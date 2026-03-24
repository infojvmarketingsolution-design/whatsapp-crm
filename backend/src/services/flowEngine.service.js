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
 */
const executeFlow = async (tenantId, flowId, contact, io) => {
  try {
    console.log(`[Flow Engine] Activating flow ${flowId} for contact ${contact.phone}...`);
    
    let flowData;
    const tenantDb = getTenantConnection(tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    flowData = await Flow.findById(flowId);

    if (!flowData || flowData.status !== 'ACTIVE') {
       console.log(`[Flow Engine] Flow ${flowId} is missing or not active.`);
       return;
    }

    // 0. Instantiate WhatsApp Service
    const client = await Client.findOne({ tenantId });
    if (!client || !client.whatsappConfig) {
        console.error(`[Flow Engine] No WhatsApp config found for tenant ${tenantId}`);
        return;
    }
    const waService = new WhatsAppService({
        accessToken: client.whatsappConfig.accessToken,
        phoneNumberId: client.whatsappConfig.phoneNumberId
    });

    const { nodes, edges } = flowData;
    
    // Find Start Node
    let currentNode = nodes.find(n => n.type === 'triggerNode' || n.id === 'start-1');
    if (!currentNode) {
       console.log(`[Flow Engine] No valid start node found in flow ${flowData.name}.`);
       return;
    }

    console.log(`[Flow Engine] Initiated graph traversal starting at ${currentNode.id}`);

    // Iterative Graph Traversal
    let executionLimit = 20; // Prevent infinite loops
    let steps = 0;

    while (currentNode && steps < executionLimit) {
       console.log(`[Flow Node Exec] Type: ${currentNode.type} | ID: ${currentNode.id}`);
       steps++;

       // 1. Execute Node Behavior
       if (currentNode.type === 'messageNode') {
           const { msgType = 'TEXT', text = '', mediaUrl = '', mediaId = '', buttons = [], header = {}, footer = '', listOptions = [], buttonText = 'Menu' } = currentNode.data;
           
           try {
               if (msgType === 'TEXT' && text) {
                   await waService.sendTextMessage(contact.phone, text);
               } 
               else if ((msgType === 'IMAGE' || msgType === 'VIDEO' || msgType === 'DOCUMENT') && mediaId) {
                   await waService.sendMedia(contact.phone, msgType.toLowerCase(), mediaId, text);
               }
               else if (msgType === 'INTERACTIVE_MESSAGE' || (msgType === 'INTERACTIVE' && buttons.length > 0)) {
                   // Traditional Interactive buttons or New Interactive Message
                   await waService.sendInteractiveButtonMessage(contact.phone, {
                       header: header.type ? header : (mediaId ? { type: 'image', image: mediaId } : null),
                       body: text,
                       footer: footer,
                       buttons: buttons.filter(b => b.trim() !== '')
                   });
               }
               else if (msgType === 'LIST_MESSAGE' && listOptions.length > 0) {
                   await waService.sendListMessage(contact.phone, {
                       header: header.text || '',
                       body: text,
                       footer: footer,
                       buttonText: buttonText,
                       sections: [{
                           title: 'Options',
                           rows: listOptions.filter(opt => opt.trim() !== '').map((opt, i) => ({
                               id: `list_${i}_${Date.now()}`,
                               title: opt.substring(0, 24)
                           }))
                       }]
                   });
               }
           } catch (sendErr) {
               console.error(`[Flow Engine] Failed to send ${msgType}:`, sendErr.message);
           }
           
           if (msgType === 'QUESTION') {
               console.log(`[Flow Engine] Halting execution to wait for user input for variable: "${currentNode.data.variableName}"`);
               break; // Halt graph traversal for user answer
           }
       } 
       else if (currentNode.type === 'actionNode') {
           const tag = currentNode.data?.tag || '';
           const actionType = currentNode.data?.actionType || 'ADD';
           if (tag) {
               console.log(`[Flow Engine] -> ${actionType} CRM Tag: [${tag}] to ${contact.phone}`);
               const tenantDb = getTenantConnection(tenantId);
               const Contact = tenantDb.model('Contact', ContactSchema);
               const update = actionType === 'REMOVE' ? { $pull: { tags: tag } } : { $addToSet: { tags: tag } };
               await Contact.findOneAndUpdate({ phone: contact.phone }, update);
           }
       }

       // 2. Find Next Node via Edges
       const outgoingEdge = edges.find(e => e.source === currentNode.id);
       
       if (!outgoingEdge) {
           console.log(`[Flow Engine] Execution reached the end of the branch. Stopped.`);
           break;
       }

       currentNode = nodes.find(n => n.id === outgoingEdge.target);
    }

    if (steps >= executionLimit) {
       console.warn(`[Flow Engine] Hit execution limit of ${executionLimit} steps! Terminating to prevent infinite loop.`);
    }

  } catch (error) {
    console.error(`[Flow Engine] Fatal Crash during graph execution:`, error);
  }
};

const processIncomingMessage = async (tenantId, contact, messageText, io) => {
  try {
     let activeFlows = [];
     const tenantDb = getTenantConnection(tenantId);
     const Flow = tenantDb.model('Flow', FlowSchema);
     activeFlows = await Flow.find({ status: 'ACTIVE', triggerType: 'KEYWORD' });

     let matched = false;
     for (const flow of activeFlows) {
         let isMatch = false;
         if (!flow.triggerKeywords || flow.triggerKeywords.length === 0 || (flow.triggerKeywords.length === 1 && flow.triggerKeywords[0] === '')) {
             // Skip empty flows during normal keyword matching if we want a specific default flow
             continue;
         } else {
             isMatch = flow.triggerKeywords.some(kw => messageText.toLowerCase().includes(kw.toLowerCase().trim()));
         }

         if (isMatch) {
             matched = true;
             console.log(`[Flow Engine] Keyphrase match! Triggering flow: ${flow.name}`);
             setTimeout(() => executeFlow(tenantId, flow._id || flow.id, contact, io), 500);
             break;
         }
     }

     // Default Flow (Catch-all)
     if (!matched) {
         const defaultFlow = await Flow.findOne({ status: 'ACTIVE', triggerType: 'KEYWORD', $or: [{ triggerKeywords: [] }, { triggerKeywords: [""] }] });
         if (defaultFlow) {
             console.log(`[Flow Engine] No matches. Triggering DEFAULT flow: ${defaultFlow.name}`);
             setTimeout(() => executeFlow(tenantId, defaultFlow._id || defaultFlow.id, contact, io), 500);
         }
     }
  } catch (err) {
     console.error('[Flow Engine] Matching error:', err);
  }
};

module.exports = { executeFlow, processIncomingMessage };
