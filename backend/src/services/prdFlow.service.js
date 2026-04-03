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
      { id: 'prd_1', type: 'GREETING', title: 'Start', message: 'Hello 👋 Welcome to JV Group!', image: 'https://wapipulse.com/uploads/prompts/tenant_demo_001/prompt_1774743344804.jpeg' },
      { id: 'prd_2', type: 'NAME_CAPTURE', title: 'Name Request', message: 'Great! May I know your name?' },
      { id: 'prd_3', type: 'QUALIFICATION', title: 'Qualification Choice', message: 'please select your last qualification 👇' },
      { id: 'prd_4', type: 'PROGRAM_SELECTION', title: 'Program Selection', message: 'Great, [[name]]! Please select your preferred program:' },
      { id: 'prd_5', type: 'SUCCESS_PROOF', title: 'Success & Proof', message: '🎉 Success Stories, [[name]]!\n\nOur students are working in top companies 🚀', image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=60' },
      { id: 'prd_6', type: 'CALL_TIME', title: 'Consultation Call', message: '[[name]], what is your preferred time for a call? 📞', options: ['Morning', 'Afternoon', 'Evening'] }
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
   * Matches Rule 15: Execution Engine (Simplified)
   */
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
      let prompts = {
        qualificationOptions: ['10th Pass', '12th Pass', 'Diploma Completed', 'Graduation Completed', 'Master Completed'],
        prdFlowSteps: this.DEFAULT_PRD_FLOW_STEPS
      };
      if (settings?.automation?.aiPrompts) prompts = { ...prompts, ...settings.automation.aiPrompts.toObject() };

      const flowSteps = prompts.prdFlowSteps || this.DEFAULT_PRD_FLOW_STEPS;
      const replaceVars = (str) => str?.replace(/{{name}}|\[\[name\]\]/g, contact.name || 'Friend').replace(/{{qualification}}|\[\[qualification\]\]/g, contact.qualification || 'your qualification') || '';

      const saveAndEmit = async (type, payload, waResult) => {
        const msg = await Message.create({ contactId: contact._id, messageId: waResult?.messages?.[0]?.id || `out_${Date.now()}`, direction: 'OUTBOUND', type, content: payload, status: 'SENT' });
        if (io) io.to(tenantId).emit('current_chat_message', { ...msg._doc, contact });
      };

      let stepToProcess = flowSteps.find(s => s.id === (contact.currentFlowStep || 'START_PRD_FLOW')) || flowSteps[0];
      let iterations = 0;
      let consumeInput = true;

      while (stepToProcess && iterations < 5) {
        iterations++;
        const currentIdx = flowSteps.findIndex(s => s.id === stepToProcess.id);
        const possibleNextStep = flowSteps[currentIdx + 1];

        // 🛡️ Rule 9: Anti-Duplication
        if (contact.currentFlowStep === stepToProcess.id && iterations > 1 && stepToProcess.type === 'NAME_CAPTURE') {
           console.log(`[PRD Flow] 🛑 Duplicate block for ${stepToProcess.id}`);
           break;
        }

        switch (stepToProcess.type) {
          case 'GREETING': {
            console.log(`[PRD Flow] 🏁 Starting GREETING pulse...`);
            const msg = replaceVars(stepToProcess.message);
            const img = this.makeAbsolute(stepToProcess.image);
            if (img) {
                const res = await waService.sendMedia(contact.phone, 'image', /^\d+$/.test(img) ? img : null, msg, /^\d+$/.test(img) ? null : img);
                await saveAndEmit('image', msg, res);
            } else {
                const res = await waService.sendTextMessage(contact.phone, msg);
                await saveAndEmit('text', msg, res);
            }

            // 🧩 Rule 13/PRD Lifecycle: Move to NAME_CAPTURE immediately and send prompt
            if (possibleNextStep) {
              await Contact.findOneAndUpdate({ phone: contact.phone }, { currentFlowStep: possibleNextStep.id });
              contact.currentFlowStep = possibleNextStep.id;
              stepToProcess = possibleNextStep;
              consumeInput = false; // Next pulse should ONLY send the prompt, not wait for input
              continue;
            }
            stepToProcess = null;
            break;
          }

          case 'NAME_CAPTURE': {
            if (consumeInput && !isAutoFollowup) {
              // Extract and Save (Rule 6)
              const name = await AIService.extractData(messageText.trim(), 'NAME');
              const finalName = (name && name.length < 50) ? name : messageText.trim();
              await Contact.findOneAndUpdate({ phone: contact.phone }, { name: finalName, 'flowVariables.name': finalName });
              contact.name = finalName;

              if (possibleNextStep) {
                await Contact.findOneAndUpdate({ phone: contact.phone }, { currentFlowStep: possibleNextStep.id });
                contact.currentFlowStep = possibleNextStep.id;
                stepToProcess = possibleNextStep;
                consumeInput = false;
                continue;
              }
            } else {
              // Send Question and Stop (Rule 15)
              const prompt = replaceVars(stepToProcess.message || 'Great! May I know your name?');
              const res = await waService.sendTextMessage(contact.phone, prompt);
              await saveAndEmit('text', prompt, res);
              await Contact.findOneAndUpdate({ phone: contact.phone }, { currentFlowStep: stepToProcess.id });
              stepToProcess = null;
            }
            break;
          }

          case 'QUALIFICATION': {
            if (consumeInput && !isAutoFollowup) {
              const input = messageText.trim();
              const extracted = await AIService.extractData(input, 'QUALIFICATION');
              const opts = prompts.qualificationOptions || ['10th Pass', '12th Pass', 'Diploma Completed', 'Graduation Completed', 'Master Completed'];
              const matched = opts.find(o => o.toLowerCase().includes(extracted.toLowerCase()) || extracted.toLowerCase().includes(o.toLowerCase()) || o.toLowerCase() === extracted.toLowerCase());
              
              if (matched) {
                await Contact.findOneAndUpdate({ phone: contact.phone }, { qualification: matched, 'flowVariables.qualification': matched });
                contact.qualification = matched;
                if (possibleNextStep) {
                  await Contact.findOneAndUpdate({ phone: contact.phone }, { currentFlowStep: possibleNextStep.id });
                  contact.currentFlowStep = possibleNextStep.id;
                  stepToProcess = possibleNextStep;
                  consumeInput = false;
                  continue;
                }
              } else {
                const rep = `I didn't quite catch that. Please select your last qualification 👇`;
                await waService.sendListMessage(contact.phone, { header: 'Qualification', body: rep, buttonText: 'Options', sections: [{ title: 'Options', rows: opts.map((opt, i) => ({ id: `list_${i}`, title: opt })) }] });
                stepToProcess = null;
              }
            } else {
              const prompt = replaceVars(stepToProcess.message);
              const opts = prompts.qualificationOptions || ['10th Pass', '12th Pass', 'Diploma Completed', 'Graduation Completed', 'Master Completed'];
              await waService.sendListMessage(contact.phone, { header: 'Qualification', body: prompt, buttonText: 'Options', sections: [{ title: 'Qualifications', rows: opts.map((opt, i) => ({ id: `list_${i}`, title: opt })) }] });
              await Contact.findOneAndUpdate({ phone: contact.phone }, { currentFlowStep: stepToProcess.id });
              stepToProcess = null;
            }
            break;
          }

          case 'PROGRAM_SELECTION': {
            if (consumeInput && !isAutoFollowup) {
              const prog = messageText.trim();
              await Contact.findOneAndUpdate({ phone: contact.phone }, { selectedProgram: prog, 'flowVariables.selectedProgram': prog });
              contact.selectedProgram = prog;
              if (possibleNextStep) {
                await Contact.findOneAndUpdate({ phone: contact.phone }, { currentFlowStep: possibleNextStep.id });
                contact.currentFlowStep = possibleNextStep.id;
                stepToProcess = possibleNextStep;
                consumeInput = false;
                continue;
              }
            } else {
              const qual = contact.qualification || '';
              const pMap = prompts.programMap || {};
              const qualMap = pMap[qual] || {};
              const sections = Object.keys(qualMap).map(title => ({ title, rows: qualMap[title].map((p, i) => ({ id: `p_${i}`, title: p })) }));
              const msg = replaceVars(stepToProcess.message);
              if (sections.length > 0) await waService.sendListMessage(contact.phone, { header: 'Programs', body: msg, buttonText: 'View Programs', sections });
              else await waService.sendTextMessage(contact.phone, msg);
              await Contact.findOneAndUpdate({ phone: contact.phone }, { currentFlowStep: stepToProcess.id });
              stepToProcess = null;
            }
            break;
          }

          case 'SUCCESS_PROOF': {
            const msg = replaceVars(stepToProcess.message);
            const img = this.makeAbsolute(stepToProcess.image);
            if (img) {
                const res = await waService.sendMedia(contact.phone, 'image', /^\d+$/.test(img) ? img : null, msg, /^\d+$/.test(img) ? null : img);
                await saveAndEmit('image', msg, res);
            } else {
                const res = await waService.sendTextMessage(contact.phone, msg);
                await saveAndEmit('text', msg, res);
            }
            if (possibleNextStep) {
              await Contact.findOneAndUpdate({ phone: contact.phone }, { currentFlowStep: possibleNextStep.id });
              contact.currentFlowStep = possibleNextStep.id;
              stepToProcess = possibleNextStep;
              consumeInput = false;
              continue;
            }
            stepToProcess = null;
            break;
          }

          case 'CALL_TIME': {
            if (consumeInput && !isAutoFollowup) {
              const time = messageText.trim();
              await Lead.create({ tenantId, name: contact.name, phone: contact.phone, qualification: contact.qualification, selectedProgram: contact.selectedProgram, preferredCallTime: time, status: 'QUALIFIED' });
              const sum = `Thank you ${contact.name}! 🙌\n🎓 Qual: ${contact.qualification}\n📘 Prog: ${contact.selectedProgram}\n⏰ Time: ${time}`;
              await waService.sendTextMessage(contact.phone, sum);
              await Contact.findOneAndUpdate({ phone: contact.phone }, { $unset: { currentFlowStep: '' } });
              stepToProcess = null;
            } else {
              const msg = replaceVars(stepToProcess.message);
              await waService.sendInteractiveButtonMessage(contact.phone, { body: msg, buttons: ['Morning', 'Afternoon', 'Evening'] });
              await Contact.findOneAndUpdate({ phone: contact.phone }, { currentFlowStep: stepToProcess.id });
              stepToProcess = null;
            }
            break;
          }

          default: stepToProcess = null; break;
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
