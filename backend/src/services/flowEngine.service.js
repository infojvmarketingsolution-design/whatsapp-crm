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

/**
 * 🧩 Helper: Determine if a node should stop the flow and wait for user input.
 * Matches Rule 7: NODE TYPES
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

    while (node) {
      console.log(`[Flow Engine] 📤 Executing node: ${node.id} (${node.data?.msgType})`);

      // 🚫 Rule 9: ANTI-DUPLICATION RULE
      const freshContact = await Contact.findOne({ phone: contact.phone });
      if (freshContact.currentFlowStep === node.id && isWaitingNode(node)) {
        console.log(`[Flow Engine] 🛑 Anti-duplication: Skipping node ${node.id}`);
        break;
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

      // 🧩 Rule 5: STOP at QUESTION / LIST / BUTTON
      if (isWaitingNode(node)) {
        console.log(`[Flow Engine] ⏸️ Waiting Node: ${node.id}. Saving session.`);
        await Contact.findOneAndUpdate({ phone: freshContact.phone }, { currentFlowStep: node.id, lastFlowId: flowId });
        break;
      }

      // Move to next node (linear flow or default handle)
      const tenantFlowData = await tenantDb.model('Flow', FlowSchema).findById(flowId);
      const nextEdge = tenantFlowData.edges.find(e => e.source === node.id);
      if (nextEdge) {
        node = tenantFlowData.nodes.find(n => n.id === nextEdge.target);
      } else {
        console.log(`[Flow Engine] 🏁 End of flow reached for node ${node.id}`);
        await Contact.findOneAndUpdate({ phone: freshContact.phone }, { $unset: { currentFlowStep: "", lastFlowId: "" } });
        node = null;
      }
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
    console.log(`[Flow Engine] 🟢 Starting Flow: ${flowId} for ${contact.phone}`);
    const tenantDb = getTenantConnection(tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    const flowData = await Flow.findById(flowId);
    
    if (!flowData || flowData.status !== 'ACTIVE') return;

    // 1. Find start node
    let node = flowData.nodes.find(n => n.type === 'triggerNode' || n.id === 'start-1') || flowData.nodes[0];
    
    // 2. Execute
    await executeFlow(tenantId, flowId, contact, node, io, waService);
  } catch (error) {
    console.error(`[Flow Engine] startFlow Error:`, error);
  }
};

/**
 * 🔁 6. CONTINUE FLOW (CRITICAL)
 * Matches Rule 6: CONTINUE FLOW logic
 */
