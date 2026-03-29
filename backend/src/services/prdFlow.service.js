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
      { id: 'step_1', type: 'GREETING', title: 'Greeting Message', message: 'Hello 👋 Welcome to JV Marketing Support!', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=60' },
      { id: 'step_2', type: 'NAME_CAPTURE', title: 'Name Request', message: 'Great! May I know your name?' },
      { id: 'step_3', type: 'QUALIFICATION', title: 'Qualification Choice', message: '{{name}}, please select your last qualification 👇' },
      { id: 'step_4', type: 'PROGRAM_SELECTION', title: 'Program Selection', message: 'Great, {{name}}! Please select your preferred program:' },
      { id: 'step_5', type: 'SUCCESS_PROOF', title: 'Success & Proof', message: '🎉 Success Stories, {{name}}!\n\nOur students are working in top companies 🚀', image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=60' },
      { id: 'step_6', type: 'CALL_TIME', title: 'Consultation Call', message: '{{name}}, what is your preferred time for a call? 📞', options: ['Morning', 'Afternoon', 'Evening'] }
    ];
  }

  makeAbsolute(url) {
    if (!url || typeof url !== 'string' || url.trim() === '') return '';
    const trimmedUrl = url.trim();
    
    // ✅ Fix: Don't prepend domain to Meta Media IDs (Numeric strings)
    // This allows users to use IDs from their Meta Dashboard directly
    if (/^\d+$/.test(trimmedUrl)) return trimmedUrl;
    
    if (trimmedUrl.startsWith('http')) return trimmedUrl;
    
    // Use BASE_URL if available, otherwise fallback to wapipulse.com
    let baseUrl = (process.env.BASE_URL || 'https://wapipulse.com').trim();
    baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    
    const normalizedPath = trimmedUrl.startsWith('/') ? trimmedUrl : `/${trimmedUrl}`;
    return `${baseUrl}${normalizedPath}`;
  }

  async processStep(tenantId, contact, messageText, waService, io) {
    const tenantDb = getTenantConnection(tenantId);
    const Contact = tenantDb.model('Contact', ContactSchema);
    const Message = tenantDb.model('Message', MessageSchema);
    
    // Pass io and tenantId to score update calls
    const triggerScoreUpdate = () => this.updateLeadScore(Contact, Message, contact._id, io, tenantId);
    const Lead = tenantDb.model('Lead', LeadSchema);

    const currentState = contact.currentFlowStep || 'START_PRD_FLOW';
    console.log(`[PRD Flow] Processing Step: ${currentState} for ${contact.phone}`);

    // Fetch dynamic prompts from settings
    let prompts = {
      greetingMessage: 'Hello 👋 Welcome to JV Marketing Education Support!\n\nWe help you choose the best career path 🚀',
      greetingImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=60',
      namePrompt: 'Great! May I know your name?',
      programListPrompt: '{{name}}, which career path or program are you interested in?',
      successProofMessage: '🎉 Success Stories, {{name}}!\n\nOur students are already working in top companies 🚀\nYou could be next!',
      successProofImage: '',
      callTimePrompt: '{{name}}, what is your preferred time for our counsellor to call you? 📞',
      agentTransferPrompt: 'Transferring you to a human agent... 👨–💻',
      fallbackMessage: "I'm sorry, I didn't quite get that. Could you please rephrase?"
    };

    try {
      const settings = await Settings.findOne({ tenantId });
      if (settings?.automation?.aiPrompts) {
        // Merge with defaults to ensure no missing keys
        prompts = { ...prompts, ...settings.automation.aiPrompts.toObject() };
      }
    } catch (err) {
      console.warn('[PRD Flow] Could not fetch settings, using defaults:', err.message);
    }

    // Ensure image URLs are absolute for Meta API
    prompts.greetingImage = this.makeAbsolute(prompts.greetingImage);
    prompts.successProofImage = this.makeAbsolute(prompts.successProofImage);

    // Extraction of dynamic branching lists
    const qualOptions = prompts.qualificationOptions || this.DEFAULT_QUALIFICATION_OPTIONS;
    const progMap = prompts.programMap || this.DEFAULT_PROGRAM_MAP;

    const replaceVars = (str) => {
      if (!str) return '';
      return str
        .replace(/{{name}}/g, contact.name || 'Friend')
        .replace(/{{qualification}}/g, contact.qualification || 'your qualification')
        .replace(/{{program}}/g, contact.selectedProgram || 'the program');
    };

    const saveAndEmit = async (type, payload, waResult) => {
      const savedMsg = await Message.create({
        contactId: contact._id,
        messageId: waResult?.messages?.[0]?.id || `prd_${Date.now()}`,
        direction: 'OUTBOUND',
        type: type,
        content: payload,
        status: 'SENT'
      });
      if (io) io.to(tenantId).emit('new_message', { ...savedMsg._doc, contact });
    };

    const flowSteps = prompts.prdFlowSteps && prompts.prdFlowSteps.length > 0 
      ? prompts.prdFlowSteps 
      : this.DEFAULT_PRD_FLOW_STEPS;

    let currentStep = null;
    let nextStep = null;

    if (!contact.currentFlowStep || contact.currentFlowStep === 'START_PRD_FLOW') {
      currentStep = flowSteps[0];
      nextStep = flowSteps[1];
    } else {
      const currentIndex = flowSteps.findIndex(s => s.id === contact.currentFlowStep);
      currentStep = currentIndex !== -1 ? flowSteps[currentIndex] : flowSteps[0];
      nextStep = flowSteps[currentIndex + 1];
    }

    if (!currentStep) {
       console.log(`[PRD Flow] No more steps or invalid step. Ending flow.`);
       await Contact.findByIdAndUpdate(contact._id, { $unset: { currentFlowStep: "" } });
       return;
    }

    let stepToProcess = currentStep;
    let iterations = 0;

    while (stepToProcess && iterations < 5) {
      iterations++;
      console.log(`[PRD Flow] Iteration ${iterations} | Executing Type: ${stepToProcess.type} | ID: ${stepToProcess.id}`);
      
      let nextStepId = null;
      const currentIndex = flowSteps.findIndex(s => s.id === stepToProcess.id);
      const possibleNextStep = flowSteps[currentIndex + 1];

      switch (stepToProcess.type) {
        case 'GREETING': {
          const greeting = replaceVars(stepToProcess.message);
          const greetingImg = this.makeAbsolute(stepToProcess.image);
          
          if (greetingImg) {
            try {
              const imgRes = await waService.sendMedia(contact.phone, 'image', /^\d+$/.test(greetingImg) ? greetingImg : null, greeting, /^\d+$/.test(greetingImg) ? null : greetingImg);
              await saveAndEmit('image', `[Media] ${greetingImg}\n${greeting}`, imgRes);
            } catch (mediaErr) {
              const gRes = await waService.sendTextMessage(contact.phone, greeting);
              await saveAndEmit('text', greeting, gRes);
            }
          } else {
              const gRes = await waService.sendTextMessage(contact.phone, greeting);
              await saveAndEmit('text', greeting, gRes);
          }

          if (possibleNextStep) {
             nextStepId = possibleNextStep.id;
             await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: nextStepId });
             stepToProcess = possibleNextStep;
             // Delay for visual order
             await new Promise(r => setTimeout(r, 800));
             continue; // Chaining!
          }
          break;
        }

        case 'NAME_CAPTURE': {
          if (contact.currentFlowStep === stepToProcess.id) {
             const name = await AIService.extractData(messageText.trim(), 'NAME');
             contact.name = name; // Update local for variables in next step
             
             await Contact.findByIdAndUpdate(contact._id, { 
                name, 
                currentFlowStep: possibleNextStep?.id || '',
                [`flowVariables.name`]: name,
                $push: { timeline: { eventType: 'AI_MILESTONE', description: `Name captured: ${name}`, timestamp: new Date() } }
             });
             
             if (possibleNextStep) {
                stepToProcess = possibleNextStep;
                continue; 
             }
             break;
          } else {
             const msg = replaceVars(stepToProcess.message);
             const res = await waService.sendTextMessage(contact.phone, msg);
             await saveAndEmit('text', msg, res);
             await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: stepToProcess.id });
             contact.currentFlowStep = stepToProcess.id; // Sync local
             stepToProcess = null; 
             break;
          }
        }

        case 'QUALIFICATION': {
          if (contact.currentFlowStep === stepToProcess.id) {
             let qual = messageText.trim();
             const opts = prompts.qualificationOptions || [];
             
             // Smart Matching: find based on lowercase or direct match
             const matched = opts.find(opt => opt.toLowerCase() === qual.toLowerCase());
             if (matched) {
                qual = matched;
             } else {
                stepToProcess = null; 
                break;
             }

             contact.qualification = qual;
             await Contact.findByIdAndUpdate(contact._id, { 
                qualification: qual,
                [`flowVariables.qualification`]: qual,
                currentFlowStep: possibleNextStep?.id || ''
             });

             if (possibleNextStep) {
                stepToProcess = possibleNextStep;
                continue;
             }
             break;
          } else {
             const reply = replaceVars(stepToProcess.message);
             const opts = prompts.qualificationOptions || [];

             await waService.sendListMessage(contact.phone, {
               header: stepToProcess.title || 'Qualification',
               body: reply,
               buttonText: 'Select Option',
               sections: [{
                 title: 'Options',
                 rows: opts.map((opt, i) => ({ id: `qual_${i}`, title: opt }))
               }]
             });
             await saveAndEmit('interactive', reply, null);
             await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: stepToProcess.id });
             contact.currentFlowStep = stepToProcess.id; // Sync local
             stepToProcess = null;
             break;
          }
        }

        case 'PROGRAM_SELECTION': {
          if (contact.currentFlowStep === stepToProcess.id) {
             const prog = messageText.trim();
             contact.selectedProgram = prog;
             
             await Contact.findByIdAndUpdate(contact._id, { 
                selectedProgram: prog,
                [`flowVariables.selectedProgram`]: prog,
                currentFlowStep: possibleNextStep?.id || ''
             });
             
             if (possibleNextStep) {
                contact.currentFlowStep = possibleNextStep.id;
                stepToProcess = possibleNextStep;
                continue;
             }
             break;
          } else {
             const prompts = (await Settings.findOne({ tenantId }))?.automation?.aiPrompts || {};
             const qual = contact.qualification; // Already synced in previous step
             const pMap = prompts.programMap || {};
             const qualMap = pMap[qual] || {};

             const sections = Object.keys(qualMap).map(secTitle => ({
               title: secTitle,
               rows: qualMap[secTitle].map((progName, i) => ({ id: `prog_${i}`, title: progName }))
             }));

             const reply = replaceVars(stepToProcess.message);
             await waService.sendListMessage(contact.phone, {
               header: stepToProcess.title || 'Program Selection',
               body: reply,
               buttonText: 'View Programs',
               sections
             });
             await saveAndEmit('interactive', reply, null);
             await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: stepToProcess.id });
             contact.currentFlowStep = stepToProcess.id;
             stepToProcess = null;
             break;
          }
        }

        case 'SUCCESS_PROOF': {
          const success = replaceVars(stepToProcess.message);
          const successImg = this.makeAbsolute(stepToProcess.image);
          
          if (successImg) {
            try {
              const isId = /^\d+$/.test(successImg);
              const sRes = await waService.sendMedia(contact.phone, 'image', isId ? successImg : null, success, isId ? null : successImg);
              await saveAndEmit('image', successImg, sRes);
            } catch (mediaErr) {
              const sRes = await waService.sendTextMessage(contact.phone, success);
              await saveAndEmit('text', success, sRes);
            }
          } else {
            const sRes = await waService.sendTextMessage(contact.phone, success);
            await saveAndEmit('text', success, sRes);
          }

          if (possibleNextStep) {
             await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: possibleNextStep.id });
             contact.currentFlowStep = possibleNextStep.id;
             stepToProcess = possibleNextStep;
             await new Promise(r => setTimeout(r, 800));
             continue;
          }
          stepToProcess = null;
          break;
        }

        case 'CALL_TIME': {
          if (contact.currentFlowStep === stepToProcess.id) {
             const time = messageText.trim();
             // Finalize Lead
             const fullContact = await Contact.findById(contact._id);
             const vars = fullContact.flowVariables || {};
             
             await Lead.create({
                tenantId,
                name: contact.name, 
                phone: contact.phone,
                qualification: vars.qualification || contact.qualification, 
                selectedProgram: vars.selectedProgram || contact.selectedProgram,
                preferredCallTime: time, 
                leadSource: 'proactive_ai_bot', 
                status: 'QUALIFIED'
             });

             const summary = `Thank you ${contact.name || ''} 🙌\n\nDetails Submitted:\n🎓 Qual: ${vars.qualification || contact.qualification}\n📘 Program: ${vars.selectedProgram || contact.selectedProgram}\n⏰ Time: ${time}\n\nOur counsellor will call you! 📞`;
             await waService.sendTextMessage(contact.phone, summary);

             await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: '' });
             contact.currentFlowStep = '';
             stepToProcess = null;
             break;
          } else {
             const timeMsg = replaceVars(stepToProcess.message);
             const options = stepToProcess.options || ['Morning', 'Afternoon', 'Evening'];
             const res = await waService.sendInteractiveButtonMessage(contact.phone, {
               body: timeMsg,
               buttons: options.slice(0, 3)
             });
             await saveAndEmit('interactive', timeMsg, res);
             await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: stepToProcess.id });
             contact.currentFlowStep = stepToProcess.id;
             stepToProcess = null;
             break;
          }
        }

        case 'CUSTOM_MESSAGE': {
           const msg = replaceVars(stepToProcess.message);
           const res = await waService.sendTextMessage(contact.phone, msg);
           await saveAndEmit('text', msg, res);
           if (possibleNextStep) {
              await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: possibleNextStep.id });
              contact.currentFlowStep = possibleNextStep.id;
              stepToProcess = possibleNextStep;
              await new Promise(r => setTimeout(r, 800));
              continue;
           }
           stepToProcess = null;
           break;
        }

        case 'CUSTOM_QUESTION': {
           if (contact.currentFlowStep === stepToProcess.id) {
              await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: possibleNextStep?.id || '' });
              if (possibleNextStep) { 
                 contact.currentFlowStep = possibleNextStep.id;
                 stepToProcess = possibleNextStep; 
                 continue; 
              }
              break;
           } else {
              const msg = replaceVars(stepToProcess.message);
              const res = await waService.sendTextMessage(contact.phone, msg);
              await saveAndEmit('text', msg, res);
              await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: stepToProcess.id });
              contact.currentFlowStep = stepToProcess.id;
              stepToProcess = null;
              break;
           }
        }

        default:
          stepToProcess = null;
          break;
      }
    }
  }

  async updateLeadScore(Contact, Message, contactId, io, tenantId) {
    try {
      const contact = await Contact.findById(contactId);
      const messages = await Message.find({ contactId }).sort({ timestamp: -1 }).limit(10);
      const { score, heatLevel } = await AIService.calculateLeadScore(contact, messages);
      await Contact.findByIdAndUpdate(contactId, { score, heatLevel });
      
      if (io && tenantId) {
        io.to(tenantId).emit('lead_score_updated', { contactId, score, heatLevel });
      }
    } catch (e) {
      console.warn('[PRD Flow] Score update failed:', e.message);
    }
  }
}

module.exports = new PRDFlowService();
