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

/**
 * Traverses a visually-built ReactFlow JSON graph synchronously.
 */
const executeFlow = async (tenantId, flowId, contact, io, startNodeId = null, replyValue = null) => {
  try {
    console.log(`[Flow Engine] STARTING EXECUTION | Flow: ${flowId} | Contact: ${contact.phone} | StartNode: ${startNodeId}`);
    
    const tenantDb = getTenantConnection(tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);
    const Contact = tenantDb.model('Contact', ContactSchema);
    const Message = tenantDb.model('Message', MessageSchema);
    
    let flowData = await Flow.findById(flowId);
    if (!flowData || flowData.status !== 'ACTIVE') {
        console.log(`[Flow Engine] Flow not found or inactive: ${flowId}`);
        return;
    }

    const { nodes, edges } = flowData;
    
    const client = await Client.findOne({ tenantId });
    if (!client || !client.whatsappConfig) {
        console.log(`[Flow Engine] No WhatsApp config for tenant: ${tenantId}`);
        return;
    }

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

    const getFullUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return encodeURI(url);
        // Use environment variable for base URL if provided, fallback to wapipulse.com
        const baseUrl = (process.env.BASE_URL || 'https://wapipulse.com').replace(/\/$/, '');
        const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
        return encodeURI(`${baseUrl}${normalizedUrl}`);
    };

    let currentNode;
    if (startNodeId) {
        console.log(`[Flow Engine] Branching from Node: ${startNodeId} with Reply: ${replyValue}`);
        const lastNode = nodes.find(n => n.id === startNodeId);
        const outgoingEdges = edges.filter(e => e.source === startNodeId);
        
        if (lastNode && outgoingEdges.length > 1) {
            console.log(`[Flow Engine] Searching for edge with handle matching "${replyValue}" among ${outgoingEdges.length} options...`);
            let targetEdge = outgoingEdges.find(e => {
                const handle = e.sourceHandle;
                const isMatch = (handle === replyValue || handle === `handle_${replyValue}`);
                console.log(`[Flow Engine] Checking Handle: "${handle}" vs Input: "${replyValue}" | Match: ${isMatch}`);
                return isMatch;
            });

            if (!targetEdge && replyValue && replyValue.startsWith('list_')) {
                console.log(`[Flow Engine] No strict match. Trying loose list_ match for ${replyValue}...`);
                targetEdge = outgoingEdges.find(e => e.sourceHandle === replyValue);
            }

            if (!targetEdge) {
                console.log(`[Flow Engine] ❌ NO BRANCH MATCH FOUND for "${replyValue}". Using fallback.`);
                targetEdge = outgoingEdges[0]; 
            } else {
                console.log(`[Flow Engine] ✅ MATCHED EDGE: ${targetEdge.id} leading to node: ${targetEdge.target}`);
            }
            currentNode = targetEdge ? nodes.find(n => n.id === targetEdge.target) : null;
        } else {
            console.log(`[Flow Engine] Linear path. Moving to next node.`);
            const nextEdge = edges.find(e => e.source === startNodeId);
            currentNode = nextEdge ? nodes.find(n => n.id === nextEdge.target) : null;
        }
    } else {
        currentNode = nodes.find(n => n.type === 'triggerNode' || n.id === 'start-1');
        console.log(`[Flow Engine] Fresh start at node: ${currentNode?.id}`);
    }

    let executionLimit = 20;
    let steps = 0;

    while (currentNode && steps < executionLimit) {
       steps++;
       console.log(`[Flow Engine] Node ${steps}: ${currentNode.id} [${currentNode.type}]`);

       // Persist state by phone instead of ID to be safe
       await Contact.findOneAndUpdate({ phone: contact.phone }, { 
           currentFlowStep: currentNode.id, 
           lastFlowId: flowId,
           lastMessageAt: new Date()
       });

       if (currentNode.type === 'messageNode') {
           const { msgType = 'TEXT', text = '', mediaId = '', buttons = [], header = {}, footer = '', listOptions = [], buttonText = 'Menu', mediaUrl = '' } = currentNode.data;
           
           const interpolatedText = interpolate(text);
           const interpolatedHeader = header.text ? { ...header, text: interpolate(header.text) } : header;
           const publicMediaUrl = getFullUrl(mediaUrl || currentNode.data.mediaUrl);

           const saveAndEmit = async (type, content, waResult) => {
               try {
                  const savedMsg = await Message.create({
                      contactId: contact._id,
                      messageId: waResult?.messages?.[0]?.id || `out_${Date.now()}_flow_sent`,
                      direction: 'OUTBOUND',
                      type: type,
                      content: content,
                      status: 'SENT'
                  });
                  if (io) {
                      io.to(tenantId).emit('new_message', Object.assign({}, savedMsg._doc, { contact: contact }));
                  }
               } catch (e) {
                  console.error('[Flow Engine] Error saving flow message:', e);
               }
           };

           try {
               if (msgType === 'TEXT' && text) {
                   let res = await waService.sendTextMessage(contact.phone, interpolatedText);
                   await saveAndEmit('text', interpolatedText, res);
               }                else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(msgType.toUpperCase())) {
                    const isMediaId = mediaId && /^\d+$/.test(mediaId.toString());
                    const mType = msgType.toLowerCase();

                    if (isMediaId) {
                        let res = await waService.sendMedia(contact.phone, mType, mediaId, interpolatedText);
                        await saveAndEmit(mType, `[Media ID] ${mediaId}\nCaption: ${interpolatedText}`, res);
                    } else {
                        // If mediaId is not a numeric ID, treat it as a potential filename/URL
                        const finalMediaUrl = getFullUrl(mediaUrl || mediaId);
                        if (finalMediaUrl) {
                            let res = await waService.sendMedia(contact.phone, mType, null, interpolatedText, finalMediaUrl);
                            await saveAndEmit(mType, `${finalMediaUrl}`, res);
                        } else {
                            let res = await waService.sendTextMessage(contact.phone, interpolatedText);
                            await saveAndEmit('text', interpolatedText, res);
                        }
                    }
                }
               else if (msgType === 'INTERACTIVE_MESSAGE' || (msgType === 'INTERACTIVE' && buttons.length > 0)) {
                   const headerMedia = (mediaId && /^\d+$/.test(mediaId)) 
                        ? { type: 'image', image: mediaId } 
                        : (publicMediaUrl ? { type: 'image', link: publicMediaUrl } : null);

                   let res = await waService.sendInteractiveButtonMessage(contact.phone, {
                       header: interpolatedHeader.type ? interpolatedHeader : headerMedia,
                       body: interpolatedText,
                       footer: interpolate(footer),
                       buttons: buttons.filter(b => b.trim() !== '').map(b => interpolate(b))
                   });
                   await saveAndEmit('interactive', `[Interactive]\n${interpolatedText}`, res);
               }
               else if (msgType === 'LIST_MESSAGE' && listOptions.length > 0) {
                   let res = await waService.sendListMessage(contact.phone, {
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
                   await saveAndEmit('interactive', `[List]\n${interpolatedText}\nOptions: ${listOptions.join(', ')}`, res);
               }
           } catch (sendErr) {
               console.error(`[Flow Engine] Send Error:`, sendErr.message);
           }
           
           if (msgType === 'QUESTION' || msgType === 'INTERACTIVE_MESSAGE' || msgType === 'LIST_MESSAGE' || (msgType === 'INTERACTIVE' && buttons.length > 0)) {
               console.log(`[Flow Engine] Waiting for user input. Halted at ${currentNode.id}`);
               break; 
           }
       } 
       else if (currentNode.type === 'actionNode') {
           const tag = interpolate(currentNode.data?.tag || '');
           const actionType = currentNode.data?.actionType || 'ADD';
           if (tag) {
               const update = actionType === 'REMOVE' ? { $pull: { tags: tag } } : { $addToSet: { tags: tag } };
               await Contact.findOneAndUpdate({ phone: contact.phone }, update);
           }
       }

       const outgoingEdge = edges.find(e => e.source === currentNode.id);
       if (!outgoingEdge) {
           console.log(`[Flow Engine] End of flow reached at ${currentNode.id}`);
           await Contact.findOneAndUpdate({ phone: contact.phone }, { $unset: { currentFlowStep: "", lastFlowId: "" } });
           break;
       }
       currentNode = nodes.find(n => n.id === outgoingEdge.target);
    }
  } catch (error) {
    console.error(`[Flow Engine] FATAL:`, error);
  }
};

