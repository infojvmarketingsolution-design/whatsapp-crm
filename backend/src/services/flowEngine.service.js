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
 * 🚀 WHATSAPP FLOW ENGINE – RESOLUTION PRD (FINAL FIXED & STABLE + AI SMART + VERBOSE LOGS)
 */

const isWaitingNode = (node) => {
  if (!node || !node.data) return false;
  const msgType = node.data.msgType;
  return ['QUESTION', 'LIST_MESSAGE', 'INTERACTIVE', 'INTERACTIVE_MESSAGE'].includes(msgType);
};

const normalize = v => v?.toString().toLowerCase().trim();

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
 * ⚙️ 8. EXECUTION ENGINE (FINAL SAFE VERSION)
 * Matches Rule 15: EXECUTION ENGINE
 */
const executeFlow = async (tenantId, flowId, contact, node, io, waService) => {
  try {
    const tenantDb = getTenantConnection(tenantId);
    const Contact = tenantDb.model('Contact', ContactSchema);
    const Message = tenantDb.model('Message', MessageSchema);

    while (node) {
      console.log(`[Flow Engine] 📤 Node: ${node.id} (${node.data?.msgType})`);

      // 🔄 ALWAYS REFETCH CONTACT FOR ATOMIC STATE
      const freshContact = await Contact.findOne({ phone: contact.phone });

      // 🚫 DUPLICATE GUARD (Rule 8)
      if (freshContact.lastExecutedNode === node.id) {
        console.log(`[Flow Engine] 🛑 Guard: Node ${node.id} already executed. Skipping send.`);
      } else {
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

        // ✅ SAVE EXECUTION (Rule 8)
        await Contact.updateOne(
          { phone: freshContact.phone },
          { lastExecutedNode: node.id }
        );
      }

      // ⛔ STOP if waiting node (Rule 11)
      if (isWaitingNode(node)) {
        console.log(`[Flow Engine] ⏸️ Waiting Node: ${node.id}.`);
        await Contact.updateOne(
          { phone: freshContact.phone },
          { currentFlowStep: node.id }
        );
        return;
      }

      // ➡️ NEXT NODE (From Snapshot - Rule 10)
      const flow = freshContact.flowSnapshot;
      const edge = flow.edges.find(e => e.source === node.id);

      if (!edge) {
        console.log(`[Flow Engine] 🏁 End of flow.`);
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
 * ▶️ 6. START FLOW
 * Matches Rule 6: START FLOW logic
 */
const startFlow = async (tenantId, flowId, contact, io, waService) => {
  try {
    console.log(`[Flow Engine] 🚀 Starting Flow: ${flowId} for ${contact.phone}`);
    const tenantDb = getTenantConnection(tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    const Contact = tenantDb.model('Contact', ContactSchema);

    const flow = await Flow.findById(flowId);
    if (!flow || flow.status !== 'ACTIVE') {
       console.log(`[Flow Engine] ⚠️ Flow ${flowId} not found or NOT ACTIVE.`);
       return;
    }

    const startNode = flow.nodes.find(n => n.type === 'triggerNode' || n.id === 'start-1' || n.id === 'start') || flow.nodes[0];

    // 🔥 SAVE SESSION + SNAPSHOT (Rule 6)
    await Contact.updateOne(
      { phone: contact.phone },
      {
        currentFlowId: flow._id,
        currentFlowStep: startNode.id,
        isFlowActive: true,
        flowSnapshot: {
          nodes: flow.nodes,
          edges: flow.edges
        },
        lastExecutedNode: null // Reset for new session
      }
    );

    // 📊 METRICS (Rule 13)
    await Flow.updateOne({ _id: flowId }, { $inc: { 'metrics.triggeredCount': 1 } });

    return executeFlow(tenantId, flow._id, contact, startNode, io, waService);
  } catch (error) {
    console.error(`[Flow Engine] startFlow Error:`, error);
  }
};

/**
 * 🔁 7. CONTINUE FLOW (FINAL FIXED + SMART AI)
 */
const continueFlow = async (tenantId, phone, messageText, replyValue, io, waService) => {
  try {
    const tenantDb = getTenantConnection(tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    const Contact = tenantDb.model('Contact', ContactSchema);

    // 🧩 STEP 1: ALWAYS REFETCH
    const contact = await Contact.findOne({ phone });
    if (!contact || !contact.currentFlowId || !contact.flowSnapshot) {
       console.log(`[Flow Engine] ❌ Missing Snapshot for ${phone}. Resetting.`);
       await clearSession(tenantId, phone);
       return waService.sendTextMessage(phone, "Session expired or reset. Please type 'hello' to restart.");
    }

    // 🧩 STEP 2: LOAD SNAPSHOT (Rule 7 Step 2)
    const flow = contact.flowSnapshot;
    const lastNode = flow.nodes.find(n => n.id === contact.currentFlowStep);

    // 🧩 STEP 3: SAVE VARIABLE (SMART AI EXTRACTION)
    if (lastNode?.data?.variableName) {
      let extractedValue = messageText;
      
      // ✨ AI EXTRACTOR (Smart Resolve)
      try {
        const vName = normalize(lastNode.data.variableName);
        if (vName === 'name' || vName === 'visitor_name' || vName === 'firstname') {
           console.log(`[Flow Engine] ✨ Extracting NAME from: "${messageText}"`);
           extractedValue = await AIService.extractData(messageText, 'NAME');
           console.log(`[Flow Engine] ✅ Extracted: "${extractedValue}"`);
        } else if (vName === 'qualification') {
           console.log(`[Flow Engine] ✨ Extracting QUALIFICATION from: "${messageText}"`);
           extractedValue = await AIService.extractData(messageText, 'QUALIFICATION');
           console.log(`[Flow Engine] ✅ Extracted: "${extractedValue}"`);
        }
      } catch (aiErr) {
        console.error('[Flow Engine] AI Extraction Failed (Falling back to raw):', aiErr.message);
      }

      await Contact.updateOne(
        { phone },
        {
          $set: {
            [`flowVariables.${lastNode.data.variableName}`]: extractedValue
          }
        }
      );
    }

    // 🧩 STEP 4: NORMALIZE INPUT
    const input = normalize(replyValue || messageText);

    // 🧩 STEP 5: EDGE MATCH (STRICT - Rule 7 Step 5)
    console.log(`[Flow Engine] 🎯 Matching input "${input}" at node ${lastNode.id}`);
    const edge = flow.edges.find(e =>
      e.source === lastNode.id &&
      normalize(e.sourceHandle) === input
    );

    if (!edge) {
      // ⚡ Fallback edge check
      const fallbackEdge = flow.edges.find(e => e.source === lastNode.id && (!e.sourceHandle || e.sourceHandle === ''));
      
      if (fallbackEdge) {
        console.log(`[Flow Engine] ⚡ Using fallback edge at node ${lastNode.id}`);
        const nextNode = flow.nodes.find(n => n.id === fallbackEdge.target);
        await Contact.updateOne({ phone }, { currentFlowStep: nextNode.id });
        return executeFlow(tenantId, contact.currentFlowId, contact, nextNode, io, waService);
      }

      console.log(`[Flow Engine] ❌ No edge matched for input: "${input}".`);
      return waService.sendTextMessage(phone, "Invalid option. Please choose from the options provided.");
    }

    const nextNode = flow.nodes.find(n => n.id === edge.target);

    // 🧩 STEP 6: MOVE NEXT
    await Contact.updateOne(
      { phone },
      { currentFlowStep: nextNode.id }
    );

    // 🧩 STEP 7: EXECUTE
    return executeFlow(tenantId, contact.currentFlowId, contact, nextNode, io, waService);
  } catch (error) {
    console.error(`[Flow Engine] continueFlow Error:`, error);
  }
};

/**
 * 🟡 11. SESSION MANAGEMENT
 */
const clearSession = async (tenantId, phone) => {
  const tenantDb = getTenantConnection(tenantId);
  const Contact = tenantDb.model('Contact', ContactSchema);
  const contact = await Contact.findOne({ phone });
  
  if (contact && contact.currentFlowId) {
    const Flow = tenantDb.model('Flow', FlowSchema);
    // 📊 METRICS Completion
    await Flow.updateOne({ _id: contact.currentFlowId }, { $inc: { 'metrics.completionCount': 1 } });
  }

  await Contact.updateOne(
    { phone },
    {
      currentFlowStep: null,
      currentFlowId: null,
      isFlowActive: false,
      flowVariables: {},
      lastExecutedNode: null,
      flowSnapshot: { nodes: [], edges: [] }
    }
  );
};

const processIncomingMessage = async (tenantId, contact, messageText, io, isNewContact = false, replyValue = null) => {
  try {
    const tenantDb = getTenantConnection(tenantId);
    const Contact = tenantDb.model('Contact', ContactSchema);
    const Flow = tenantDb.model('Flow', FlowSchema);

    console.log(`[Flow Engine] 📩 Processing: "${messageText}" for ${contact.phone}`);

    // 🟡 LOAD CONTACT (ALWAYS FRESH)
    const activeContact = await Contact.findOne({ phone: contact.phone });
    if (!activeContact) {
       console.log(`[Flow Engine] ❌ Contact ${contact.phone} not found in DB!`);
       return;
    }

    // Initialize WhatsApp Service
    const client = await Client.findOne({ tenantId });
    if (!client || !client.whatsappConfig) {
       console.log(`[Flow Engine] ❌ Client config missing for tenant: ${tenantId}`);
       return;
    }
    
    const waService = new WhatsAppService({
      accessToken: client.whatsappConfig.accessToken,
      phoneNumberId: client.whatsappConfig.phoneNumberId
    });

    // ⏱️ 12. TIMEOUT RULE
    if (activeContact.lastMessageAt && Date.now() - activeContact.lastMessageAt > 30 * 60 * 1000) {
      console.log(`[Flow Engine] ⏱️ Session timeout for ${activeContact.phone}. Clearing.`);
      await clearSession(tenantId, activeContact.phone);
      const resetContact = await Contact.findOne({ phone: contact.phone });
      return processIncomingMessage(tenantId, resetContact.toObject(), messageText, io, isNewContact, replyValue);
    }

    // ✅ Manual reset
    if (messageText.toLowerCase().trim() === 'reset') {
      console.log(`[Flow Engine] 🔄 Manual reset for ${activeContact.phone}`);
      await clearSession(tenantId, activeContact.phone);
      return waService.sendTextMessage(activeContact.phone, "Session reset. Type 'hello' to start again.");
    }

    // 🔀 ROUTING (Rule 5)
    if (activeContact.isFlowActive && activeContact.currentFlowStep) {
      console.log(`[Flow Engine] ⏩ Continuing active flow: ${activeContact.currentFlowId}`);
      return continueFlow(tenantId, activeContact.phone, messageText, replyValue, io, waService);
    }

    // ▶️ Find Start Flow (by keyword)
    const keywordFlow = await Flow.findOne({
      status: 'ACTIVE',
      triggerType: 'KEYWORD',
      triggerKeywords: { $in: [messageText.toLowerCase().trim()] }
    });

    if (keywordFlow) {
      console.log(`[Flow Engine] 🎯 Keyword Trigger Matched: ${keywordFlow.name}`);
      return startFlow(tenantId, keywordFlow._id, activeContact, io, waService);
    }

    // Fallback to Default Flow (Trigger Type NEW_MESSAGE or match greeting)
    if (messageText.toLowerCase().match(/hi|hello|hey|start|menu/)) {
       console.log(`[Flow Engine] 👋 Greeting Match. Checking for Default Flow...`);
       const defaultFlow = await Flow.findOne({ status: 'ACTIVE', triggerType: 'NEW_MESSAGE' });
       if (defaultFlow) {
         return startFlow(tenantId, defaultFlow._id, activeContact, io, waService);
       } else {
         console.log(`[Flow Engine] ⚠️ No Active 'NEW_MESSAGE' triggers found.`);
       }
    }

    // 🤖 AI CONVERSATIONAL FALLBACK (Smart Resolution)
    console.log(`[Flow Engine] 🤖 Checking AI Settings for fallback...`);
    const settings = await Settings.findOne({ tenantId });
    if (settings?.automation?.botEnabled) {
       console.log(`[Flow Engine] 🧠 AI Bot Enabled. Generating response for: "${messageText}"`);
       const aiReply = await AIService.askAI(messageText, "Education CRM. We offer Software Engineering, VFX, and AI courses.");
       
       // Record in DB
       const Message = tenantDb.model('Message', MessageSchema);
       const savedMsg = await Message.create({
          contactId: activeContact._id,
          messageId: `ai_${Date.now()}`,
          direction: 'OUTBOUND',
          type: 'text',
          content: aiReply,
          status: 'SENT'
       });
       if (io) io.to(tenantId).emit('new_message', { ...savedMsg._doc, contact: activeContact });

       return waService.sendTextMessage(activeContact.phone, aiReply);
    } else {
       console.log(`[Flow Engine] 🔇 AI Bot Disabled. Ending silently.`);
    }

  } catch (err) {
    console.error('[Flow Engine] Fatal Error:', err);
  }
};

module.exports = { startFlow, continueFlow, executeFlow, processIncomingMessage, clearSession };
