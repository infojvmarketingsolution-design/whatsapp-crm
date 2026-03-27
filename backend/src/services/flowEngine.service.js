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
    const tenantDb = getTenantConnection(tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    const Contact = tenantDb.model('Contact', ContactSchema);
    
    let flowData = await Flow.findById(flowId);
    if (!flowData || flowData.status !== 'ACTIVE') return;

    const { nodes, edges } = flowData;
    
    const client = await Client.findOne({ tenantId });
    if (!client || !client.whatsappConfig) return;

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

    let currentNode;
    if (startNodeId) {
        console.log(`[Flow Engine] Resuming from Node: ${startNodeId} | Reply: ${replyValue}`);
        const lastNode = nodes.find(n => n.id === startNodeId);
        const outgoingEdges = edges.filter(e => e.source === startNodeId);
        
        if (lastNode && outgoingEdges.length > 1) {
            // BRANCHING LOGIC
            console.log(`[Flow Engine] Branching search for handle: "${replyValue}" among ${outgoingEdges.length} edges`);
            let targetEdge = outgoingEdges.find(e => {
                const handle = e.sourceHandle;
                // Match handle ID (list_0, btn_0) or exact text
                return handle === replyValue || handle === `handle_${replyValue}`;
            });

            // If no handle match, check if replyValue is an index
            if (!targetEdge && replyValue && replyValue.startsWith('list_')) {
                targetEdge = outgoingEdges.find(e => e.sourceHandle === replyValue);
            }

            if (!targetEdge) {
                console.log(`[Flow Engine] No branch match for "${replyValue}". Falling back to first edge.`);
                targetEdge = outgoingEdges[0];
            }
            currentNode = targetEdge ? nodes.find(n => n.id === targetEdge.target) : null;
        } else {
            const nextEdge = edges.find(e => e.source === startNodeId);
            currentNode = nextEdge ? nodes.find(n => n.id === nextEdge.target) : null;
        }
    } else {
        currentNode = nodes.find(n => n.type === 'triggerNode' || n.id === 'start-1');
    }

    let executionLimit = 20;
    let steps = 0;

    while (currentNode && steps < executionLimit) {
       steps++;
       console.log(`[Flow Engine] Step ${steps}: Node ${currentNode.id} (${currentNode.type})`);

       await Contact.findByIdAndUpdate(contact._id, { 
           currentFlowStep: currentNode.id, 
           lastFlowId: flowId 
       });

       if (currentNode.type === 'messageNode') {
           const { msgType = 'TEXT', text = '', mediaId = '', buttons = [], header = {}, footer = '', listOptions = [], buttonText = 'Menu' } = currentNode.data;
           
           const interpolatedText = interpolate(text);
           const interpolatedHeader = header.text ? { ...header, text: interpolate(header.text) } : header;

           try {
               if (msgType === 'TEXT' && text) {
                   await waService.sendTextMessage(contact.phone, interpolatedText);
               } 
               else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(msgType)) {
                   // mediaId might be a placeholder or invalid. Fallback to TEXT if it fails.
                   try {
                       if (mediaId && !mediaId.includes('demo_')) {
                           await waService.sendMedia(contact.phone, msgType.toLowerCase(), mediaId, interpolatedText);
                       } else {
                           // Fallback to text if no real media ID
                           await waService.sendTextMessage(contact.phone, interpolatedText);
                       }
                   } catch (mediaErr) {
                       console.warn(`[Flow Engine] Media failed, falling back to text:`, mediaErr.message);
                       await waService.sendTextMessage(contact.phone, interpolatedText);
                   }
               }
               else if (msgType === 'INTERACTIVE_MESSAGE' || (msgType === 'INTERACTIVE' && buttons.length > 0)) {
                   await waService.sendInteractiveButtonMessage(contact.phone, {
                       header: interpolatedHeader.type ? interpolatedHeader : (mediaId && !mediaId.includes('demo_') ? { type: 'image', image: mediaId } : null),
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
               console.error(`[Flow Engine] Error sending node ${currentNode.id}:`, sendErr.message);
           }
           
           if (msgType === 'QUESTION' || msgType === 'INTERACTIVE_MESSAGE' || msgType === 'LIST_MESSAGE' || (msgType === 'INTERACTIVE' && buttons.length > 0)) {
               break; 
           }
       } 
       else if (currentNode.type === 'actionNode') {
           const tag = interpolate(currentNode.data?.tag || '');
           const actionType = currentNode.data?.actionType || 'ADD';
           if (tag) {
               const update = actionType === 'REMOVE' ? { $pull: { tags: tag } } : { $addToSet: { tags: tag } };
               await Contact.findByIdAndUpdate(contact._id, update);
           }
       }

       const outgoingEdge = edges.find(e => e.source === currentNode.id);
       if (!outgoingEdge) {
           await Contact.findByIdAndUpdate(contact._id, { $unset: { currentFlowStep: "", lastFlowId: "" } });
           break;
       }
       currentNode = nodes.find(n => n.id === outgoingEdge.target);
    }
  } catch (error) {
    console.error(`[Flow Engine] Fatal Error:`, error);
  }
};

const processIncomingMessage = async (tenantId, contact, messageText, io, isNewContact = false, replyValue = null) => {
  try {
     const tenantDb = getTenantConnection(tenantId);
     const Flow = tenantDb.model('Flow', FlowSchema);
     const Contact = tenantDb.model('Contact', ContactSchema);

     if (contact.currentFlowStep && contact.lastFlowId) {
         const activeFlow = await Flow.findById(contact.lastFlowId);
         if (activeFlow) {
             const lastNode = activeFlow.nodes.find(n => n.id === contact.currentFlowStep);
             if (lastNode && lastNode.data.msgType === 'QUESTION' && lastNode.data.variableName) {
                 const varName = lastNode.data.variableName;
                 await Contact.findByIdAndUpdate(contact._id, { 
                     $set: { [`flowVariables.${varName}`]: messageText }
                 });
                 // Update local object for immediate use in interpolate
                 contact.flowVariables = contact.flowVariables || {};
                 contact.flowVariables[varName] = messageText;
             }
         }

         // Resume flow
         executeFlow(tenantId, contact.lastFlowId, contact, io, contact.currentFlowStep, replyValue || messageText);
         return;
     }

     if (isNewContact) {
         const welcomeFlow = await Flow.findOne({ status: 'ACTIVE', triggerType: 'NEW_MESSAGE' });
         if (welcomeFlow) {
             executeFlow(tenantId, welcomeFlow._id, contact, io);
             return;
         }
     }

     let activeFlows = await Flow.find({ status: 'ACTIVE', triggerType: 'KEYWORD' });
     let matched = false;
     for (const flow of activeFlows) {
         const keywords = flow.triggerKeywords || [];
         if (keywords.length === 0 || (keywords.length === 1 && keywords[0] === '')) continue;

         const isMatch = flow.isSmartMatch ? smartMatch(messageText, keywords) : keywords.some(kw => messageText.toLowerCase().includes(kw.toLowerCase().trim()));

         if (isMatch) {
             matched = true;
             executeFlow(tenantId, flow._id, contact, io);
             break;
         }
     }

     if (!matched) {
         const defaultFlow = await Flow.findOne({ status: 'ACTIVE', triggerType: 'KEYWORD', $or: [{ triggerKeywords: [] }, { triggerKeywords: [""] }] });
         if (defaultFlow) {
             executeFlow(tenantId, defaultFlow._id, contact, io);
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