const processIncomingMessage = async (tenantId, contact, messageText, io, isNewContact = false, replyValue = null) => {
  try {
     console.log(`[Flow Engine] Processing Message from ${contact.phone}: "${messageText}" | ReplyValue: "${replyValue}" | isNewContact: ${isNewContact} | Session: ${contact.currentFlowStep || 'NONE'}`);
     
     const tenantDb = getTenantConnection(tenantId);
     const Flow = tenantDb.model('Flow', FlowSchema);
     const Contact = tenantDb.model('Contact', ContactSchema);

     // Refresh contact from DB
     const dbContact = await Contact.findOne({ phone: contact.phone });
     const activeContact = dbContact ? dbContact.toObject() : contact;

     const client = await Client.findOne({ tenantId });
     const waService = new WhatsAppService({
         accessToken: client.whatsappConfig.accessToken,
         phoneNumberId: client.whatsappConfig.phoneNumberId
     });

     // 0. PRD Flow Session Resume
     const prdStates = ['START_PRD_FLOW', 'AWAITING_NAME', 'AWAITING_QUALIFICATION', 'AWAITING_PROGRAM', 'AWAITING_CALL_TIME', 'AWAITING_ADDITIONAL_HELP'];
     if (activeContact.currentFlowStep && prdStates.includes(activeContact.currentFlowStep)) {
         console.log(`[Flow Engine] Resuming PRD AI Flow for ${activeContact.phone}: ${activeContact.currentFlowStep}`);
         await PRDFlowService.processStep(tenantId, activeContact, replyValue || messageText, waService, io);
         return;
     }

     // 1. Standard Flow Session Resume
     if (activeContact.currentFlowStep && activeContact.lastFlowId) {
         console.log(`[Flow Engine] Resuming Session for ${activeContact.phone}: ${activeContact.currentFlowStep}`);
         const activeFlow = await Flow.findById(activeContact.lastFlowId);

         if (!activeFlow || activeFlow.status !== 'ACTIVE') {
             console.log(`[Flow Engine] ⚠️ Flow ${activeContact.lastFlowId} not found or inactive. Clearing stuck session for ${activeContact.phone}.`);
             // Clear the stuck session so the contact can trigger new flows
             await Contact.findOneAndUpdate({ phone: activeContact.phone }, { 
                 $unset: { currentFlowStep: "", lastFlowId: "" } 
             });
             // Update activeContact object to reflect cleared session for subsequent checks
             activeContact.currentFlowStep = null;
             activeContact.lastFlowId = null;
             // DO NOT RETURN! Continue to normal trigger analysis.
         } else {
             const lastNode = activeFlow.nodes.find(n => n.id === activeContact.currentFlowStep);
             if (lastNode && (lastNode.data.msgType === 'QUESTION' || lastNode.data.variableName)) {
                 const varName = lastNode.data.variableName || 'last_input';
                 console.log(`[Flow Engine] Saving input "${messageText}" to variable "${varName}"`);
                 await Contact.findOneAndUpdate({ phone: activeContact.phone }, { 
                     $set: { [`flowVariables.${varName}`]: messageText }
                 });
                 activeContact.flowVariables = activeContact.flowVariables || {};
                 activeContact.flowVariables[varName] = messageText;
             }
             // Only execute and return if we HAVE a valid active flow to resume
             executeFlow(tenantId, activeContact.lastFlowId, activeContact, io, activeContact.currentFlowStep, replyValue || messageText);
             return;
         }
     }

      // 4. TRIGGER PRD GREETING FLOW
      // ✅ MISSION: If the user has no active flow session, ALWAYS start with the PRD Greeting (Image + Text + Name Prompt)
      // This ensures that even if they ask a question first, they get the professional welcome.
      if (!activeContact.currentFlowStep) {
          console.log(`[Flow Engine] 🤖 Starting AI Greeting Journey for ${activeContact.phone} (No active session detected)`);
          await PRDFlowService.processStep(tenantId, activeContact, messageText, waService, io);
          return;
      }

      // 5. IF SESSION IS ACTIVE (or manually triggered), Process based on AI Intent
      const intent = await AIService.detectIntent(messageText);
      if (intent === 'AGENT_TRANSFER') {
          console.log(`[Flow Engine] 👨‍💼 Agent Transfer requested by ${activeContact.phone}`);
          const transferPrompt = "Transferring you to a human agent... 👨‍💻";
          await waService.sendTextMessage(activeContact.phone, transferPrompt);
          
          await Contact.findByIdAndUpdate(dbContact._id, { 
              status: 'FOLLOW_UP',
              $set: { lastInteraction: new Date() }
          });
          return;
      } else if (intent === 'QUESTION') {
         const answer = await AIService.askAI(messageText, "You are JV Marketing Education Support assistant.");
         await waService.sendTextMessage(activeContact.phone, answer);
         return;
     }

     // 5. Catch-all Fallback
     console.log(`[Flow Engine] No match found. Checking for Catch-all...`);
     const catchAllFlow = await Flow.findOne({ 
         status: 'ACTIVE', 
         triggerType: 'KEYWORD', 
         $or: [{ triggerKeywords: [] }, { triggerKeywords: [""] }] 
     });

     if (catchAllFlow) {
         console.log(`[Flow Engine] 🎣 Triggering Catch-all Flow: "${catchAllFlow.name}"`);
         executeFlow(tenantId, catchAllFlow._id, activeContact, io);
     } else {
         console.log(`[Flow Engine] No catch-all flow found. Silent.`);
     }

     // FINAL: Trigger universal score update for every message
     // This catches buying signals even in manual/casual conversation
     await PRDFlowService.updateLeadScore(Contact, Message, activeContact._id, io, tenantId);

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
