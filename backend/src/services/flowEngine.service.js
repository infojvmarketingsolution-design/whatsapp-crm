const { getTenantConnection } = require('../config/db');
const mongoose = require('mongoose');
const FlowSchema = require('../models/tenant/Flow');
const ContactSchema = require('../models/tenant/Contact');
const Client = require('../models/core/Client');
const WhatsAppService = require('./whatsapp.service');

/**
 * Traverses a visually-built ReactFlow JSON graph synchronously.
 * 
 * @param {string} tenantId - Tenant DB ID
 * @param {string} flowId - The Flow ID triggered
 * @param {object} contact - The Contact object { phone, name, _id }
 * @param {string} startNodeId - (Optional) specific node to start. If null, starts at triggerNode.
 * @param {string} replyValue - (Optional) The user's reply text/button for branching.
 */
const executeFlow = async (tenantId, flowId, contact, io, startNodeId = null, replyValue = null) => {
  try {
    const tenantDb = getTenantConnection(tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    const Contact = tenantDb.model('Contact', ContactSchema);
    
    let flowData = await Flow.findById(flowId);

    if (!flowData || flowData.status !== 'ACTIVE') {
       return;
    }

    const { nodes, edges } = flowData;
    
    // Instantiate WhatsApp Service
    const client = await Client.findOne({ tenantId });
    if (!client || !client.whatsappConfig) return;

    const waService = new WhatsAppService({
        accessToken: client.whatsappConfig.accessToken,
        phoneNumberId: client.whatsappConfig.phoneNumberId
    });

    // Helper: Substitute variables {{name}}, {{email}} etc.
    const interpolate = (text) => {
        if (!text) return '';
        return text.replace(/\{\{(.*?)\}\}/g, (match, key) => {
            const v = key.trim();
            if (v === 'name') return contact.name || 'Friend';
            if (v === 'phone') return contact.phone || '';
            return contact.flowVariables?.[v] || match;
        });
    };

    // Determine current node
    let currentNode;
    if (startNodeId) {
        // Resuming from a specific node (e.g. after a question or button click)
        const lastNode = nodes.find(n => n.id === startNodeId);
        if (lastNode && (lastNode.data.msgType === 'INTERACTIVE_MESSAGE' || lastNode.data.msgType === 'LIST_MESSAGE' || lastNode.data.msgType === 'INTERACTIVE')) {
            // BRANCHING: Find edge that matches the reply value or button text
            const outgoingEdges = edges.filter(e => e.source === startNodeId);
            let targetEdge = outgoingEdges.find(e => {
                const sourceHandle = e.sourceHandle;
                // If the handle matches the reply value or button index, use it
                return sourceHandle === replyValue || sourceHandle === `handle_${replyValue}`;
            });
            // Fallback: If no handle match, use the first edge
            if (!targetEdge) targetEdge = outgoingEdges[0];
            currentNode = targetEdge ? nodes.find(n => n.id === targetEdge.target) : null;
        } else {
            // Linear progression
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

       // Save state to contact
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
               else if ((msgType === 'IMAGE' || msgType === 'VIDEO' || msgType === 'DOCUMENT') && mediaId) {
                   await waService.sendMedia(contact.phone, msgType.toLowerCase(), mediaId, interpolatedText);
               }
               else if (msgType === 'INTERACTIVE_MESSAGE' || (msgType === 'INTERACTIVE' && buttons.length > 0)) {
                   await waService.sendInteractiveButtonMessage(contact.phone, {
                       header: interpolatedHeader.type ? interpolatedHeader : (mediaId ? { type: 'image', image: mediaId } : null),
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
               console.error(`[Flow Engine] Node Error ${currentNode.id}:`, sendErr.message);
           }
           
           // If it's a QUESTION or INTERACTIVE, we MUST wait for user reply
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
           // End of flow
           await Contact.findByIdAndUpdate(contact._id, { $unset: { currentFlowStep: "", lastFlowId: "" } });
           break;
       }
       currentNode = nodes.find(n => n.id === outgoingEdge.target);
    }
  } catch (error) {
    console.error(`[Flow Engine] Fatal Crash:`, error);
  }
};

const processIncomingMessage = async (tenantId, contact, messageText, io, isNewContact = false, replyValue = null) => {
  try {
     const tenantDb = getTenantConnection(tenantId);
     const Flow = tenantDb.model('Flow', FlowSchema);
     const Contact = tenantDb.model('Contact', ContactSchema);

     // A. Check if user is ALREADY IN A FLOW (Session)
     if (contact.currentFlowStep && contact.lastFlowId) {
         console.log(`[Flow Engine] Resuming session for ${contact.phone} at node ${contact.currentFlowStep}`);
         
         // If last node was a QUESTION, save the answer to variable
         const activeFlow = await Flow.findById(contact.lastFlowId);
         if (activeFlow) {
             const lastNode = activeFlow.nodes.find(n => n.id === contact.currentFlowStep);
             if (lastNode && lastNode.data.msgType === 'QUESTION' && lastNode.data.variableName) {
                 const varName = lastNode.data.variableName;
                 await Contact.findByIdAndUpdate(contact._id, { 
                     $set: { [`flowVariables.${varName}`]: messageText }
                 });
                 // Refresh contact to have new variable for interpolation
                 contact.flowVariables = contact.flowVariables || {};
                 contact.flowVariables[varName] = messageText;
             }
         }

         // Resume flow from the next step
         setTimeout(() => executeFlow(tenantId, contact.lastFlowId, contact, io, contact.currentFlowStep, replyValue || messageText), 500);
         return;
     }

     // B. If not in a session, look for new triggers
     if (isNewContact) {
         const welcomeFlow = await Flow.findOne({ status: 'ACTIVE', triggerType: 'NEW_MESSAGE' });
         if (welcomeFlow) {
             setTimeout(() => executeFlow(tenantId, welcomeFlow._id || welcomeFlow.id, contact, io), 500);
             return;
         }
     }

     let activeFlows = await Flow.find({ status: 'ACTIVE', triggerType: 'KEYWORD' });
     let matched = false;
     for (const flow of activeFlows) {
         let isMatch = false;
         const keywords = flow.triggerKeywords || [];
         const isSmartMatchEnabled = flow.isSmartMatch || false;

         if (keywords.length === 0 || (keywords.length === 1 && keywords[0] === '')) continue;

         if (isSmartMatchEnabled) {
             isMatch = smartMatch(messageText, keywords);
         } else {
             isMatch = keywords.some(kw => messageText.toLowerCase().includes(kw.toLowerCase().trim()));
         }

         if (isMatch) {
             matched = true;
             setTimeout(() => executeFlow(tenantId, flow._id || flow.id, contact, io), 500);
             break;
         }
     }

     if (!matched) {
         const defaultFlow = await Flow.findOne({ status: 'ACTIVE', triggerType: 'KEYWORD', $or: [{ triggerKeywords: [] }, { triggerKeywords: [""] }] });
         if (defaultFlow) {
             setTimeout(() => executeFlow(tenantId, defaultFlow._id || defaultFlow.id, contact, io), 500);
         }
     }
  } catch (err) {
     console.error('[Flow Engine] Logic Error:', err);
  }
};

function smartMatch(message, keywords) {
    if (!message || !keywords || keywords.length === 0) return false;
    const msg = message.toLowerCase().trim();
    const tokens = msg.split(/\s+/);
    for (const kw of keywords) {
        const target = kw.toLowerCase().trim();
        if (!target) continue;
        if (msg.includes(target)) return true;
        if (levenshteinDistance(msg, target) <= 2) return true;
        for (const token of tokens) {
            if (levenshteinDistance(token, target) <= 1) return true;
        }
    }
    return false;
}

function levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[b.length][a.length];
}

module.exports = { executeFlow, processIncomingMessage };
