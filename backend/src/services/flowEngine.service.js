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
    const Flow = tenantDb.model('Flow', FlowSchema);

    // Context-level execution guard (memory-based for current request)
    const executedNodes = new Set();

    while (node) {
      console.log(`[Flow Engine] 📤 Executing node: ${node.id} (${node.data?.msgType})`);

      // 🚫 Rule 9: ANTI-DUPLICATION (Memory Guard)
      if (executedNodes.has(node.id)) {
        console.log(`[Flow Engine] 🛑 Loop detected or node already executed in this pass: ${node.id}`);
        break;
      }
      executedNodes.add(node.id);

      // Re-fetch contact to ensure atomic state transitions (PRD Requirement)
      const freshContact = await Contact.findOne({ phone: contact.phone });

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

      // 🧩 Rule 5: STOP if waiting node (PRD requirement)
      if (isWaitingNode(node)) {
        console.log(`[Flow Engine] ⏸️ Waiting Node: ${node.id}. Stopping sequential execution.`);
        await Contact.updateOne(
          { phone: freshContact.phone }, 
          { currentFlowStep: node.id, currentFlowId: flowId }
        );
        return; 
      }

      // ➡️ NEXT NODE (Linear sequential flow)
      const flowObject = await Flow.findById(flowId);
      const nextEdge = flowObject.edges.find(e => e.source === node.id);
      
      if (nextEdge) {
        node = flowObject.nodes.find(n => n.id === nextEdge.target);
        // Sync state to DB before moving to next in while loop
        await Contact.updateOne(
          { phone: freshContact.phone },
          { currentFlowStep: node.id }
        );
      } else {
        console.log(`[Flow Engine] 🏁 End of flow reached at node: ${node.id}`);
        await clearSession(tenantId, freshContact.phone);
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
    const Contact = tenantDb.model('Contact', ContactSchema);
    
    const flowData = await Flow.findById(flowId);
    if (!flowData || (flowData.status !== 'ACTIVE' && flowData.status !== 'PUBLISHED')) return;

    // 1. Find start node
    let startNode = flowData.nodes.find(n => n.type === 'triggerNode' || n.type === 'start' || n.id === 'start-1') || flowData.nodes[0];
    
    // 2. Initialize Flow Session (PRD REQUIREMENT)
    await Contact.updateOne(
      { phone: contact.phone },
      {
        currentFlowId: flowData._id,
        currentFlowStep: startNode.id,
        isFlowActive: true,
        flowVersion: flowData.version || 1
      }
    );

    // 3. Execute
    await executeFlow(tenantId, flowData._id, contact, startNode, io, waService);
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
    const tenantDb = getTenantConnection(tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    const Contact = tenantDb.model('Contact', ContactSchema);

    // 🔥 ALWAYS REFETCH (PRD REQ)
    const activeContact = await Contact.findOne({ phone: contact.phone });
    if (!activeContact || !activeContact.currentFlowId) return;

    console.log(`[Flow Engine] 🔁 Continuing Flow for ${activeContact.phone} | LastNode: ${activeContact.currentFlowStep}`);

    // 🧩 1. Get flow data
    const flowData = await Flow.findById(activeContact.currentFlowId);
    if (!flowData) return;

    const lastNode = flowData.nodes.find(n => n.id === activeContact.currentFlowStep);
    if (!lastNode) return;

    // 🧩 2. SAVE VARIABLE (PRD REQ)
    const variableName = lastNode.data?.variableName;
    if (variableName) {
      console.log(`[Flow Engine] 💾 Saving variable: ${variableName} = ${messageText}`);
      await Contact.updateOne(
        { phone: activeContact.phone },
        { $set: { [`flowVariables.${variableName}`]: messageText } }
      );
    }

    // 🧩 3. STRICT EDGE MATCH (PRD REQ)
    // sourceHandle matches button ID/List ID OR Title
    const input = replyValue || messageText.trim();

    const edge = flowData.edges.find(e => 
      e.source === lastNode.id && 
      (e.sourceHandle === input || e.sourceHandle === `handle_${input}`)
    );

    if (!edge) {
      console.warn(`[Flow Engine] ⚠️ No strict edge match for: "${input}"`);
      // Optional: Send invalid option message
      return waService.sendTextMessage(activeContact.phone, "Invalid option. Please try again.");
    }

    // 🧩 4. Move to next node
    const nextNode = flowData.nodes.find(n => n.id === edge.target);

    if (nextNode) {
      await Contact.updateOne(
        { phone: activeContact.phone },
        { currentFlowStep: nextNode.id }
      );
      await executeFlow(tenantId, flowData._id, activeContact, nextNode, io, waService);
    } else {
      console.log(`[Flow Engine] 🏁 No target for edge ${edge.id}`);
      await clearSession(tenantId, activeContact.phone);
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

    // Initialize WhatsApp Service
    const client = await Client.findOne({ tenantId });
    if (!client || !client.whatsappConfig) return;
    
    const waService = new WhatsAppService({
      accessToken: client.whatsappConfig.accessToken,
      phoneNumberId: client.whatsappConfig.phoneNumberId
    });

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

    // 🔵 STEP 3: SESSION CHECK (PRD REQ: isFlowActive)
    if (activeContact.isFlowActive && activeContact.currentFlowStep && activeContact.currentFlowId) {
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
          await PRDFlowService.processStep(tenantId, activeContact, messageText, waService, io, false, replyValue);
          
          const Message = tenantDb.model('Message', MessageSchema);
          return await PRDFlowService.updateLeadScore(Contact, Message, activeContact._id, io, tenantId);
       }
    }

  } catch (err) {
    console.error('[Flow Engine] Fatal Error:', err);
  }
};

/**
 * 🔄 7. SESSION MANAGEMENT (PRD FIX)
 */
async function clearSession(tenantId, phone) {
  try {
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
    console.log(`[Flow Engine] 🧹 Session cleared for ${phone}`);
  } catch (err) {
    console.error('[Flow Engine] clearSession Error:', err);
  }
}

module.exports = { startFlow, continueFlow, executeFlow, processIncomingMessage, clearSession };

