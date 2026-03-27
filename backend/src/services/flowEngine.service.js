const { getTenantConnection } = require('../config/db');
const mongoose = require('mongoose');
const FlowSchema = require('../models/tenant/Flow');
const ContactSchema = require('../models/tenant/Contact');
const Client = require('../models/core/Client');
const WhatsAppService = require('./whatsapp.service');

/**
 * Traverses a visually-built ReactFlow JSON graph synchronously.
 */
const executeFlow = async (tenantId, flowId, contact, io, startNodeId = null, replyValue = null) => {
  try {
    console.log(`[Flow Engine] STARTING EXECUTION | Flow: ${flowId} | Contact: ${contact.phone} | StartNode: ${startNodeId}`);
    
    const tenantDb = getTenantConnection(tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    const Contact = tenantDb.model('Contact', ContactSchema);
    
    let flowData = await Flow.findById(flowId);
    if (!flowData || flowData.status !== 'ACTIVE') {
        console.log(`[Flow Engine] Flow not found or inactive: ${flowId}`);
        return;
    }

    const { nodes, edges } = flowData;
    
    const client = await Client.findOne({ tenantId });
    if (!client || !client.whatsappConfig) {
        console.log(`[Flow Engine] No WhatsApp config for tenant: ${tenantId}`);
        return;
    }

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
        if (url.startsWith('http')) return url;
        // Prepend domain for Meta API compatibility (MUST BE PUBLIC SECURE URL)
        return `https://wapipulse.com${url}`;
    };

    let currentNode;
    if (startNodeId) {
        console.log(`[Flow Engine] Branching from Node: ${startNodeId} with Reply: ${replyValue}`);
        const lastNode = nodes.find(n => n.id === startNodeId);
        const outgoingEdges = edges.filter(e => e.source === startNodeId);
        
        if (lastNode && outgoingEdges.length > 1) {
            console.log(`[Flow Engine] Multiple paths found: ${outgoingEdges.length}. Matching handle...`);
            let targetEdge = outgoingEdges.find(e => {
                const handle = e.sourceHandle;
                return handle === replyValue || handle === `handle_${replyValue}`;
            });

            if (!targetEdge && replyValue && replyValue.startsWith('list_')) {
                targetEdge = outgoingEdges.find(e => e.sourceHandle === replyValue);
            }

            if (!targetEdge) {
                console.log(`[Flow Engine] No specific branch match. Falling back to first edge.`);
                targetEdge = outgoingEdges[0];
            }
            currentNode = targetEdge ? nodes.find(n => n.id === targetEdge.target) : null;
        } else {
            console.log(`[Flow Engine] Linear path. Moving to next node.`);
            const nextEdge = edges.find(e => e.source === startNodeId);
            currentNode = nextEdge ? nodes.find(n => n.id === nextEdge.target) : null;
        }
    } else {
        currentNode = nodes.find(n => n.type === 'triggerNode' || n.id === 'start-1');
        console.log(`[Flow Engine] Fresh start at node: ${currentNode?.id}`);
    }

    let executionLimit = 20;
    let steps = 0;

    while (currentNode && steps < executionLimit) {
       steps++;
       console.log(`[Flow Engine] Node ${steps}: ${currentNode.id} [${currentNode.type}]`);

       // Persist state by phone instead of ID to be safe
       await Contact.findOneAndUpdate({ phone: contact.phone }, { 
           currentFlowStep: currentNode.id, 
           lastFlowId: flowId,
           lastMessageAt: new Date()
       });

       if (currentNode.type === 'messageNode') {
           const { msgType = 'TEXT', text = '', mediaId = '', buttons = [], header = {}, footer = '', listOptions = [], buttonText = 'Menu', mediaUrl = '' } = currentNode.data;
           
           const interpolatedText = interpolate(text);
           const interpolatedHeader = header.text ? { ...header, text: interpolate(header.text) } : header;
           const publicMediaUrl = getFullUrl(mediaUrl || currentNode.data.mediaUrl);

           try {
               if (msgType === 'TEXT' && text) {
                   await waService.sendTextMessage(contact.phone, interpolatedText);
               } 
               else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(msgType)) {
                   // Only use mediaId if it's purely digits (Meta Media ID)
                   if (mediaId && /^\d+$/.test(mediaId)) {
                       await waService.sendMedia(contact.phone, msgType.toLowerCase(), mediaId, interpolatedText);
                   } else if (publicMediaUrl) {
                       await waService.sendMedia(contact.phone, msgType.toLowerCase(), null, interpolatedText, publicMediaUrl);
                   } else {
                       await waService.sendTextMessage(contact.phone, interpolatedText);
                   }
               }
               else if (msgType === 'INTERACTIVE_MESSAGE' || (msgType === 'INTERACTIVE' && buttons.length > 0)) {
                   const headerMedia = (mediaId && /^\d+$/.test(mediaId)) 
                        ? { type: 'image', image: mediaId } 
                        : (publicMediaUrl ? { type: 'image', link: publicMediaUrl } : null);

                   await waService.sendInteractiveButtonMessage(contact.phone, {
                       header: interpolatedHeader.type ? interpolatedHeader : headerMedia,
                       body: interpolatedText,
                       footer: interpolate(footer),
                       buttons: buttons.filter(b => b.trim() !== '').map(b => interpolate(b))
                   });
               }
               else if (msgType === 'LIST_MESSAGE' && listOptions.length > 0) {
                   await waService.sendListMessage(contact.phone, {
                       header: interpolatedHeader.text || '',
                       body: interpolatedText,
                       footer: interpolate(footer),
                       buttonText: interpolate(buttonText),
                       sections: [{
                           title: 'Options',
                           rows: listOptions.filter(opt => opt.trim() !== '').map((opt, i) => ({
                               id: `list_${i}`,
                               title: interpolate(opt).substring(0, 24)
                           }))
                       }]
                   });
               }
           } catch (sendErr) {
               console.error(`[Flow Engine] Send Error:`, sendErr.message);
           }
           
           if (msgType === 'QUESTION' || msgType === 'INTERACTIVE_MESSAGE' || msgType === 'LIST_MESSAGE' || (msgType === 'INTERACTIVE' && buttons.length > 0)) {
               console.log(`[Flow Engine] Waiting for user input. Halted at ${currentNode.id}`);
               break; 
           }
       } 
       else if (currentNode.type === 'actionNode') {
           const tag = interpolate(currentNode.data?.tag || '');
           const actionType = currentNode.data?.actionType || 'ADD';
           if (tag) {
               const update = actionType === 'REMOVE' ? { $pull: { tags: tag } } : { $addToSet: { tags: tag } };
               await Contact.findOneAndUpdate({ phone: contact.phone }, update);
           }
       }

       const outgoingEdge = edges.find(e => e.source === currentNode.id);
       if (!outgoingEdge) {
           console.log(`[Flow Engine] End of flow reached at ${currentNode.id}`);
           await Contact.findOneAndUpdate({ phone: contact.phone }, { $unset: { currentFlowStep: "", lastFlowId: "" } });
           break;
       }
       currentNode = nodes.find(n => n.id === outgoingEdge.target);
    }
  } catch (error) {
    console.error(`[Flow Engine] FATAL:`, error);
  }
};

