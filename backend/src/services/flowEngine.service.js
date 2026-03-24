const { getTenantConnection } = require('../config/db');
const mongoose = require('mongoose');
const FlowSchema = require('../models/tenant/Flow');
const ContactSchema = require('../models/tenant/Contact');
const whatsappService = require('./whatsapp.service');

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
           const msgType = currentNode.data?.msgType || 'TEXT';
           const messageText = currentNode.data?.text || '';
           const mediaUrl = currentNode.data?.mediaUrl || '';
           const buttons = currentNode.data?.buttons || [];
           
           if (messageText || mediaUrl) {
               console.log(`[Flow Engine] -> Sending ${msgType} Message to ${contact.phone}`);
               // Real Meta API send
               await whatsappService.sendTextMessage(tenantId, contact.phone, messageText || `[${msgType} Triggered]`);
           }
           
           if (msgType === 'QUESTION') {
               console.log(`[Flow Engine] Halting execution to wait for user input for variable: "${currentNode.data.variableName}"`);
               break; // Halt graph traversal for user answer
           }
       } 
       else if (currentNode.type === 'actionNode') {
           const tagToApply = currentNode.data?.tag || '';
           if (tagToApply) {
               console.log(`[Flow Engine] -> Applying CRM Tag: [${tagToApply}] to ${contact.phone}`);
               const tenantDb = getTenantConnection(tenantId);
               const Contact = tenantDb.model('Contact', ContactSchema);
               await Contact.findOneAndUpdate(
                  { phone: contact.phone },
                  { $addToSet: { tags: tagToApply } }
               );
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

     for (const flow of activeFlows) {
         let isMatch = false;
         if (!flow.triggerKeywords || flow.triggerKeywords.length === 0 || flow.triggerKeywords[0] === '') {
             isMatch = true;
         } else {
             isMatch = flow.triggerKeywords.some(kw => messageText.toLowerCase().includes(kw.toLowerCase().trim()));
         }

         if (isMatch) {
             console.log(`[Flow Engine] Keyphrase match! Triggering flow: ${flow.name}`);
             setTimeout(() => executeFlow(tenantId, flow._id || flow.id, contact, io), 500);
             break;
         }
     }
  } catch (err) {
     console.error('[Flow Engine] Matching error:', err);
  }
};

module.exports = { executeFlow, processIncomingMessage };
