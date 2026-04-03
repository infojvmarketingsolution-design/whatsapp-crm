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
      { id: 'careerGoal', type: 'messageNode', data: { msgType: 'QUESTION', text: '{{name}}, what is your long-term career goal? 🎯', variableName: 'careerGoal' } },
      { id: 'call_time', type: 'messageNode', data: { msgType: 'INTERACTIVE', text: '{{name}}, what is your preferred time for a call? 📞', variableName: 'time', buttons: ['Morning', 'Afternoon', 'Evening'] } },
      { id: 'thank_you', type: 'messageNode', data: { msgType: 'TEXT', text: 'Thank you {{name}} 🙌\n🎓 Qual: {{qualification}}\n📘 Prog: {{program}}\n🎯 Goal: {{careerGoal}}\n⏰ Time: {{time}}' } }
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

      const flowSteps = prompts.prdFlowSteps || this.DEFAULT_PRD_FLOW_STEPS;
      
      const replaceVars = (str) => {
        if (!str) return '';
        const vars = contact.flowVariables || {};
        const name = vars.name || contact.name || 'Friend';
        return str
          .replace(/{{name}}|\[\[name\]\]/g, name)
          .replace(/{{qualification}}|\[\[qualification\]\]/g, vars.qualification || 'your qualification')
          .replace(/{{program}}|\[\[program\]\]/g, vars.program || 'the program')
          .replace(/{{careerGoal}}|\[\[careerGoal\]\]/g, vars.careerGoal || 'your goal')
          .replace(/{{time}}|\[\[time\]\]/g, vars.time || 'your preferred time');
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
      while (stepToProcess && iterations < 10) {
        iterations++;
        const nodeData = stepToProcess.data || {};
        const msgType = nodeData.msgType || 'TEXT';

        // 🧩 Rule 6 Step 2: SAVE USER INPUT
        if (consumeInput && !isAutoFollowup && nodeData.variableName) {
           const varName = nodeData.variableName;
           let val = messageText.trim();
           
           // 🧩 Rule 6 Step 3: NORMALIZE INPUT
           const normalizedInput = replyValue || messageText.trim();

           if (varName === 'name') {
              const extName = await AIService.extractData(val, 'NAME');
              val = (extName && extName.length < 50) ? extName : val;
              await Contact.findOneAndUpdate({ phone: contact.phone }, { 'flowVariables.name': val });
              contact.flowVariables = { ...(contact.flowVariables || {}), name: val };
           } else if (varName === 'qualification') {
              const opts = prompts.qualificationOptions || ['10th Pass', '12th Pass', 'Diploma Completed', 'Graduation Completed', 'Master Completed'];
              const matched = opts.find(o => o.toLowerCase().includes(val.toLowerCase()) || val.toLowerCase().includes(o.toLowerCase()) || o === val);
              if (matched) {
                 await Contact.findOneAndUpdate({ phone: contact.phone }, { 'flowVariables.qualification': matched });
                 contact.flowVariables = { ...(contact.flowVariables || {}), qualification: matched };
              }
           } else {
              await Contact.findOneAndUpdate({ phone: contact.phone }, { [`flowVariables.${varName}`]: val });
              contact.flowVariables = { ...(contact.flowVariables || {}), [varName]: val };
              
              if (varName === 'time') {
                 // Final Completion Lead
                 await Lead.create({ tenantId, name: contact.flowVariables.name, phone: contact.phone, qualification: contact.flowVariables.qualification, selectedProgram: contact.flowVariables.program, status: 'QUALIFIED' });
              }
           }

           // 🧩 Rule 6 Step 4: FIND EDGE / MOVE NEXT
           const idx = flowSteps.findIndex(s => s.id === stepToProcess.id);
           if (idx !== -1 && flowSteps[idx + 1]) {
              stepToProcess = flowSteps[idx + 1];
              consumeInput = false;
              continue; // Execute next node immediately
           } else {
              break; 
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

        // 🛑 Rule 9: WAITING CONDITION (BREAK)
        await Contact.findOneAndUpdate({ phone: contact.phone }, { currentFlowStep: stepToProcess.id });

        if (['QUESTION', 'LIST_MESSAGE', 'INTERACTIVE'].includes(msgType)) {
           console.log(`[PRD Flow] 🛑 STOPPING execution for: ${stepToProcess.id}`);
           break;
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
