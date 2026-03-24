const { getTenantConnection } = require('../config/db');
const mongoose = require('mongoose');
const FlowSchema = require('../models/tenant/Flow');
const ContactSchema = require('../models/tenant/Contact');
const MessageSchema = require('../models/tenant/Message');
const Client = require('../models/core/Client');
const WhatsAppService = require('./whatsapp.service');

/**
 * Traverses a visually-built ReactFlow JSON graph synchronously.
 */
const executeFlow = async (tenantId, flowId, contact, io) => {
  try {
    console.log(`[Flow Engine] Activating flow ${flowId} for contact ${contact.phone}...`);
    
    const tenantDb = getTenantConnection(tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    const flowData = await Flow.findById(flowId);

    if (!flowData || flowData.status !== 'ACTIVE') {
       console.log(`[Flow Engine] Flow ${flowId} is missing or not active.`);
       return;
    }

    // Get Client credentials for WhatsApp Service
    const client = await Client.findOne({ tenantId });
    if (!client || !client.whatsappConfig?.accessToken) {
        console.error(`[Flow Engine] Missing WhatsApp config for tenant ${tenantId}`);
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

    let executionLimit = 20; 
    let steps = 0;

    while (currentNode && steps < executionLimit) {
       console.log(`[Flow Node Exec] Type: ${currentNode.type} | ID: ${currentNode.id}`);
       steps++;

       // 1. Execute Node Behavior
       if (currentNode.type === 'messageNode') {
            const msgType = (currentNode.data?.msgType || 'TEXT').toLowerCase();
            const messageText = currentNode.data?.text || '';
            const mediaUrl = currentNode.data?.mediaUrl || '';
            const buttons = currentNode.data?.buttons || [];
                        try {
                let sentResponse;
                let messageType = 'text';
                let content = messageText || '[Flow Message]';

                if (msgType === 'interactive' && buttons.length > 0) {
                    sentResponse = await waService.sendButtons(contact.phone, messageText || 'Please choose:', buttons);
                    messageType = 'interactive';
                } else if (msgType === 'text' || !mediaUrl) {
                    sentResponse = await waService.sendText(contact.phone, messageText || '[Flow Message]');
                    messageType = 'text';
                } else if (['image', 'video', 'document'].includes(msgType)) {
                    if (mediaUrl.startsWith('http')) {
                        content = `${messageText}\n\n${mediaUrl}`;
                        sentResponse = await waService.sendText(contact.phone, content);
                        messageType = 'text';
                    }
                }

                // Save to Message History
                if (sentResponse) {
                    const Message = tenantDb.model('Message', MessageSchema);
                    const savedMsg = await Message.create({
                        contactId: contact._id || contact.id,
                        messageId: sentResponse.messages?.[0]?.id || `flow_${Date.now()}`,
                        direction: 'OUTBOUND',
                        type: messageType,
                        content: content,
                        status: 'SENT'
                    });

                    // Emit via socket for real-time inbox update
                    if (io) {
                        io.to(tenantId).emit('new_message', savedMsg);
                    }
                }
            } catch (err) {
                console.error(`[Flow Engine] Failed to send node message:`, err.message);
            }
            
            if (msgType === 'question') {
                console.log(`[Flow Engine] Halting execution for question: "${currentNode.data.variableName}"`);
                break; 
            }
       } 
       else if (currentNode.type === 'actionNode') {
            const tagToApply = currentNode.data?.tag || '';
            if (tagToApply) {
                const Contact = tenantDb.model('Contact', ContactSchema);
                await Contact.findOneAndUpdate(
                   { phone: contact.phone },
                   { 
                     $addToSet: { tags: tagToApply },
                     $push: { timeline: { eventType: 'TAG_ADDED', description: `Automation: Added tag ${tagToApply}`, timestamp: new Date() } }
                   }
                );
            }
       }

       // 2. Find Next Node via Edges
       const outgoingEdge = edges.find(e => e.source === currentNode.id);
       if (!outgoingEdge) {
           console.log(`[Flow Engine] End of branch.`);
           break;
       }
       currentNode = nodes.find(n => n.id === outgoingEdge.target);
    }
  } catch (error) {
    console.error(`[Flow Engine] Execution Error:`, error);
  }
};

const processIncomingMessage = async (tenantId, contact, messageText, io) => {
  try {
     const tenantDb = getTenantConnection(tenantId);
     const Flow = tenantDb.model('Flow', FlowSchema);
     const activeFlows = await Flow.find({ status: 'ACTIVE' });

     for (const flow of activeFlows) {
         let isMatch = false;
         
         // Find trigger node data
         const triggerNode = (flow.nodes || []).find(n => n.type === 'triggerNode');
         const triggerWords = triggerNode?.data?.triggerWords;

         if (!triggerWords || triggerWords.trim() === '') {
             isMatch = true; // Fallback or global trigger
         } else {
             const keywords = triggerWords.split(',').map(k => k.trim().toLowerCase());
             isMatch = keywords.some(kw => messageText.toLowerCase().includes(kw));
         }

         if (isMatch) {
             console.log(`[Flow Engine] Match! Flow: ${flow.name}`);
             setTimeout(() => executeFlow(tenantId, flow._id || flow.id, contact, io), 500);
             break;
         }
     }
  } catch (err) {
     console.error('[Flow Engine] Matching error:', err);
  }
};

module.exports = { executeFlow, processIncomingMessage };
