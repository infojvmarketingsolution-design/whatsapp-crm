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
      { id: 'qualification', type: 'messageNode', data: { msgType: 'LIST_MESSAGE', text: '{{name}}, please select your last qualification 👇', variableName: 'qualification', listOptions: ['10th Pass', '12th Pass', 'Diploma Completed', 'Graduation Completed', 'Master Completed'] } },
      { id: 'program', type: 'messageNode', data: { msgType: 'LIST_MESSAGE', text: 'Great {{name}}! Please select your preferred program:', variableName: 'program' } },
      { id: 'call_time', type: 'messageNode', data: { msgType: 'INTERACTIVE', text: '{{name}}, what is your preferred time for a call?', variableName: 'time', buttons: ['Morning', 'Afternoon', 'Evening'] } },
      { id: 'thank_you', type: 'messageNode', data: { msgType: 'TEXT', text: 'Thank you {{name}} 🙌\n🎓 Qual: {{qualification}}\n📘 Prog: {{program}}\n⏰ Time: {{time}}' } }
    ];
    this.activeProcesses = new Set();
  }

  makeAbsolute(url) {
    if (!url || typeof url !== 'string' || url.trim() === '') return '';
    if (url.startsWith('http') || /^\d+$/.test(url)) return url;
    const baseUrl = (process.env.BASE_URL || 'https://wapipulse.com').replace(/\/$/, '');
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  }

  /**
   * Main Entry Point
   */
  async processStep(tenantId, contact, messageText, waService, io, isAutoFollowup = false) {
    const lockKey = `${tenantId}_${contact.phone}`;
    if (this.activeProcesses.has(lockKey) && !isAutoFollowup) return;
    this.activeProcesses.add(lockKey);

    console.log(`[PRD Flow] 🌀 Pulse for ${contact.phone} | LastStep: ${contact.currentFlowStep || 'START'}`);

    try {
      const tenantDb = getTenantConnection(tenantId);
      const Contact = tenantDb.model('Contact', ContactSchema);
      const Message = tenantDb.model('Message', MessageSchema);
      const Lead = tenantDb.model('Lead', LeadSchema);

      const settings = await Settings.findOne({ tenantId });
      let prompts = { qualificationOptions: ['10th Pass', '12th Pass', 'Diploma Completed', 'Graduation Completed', 'Master Completed'], prdFlowSteps: this.DEFAULT_PRD_FLOW_STEPS };
      if (settings?.automation?.aiPrompts) prompts = { ...prompts, ...settings.automation.aiPrompts.toObject() };

      const flowSteps = prompts.prdFlowSteps || this.DEFAULT_PRD_FLOW_STEPS;
      
      const replaceVars = (str) => {
        if (!str) return '';
        const vars = contact.flowVariables || {};
        // 🧪 Rule 3/4 Fix: Prioritize flowVariables.name
        const name = vars.name || contact.name || 'Friend';
        const qual = vars.qualification || contact.qualification || 'your qualification';
        const prog = vars.program || contact.selectedProgram || 'the program';
        const time = vars.time || 'your preferred time';

        return str
          .replace(/{{name}}|\[\[name\]\]/g, name)
          .replace(/{{qualification}}|\[\[qualification\]\]/g, qual)
          .replace(/{{program}}|\[\[program\]\]/g, prog)
          .replace(/{{time}}|\[\[time\]\]/g, time);
      };

      const saveAndEmit = async (type, payload, waResult) => {
        const msgId = waResult?.messages?.[0]?.id || `out_${Date.now()}`;
        const msg = await Message.create({ contactId: contact._id, messageId: msgId, direction: 'OUTBOUND', type, content: payload, status: 'SENT' });
        if (io) io.to(tenantId).emit('current_chat_message', { ...msg._doc, contact });
      };

      // Determine starting node
      let stepToProcess = flowSteps.find(s => s.id === (contact.currentFlowStep || 'START_PRD_FLOW')) || flowSteps[0];
      let iterations = 0;
      let consumeInput = !!contact.currentFlowStep;
      
      // 🔥 Rule 15: Execution Loop (End-to-End Hardened)
      while (stepToProcess && iterations < 8) {
        iterations++;
        const nodeData = stepToProcess.data || {};
        const msgType = nodeData.msgType || 'TEXT';

        // 🧩 STEP A: Process User Input (Rule 7)
        if (consumeInput && !isAutoFollowup && nodeData.variableName) {
           const varName = nodeData.variableName;
           let val = messageText.trim();
           console.log(`[PRD Flow] 🧩 Processing Input for ${varName}: "${val}"`);

           if (varName === 'name') {
              const extName = await AIService.extractData(val, 'NAME');
              val = (extName && extName.length < 50) ? extName : val;
              await Contact.findOneAndUpdate({ phone: contact.phone }, { 'flowVariables.name': val });
              contact.flowVariables = { ...(contact.flowVariables || {}), name: val };
           } else if (varName === 'qualification') {
              const opts = prompts.qualificationOptions || ['10th Pass', '12th Pass', 'Diploma Completed', 'Graduation Completed', 'Master Completed'];
              const matched = opts.find(o => o === val || o.toLowerCase().includes(val.toLowerCase()) || val.toLowerCase().includes(o.toLowerCase()));
              if (matched) {
                 await Contact.findOneAndUpdate({ phone: contact.phone }, { 'flowVariables.qualification': matched });
                 contact.flowVariables = { ...(contact.flowVariables || {}), qualification: matched };
              }
           } else if (varName === 'program') {
              await Contact.findOneAndUpdate({ phone: contact.phone }, { 'flowVariables.program': val });
              contact.flowVariables = { ...(contact.flowVariables || {}), program: val };
           } else if (varName === 'time') {
              await Contact.findOneAndUpdate({ phone: contact.phone }, { 'flowVariables.time': val });
              contact.flowVariables = { ...(contact.flowVariables || {}), time: val };
              // CREATE LEAD (Rule 10 Success)
              await Lead.create({ tenantId, name: contact.flowVariables.name, phone: contact.phone, qualification: contact.flowVariables.qualification, selectedProgram: contact.flowVariables.program, preferredCallTime: val, status: 'QUALIFIED' });
           }

           // Find NEXT node in the sequence
           const idx = flowSteps.findIndex(s => s.id === stepToProcess.id);
           if (idx !== -1 && flowSteps[idx + 1]) {
              stepToProcess = flowSteps[idx + 1];
              consumeInput = false;
              continue; // Start loop for next node
           } else {
              break; 
           }
        }

        // 🧩 STEP B: Send Node Message
        console.log(`[PRD Flow] 📤 Executing: ${stepToProcess.id} (${msgType})`);
        const interpolatedText = replaceVars(nodeData.text || '');
        const media = this.makeAbsolute(nodeData.mediaUrl || '');

        try {
          if (msgType === 'IMAGE' && media) {
             const res = await waService.sendMedia(contact.phone, 'image', /^\d+$/.test(media) ? media : null, interpolatedText, /^\d+$/.test(media) ? null : media);
             await saveAndEmit('image', interpolatedText, res);
          } else if (msgType === 'LIST_MESSAGE') {
             const opts = nodeData.listOptions || prompts.qualificationOptions || [];
             await waService.sendListMessage(contact.phone, { body: interpolatedText, buttonText: 'Options', sections: [{ title: 'Options', rows: opts.map((o, i) => ({ id: `list_${i}`, title: o.substring(0, 24) })) }] });
             await saveAndEmit('interactive', interpolatedText, null);
          } else if (msgType === 'INTERACTIVE') {
             const btns = nodeData.buttons || ['Morning', 'Afternoon', 'Evening'];
             await waService.sendInteractiveButtonMessage(contact.phone, { body: interpolatedText, buttons: btns.slice(0,3) });
             await saveAndEmit('interactive', interpolatedText, null);
          } else {
             const res = await waService.sendTextMessage(contact.phone, interpolatedText);
             await saveAndEmit('text', interpolatedText, res);
          }
        } catch (e) {
          console.error(`[PRD Flow] Send Error:`, e.message);
        }

        // 🧩 STEP C: Update State and STOP if needed
        await Contact.findOneAndUpdate({ phone: contact.phone }, { currentFlowStep: stepToProcess.id });

        // 🛑 Rule 9: WAITING NODE RULE (STOP FLOW)
        if (['QUESTION', 'LIST_MESSAGE', 'INTERACTIVE'].includes(msgType)) {
           console.log(`[PRD Flow] 🛑 STOPPING at waiting node: ${stepToProcess.id}`);
           break;
        }

        // Move to next node linearly (e.g. Image -> Question)
        const idx = flowSteps.findIndex(s => s.id === stepToProcess.id);
        if (idx !== -1 && flowSteps[idx + 1]) {
           stepToProcess = flowSteps[idx + 1];
           consumeInput = false;
        } else {
           console.log(`[PRD Flow] 🏁 End of flow reached.`);
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

  static async updateLeadScore(Contact, Message, contactId, io, tenantId) {
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
