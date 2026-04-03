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
      { id: 'prd_4', type: 'PROGRAM_SELECTION', title: 'Program Selection', message: 'Great, {{name}}! Please select your preferred program:' },
      { id: 'prd_5', type: 'SUCCESS_PROOF', title: 'Success & Proof', message: '🎉 Success Stories, {{name}}!\n\nOur students are working in top companies 🚀', image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=60' },
      { id: 'prd_6', type: 'CALL_TIME', title: 'Consultation Call', message: '{{name}}, what is your preferred time for a call? 📞', options: ['Morning', 'Afternoon', 'Evening'] }
    ];
    this.activeTimers = new Map();
    this.activeProcesses = new Set();
  }

  clearTimer(contactId) {
    if (this.activeTimers.has(contactId)) {
      clearTimeout(this.activeTimers.get(contactId));
      this.activeTimers.delete(contactId);
    }
  }

  makeAbsolute(url) {
    if (!url || typeof url !== 'string' || url.trim() === '') return '';
    const trimmedUrl = url.trim();
    if (/^\d+$/.test(trimmedUrl)) return trimmedUrl;
    if (trimmedUrl.startsWith('http')) return trimmedUrl;
    let baseUrl = (process.env.BASE_URL || 'https://wapipulse.com').trim();
    baseUrl = baseUrl.replace(/\/$/, ''); 
    const normalizedPath = trimmedUrl.startsWith('/') ? trimmedUrl : `/${trimmedUrl}`;
    return `${baseUrl}${normalizedPath}`;
  }

  async processStep(tenantId, contact, messageText, waService, io, isAutoFollowup = false) {
    const lockKey = `${tenantId}_${contact.phone}`;
    
    // Webhook Concurrency Lock
    if (this.activeProcesses.has(lockKey) && !isAutoFollowup) {
      console.log(`[PRD Flow] 🛡️ Blocked concurrent process for ${contact.phone}`);
      return;
    }
    this.activeProcesses.add(lockKey);

    try {
      const tenantDb = getTenantConnection(tenantId);
      const Contact = tenantDb.model('Contact', ContactSchema);
      const Message = tenantDb.model('Message', MessageSchema);
      const Lead = tenantDb.model('Lead', LeadSchema);
      
      this.clearTimer(contact._id.toString());

      const currentState = contact.currentFlowStep || 'START_PRD_FLOW';
      console.log(`[PRD Flow] Processing Step: ${currentState} for ${contact.phone}`);

      let prompts = {
        qualificationOptions: ['10th Pass', '12th Pass', 'Diploma Completed', 'Graduation Completed', 'Master Completed'],
        programMap: {
          '10th Pass': { 'Diploma Programs': ['Diploma in Engineering', 'IT Diploma', 'Animation Diploma'] },
          '12th Pass': { 'Trending Programs': ['B.Sc IT (Cyber Security)', 'AI & ML', 'Cloud Automation'], 'Traditional Programs': ['BBA', 'B.Com', 'BCA', 'B.Sc'] },
          'Diploma Completed': { 'Bachelor Programs': ['Electrical Engineering', 'Civil Engineering', 'Mechanical Engineering'] },
          'Graduation Completed': { 'Master Programs': ['MBA', 'MCA', 'M.Sc IT'] },
          'Master Completed': { 'Advanced Certs': ['Post Grad Diploma', 'Research Program'] }
        }
      };

      try {
        const settings = await Settings.findOne({ tenantId });
        if (settings?.automation?.aiPrompts) {
          prompts = { ...prompts, ...settings.automation.aiPrompts.toObject() };
        }
      } catch (err) {}

      const replaceVars = (str) => {
        if (!str) return '';
        return str
          .replace(/{{name}}|\[\[name\]\]/g, contact.name || 'Friend')
          .replace(/{{qualification}}|\[\[qualification\]\]/g, contact.qualification || 'your qualification')
          .replace(/{{program}}|\[\[program\]\]/g, contact.selectedProgram || 'the program');
      };

      const saveAndEmit = async (type, payload, waResult) => {
        const savedMsg = await Message.create({
          contactId: contact._id,
          messageId: waResult?.messages?.[0]?.id || `prd_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          direction: 'OUTBOUND',
          type: type,
          content: payload,
          status: 'SENT'
        });
        if (io) io.to(tenantId).emit('current_chat_message', { ...savedMsg._doc, contact });
      };

      const flowSteps = (prompts.prdFlowSteps && prompts.prdFlowSteps.length > 0) 
        ? prompts.prdFlowSteps 
        : this.DEFAULT_PRD_FLOW_STEPS;

      let iterations = 0;
      let stepToProcess = null;

      if (!contact.currentFlowStep || contact.currentFlowStep === 'START_PRD_FLOW') {
        stepToProcess = flowSteps[0];
      } else {
        const idx = flowSteps.findIndex(s => s.id === contact.currentFlowStep);
        stepToProcess = idx !== -1 ? flowSteps[idx] : flowSteps[0];
      }

      let canConsumeMessage = true;

      while (stepToProcess && iterations < 5) {
        iterations++;
        const currentIdx = flowSteps.findIndex(s => s.id === stepToProcess.id);
        const possibleNextStep = flowSteps[currentIdx + 1];

        switch (stepToProcess.type) {
          case 'GREETING': {
            console.log(`[PRD Flow] Executing GREETING for ${contact.phone}`);
            const msg = replaceVars(stepToProcess.message || 'Hello 👋 Welcome to JV Group!');
            const img = this.makeAbsolute(stepToProcess.image);
            
            if (img) {
              try {
                const res = await waService.sendMedia(contact.phone, 'image', /^\d+$/.test(img) ? img : null, msg, /^\d+$/.test(img) ? null : img);
                await saveAndEmit('image', msg, res);
              } catch (e) {
                const res = await waService.sendTextMessage(contact.phone, msg);
                await saveAndEmit('text', msg, res);
              }
            } else {
              const res = await waService.sendTextMessage(contact.phone, msg);
              await saveAndEmit('text', msg, res);
            }

            if (possibleNextStep) {
              await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: possibleNextStep.id });
              contact.currentFlowStep = possibleNextStep.id;
              
              const namePrompt = replaceVars(possibleNextStep.message || 'Great! May I know your name?');
              const pRes = await waService.sendTextMessage(contact.phone, namePrompt);
              await saveAndEmit('text', namePrompt, pRes);
              
              this.startActivityTimer(tenantId, contact, waService, io);
            }
            stepToProcess = null;
            break;
          }

          case 'NAME_CAPTURE': {
            console.log(`[PRD Flow] Executing NAME_CAPTURE for ${contact.phone} | canConsume: ${canConsumeMessage}`);
            if (!isAutoFollowup && canConsumeMessage) {
              const rawName = messageText.trim();
              const extractedName = await AIService.extractData(rawName, 'NAME');
              const finalName = (extractedName && extractedName.length < 50) ? extractedName : rawName;
              
              await Contact.findByIdAndUpdate(contact._id, { name: finalName, 'flowVariables.name': finalName });
              contact.name = finalName;

              if (possibleNextStep) {
                await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: possibleNextStep.id });
                contact.currentFlowStep = possibleNextStep.id;
                stepToProcess = possibleNextStep;
                canConsumeMessage = false;
                continue;
              }
            } else {
              const msg = replaceVars(stepToProcess.message || 'Great! May I know your name?');
              const res = await waService.sendTextMessage(contact.phone, msg);
              await saveAndEmit('text', msg, res);
              await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: stepToProcess.id });
              this.startActivityTimer(tenantId, contact, waService, io);
              stepToProcess = null;
            }
            break;
          }

          case 'QUALIFICATION': {
            if (contact.currentFlowStep === stepToProcess.id && !isAutoFollowup && canConsumeMessage) {
              const extracted = await AIService.extractData(messageText.trim(), 'QUALIFICATION');
              const opts = prompts.qualificationOptions || ['10th Pass', '12th Pass', 'Diploma Completed', 'Graduation Completed', 'Master Completed'];
              const matched = opts.find(o => o.toLowerCase().includes(extracted.toLowerCase()) || extracted.toLowerCase().includes(o.toLowerCase()));
              
              if (matched) {
                await Contact.findByIdAndUpdate(contact._id, { qualification: matched, 'flowVariables.qualification': matched });
                contact.qualification = matched;
                if (possibleNextStep) {
                  await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: possibleNextStep.id });
                  contact.currentFlowStep = possibleNextStep.id;
                  stepToProcess = possibleNextStep;
                  canConsumeMessage = false;
                  continue;
                }
              } else {
                const reprompt = `I didn't quite catch that. Please select your last qualification from the list 👇`;
                await waService.sendListMessage(contact.phone, {
                  header: 'Qualification',
                  body: reprompt,
                  buttonText: 'Select Option',
                  sections: [{ title: 'Options', rows: opts.map((opt, i) => ({ id: `qual_${i}`, title: opt })) }]
                });
                await saveAndEmit('interactive', reprompt, null);
                stepToProcess = null;
              }
            } else {
              const msg = replaceVars(stepToProcess.message);
              const opts = prompts.qualificationOptions || ['10th Pass', '12th Pass', 'Diploma Completed', 'Graduation Completed', 'Master Completed'];
              await waService.sendListMessage(contact.phone, {
                header: 'Qualification',
                body: msg,
                buttonText: 'Options',
                sections: [{ title: 'Qualifications', rows: opts.map((opt, i) => ({ id: `qual_${i}`, title: opt })) }]
              });
              await saveAndEmit('interactive', msg, null);
              await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: stepToProcess.id });
              this.startActivityTimer(tenantId, contact, waService, io);
              stepToProcess = null;
            }
            break;
          }

          case 'PROGRAM_SELECTION': {
            if (contact.currentFlowStep === stepToProcess.id && !isAutoFollowup && canConsumeMessage) {
              const prog = messageText.trim();
              await Contact.findByIdAndUpdate(contact._id, { selectedProgram: prog, 'flowVariables.selectedProgram': prog });
              contact.selectedProgram = prog;
              if (possibleNextStep) {
                await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: possibleNextStep.id });
                contact.currentFlowStep = possibleNextStep.id;
                stepToProcess = possibleNextStep;
                canConsumeMessage = false;
                continue;
              }
            } else {
              const qual = contact.qualification || '';
              const pMap = prompts.programMap || {};
              const qualMap = pMap[qual] || {};
              const sections = Object.keys(qualMap).map(title => ({
                title,
                rows: qualMap[title].map((p, i) => ({ id: `p_${i}`, title: p }))
              }));
              const msg = replaceVars(stepToProcess.message);
              if (sections.length > 0) {
                await waService.sendListMessage(contact.phone, { header: 'Programs', body: msg, buttonText: 'View Programs', sections });
              } else {
                await waService.sendTextMessage(contact.phone, msg);
              }
              await saveAndEmit('interactive', msg, null);
              await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: stepToProcess.id });
              this.startActivityTimer(tenantId, contact, waService, io);
              stepToProcess = null;
            }
            break;
          }

          case 'SUCCESS_PROOF': {
            const msg = replaceVars(stepToProcess.message);
            const img = this.makeAbsolute(stepToProcess.image);
            if (img) {
              try {
                const res = await waService.sendMedia(contact.phone, 'image', /^\d+$/.test(img) ? img : null, msg, /^\d+$/.test(img) ? null : img);
                await saveAndEmit('image', msg, res);
              } catch (e) {
                const res = await waService.sendTextMessage(contact.phone, msg);
                await saveAndEmit('text', msg, res);
              }
            } else {
              const res = await waService.sendTextMessage(contact.phone, msg);
              await saveAndEmit('text', msg, res);
            }
            if (possibleNextStep) {
              await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: possibleNextStep.id });
              contact.currentFlowStep = possibleNextStep.id;
              stepToProcess = possibleNextStep;
              canConsumeMessage = false;
              continue;
            }
            break;
          }

          case 'CALL_TIME': {
            if (contact.currentFlowStep === stepToProcess.id && !isAutoFollowup && canConsumeMessage) {
              const time = messageText.trim();
              const vars = contact.flowVariables || {};
              const name = contact.name || 'Friend';
              
              await Lead.create({
                tenantId, name, phone: contact.phone,
                qualification: vars.qualification || contact.qualification,
                selectedProgram: vars.selectedProgram || contact.selectedProgram,
                preferredCallTime: time, leadSource: 'proactive_ai_bot', status: 'QUALIFIED'
              });

              const summary = `Thank you ${name} 🙌\n\nHere are your details:\n🎓 Qualification: ${vars.qualification || contact.qualification}\n📘 Selected Program: ${vars.selectedProgram || contact.selectedProgram}\n⏰ Preferred Time: ${time}\n\nOur counsellor will call you at your selected time 📞`;
              await waService.sendTextMessage(contact.phone, summary);
              await saveAndEmit('text', summary, null);

              const closing = `Thank you for your time, ${name} 😊`;
              await waService.sendTextMessage(contact.phone, closing);
              await saveAndEmit('text', closing, null);

              await Contact.findByIdAndUpdate(contact._id, { $unset: { currentFlowStep: '' } });
              stepToProcess = null;
            } else {
              const msg = replaceVars(stepToProcess.message);
              const opts = stepToProcess.options || ['Morning', 'Afternoon', 'Evening'];
              const res = await waService.sendInteractiveButtonMessage(contact.phone, {
                body: msg,
                buttons: opts.slice(0, 3)
              });
              await saveAndEmit('interactive', msg, res);
              await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: stepToProcess.id });
              this.startActivityTimer(tenantId, contact, waService, io);
              stepToProcess = null;
            }
            break;
          }

          default:
            stepToProcess = null;
            break;
        }
      }
    } catch (err) {
      console.error(`[PRD Flow] FATAL ERROR in processStep:`, err);
    } finally {
      this.activeProcesses.delete(lockKey);
    }
  }

  startActivityTimer(tenantId, contact, waService, io) {
    const contactId = contact._id.toString();
    this.clearTimer(contactId);
    const timer = setTimeout(async () => {
      try {
        const tenantDb = getTenantConnection(tenantId);
        const Contact = tenantDb.model('Contact', ContactSchema);
        const fresh = await Contact.findById(contactId);
        if (!fresh || !fresh.currentFlowStep) return;
        const timeouts = (fresh.flowVariables?.consecutiveTimeouts || 0) + 1;
        if (timeouts >= 2) {
          await Contact.findByIdAndUpdate(contactId, { 'flowVariables.consecutiveTimeouts': 0 });
          return;
        }
        await Contact.findByIdAndUpdate(contactId, { 'flowVariables.consecutiveTimeouts': timeouts });
        await this.processStep(tenantId, fresh, "TIMEOUT", waService, io, true);
      } catch (e) {}
    }, 15000);
    this.activeTimers.set(contactId, timer);
  }

  static async updateLeadScore(Contact, Message, contactId, io, tenantId) {
    try {
      const contact = await Contact.findById(contactId);
      if (!contact) return;
      const messages = await Message.find({ contactId }).sort({ createdAt: -1 }).limit(20);
      const { score, heatLevel } = await AIService.calculateLeadScore(contact, messages);
      await Contact.findByIdAndUpdate(contactId, { score, heatLevel });
      if (io) io.to(tenantId).emit('contact_updated', { contactId, score, heatLevel });
    } catch (err) {
      console.error('[Score Update Error]', err);
    }
  }
}

module.exports = new PRDFlowService();
