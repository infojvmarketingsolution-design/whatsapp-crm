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
 * 🚀 WHATSAPP FLOW ENGINE – FULL PRD (CONTINUOUS MODE)
 */

const isWaitingNode = (node) => {
  if (!node || !node.data) return false;
  const msgType = node.data.msgType;
  return ['QUESTION', 'LIST_MESSAGE', 'INTERACTIVE', 'INTERACTIVE_MESSAGE'].includes(msgType);
};

/**
 * 🧩 Helper: Interpolate variables in text.
 */
const interpolate = (text, contact) => {
  if (!text) return '';
  return text.replace(/\{\{(.*?)\}\}/g, (match, key) => {
    const v = key.trim();
    if (v === 'name' || v === 'visitor_name') return contact.flowVariables?.name || contact.name || 'Friend';
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
 * 💥 FINAL EXECUTION ENGINE (SIMPLIFIED)
 * Matches Rule 15: EXECUTION ENGINE
 */
const executeFlow = async (tenantId, flowId, contact, node, io, waService) => {
  try {
    const tenantDb = getTenantConnection(tenantId);
    const Contact = tenantDb.model('Contact', ContactSchema);
    const Message = tenantDb.model('Message', MessageSchema);
    const Flow = tenantDb.model('Flow', FlowSchema);

    while (node) {
      console.log(`[Flow Engine] 📤 Executing node: ${node.id} (${node.data?.msgType})`);

      // 🔄 ALWAYS REFETCH CONTACT FOR ATOMIC STATE
      const freshContact = await Contact.findOne({ phone: contact.phone });

      // 🚫 ANTI DUPLICATE CHECK (Guard against double execution in same tick)
      if (freshContact.currentFlowStep === node.id && node.executed) {
        return;
      }

      // Send Message logic
      if (node.type === 'messageNode' || node.type === 'triggerNode') {
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
          if (msgType === 'TEXT' && text) {
            let res = await waService.sendTextMessage(freshContact.phone, interpolatedText);
            await saveAndEmit('text', interpolatedText, res);
          } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(msgType.toUpperCase())) {
            const finalMediaUrl = getFullUrl(mediaUrl);
            const isNumeric = mediaUrl && /^\d+$/.test(mediaUrl);
            let res = await waService.sendMedia(freshContact.phone, msgType.toLowerCase(), isNumeric ? mediaUrl : null, interpolatedText, isNumeric ? null : finalMediaUrl);
            await saveAndEmit(msgType.toLowerCase(), interpolatedText, res);
          } else if (msgType === 'INTERACTIVE' || msgType === 'INTERACTIVE_MESSAGE') {
            let res = await waService.sendSmartButtons(freshContact.phone, {
              body: interpolatedText,
              buttons: buttons.filter(b => b && b.trim() !== '').map(b => interpolate(b, freshContact))
            });
            await saveAndEmit('interactive', interpolatedText, res);
          } else if (msgType === 'LIST_MESSAGE') {
            let res = await waService.sendListMessage(freshContact.phone, {
              body: interpolatedText,
              buttonText: interpolate(buttonText, freshContact),
              sections: [{ title: 'Options', rows: listOptions.map((opt, i) => ({ id: `list_${i}`, title: interpolate(opt, freshContact).substring(0, 24) })) }]
            });
            await saveAndEmit('interactive', interpolatedText, res);
          }
        } catch (e) {
          console.error(`[Flow Engine] Node Error:`, e.message);
        }
      } else if (node.type === 'actionNode') {
        const tag = interpolate(node.data?.tag || '', freshContact);
        if (tag) {
          await Contact.findOneAndUpdate({ phone: freshContact.phone }, { $addToSet: { tags: tag } });
        }
      }

      // Mark as executed in this loop context
      node.executed = true;

      // ⛔ STOP if waiting node (QUESTION/LIST/BUTTONS)
      if (isWaitingNode(node)) {
        console.log(`[Flow Engine] ⏸️ Waiting Node: ${node.id}.`);
        await Contact.updateOne(
          { phone: freshContact.phone },
          { currentFlowStep: node.id }
        );
        return;
      }

      // ➡️ NEXT NODE
      const flow = await Flow.findById(flowId);
      const edge = flow.edges.find(e => e.source === node.id);

      if (!edge) {
        return clearSession(tenantId, freshContact.phone);
      }

      node = flow.nodes.find(n => n.id === edge.target);

      await Contact.updateOne(
        { phone: freshContact.phone },
        { currentFlowStep: node.id }
      );
    }
  } catch (error) {
    console.error(`[Flow Engine] executeFlow Fatal:`, error);
  }
};

/**
 * ▶️ 5. START FLOW
 * Matches Rule 5: START FLOW logic
 */
const startFlow = async (tenantId, flowId, contact, io, waService) => {
  try {
    console.log(`[Flow Engine] 🚀 Starting Flow: ${flowId} for ${contact.phone}`);
    const tenantDb = getTenantConnection(tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    const Contact = tenantDb.model('Contact', ContactSchema);

    const flow = await Flow.findById(flowId);
    if (!flow || flow.status !== 'ACTIVE') return;

    const startNode = flow.nodes.find(n => n.type === 'triggerNode' || n.id === 'start-1') || flow.nodes[0];

    await Contact.updateOne(
      { phone: contact.phone },
      {
        currentFlowId: flow._id,
        currentFlowStep: startNode.id,
        isFlowActive: true,
        flowVersion: flow.version || 1
      }
    );

    return executeFlow(tenantId, flow._id, contact, startNode, io, waService);
  } catch (error) {
    console.error(`[Flow Engine] startFlow Error:`, error);
  }
};

/**
 * 🔁 6. CONTINUE FLOW (CRITICAL)
 * Matches Rule 6: CONTINUE FLOW logic
 */
const continueFlow = async (tenantId, phone, messageText, replyValue, io, waService) => {
  try {
    const tenantDb = getTenantConnection(tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    const Contact = tenantDb.model('Contact', ContactSchema);

    // 🔥 ALWAYS REFETCH CONTACT
    const contact = await Contact.findOne({ phone });
    if (!contact || !contact.currentFlowId) return;

    const flow = await Flow.findById(contact.currentFlowId);
    if (!flow) return;

    const lastNode = flow.nodes.find(n => n.id === contact.currentFlowStep);

    // 🧩 SAVE VARIABLE
    if (lastNode?.data?.variableName) {
      await Contact.updateOne(
        { phone },
        {
          $set: {
            [`flowVariables.${lastNode.data.variableName}`]: messageText
          }
        }
      );
    }

    const input = replyValue || messageText.trim();

    // 🔥 STRICT EDGE MATCH
    const edge = flow.edges.find(e =>
      e.source === lastNode.id &&
      (e.sourceHandle === input || e.sourceHandle === `handle_${input}`)
    );

    if (!edge) {
      // Fallback for linear flow with single edge
      const singleEdge = flow.edges.find(e => e.source === lastNode.id && (!e.sourceHandle || e.sourceHandle === ''));
      if (singleEdge) {
        const nextNode = flow.nodes.find(n => n.id === singleEdge.target);
        await Contact.updateOne({ phone }, { currentFlowStep: nextNode.id });
        return executeFlow(tenantId, flow._id, contact, nextNode, io, waService);
      }

      return waService.sendTextMessage(phone, "Invalid option. Please try again.");
    }

    const nextNode = flow.nodes.find(n => n.id === edge.target);

    await Contact.updateOne(
      { phone },
      { currentFlowStep: nextNode.id }
    );

    return executeFlow(tenantId, flow._id, contact, nextNode, io, waService);
  } catch (error) {
    console.error(`[Flow Engine] continueFlow Error:`, error);
  }
};

/**
 * 🟡 STEP 1: USER SENDS MESSAGE
 * Matches Rule 4: FLOW LIFECYCLE
 */
const clearSession = async (tenantId, phone) => {
  const tenantDb = getTenantConnection(tenantId);
  const Contact = tenantDb.model('Contact', ContactSchema);
  await Contact.updateOne(
    { phone },
    {
      currentFlowStep: null,
      currentFlowId: null,
      isFlowActive: false
    }
  );
};

const processIncomingMessage = async (tenantId, contact, messageText, io, isNewContact = false, replyValue = null, oldLastMessageAt = null) => {
  try {
    const tenantDb = getTenantConnection(tenantId);
    const Contact = tenantDb.model('Contact', ContactSchema);
    const Flow = tenantDb.model('Flow', FlowSchema);

    // 🟡 LOAD CONTACT (ALWAYS FRESH)
    const activeContact = await Contact.findOne({ phone: contact.phone });
    if (!activeContact) return;

    // Initialize WhatsApp Service
    const client = await Client.findOne({ tenantId });
    if (!client || !client.whatsappConfig) return;
    
    const waService = new WhatsAppService({
      accessToken: client.whatsappConfig.accessToken,
      phoneNumberId: client.whatsappConfig.phoneNumberId
    });

    // ⏱️ TIMEOUT RESET
    if (activeContact.lastMessageAt && Date.now() - activeContact.lastMessageAt > 30 * 60 * 1000) {
      await clearSession(tenantId, activeContact.phone);
      return processIncomingMessage(tenantId, contact, messageText, io, isNewContact, replyValue, null); // Re-run as fresh session
    }

    // ✅ Manual reset
    if (messageText.toLowerCase().trim() === 'reset') {
      await clearSession(tenantId, activeContact.phone);
      return waService.sendTextMessage(activeContact.phone, "Session reset. Type 'hello' to start again.");
    }

    // 🔀 ROUTING
    if (activeContact.isFlowActive && activeContact.currentFlowStep) {
      return continueFlow(tenantId, activeContact.phone, messageText, replyValue, io, waService);
    }

    // ▶️ Find Start Flow (by keyword)
    const keywordFlow = await Flow.findOne({
      status: 'ACTIVE',
      triggerType: 'KEYWORD',
      triggerKeywords: { $in: [messageText.toLowerCase().trim()] }
    });

    if (keywordFlow) {
      return startFlow(tenantId, keywordFlow._id, activeContact, io, waService);
    }

    // Fallback to Default Flow
    if (messageText.toLowerCase().match(/hi|hello|hey|start|menu/)) {
       const defaultFlow = await Flow.findOne({ status: 'ACTIVE', triggerType: 'NEW_MESSAGE' });
       if (defaultFlow) {
         return startFlow(tenantId, defaultFlow._id, activeContact, io, waService);
       }
    }

  } catch (err) {
    console.error('[Flow Engine] Fatal Error:', err);
  }
};

module.exports = { startFlow, continueFlow, executeFlow, processIncomingMessage, clearSession };

