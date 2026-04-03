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

  async processStep(tenantId, contact, messageText, waService, io, isAutoFollowup = false) {
    const lockKey = `${tenantId}_${contact.phone}`;
    if (this.activeProcesses.has(lockKey) && !isAutoFollowup) return;
    this.activeProcesses.add(lockKey);

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
        return str
          .replace(/{{name}}|\[\[name\]\]/g, contact.name || 'Friend')
          .replace(/{{qualification}}|\[\[qualification\]\]/g, vars.qualification || contact.qualification || 'your qualification')
          .replace(/{{program}}|\[\[program\]\]/g, vars.selectedProgram || contact.selectedProgram || 'the program')
          .replace(/{{time}}|\[\[time\]\]/g, vars.time || 'your preferred time');
      };

      const saveAndEmit = async (type, payload, waResult) => {
        const msg = await Message.create({ contactId: contact._id, messageId: waResult?.messages?.[0]?.id || `out_${Date.now()}`, direction: 'OUTBOUND', type, content: payload, status: 'SENT' });
        if (io) io.to(tenantId).emit('current_chat_message', { ...msg._doc, contact });
      };

      // Rule 11/StartFlow Logic
      let stepToProcess = flowSteps.find(s => s.id === (contact.currentFlowStep || 'START_PRD_FLOW')) || flowSteps[0];
      let iterations = 0;
      let consumeInput = true;

      // 🔥 Rule 15: Execution Loop
      while (stepToProcess && iterations < 10) {
        iterations++;
        const currentIdx = flowSteps.findIndex(s => s.id === stepToProcess.id);
        const possibleNextStep = flowSteps[currentIdx + 1];
        const nodeData = stepToProcess.data || {};
        const msgType = nodeData.msgType || 'TEXT';

        // 🧠 Rule 7: Save Input Logic (if consuming current step)
        if (consumeInput && !isAutoFollowup && nodeData.variableName) {
           const varName = nodeData.variableName;
           let val = messageText.trim();
           
           if (varName === 'name') {
              const extName = await AIService.extractData(val, 'NAME');
              val = (extName && extName.length < 50) ? extName : val;
              await Contact.findOneAndUpdate({ phone: contact.phone }, { name: val, 'flowVariables.name': val });
              contact.name = val;
           } else if (varName === 'qualification') {
              const opts = prompts.qualificationOptions || ['10th Pass', '12th Pass', 'Diploma Completed', 'Graduation Completed', 'Master Completed'];
              const matched = opts.find(o => o.toLowerCase().includes(val.toLowerCase()) || val.toLowerCase().includes(o.toLowerCase()));
              if (matched) {
                 await Contact.findOneAndUpdate({ phone: contact.phone }, { qualification: matched, 'flowVariables.qualification': matched });
                 contact.qualification = matched;
              } else {
                 // Re-prompt rule
                 const rep = `I didn't quite catch that. Please select from the list 👇`;
                 await waService.sendListMessage(contact.phone, { header: 'Qualification', body: rep, buttonText: 'Options', sections: [{ title: 'Options', rows: opts.map((opt, i) => ({ id: `list_${i}`, title: opt })) }] });
                 break; // STOP
              }
           } else if (varName === 'program') {
              await Contact.findOneAndUpdate({ phone: contact.phone }, { selectedProgram: val, 'flowVariables.program': val });
              contact.selectedProgram = val;
           } else if (varName === 'time') {
              await Contact.findOneAndUpdate({ phone: contact.phone }, { 'flowVariables.time': val });
              // CREATE LEAD (Final rule)
              await Lead.create({ tenantId, name: contact.name, phone: contact.phone, qualification: contact.qualification, selectedProgram: contact.selectedProgram, preferredCallTime: val, status: 'QUALIFIED' });
           }

           // Continue to next step in same pulse
           if (possibleNextStep) {
              await Contact.findOneAndUpdate({ phone: contact.phone }, { currentFlowStep: possibleNextStep.id });
              contact.currentFlowStep = possibleNextStep.id;
              stepToProcess = possibleNextStep;
              consumeInput = false;
              continue;
           }
        }

        // 🧠 RULE 8/15: Execution/SendMessage
        const interpolatedText = replaceVars(nodeData.text || stepToProcess.message || '');
        const media = this.makeAbsolute(nodeData.mediaUrl || stepToProcess.image || '');

        try {
          if (msgType === 'IMAGE') {
             const res = await waService.sendMedia(contact.phone, 'image', /^\d+$/.test(media) ? media : null, interpolatedText, /^\d+$/.test(media) ? null : media);
             await saveAndEmit('image', interpolatedText, res);
          } else if (msgType === 'QUESTION' || msgType === 'TEXT') {
             const res = await waService.sendTextMessage(contact.phone, interpolatedText);
             await saveAndEmit('text', interpolatedText, res);
          } else if (msgType === 'LIST_MESSAGE') {
             const opts = nodeData.listOptions || prompts.qualificationOptions || [];
             await waService.sendListMessage(contact.phone, { body: interpolatedText, buttonText: 'Options', sections: [{ title: 'Options', rows: opts.map((o, i) => ({ id: `list_${i}`, title: o })) }] });
             await saveAndEmit('interactive', interpolatedText, null);
          } else if (msgType === 'INTERACTIVE') {
             const btns = nodeData.buttons || ['Morning', 'Afternoon', 'Evening'];
             await waService.sendInteractiveButtonMessage(contact.phone, { body: interpolatedText, buttons: btns.slice(0,3) });
             await saveAndEmit('interactive', interpolatedText, null);
          }
        } catch (e) { console.error(`[PRD Flow] Node Send Fatal:`, e.message); }

        await Contact.findOneAndUpdate({ phone: contact.phone }, { currentFlowStep: stepToProcess.id });

        // 🛑 Rule 9: WAITING NODE RULE (STOP FLOW)
        if (['QUESTION', 'LIST_MESSAGE', 'INTERACTIVE'].includes(msgType)) {
           console.log(`[PRD Flow] 🛑 Stopping flow at waiting node: ${stepToProcess.id}`);
           break;
        }

        // Move to next node if it's a simple message sequence (like Greeting -> Name)
        if (possibleNextStep) {
           stepToProcess = possibleNextStep;
           consumeInput = false;
        } else {
           // End of flow
           await Contact.findOneAndUpdate({ phone: contact.phone }, { $unset: { currentFlowStep: '' } });
           stepToProcess = null;
        }
      }
    } catch (err) {
      console.error(`[PRD Flow] FATAL:`, err);
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
