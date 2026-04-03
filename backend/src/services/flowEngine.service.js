const { getTenantConnection } = require('../config/db');
const mongoose = require('mongoose');
const FlowSchema = require('../models/tenant/Flow');
const ContactSchema = require('../models/tenant/Contact');
const Client = require('../models/core/Client');
const WhatsAppService = require('./whatsapp.service');
const MessageSchema = require('../models/tenant/Message');

/**
 * ⚡ WHATSAPP FLOW ENGINE – FULL PRD (CONTINUOUS MODE)
 */

/**
 * 🧩 7. NODE TYPES (FINAL STANDARD)
 * Determines if a node should stop the flow and wait for user input.
 */
const isWaitingNode = (node) => {
  if (!node || !node.data) return false;
  const msgType = node.data.msgType;
  // QUESTION, LIST_MESSAGE, INTERACTIVE are waiting nodes
  return ['QUESTION', 'LIST_MESSAGE', 'INTERACTIVE', 'INTERACTIVE_MESSAGE'].includes(msgType);
};

/**
 * 🧩 Helper: Interpolate variables in text.
 */
const interpolate = (text, contact) => {
  if (!text) return '';
  return text.replace(/\{\{(.*?)\}\}/g, (match, key) => {
    const v = key.trim();
    // Default fallback to name or phone if specified
    if (v === 'name') return contact.flowVariables?.name || contact.name || 'Friend';
    if (v === 'phone') return contact.phone || '';
    return contact.flowVariables?.[v] || match;
  });
};

/**
 * 🧩 Helper: Get full media URL.
 */
const getFullUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return encodeURI(url);
  const baseUrl = (process.env.BASE_URL || 'https://wapipulse.com').replace(/\/$/, '');
  return encodeURI(`${baseUrl}${url.startsWith('/') ? url : `/${url}`}`);
};

/**
 * 💥 15. FINAL EXECUTION ENGINE (SIMPLIFIED)
 * Matches Rule 5 & 15: EXECUTION ENGINE
 */
const executeFlow = async (tenantId, flowId, contact, node, io, waService) => {
  try {
    const tenantDb = getTenantConnection(tenantId);
    const Contact = tenantDb.model('Contact', ContactSchema);
    const Message = tenantDb.model('Message', MessageSchema);

    // 🔄 Rule 5 & 15: while(node) loop
    while (node) {
      console.log(`[Flow Engine] 📤 Sending Node: ${node.id} (${node.data?.msgType || 'TEXT'})`);

      // 🚫 9. ANTI-DUPLICATION RULE
      // Before sending: if (contact.currentFlowStep === node.id) return;
      // We check fresh DB state to avoid race conditions
      const freshContact = await Contact.findOne({ phone: contact.phone });
      if (freshContact.currentFlowStep === node.id && isWaitingNode(node)) {
        console.log(`[Flow Engine] 🛑 Anti-duplication: Already at ${node.id}. Skipping.`);
        return; 
      }

      // Execute Node (Send Message)
      const { msgType = 'TEXT', text = '', mediaUrl = '', buttons = [], listOptions = [], buttonText = 'Select' } = node.data;
      const interpolatedText = interpolate(text, freshContact);

      const saveAndEmit = async (type, content, waResult) => {
        const savedMsg = await Message.create({
          contactId: freshContact._id,
          messageId: waResult?.messages?.[0]?.id || `out_${Date.now()}_flow`,
          direction: 'OUTBOUND',
          type,
          content,
          status: 'SENT'
        });
        if (io) io.to(tenantId).emit('new_message', { ...savedMsg._doc, contact: freshContact });
      };

      try {
        if (msgType === 'TEXT' || (!msgType && text)) {
          let res = await waService.sendTextMessage(freshContact.phone, interpolatedText);
          await saveAndEmit('text', interpolatedText, res);
        } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(msgType.toUpperCase())) {
          const finalMediaUrl = getFullUrl(mediaUrl);
          const isNumeric = mediaUrl && /^\d+$/.test(mediaUrl);
          let res = await waService.sendMedia(freshContact.phone, msgType.toLowerCase(), isNumeric ? mediaUrl : null, interpolatedText, isNumeric ? null : finalMediaUrl);
          await saveAndEmit(msgType.toLowerCase(), interpolatedText, res);
        } else if (msgType === 'INTERACTIVE' || msgType === 'INTERACTIVE_MESSAGE') {
          // Standard Buttons
          const btnLabels = (buttons || []).filter(b => b && b.trim() !== '').map(b => interpolate(b, freshContact));
          let res = await waService.sendSmartButtons(freshContact.phone, {
            body: interpolatedText,
            buttons: btnLabels.slice(0, 3) 
          });
          await saveAndEmit('interactive', interpolatedText, res);
        } else if (msgType === 'LIST_MESSAGE') {
          // Standard List
          const opts = (listOptions || []).filter(o => o && o.trim() !== '');
          let res = await waService.sendListMessage(freshContact.phone, {
            body: interpolatedText,
            buttonText: interpolate(buttonText || 'Select', freshContact),
            sections: [{ title: 'Options', rows: opts.map((opt, i) => ({ id: `list_${i}`, title: interpolate(opt, freshContact).substring(0, 24) })) }]
          });
          await saveAndEmit('interactive', interpolatedText, res);
        }
      } catch (e) {
        console.error(`[Flow Engine] Node ${node.id} Send Error:`, e.message);
      }

      // 🛑 5. STOP at QUESTION / LIST / BUTTON
      if (isWaitingNode(node)) {
        console.log(`[Flow Engine] ⏸️ STOP at Waiting Node: ${node.id}. Saving Session.`);
        await Contact.findOneAndUpdate(
          { phone: freshContact.phone }, 
          { currentFlowStep: node.id, lastFlowId: flowId }
        );
        break;
      }

      // ⏭️ Move to Next Node (Linear)
      const tenantFlowData = await tenantDb.model('Flow', FlowSchema).findById(flowId);
      const edges = tenantFlowData.edges.filter(e => e.source === node.id);
      
      // For non-waiting nodes, we usually expect only one edge (linear)
      if (edges.length > 0) {
        const edge = edges[0];
        node = tenantFlowData.nodes.find(n => n.id === edge.target);
      } else {
        console.log(`[Flow Engine] 🏁 END of Flow: ${node.id}. Clearing Session.`);
        await Contact.findOneAndUpdate({ phone: freshContact.phone }, { $unset: { currentFlowStep: "", lastFlowId: "" } });
        node = null;
      }
    }
  } catch (err) {
    console.error(`[Flow Engine] executeFlow Fatal:`, err);
  }
};

