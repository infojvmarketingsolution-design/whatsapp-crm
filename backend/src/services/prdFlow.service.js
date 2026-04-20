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
      { id: 'qualification', type: 'messageNode', data: { msgType: 'LIST_MESSAGE', text: '{{name}}, please select your last qualification 👇', variableName: 'qualification', listOptions: ['10th Pass', '12th Pass', 'Diploma Complete', 'Graduation complete', 'Master complete', 'phD complete'] } },
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
      let prompts = { 
         qualificationOptions: ['10th Pass', '12th Pass', 'Diploma Complete', 'Graduation complete', 'Master complete', 'phD complete'], 
         prdFlowSteps: this.DEFAULT_PRD_FLOW_STEPS 
      };
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
            nodeData.isProgramSelection = true;
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
        const msgId = waResult?.messages?.[0]?.id || `out_${Date.now()}`;
        const msg = await Message.create({ contactId: contact._id, messageId: msgId, direction: 'OUTBOUND', type, content: payload, status: 'SENT' });
        if (io) io.to(tenantId).emit('current_chat_message', { ...msg._doc, contact });
      };

      const aggressiveNormalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

      // 🧩 STEP 1: LOAD CURRENT NODE
      let currentStepId = contact.currentFlowStep || (flowSteps[0] ? flowSteps[0].id : 'START');
      let stepToProcess = flowSteps.find(s => s.id === currentStepId) || flowSteps[0];
      
      let iterations = 0;
      let consumeInput = !!contact.currentFlowStep;
      
      // 🚀 EXECUTION LOOP
      while (stepToProcess && iterations < 12) {
        iterations++;
        const nodeData = stepToProcess.data || {};
        const msgType = nodeData.msgType || 'TEXT';
        let forceStay = false;

        // 🧩 STEP A: SAVE USER INPUT
        if (consumeInput && !isAutoFollowup && nodeData.variableName) {
           const varName = nodeData.variableName;
           let val = (replyValue || messageText || '').trim();
           const normalizedInput = aggressiveNormalize(val);

           if (varName === 'name') {
              const extName = await AIService.extractData(val, 'NAME');
              val = (extName && extName.length < 50) ? extName : val;
              const nameParts = val.trim().split(' ');
              const firstName = nameParts[0] || '';
              const lastName = nameParts.slice(1).join(' ') || '';
              
              const updates = { 'flowVariables.name': val, name: val, firstName, lastName };
              await Contact.findOneAndUpdate({ phone: contact.phone }, updates);
              contact.flowVariables = { ...(contact.flowVariables || {}), name: val };
              Object.assign(contact, updates);
           } 
           else if (varName === 'qualification') {
              const opts = prompts.qualificationOptions || ['10th Pass', '12th Pass', 'Diploma Complete', 'Graduation complete', 'Master complete', 'phD complete'];
              const matched = opts.find(o => o.toLowerCase().includes(val.toLowerCase()) || val.toLowerCase().includes(o.toLowerCase()) || o === val);
              if (matched) {
                 await Contact.findOneAndUpdate({ phone: contact.phone }, { 'flowVariables.qualification': matched, qualification: matched });
                 contact.flowVariables = { ...(contact.flowVariables || {}), qualification: matched };
                 contact.qualification = matched;
              }
           } 
           else if (varName === 'program' && nodeData.isProgramSelection) {
              const currentQual = contact.flowVariables?.qualification;
              const targetQualCode = aggressiveNormalize(currentQual);
              const actualQualKey = Object.keys(prompts.programMap || {}).find(k => {
                 const nk = aggressiveNormalize(k);
                 return nk === targetQualCode || nk.startsWith(targetQualCode) || targetQualCode.startsWith(nk);
              });
              const qualMap = actualQualKey ? prompts.programMap[actualQualKey] : {};
              
              // 📂 CATEGORY MATCH CHECK
              const categories = Object.keys(qualMap);
              const matchedCategory = categories.find(c => {
                 const nc = aggressiveNormalize(c);
                 return nc === normalizedInput || nc.startsWith(normalizedInput) || normalizedInput.startsWith(nc);
              });

              if (matchedCategory) {
                 console.log(`[PRD Flow] 📂 Category Match: ${matchedCategory}. Phase 1 complete.`);
                 await Contact.findOneAndUpdate({ phone: contact.phone }, { 'flowVariables.selectedStream': matchedCategory });
                 contact.flowVariables = { ...(contact.flowVariables || {}), selectedStream: matchedCategory };
                 forceStay = true; // STAY to show programs list
              } else {
                 // Final Program Selection
                 await Contact.findOneAndUpdate({ phone: contact.phone }, { 'flowVariables.program': val, selectedProgram: val, 'flowVariables.selectedStream': null });
                 contact.flowVariables = { ...(contact.flowVariables || {}), program: val };
                 delete contact.flowVariables.selectedStream;
              }
           } 
           else {
              // General variable capture
              const dbUpdates = { [`flowVariables.${varName}`]: val };
              if (varName === 'time') {
                 dbUpdates.preferredCallTime = val;
                 await Lead.create({ tenantId, name: contact.flowVariables.name, phone: contact.phone, qualification: contact.flowVariables.qualification, selectedProgram: contact.flowVariables.program, status: 'QUALIFIED' });
              }
              await Contact.findOneAndUpdate({ phone: contact.phone }, dbUpdates);
              contact.flowVariables = { ...(contact.flowVariables || {}), [varName]: val };
           }
        }

        // 🧩 STEP B: MOVE TO NEXT NODE (If not stayed for sub-step)
        if (consumeInput && !forceStay) {
           const idx = flowSteps.findIndex(s => s.id === stepToProcess.id);
           if (idx !== -1 && flowSteps[idx + 1]) {
              stepToProcess = flowSteps[idx + 1];
              consumeInput = false;
              continue; 
           } else {
              break; // End of flow
           }
        }

        // 🧩 STEP C: EXECUTE CURRENT NODE (Send Message)
        console.log(`[PRD Flow] 📤 Output: ${stepToProcess.id}`);
        const text = replaceVars(nodeData.text || '');
        const media = this.makeAbsolute(nodeData.mediaUrl || '');

        if (msgType === 'IMAGE' && media) {
           const res = await waService.sendMedia(contact.phone, 'image', /^\d+$/.test(media) ? media : null, text, /^\d+$/.test(media) ? null : media);
           await saveAndEmit('image', text, res);
        } 
        else if (msgType === 'LIST_MESSAGE') {
           let opts = nodeData.listOptions || prompts.qualificationOptions || ['Options'];
           let body = text;

           if (nodeData.isProgramSelection) {
              const currentQual = contact.flowVariables?.qualification;
              const stream = contact.flowVariables?.selectedStream;
              const tqc = aggressiveNormalize(currentQual);
              const qk = Object.keys(prompts.programMap || {}).find(k => {
                 const nk = aggressiveNormalize(k);
                 return nk === tqc || nk.startsWith(tqc) || tqc.startsWith(nk);
              });
              const qm = qk ? prompts.programMap[qk] : {};

              if (!stream) {
                 opts = Object.keys(qm);
                 body = "Please select your preferred stream/category:";
              } else {
                 const sk = Object.keys(qm).find(k => aggressiveNormalize(k) === aggressiveNormalize(stream));
                 const val = sk ? qm[sk] : null;
                 let progs = [];
                 if (Array.isArray(val)) progs = val;
                 else if (val && typeof val === 'object') Object.values(val).forEach(a => Array.isArray(a) && progs.push(...a));
                 opts = progs.length > 0 ? progs.slice(0, 10) : ['General Inquiry'];
                 body = `Great! Now choose a program under ${stream}:`;
              }
           }

           await waService.sendListMessage(contact.phone, { body, buttonText: 'Options', sections: [{ title: 'Options', rows: opts.map((o, i) => ({ id: `list_${i}`, title: String(o).substring(0, 24) })) }] });
           await saveAndEmit('interactive', body, null);
        } 
        else if (msgType === 'INTERACTIVE') {
           const btns = nodeData.buttons || ['Morning', 'Afternoon', 'Evening'];
           await waService.sendInteractiveButtonMessage(contact.phone, { body: text, buttons: btns.slice(0, 3) });
           await saveAndEmit('interactive', text, null);
        } 
        else {
           if (text) {
              const res = await waService.sendTextMessage(contact.phone, text);
              await saveAndEmit('text', text, res);
           }
        }

        // 🧩 STEP D: UPDATE STATE & CHECK WAIT
        await Contact.findOneAndUpdate({ phone: contact.phone }, { currentFlowStep: stepToProcess.id });

        if (['QUESTION', 'LIST_MESSAGE', 'INTERACTIVE'].includes(msgType)) {
           console.log(`[PRD Flow] 🛑 WAIT at ${stepToProcess.id}`);
           return; // EXIT WEBHOOK TURN
        }

        // Move to next automatically if no wait
        const idx = flowSteps.findIndex(s => s.id === stepToProcess.id);
        if (idx !== -1 && flowSteps[idx + 1]) {
           stepToProcess = flowSteps[idx + 1];
           consumeInput = false;
           await this.sleep(msgType === 'IMAGE' ? 1500 : 1000);
        } else {
           await Contact.findOneAndUpdate({ phone: contact.phone }, { $unset: { currentFlowStep: '' } });
           break;
        }
      }
    } catch (err) {
      console.error(`[PRD Flow] ERROR:`, err);
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