const processIncomingMessage = async (tenantId, contact, messageText, io, isNewContact = false, replyValue = null) => {
  try {
     console.log(`[Flow Engine] Processing Message from ${contact.phone}: "${messageText}" | ReplyValue: "${replyValue}" | Session: ${contact.currentFlowStep || 'NONE'}`);
     
     const tenantDb = getTenantConnection(tenantId);
     const Flow = tenantDb.model('Flow', FlowSchema);
     const Contact = tenantDb.model('Contact', ContactSchema);

     // Refresh contact from DB to ensure it's not stale from the controller
     const dbContact = await Contact.findOne({ phone: contact.phone });
     const activeContact = dbContact ? dbContact.toObject() : contact;

     if (activeContact.currentFlowStep && activeContact.lastFlowId) {
         console.log(`[Flow Engine] Found Active Session for ${activeContact.phone}: ${activeContact.currentFlowStep}`);
         const activeFlow = await Flow.findById(activeContact.lastFlowId);
         if (activeFlow) {
             const lastNode = activeFlow.nodes.find(n => n.id === activeContact.currentFlowStep);
             if (lastNode && lastNode.data.msgType === 'QUESTION' && lastNode.data.variableName) {
                 const varName = lastNode.data.variableName;
                 console.log(`[Flow Engine] Saving input "${messageText}" to variable "${varName}"`);
                 await Contact.findOneAndUpdate({ phone: activeContact.phone }, { 
                     $set: { [`flowVariables.${varName}`]: messageText }
                 });
                 activeContact.flowVariables = activeContact.flowVariables || {};
                 activeContact.flowVariables[varName] = messageText;
             }
         }

         executeFlow(tenantId, activeContact.lastFlowId, activeContact, io, activeContact.currentFlowStep, replyValue || messageText);
         return;
     }

     if (isNewContact) {
         console.log(`[Flow Engine] Analyzing NEW_MESSAGE trigger for ${activeContact.phone}...`);
         const welcomeFlow = await Flow.findOne({ status: 'ACTIVE', triggerType: 'NEW_MESSAGE' });
         if (welcomeFlow) {
             console.log(`[Flow Engine] Triggering Welcome Flow: "${welcomeFlow.name}"`);
             executeFlow(tenantId, welcomeFlow._id, activeContact, io);
             return;
         } else {
             console.log(`[Flow Engine] No ACTIVE NEW_MESSAGE flow found.`);
         }
     }

     console.log(`[Flow Engine] Searching for KEYWORD matches for "${messageText}"...`);
     let activeFlows = await Flow.find({ status: 'ACTIVE', triggerType: 'KEYWORD' });
     console.log(`[Flow Engine] Found ${activeFlows.length} active keyword flows to check.`);
     
     let matched = false;
     for (const flow of activeFlows) {
         const keywords = (flow.triggerKeywords || []).filter(kw => kw.trim() !== '');
         if (keywords.length === 0) continue;

         console.log(`[Flow Engine] Checking flow "${flow.name}" keywords: [${keywords.join(', ')}]`);
         const isMatch = flow.isSmartMatch ? smartMatch(messageText, keywords) : keywords.some(kw => messageText.toLowerCase().includes(kw.toLowerCase().trim()));

         if (isMatch) {
             matched = true;
             console.log(`[Flow Engine] MATCH FOUND! Triggering flow: "${flow.name}"`);
             executeFlow(tenantId, flow._id, activeContact, io);
             break;
         }
     }

     if (!matched) {
         console.log(`[Flow Engine] No keywords matched "${messageText}". Checking for catch-all...`);
         const defaultFlow = await Flow.findOne({ status: 'ACTIVE', triggerType: 'KEYWORD', $or: [{ triggerKeywords: [] }, { triggerKeywords: [""] }] });
         if (defaultFlow) {
             console.log(`[Flow Engine] Triggering Catch-all Flow: "${defaultFlow.name}"`);
             executeFlow(tenantId, defaultFlow._id, activeContact, io);
         } else {
             console.log(`[Flow Engine] No catch-all flow found. Message ignored.`);
         }
     }
  } catch (err) {
     console.error('[Flow Engine] Logic Error:', err);
  }
};

function smartMatch(message, keywords) {
    if (!message || !keywords || keywords.length === 0) return false;
    const msg = message.toLowerCase().trim();
    for (const kw of keywords) {
        const target = kw.toLowerCase().trim();
        if (!target) continue;
        if (msg.includes(target)) return true;
        if (levenshteinDistance(msg, target) <= 2) return true;
    }
    return false;
}

function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
            else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
        }
    }
    return matrix[b.length][a.length];
}

module.exports = { executeFlow, processIncomingMessage };