/**
 * ▶️ 5. START FLOW
 */
const startFlow = async (tenantId, flowId, contact, io, waService) => {
  try {
    const tenantDb = getTenantConnection(tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    const flowData = await Flow.findById(flowId);
    
    if (!flowData || flowData.status !== 'ACTIVE') return;

    // 1. Find start node (Trigger or First Node)
    let node = flowData.nodes.find(n => n.type === 'triggerNode' || n.id === 'start-1') || flowData.nodes[0];
    
    // 2. Execute
    await executeFlow(tenantId, flowId, contact, node, io, waService);
  } catch (err) {
    console.error(`[Flow Engine] startFlow Error:`, err);
  }
};

/**
 * 🔁 6. CONTINUE FLOW (CRITICAL)
 * Step-by-step resumption logic
 */
const continueFlow = async (tenantId, contact, messageText, replyValue, io, waService) => {
  try {
    const tenantDb = getTenantConnection(tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    const Contact = tenantDb.model('Contact', ContactSchema);

    // 🧩 1. Get last node
    const flowData = await Flow.findById(contact.lastFlowId);
    if (!flowData) return;

    const lastNode = flowData.nodes.find(n => n.id === contact.currentFlowStep);
    if (!lastNode) return;

    console.log(`[Flow Engine] 🔁 Resuming from: ${lastNode.id}. Input: "${replyValue || messageText}"`);

    // 🧩 2. Save user input
    // Only if the node has a variableName defined
    const variableName = lastNode.data?.variableName;
    if (variableName) {
      await Contact.findOneAndUpdate(
        { phone: contact.phone },
        { $set: { [`flowVariables.${variableName}`]: messageText } }
      );
      // Update local object for use in interpolation
      contact.flowVariables = { ...(contact.flowVariables || {}), [variableName]: messageText };
    }

    // 🧩 3. Determine input type
    const input = replyValue ? replyValue : messageText.trim();

    // 🧩 4. Find next node
    const edges = flowData.edges.filter(e => e.source === lastNode.id);

    // Matching logic (Rule 8): sourceHandle === input OR handle_${input}
    let edge = edges.find(e => 
      e.sourceHandle === input || 
      e.sourceHandle === `handle_${input}` ||
      (e.sourceHandle === messageText.trim() && !replyValue)
    );

    // Fallback: If only one edge exists and it's a generic transition
    if (!edge && edges.length === 1 && (!edges[0].sourceHandle || edges[0].sourceHandle === 'default')) {
      edge = edges[0];
    }

    if (!edge) {
      console.warn(`[Flow Engine] ⚠️ No matching branching for input: "${input}" at node ${lastNode.id}`);
      return;
    }

    // 🧩 5. Move to next node
    const nextNode = flowData.nodes.find(n => n.id === edge.target);

    // 🧩 6. Execute next nodes
    if (nextNode) {
      await executeFlow(tenantId, flowData._id, contact, nextNode, io, waService);
    } else {
      console.log(`[Flow Engine] 🏁 No target found for edge ${edge.id}. Clearing session.`);
      await Contact.findOneAndUpdate({ phone: contact.phone }, { $unset: { currentFlowStep: "", lastFlowId: "" } });
    }
  } catch (err) {
    console.error(`[Flow Engine] continueFlow Error:`, err);
  }
};

/**
 * 🟡 STEP 1: USER SENDS MESSAGE
 * Entry point for all incoming messages
 */
const processIncomingMessage = async (tenantId, contact, messageText, io, isNewContact = false, replyValue = null, oldLastMessageAt = null) => {
  try {
    const tenantDb = getTenantConnection(tenantId);
    const Contact = tenantDb.model('Contact', ContactSchema);
    const Flow = tenantDb.model('Flow', FlowSchema);

    // 🟡 STEP 2: LOAD CONTACT (ALWAYS FRESH)
    const activeContact = await Contact.findOne({ phone: contact.phone });
    if (!activeContact) return;

    // Setup WA Service
    const client = await Client.findOne({ tenantId });
    if (!client || !client.whatsappConfig) return;
    
    const waService = new WhatsAppService({
      accessToken: client.whatsappConfig.accessToken,
      phoneNumberId: client.whatsappConfig.phoneNumberId
    });

    const lastActivity = oldLastMessageAt || activeContact.lastMessageAt;

    // ⏱️ 11. TIMEOUT (30 min)
    if (lastActivity && activeContact.currentFlowStep) {
      const diffMins = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60);
      if (diffMins > 30) {
        console.log(`[Flow Engine] ⏱️ Timeout (${Math.round(diffMins)}m). Clearing session for ${activeContact.phone}`);
        await Contact.findOneAndUpdate({ phone: activeContact.phone }, { $unset: { currentFlowStep: "", lastFlowId: "" } });
        activeContact.currentFlowStep = null;
        activeContact.lastFlowId = null;
      }
    }

    // ✅ 10. SESSION RULES - Manual Reset
    if (messageText.toLowerCase().trim() === 'reset') {
      await Contact.findOneAndUpdate({ phone: activeContact.phone }, { $unset: { currentFlowStep: "", lastFlowId: "" } });
      return waService.sendTextMessage(activeContact.phone, "Session reset. Type 'hello' to start flow.");
    }

    // 🔵 3. SESSION CHECK
    // Session exists -> continueFlow()
    if (activeContact.currentFlowStep && activeContact.lastFlowId) {
      return await continueFlow(tenantId, activeContact, messageText, replyValue, io, waService);
    }

    // No session -> startFlow()
    // Find flow by keyword trigger
    const keywordFlow = await Flow.findOne({
      status: 'ACTIVE',
      tenantId,
      triggerType: 'KEYWORD',
      triggerKeywords: { $in: [messageText.toLowerCase().trim()] }
    });

    if (keywordFlow) {
      return await startFlow(tenantId, keywordFlow._id, activeContact, io, waService);
    }

    // Generic "Hello" catch-all if no keyword matches
    if (messageText.toLowerCase().match(/hi|hello|hey|start|menu/)) {
       const defaultFlow = await Flow.findOne({ status: 'ACTIVE', tenantId, triggerType: 'NEW_MESSAGE' }) 
                        || await Flow.findOne({ status: 'ACTIVE', tenantId });
       
       if (defaultFlow) {
         return await startFlow(tenantId, defaultFlow._id, activeContact, io, waService);
       }
    }

  } catch (err) {
    console.error('[Flow Engine] Fatal Entry Error:', err);
  }
};

module.exports = { startFlow, continueFlow, executeFlow, processIncomingMessage };


