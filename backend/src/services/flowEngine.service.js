const { getTenantConnection } = require('../config/db');
const mongoose = require('mongoose');
const FlowSchema = require('../models/tenant/Flow');
const ContactSchema = require('../models/tenant/Contact');
const Client = require('../models/core/Client');
const WhatsAppService = require('./whatsapp.service');
const MessageSchema = require('../models/tenant/Message');
const AIService = require('./ai.service');
const PRDFlowService = require('./prdFlow.service');
const ClientSchema = require('../models/core/Client');
const Settings = require('../models/core/Settings');

/**
 * Traverses a visually-built ReactFlow JSON graph synchronously.
 * Matches Rule 15: Exec Engine
 */
const executeFlow = async (tenantId, flowId, contact, io, startNodeId = null, replyValue = null) => {
  try {
    console.log(`[Flow Engine] ⚙️ EXEC LOOP | Flow: ${flowId} | Contact: ${contact.phone} | StartNode: ${startNodeId}`);
    
    const tenantDb = getTenantConnection(tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    const Contact = tenantDb.model('Contact', ContactSchema);
    const Message = tenantDb.model('Message', MessageSchema);
    
    let flowData = await Flow.findById(flowId);
    if (!flowData || flowData.status !== 'ACTIVE') return;

    const { nodes, edges } = flowData;
    const client = await Client.findOne({ tenantId });
    const waService = new WhatsAppService({
        accessToken: client.whatsappConfig.accessToken,
        phoneNumberId: client.whatsappConfig.phoneNumberId
    });

    const interpolate = (text) => {
        if (!text) return '';
        return text.replace(/\{\{(.*?)\}\}/g, (match, key) => {
            const v = key.trim();
            if (v === 'name' || v === 'visitor_name') return contact.name || contact.flowVariables?.visitor_name || 'Friend';
            if (v === 'phone') return contact.phone || '';
            return contact.flowVariables?.[v] || match;
        });
    };

    const getFullUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return encodeURI(url);
        const baseUrl = (process.env.BASE_URL || 'https://wapipulse.com').replace(/\/$/, '');
        return encodeURI(`${baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
    };

    let currentNode;
    if (startNodeId) {
        const lastNode = nodes.find(n => n.id === startNodeId);
        const outgoingEdges = edges.filter(e => e.source === startNodeId);
        
        if (lastNode && outgoingEdges.length > 1) {
            let targetEdge = outgoingEdges.find(e => e.sourceHandle === replyValue || e.sourceHandle === `handle_${replyValue}`);
            if (!targetEdge && replyValue?.startsWith('list_')) targetEdge = outgoingEdges.find(e => e.sourceHandle === replyValue);
            if (!targetEdge) targetEdge = outgoingEdges[0]; 
            currentNode = targetEdge ? nodes.find(n => n.id === targetEdge.target) : null;
        } else {
            const nextEdge = edges.find(e => e.source === startNodeId);
            currentNode = nextEdge ? nodes.find(n => n.id === nextEdge.target) : null;
        }
    } else {
        currentNode = nodes.find(n => n.type === 'triggerNode' || n.id === 'start-1');
    }

    let steps = 0;
    while (currentNode && steps < 20) {
       steps++;
       
       // Rules 14/15: Save session before stopping
       await Contact.findOneAndUpdate({ phone: contact.phone }, { 
           currentFlowStep: currentNode.id, 
           lastFlowId: flowId,
           lastMessageAt: new Date()
       });

       if (currentNode.type === 'messageNode') {
           const { msgType = 'TEXT', text = '', mediaId = '', buttons = [], header = {}, footer = '', listOptions = [], buttonText = 'Menu', mediaUrl = '' } = currentNode.data;
           const interpolatedText = interpolate(text);

           const saveAndEmit = async (type, content, waResult) => {
               const savedMsg = await Message.create({
                   contactId: contact._id,
                   messageId: waResult?.messages?.[0]?.id || `out_${Date.now()}_flow`,
                   direction: 'OUTBOUND', type, content, status: 'SENT'
               });
               if (io) io.to(tenantId).emit('new_message', { ...savedMsg._doc, contact });
           };

           try {
               if (msgType === 'TEXT' && text) {
                   let res = await waService.sendTextMessage(contact.phone, interpolatedText);
                   await saveAndEmit('text', interpolatedText, res);
               } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(msgType.toUpperCase())) {
                   const finalMediaUrl = getFullUrl(mediaUrl || mediaId);
                   const isNumeric = mediaId && /^\d+$/.test(mediaId);
                   let res = await waService.sendMedia(contact.phone, msgType.toLowerCase(), isNumeric ? mediaId : null, interpolatedText, isNumeric ? null : finalMediaUrl);
                   await saveAndEmit(msgType.toLowerCase(), interpolatedText, res);
               } else if (msgType === 'INTERACTIVE_MESSAGE' || (msgType === 'INTERACTIVE' && buttons.length > 0)) {
                   let res = await waService.sendSmartButtons(contact.phone, {
                       body: interpolatedText,
                       buttons: buttons.filter(b => b.trim() !== '').map(b => interpolate(b))
                   });
                   await saveAndEmit('interactive', interpolatedText, res);
               } else if (msgType === 'LIST_MESSAGE' && listOptions.length > 0) {
                   let res = await waService.sendListMessage(contact.phone, {
                       body: interpolatedText,
                       buttonText: interpolate(buttonText),
                       sections: [{ title: 'Options', rows: listOptions.map((opt, i) => ({ id: `list_${i}`, title: interpolate(opt).substring(0, 24) })) }]
                   });
                   await saveAndEmit('interactive', interpolatedText, res);
               }
           } catch (e) {
               console.error(`[Flow Engine] Node Error:`, e.message);
           }
           
           // 🔥 STOP condition as per PRD
           if (['QUESTION', 'INTERACTIVE_MESSAGE', 'LIST_MESSAGE', 'INTERACTIVE', 'CTA_URL'].includes(msgType)) break;
       }  
       else if (currentNode.type === 'actionNode') {
           const tag = interpolate(currentNode.data?.tag || '');
           if (tag) {
               await Contact.findOneAndUpdate({ phone: contact.phone }, { $addToSet: { tags: tag } });
           }
       }

       const outgoingEdge = edges.find(e => e.source === currentNode.id);
       if (!outgoingEdge) {
           await Contact.findOneAndUpdate({ phone: contact.phone }, { $unset: { currentFlowStep: "", lastFlowId: "" } });
           break;
       }
       currentNode = nodes.find(n => n.id === outgoingEdge.target);
    }
  } catch (error) {
    console.error(`[Flow Engine] FATAL:`, error);
  }
};

/**
 * Matches PRD Flow Lifecycle Rule 4
 */
const processIncomingMessage = async (tenantId, contact, messageText, io, isNewContact = false, replyValue = null) => {
  try {
     const tenantDb = getTenantConnection(tenantId);
     const Contact = tenantDb.model('Contact', ContactSchema);
     const Message = tenantDb.model('Message', MessageSchema);
     const Flow = tenantDb.model('Flow', FlowSchema);

     // 🔥 Rule 4: LOAD FRESH (Crucial for race conditions)
     const activeContact = await Contact.findOne({ phone: contact.phone });
     if (!activeContact) return;

     const settings = await Settings.findOne({ tenantId });
     if (!settings?.automation?.botEnabled) return;

     const client = await Client.findOne({ tenantId });
     const waService = new WhatsAppService({
         accessToken: client.whatsappConfig.accessToken,
         phoneNumberId: client.whatsappConfig.phoneNumberId
     });

     // Timeout Check (Rule 11)
     const diff = (new Date() - new Date(activeContact.lastMessageAt || 0)) / (1000 * 60);
     if (diff > 30 && activeContact.currentFlowStep) {
         await Contact.findOneAndUpdate({ phone: activeContact.phone }, { $unset: { currentFlowStep: "", lastFlowId: "" } });
         activeContact.currentFlowStep = null;
     }

     // 🧩 Rule 6: CONTINUE FLOW
     if (activeContact.currentFlowStep) {
         const prdStates = ['greeting', 'ask_name', 'qualification', 'program', 'call_time', 'thank_you', 'START_PRD_FLOW'];
         if (prdStates.includes(activeContact.currentFlowStep)) {
             await PRDFlowService.processStep(tenantId, activeContact, replyValue || messageText, waService, io);
             return;
         }

         if (activeContact.lastFlowId) {
            executeFlow(tenantId, activeContact.lastFlowId, activeContact, io, activeContact.currentFlowStep, replyValue || messageText);
            return;
         }
     }

     // 🧩 Rule 5: START FLOW
     const keywordFlow = await Flow.findOne({ 
         status: 'ACTIVE', tenantId, triggerType: 'KEYWORD', 
         triggerKeywords: { $in: [messageText.toLowerCase().trim()] } 
     });
     if (keywordFlow) {
         await executeFlow(tenantId, keywordFlow._id, activeContact, io);
         return;
     }

     // Default Template Fallback
     await PRDFlowService.processStep(tenantId, activeContact, messageText, waService, io);
     await PRDFlowService.updateLeadScore(Contact, Message, activeContact._id, io, tenantId);

  } catch (err) {
     console.error('[Flow Engine] Logic Error:', err);
  }
};

module.exports = { executeFlow, processIncomingMessage };