const continueFlow = async (tenantId, contact, messageText, replyValue, io, waService) => {
  try {
    console.log(`[Flow Engine] 🔁 Continuing Flow for ${contact.phone} | LastNode: ${contact.currentFlowStep}`);
    const tenantDb = getTenantConnection(tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    const Contact = tenantDb.model('Contact', ContactSchema);

    // 🧩 1. Get last node
    const flowData = await Flow.findById(contact.lastFlowId);
    if (!flowData) return;

    const lastNode = flowData.nodes.find(n => n.id === contact.currentFlowStep);
    if (!lastNode) return;

    // 🧩 2. Save user input
    const variableName = lastNode.data?.variableName;
    if (variableName) {
      console.log(`[Flow Engine] 💾 Saving variable: ${variableName} = ${messageText}`);
      await Contact.findOneAndUpdate(
        { phone: contact.phone },
        { $set: { [`flowVariables.${variableName}`]: messageText } }
      );
      // Update local object for interpolation in next steps
      contact.flowVariables = { ...(contact.flowVariables || {}), [variableName]: messageText };
    }

    // 🧩 3. Determine input type
    // If it's a list reply ID like 'list_0', list_1, etc, we use it. 
    // If it's a button reply title, we use it.
    const input = replyValue ? replyValue : messageText.trim();

    // 🧩 4. Find next node
    const edges = flowData.edges.filter(e => e.source === lastNode.id);
    
    // Exact match on sourceHandle (Rule 8)
    let edge = edges.find(e => 
      e.sourceHandle === input || 
      e.sourceHandle === `handle_${input}` ||
      (e.sourceHandle === messageText.trim() && !replyValue)
    );

    // Fallback if only one edge exists and no branch logic is defined
    if (!edge && edges.length === 1) {
      edge = edges[0];
    }

    if (!edge) {
      console.warn(`[Flow Engine] ⚠️ No matching edge found for input: "${input}" at node ${lastNode.id}`);
      return;
    }

    // 🧩 5. Move to next node
    const nextNode = flowData.nodes.find(n => n.id === edge.target);

    // 🧩 6. Execute next nodes
    if (nextNode) {
      await executeFlow(tenantId, flowData._id, contact, nextNode, io, waService);
    } else {
      console.log(`[Flow Engine] 🏁 No target node for edge ${edge.id}`);
      await Contact.findOneAndUpdate({ phone: contact.phone }, { $unset: { currentFlowStep: "", lastFlowId: "" } });
    }
  } catch (error) {
    console.error(`[Flow Engine] continueFlow Error:`, error);
  }
};

/**
 * 🟡 STEP 1: USER SENDS MESSAGE
 * Matches Rule 4: FLOW LIFECYCLE
 */
const processIncomingMessage = async (tenantId, contact, messageText, io, isNewContact = false, replyValue = null, oldLastMessageAt = null) => {
  try {
    const tenantDb = getTenantConnection(tenantId);
    const Contact = tenantDb.model('Contact', ContactSchema);
    const Flow = tenantDb.model('Flow', FlowSchema);

    // 🟡 STEP 2: LOAD CONTACT (ALWAYS FRESH)
    const activeContact = await Contact.findOne({ phone: contact.phone });
    if (!activeContact) return;

    // Use passed old timestamp for timeout check
    const lastActivity = oldLastMessageAt || activeContact.lastMessageAt;

    // ⏱️ 11. TIMEOUT (30 min)
    if (lastActivity) {
      const diff = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60);
      if (diff > 30 && activeContact.currentFlowStep) {
        console.log(`[Flow Engine] ⏱️ Session timeout for ${activeContact.phone} (${Math.round(diff)} mins)`);
        await Contact.findOneAndUpdate({ phone: activeContact.phone }, { $unset: { currentFlowStep: "", lastFlowId: "" } });
        activeContact.currentFlowStep = null;
        activeContact.lastFlowId = null;
      }
    }

    // ✅ Optional reset
    if (messageText.toLowerCase().trim() === 'reset') {
      console.log(`[Flow Engine] 🔄 Manual reset for ${activeContact.phone}`);
      await Contact.findOneAndUpdate({ phone: activeContact.phone }, { $unset: { currentFlowStep: "", lastFlowId: "" } });
      return waService.sendTextMessage(activeContact.phone, "Session reset. Type 'hello' to start again.");
    }

    // 🔵 STEP 3: SESSION CHECK
    if (activeContact.currentFlowStep && activeContact.lastFlowId) {
      return await continueFlow(tenantId, activeContact, messageText, replyValue, io, waService);
    }

    // ▶️ Find Start Flow (by keyword)
    const keywordFlow = await Flow.findOne({
      status: 'ACTIVE',
      tenantId,
      triggerType: 'KEYWORD',
      triggerKeywords: { $in: [messageText.toLowerCase().trim()] }
    });

    if (keywordFlow) {
      return await startFlow(tenantId, keywordFlow._id, activeContact, io, waService);
    }

    // Fallback to PRD Default if enabled and no other flow matches
    // (Legacy support or catch-all)
    if (messageText.toLowerCase().match(/hi|hello|hey|start|menu/)) {
       // Check for a default flow or start the PRD hardcoded one
       const defaultFlow = await Flow.findOne({ status: 'ACTIVE', tenantId, triggerType: 'NEW_MESSAGE' });
       if (defaultFlow) {
         return await startFlow(tenantId, defaultFlow._id, activeContact, io, waService);
       } else {
         // Use PRDFlowService as a last resort if no generic flow is configured
         const PRDFlowService = require('./prdFlow.service');
         return await PRDFlowService.processStep(tenantId, activeContact, messageText, waService, io, false, replyValue);
       }
    }

  } catch (err) {
    console.error('[Flow Engine] Fatal Error:', err);
  }
};

module.exports = { startFlow, continueFlow, executeFlow, processIncomingMessage };

