const MessageSchema = require('../models/tenant/Message');
const ContactSchema = require('../models/tenant/Contact');
const LeadSchema = require('../models/crm/Lead');
const { getTenantConnection } = require('../config/db');
const AIService = require('./ai.service');
const Settings = require('../models/core/Settings');
const mongoose = require('mongoose');

class PRDFlowService {
  constructor() {
    this.DEFAULT_PRD_FLOW_STEPS = [
      { id: 'greeting', type: 'messageNode', data: { msgType: 'IMAGE', text: 'Hello 👋 Welcome to JV Group!', mediaUrl: 'https://wapipulse.com/uploads/prompts/tenant_demo_001/prompt_1774743344804.jpeg' } },
      { id: 'ask_name', type: 'messageNode', data: { msgType: 'QUESTION', text: 'Great! May I know your name?', variableName: 'name' } },
      { id: 'qualification', type: 'messageNode', data: { msgType: 'LIST_MESSAGE', text: '{{name}}, please select your last qualification 👇', variableName: 'qualification', listOptions: ['10th Pass', '12th Pass', 'Diploma Complete', 'Graduation Complete', 'Master Complete'] } },
      { id: 'program', type: 'messageNode', data: { msgType: 'LIST_MESSAGE', text: 'Great {{name}}! Please select your preferred program:', variableName: 'program' } },
      { id: 'careerGoal', type: 'messageNode', data: { msgType: 'QUESTION', text: '{{name}}, what is your long-term career goal? 🎯', variableName: 'careerGoal' } },
      { id: 'call_time', type: 'messageNode', data: { msgType: 'INTERACTIVE', text: '{{name}}, what is your preferred time for a call? 📞', variableName: 'time', buttons: ['Morning', 'Afternoon', 'Evening'] } },
      { id: 'thank_you', type: 'messageNode', data: { msgType: 'TEXT', text: 'Thank you {{name}} 🙌\n🎓 Qual: {{qualification}}\n📘 Prog: {{program}}\n🎯 Goal: {{careerGoal}}\n⏰ Time: {{time}}' } }
    ];
    this.activeProcesses = new Set();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  makeAbsolute(url) {
    if (!url || typeof url !== 'string' || url.trim() === '') return '';
    if (url.startsWith('http') || /^\d+$/.test(url)) return url;
    const baseUrl = (process.env.BASE_URL || 'https://wapipulse.com').replace(/\/$/, '');
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  }

  /**
   * Matches Rule 6: CONTINUE FLOW Logic
   */
  async processStep(tenantId, contact, messageText, waService, io, isAutoFollowup = false, replyValue = null) {
    const lockKey = `${tenantId}_${contact.phone}`;
    if (this.activeProcesses.has(lockKey) && !isAutoFollowup) return;
    this.activeProcesses.add(lockKey);

    console.log(`[PRD Flow] 🌀 Pulse for ${contact.phone} | LastStep: ${contact.currentFlowStep || 'START'} | Msg: ${messageText} | Reply: ${replyValue}`);

    try {
      const tenantDb = getTenantConnection(tenantId);
      const Contact = tenantDb.model('Contact', ContactSchema);
      const Message = tenantDb.model('Message', MessageSchema);
      const Lead = tenantDb.model('Lead', LeadSchema);

      const settings = await Settings.findOne({ tenantId });
      let prompts = { qualificationOptions: ['10th Pass', '12th Pass', 'Diploma Completed', 'Graduation Completed', 'Master Completed'], prdFlowSteps: this.DEFAULT_PRD_FLOW_STEPS };
      if (settings?.automation?.aiPrompts) prompts = { ...prompts, ...settings.automation.aiPrompts.toObject() };

      const flowStepsRaw = settings?.automation?.aiPrompts?.prdFlowSteps && settings.automation.aiPrompts.prdFlowSteps.length > 0 
        ? settings.automation.aiPrompts.prdFlowSteps 
        : this.DEFAULT_PRD_FLOW_STEPS;

      // Map UI schema to PRD execution schema
      const flowSteps = flowStepsRaw.map(step => {
         if (step.data) return step; // Already in execution format (DEFAULT_PRD_FLOW_STEPS)

         let nodeData = { text: step.message };
         if (step.type === 'GREETING') {
            nodeData.msgType = step.image ? 'IMAGE' : 'TEXT';
            nodeData.mediaUrl = step.image;
         } else if (step.type === 'NAME_CAPTURE') {
            nodeData.msgType = 'QUESTION';
            nodeData.variableName = 'name';
         } else if (step.type === 'QUALIFICATION') {
            nodeData.msgType = 'LIST_MESSAGE';
            nodeData.variableName = 'qualification';
            nodeData.listOptions = prompts.qualificationOptions || [];
         } else if (step.type === 'PROGRAM_SELECTION') {
            nodeData.msgType = 'LIST_MESSAGE';
            nodeData.variableName = 'program';
            nodeData.isProgramSelection = true; // Flag for dynamic resolution
         } else if (step.type === 'SUCCESS_PROOF') {
            nodeData.msgType = step.image ? 'IMAGE' : 'TEXT';
            nodeData.mediaUrl = step.image;
         } else if (step.type === 'CALL_TIME') {
            nodeData.msgType = 'INTERACTIVE';
            nodeData.variableName = 'time';
            nodeData.buttons = step.options || ['Morning', 'Afternoon', 'Evening'];
         } else if (step.type === 'CUSTOM_MESSAGE') {
            nodeData.msgType = 'TEXT';
         } else if (step.type === 'CUSTOM_QUESTION') {
            nodeData.msgType = 'QUESTION';
            nodeData.variableName = `custom_${step.id}`;
         }
         return { id: step.id, type: 'messageNode', data: nodeData };
      });
      
      const replaceVars = (str) => {
        if (!str) return '';
        const vars = contact.flowVariables || {};
        const name = vars.name || contact.name || 'Friend';
        return str
          .replace(/\{{1,2}name\}{1,2}|\[{1,2}name\]{1,2}/gi, name)
          .replace(/\{{1,2}qualification\}{1,2}|\[{1,2}qualification\]{1,2}/gi, vars.qualification || 'your qualification')
          .replace(/\{{1,2}program\}{1,2}|\[{1,2}program\]{1,2}/gi, vars.program || 'the program')
          .replace(/\{{1,2}careerGoal\}{1,2}|\[{1,2}careerGoal\]{1,2}/gi, vars.careerGoal || 'your goal')
          .replace(/\{{1,2}time\}{1,2}|\[{1,2}time\]{1,2}/gi, vars.time || 'your preferred time');
      };

      const saveAndEmit = async (type, payload, waResult) => {
        const msg = await Message.create({ contactId: contact._id, messageId: waResult?.messages?.[0]?.id || `out_${Date.now()}`, direction: 'OUTBOUND', type, content: payload, status: 'SENT' });
        if (io) io.to(tenantId).emit('current_chat_message', { ...msg._doc, contact });
      };

      // 🧩 STEP 1: LOAD LAST NODE
      let stepToProcess = flowSteps.find(s => s.id === (contact.currentFlowStep || 'START_PRD_FLOW')) || flowSteps[0];
      let iterations = 0;
      let consumeInput = !!contact.currentFlowStep;
      // 🔥 Rule 16: Execution Loop
      const aggressiveNormalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

      while (stepToProcess && iterations < 10) {
        iterations++;
        const nodeData = stepToProcess.data || {};
        const msgType = nodeData.msgType || 'TEXT';
        let isSubStep = false;

        // 🧩 Rule 6 Step 2: SAVE USER INPUT
        if (consumeInput && !isAutoFollowup && nodeData.variableName) {
           const varName = nodeData.variableName;
           let val = messageText.trim();
           
           // 🧩 Rule 6 Step 3: NORMALIZE INPUT
           const normalizedInput = aggressiveNormalize(replyValue || messageText);

           if (varName === 'name') {
              const extName = await AIService.extractData(val, 'NAME');
              val = (extName && extName.length < 50) ? extName : val;
              
              const nameParts = val.trim().split(' ');
              const firstName = nameParts[0] || '';
              const lastName = nameParts.slice(1).join(' ') || '';
              
              await Contact.findOneAndUpdate({ phone: contact.phone }, { 
                  'flowVariables.name': val, 
                  name: val,
                  firstName: firstName,
                  lastName: lastName
              });
              contact.flowVariables = { ...(contact.flowVariables || {}), name: val };
              contact.name = val;
              contact.firstName = firstName;
              contact.lastName = lastName;
           } else if (varName === 'qualification') {
              const opts = prompts.qualificationOptions || ['10th Pass', '12th Pass', 'Diploma Complete', 'Graduation Complete', 'Master Complete'];
              const matched = opts.find(o => o.toLowerCase().includes(val.toLowerCase()) || val.toLowerCase().includes(o.toLowerCase()) || o === val);
              if (matched) {
                 await Contact.findOneAndUpdate({ phone: contact.phone }, { 'flowVariables.qualification': matched, qualification: matched });
                 contact.flowVariables = { ...(contact.flowVariables || {}), qualification: matched };
                 contact.qualification = matched;
              }
           } else {
              const currentQual = contact.flowVariables?.qualification;
              // 🧩 ROBUST QUAL LOOKUP
              const targetQualCode = aggressiveNormalize(currentQual);
              const actualQualKey = Object.keys(prompts.programMap || {}).find(k => aggressiveNormalize(k) === targetQualCode);
              const qualMap = actualQualKey ? prompts.programMap[actualQualKey] : {};
              
              const categories = Object.keys(qualMap);

              // 🧩 Check if User clicked a CATEGORY (Stream)
              const matchedCategory = categories.find(c => aggressiveNormalize(c) === normalizedInput);

              if (varName === 'program' && matchedCategory) {
                 console.log(`[PRD Flow] 📂 Category Matched: ${matchedCategory}. Saving as selectedStream.`);
                 await Contact.findOneAndUpdate({ phone: contact.phone }, { 'flowVariables.selectedStream': matchedCategory });
                 contact.flowVariables = { ...(contact.flowVariables || {}), selectedStream: matchedCategory };

                 // 🔄 STAY ON THIS NODE to send program list
                 isSubStep = true;
                 consumeInput = false; 
              } else {
                 // 🧩 Standard Variable Saving
                 const dbUpdates = { [`flowVariables.${varName}`]: val };
                 if (varName === 'program') {
                     dbUpdates.selectedProgram = val;
                     dbUpdates['flowVariables.selectedStream'] = null; // Clear stream after program picked
                 }
                 if (varName === 'time') dbUpdates.preferredCallTime = val;
                 
                 await Contact.findOneAndUpdate({ phone: contact.phone }, dbUpdates);
                 contact.flowVariables = { ...(contact.flowVariables || {}), [varName]: val };
                 if (varName === 'program') {
                     contact.selectedProgram = val;
                     delete contact.flowVariables.selectedStream;
                 }
                 if (varName === 'time') contact.preferredCallTime = val;
                 
                 if (varName === 'time') {
                    // Final Completion Lead
                    await Lead.create({ tenantId, name: contact.flowVariables.name, phone: contact.phone, qualification: contact.flowVariables.qualification, selectedProgram: contact.flowVariables.program, status: 'QUALIFIED' });
                 }
              }
           }

           // 🧩 Rule 6 Step 4: FIND EDGE / MOVE NEXT (Only if not a sub-step category pick)
           if (!isSubStep) {
              const idx = flowSteps.findIndex(s => s.id === stepToProcess.id);
              if (idx !== -1 && flowSteps[idx + 1]) {
                 stepToProcess = flowSteps[idx + 1];
                 consumeInput = false;
                 continue; // Execute next node immediately
              } else {
                 // END OF FLOW INTERCEPT - If the last node was a question (like "May I help you with anything else?")
                 if (msgType === 'QUESTION') {
                     const isPositive = val.toLowerCase().match(/yes|yeah|sure|yep|please|ok|y/);
                     const finalReply = isPositive 
                         ? "Transferring to counsellor. Please wait, our counsellor will contact you on call asap."
                         : "Thank you.";
                     const res = await waService.sendTextMessage(contact.phone, finalReply);
                     await saveAndEmit('text', finalReply, res);
                 }
                 break; 
              }
           }
        }

        // 🧩 STEP 6: Execute Next (Send Message)
        console.log(`[PRD Flow] 📤 Sending: ${stepToProcess.id} (${msgType})`);
        const interpolatedText = replaceVars(nodeData.text || '');
        const media = this.makeAbsolute(nodeData.mediaUrl || '');

        if (msgType === 'IMAGE' && media) {
           const res = await waService.sendMedia(contact.phone, 'image', /^\d+$/.test(media) ? media : null, interpolatedText, /^\d+$/.test(media) ? null : media);
           await saveAndEmit('image', interpolatedText, res);
        } else if (msgType === 'LIST_MESSAGE') {
            let opts = nodeData.listOptions || prompts.qualificationOptions || ['Option 1'];
            let customBody = interpolatedText;
            
            if (nodeData.isProgramSelection) {
               const currentQual = contact.flowVariables?.qualification;
               const selectedStream = contact.flowVariables?.selectedStream;
               
               // 🧩 ROBUST QUAL LOOKUP FOR SENDER
               const targetQualCode = aggressiveNormalize(currentQual);
               const actualQualKey = Object.keys(prompts.programMap || {}).find(k => aggressiveNormalize(k) === targetQualCode);
               const qualMap = actualQualKey ? prompts.programMap[actualQualKey] : {};
               
               if (!selectedStream) {
                  // Phase 1: Show Categories
                  opts = Object.keys(qualMap);
                  customBody = "Please select your preferred stream/category:";
               } else {
                  // Phase 2: Show Programs for Stream
                  const val = qualMap[selectedStream];
                  let programOpts = [];
                  if (val) {
                     if (Array.isArray(val)) {
                        programOpts = val;
                     } else if (typeof val === 'object') {
                        Object.values(val).forEach(arr => {
                           if (Array.isArray(arr)) programOpts.push(...arr);
                        });
                     }
                  }
                  opts = programOpts.length > 0 ? programOpts.slice(0, 10) : ['General Inquiry'];
                  customBody = `Great! Now choose a program under ${selectedStream}:`;
               }
            }
            
            await waService.sendListMessage(contact.phone, { body: customBody, buttonText: 'Options', sections: [{ title: 'Options', rows: opts.map((o, i) => ({ id: `list_${i}`, title: String(o).substring(0, 24) })) }] });
            await saveAndEmit('interactive', customBody, null);
        } else if (msgType === 'INTERACTIVE') {
           const btns = nodeData.buttons || ['Morning', 'Afternoon', 'Evening'];
           await waService.sendInteractiveButtonMessage(contact.phone, { body: interpolatedText, buttons: btns.slice(0,3) });
           await saveAndEmit('interactive', interpolatedText, null);
        } else {
           if (interpolatedText && interpolatedText.trim() !== '') {
               const res = await waService.sendTextMessage(contact.phone, interpolatedText);
               await saveAndEmit('text', interpolatedText, res);
           } else {
               console.warn(`[PRD Flow] ⚠️ Skipping empty text message for node: ${stepToProcess.id}`);
           }
        }

        // 🛑 Rule 9: WAITING CONDITION (BREAK)
        await Contact.findOneAndUpdate({ phone: contact.phone }, { currentFlowStep: stepToProcess.id });

        if (['QUESTION', 'LIST_MESSAGE', 'INTERACTIVE'].includes(msgType)) {
           console.log(`[PRD Flow] 🛑 STOPPING execution for: ${stepToProcess.id}`);
           break;
        }

        // ⏱️ Rule 16b: preserve sequence order by waiting before next message
        if (iterations < 10) {
           const delayMs = msgType === 'IMAGE' ? 1500 : 1000;
           console.log(`[PRD Flow] ⏱️ Preservation Delay: ${delayMs}ms...`);
           await this.sleep(delayMs);
        }

        // Linear Sequence Move
        const idx = flowSteps.findIndex(s => s.id === stepToProcess.id);
        if (idx !== -1 && flowSteps[idx + 1]) {
           stepToProcess = flowSteps[idx + 1];
           consumeInput = false;
        } else {
           console.log(`[PRD Flow] 🏁 END of flow. Cleaning session.`);
           await Contact.findOneAndUpdate({ phone: contact.phone }, { $unset: { currentFlowStep: '' } });
           break;
        }
      }
    } catch (err) {
      console.error(`[PRD Flow] FATAL ERROR:`, err);
    } finally {
      this.activeProcesses.delete(lockKey);
    }
  }

  async updateLeadScore(Contact, Message, contactId, io, tenantId) {
    try {
      const contact = await Contact.findById(contactId);
      if (!contact) return;
      const messages = await Message.find({ contactId }).sort({ createdAt: -1 }).limit(10);
      const { score, heatLevel } = await AIService.calculateLeadScore(contact, messages);
      await Contact.findByIdAndUpdate(contactId, { score, heatLevel });
      if (io) io.to(tenantId).emit('contact_updated', { contactId, score, heatLevel });
    } catch (err) {}
  }
}

module.exports = new PRDFlowService();
