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

    console.log(`[PRD Flow] Executing Type: ${currentStep.type} | ID: ${currentStep.id}`);

    switch (currentStep.type) {
      case 'GREETING': {
        const greeting = replaceVars(currentStep.message);
        const greetingImg = this.makeAbsolute(currentStep.image);
        
        if (greetingImg) {
          try {
            const isId = /^\d+$/.test(greetingImg);
            const imgRes = await waService.sendMedia(contact.phone, 'image', isId ? greetingImg : null, greeting, isId ? null : greetingImg);
            await saveAndEmit('image', `[Media] ${greetingImg}\n${greeting}`, imgRes);
          } catch (mediaErr) {
            const gRes = await waService.sendTextMessage(contact.phone, greeting);
            await saveAndEmit('text', greeting, gRes);
          }
        } else {
            const gRes = await waService.sendTextMessage(contact.phone, greeting);
            await saveAndEmit('text', greeting, gRes);
        }

        if (nextStep) {
           await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: nextStep.id });
           // Auto-trigger next step if it's a non-interactive message (like success proof or custom message)
           // But for greeting, we usually wait for name, so just set step.
        }
        break;
      }

      case 'NAME_CAPTURE': {
        // If we just arrived and haven't asked yet, ask!
        if (contact.currentFlowStep !== currentStep.id) {
           const msg = replaceVars(currentStep.message);
           const res = await waService.sendTextMessage(contact.phone, msg);
           await saveAndEmit('text', msg, res);
           await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: currentStep.id });
           return;
        }

        // Process response
        const cleanMessage = messageText.trim();
        const words = cleanMessage.split(/\s+/);
        let name = cleanMessage;
        
        if (words.length > 2) {
          name = await AIService.extractData(cleanMessage, 'NAME');
        }

        await Contact.findByIdAndUpdate(contact._id, { 
          name, 
          currentFlowStep: nextStep?.id || '',
          [`flowVariables.name`]: name,
          $push: { timeline: { eventType: 'AI_MILESTONE', description: `Name captured: ${name}`, timestamp: new Date() } }
        });

        // Trigger the next step immediately?
        // Usually, after name capture, we ask qualification next. 
        // We repeat the process in the next message or call this function recursively (carefully).
        // For now, we wait for the next message to trigger the next step's "Question" part.
        break;
      }

      case 'QUALIFICATION': {
        const reply = replaceVars(currentStep.message);
        
        await waService.sendListMessage(contact.phone, {
          header: currentStep.title || 'Qualification',
          body: reply,
          buttonText: 'Select Option',
          sections: [{
            title: 'Options',
            rows: qualOptions.map((opt, i) => ({
              id: `qual_${i}`,
              title: opt
            }))
          }]
        });
        await saveAndEmit('interactive', reply, null);
        await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: currentStep.id });
        break;
      }

      case 'PROGRAM_SELECTION': {
        let qual = messageText.trim();
        if (!qualOptions.includes(qual)) {
           const matched = qualOptions.find(opt => opt.toLowerCase() === qual.toLowerCase());
           if (matched) qual = matched;
           else return; 
        }

        const sections = Object.keys(progMap[qual]).map(secTitle => ({
          title: secTitle,
          rows: progMap[qual][secTitle].map((progName, i) => ({
            id: `prog_${qual.substring(0,3)}_${i}`,
            title: progName
          }))
        }));

        const reply = replaceVars(currentStep.message);
        
        await waService.sendListMessage(contact.phone, {
          header: currentStep.title || 'Program Selection',
          body: reply,
          buttonText: 'View Programs',
          sections
        });
        await saveAndEmit('interactive', reply, null);

        await Contact.findByIdAndUpdate(contact._id, { 
          currentFlowStep: currentStep.id,
          qualification: qual,
          [`flowVariables.qualification`]: qual
        });
        break;
      }

      case 'SUCCESS_PROOF': {
        const success = replaceVars(currentStep.message);
        const successImg = this.makeAbsolute(currentStep.image);
        
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

        if (nextStep) {
           await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: nextStep.id });
        }
        break;
      }

      case 'CALL_TIME': {
        const timeMsg = replaceVars(currentStep.message);
        const options = currentStep.options || ['Morning', 'Afternoon', 'Evening'];
        const res = await waService.sendInteractiveButtonMessage(contact.phone, {
          body: timeMsg,
          buttons: options.slice(0, 3)
        });
        await saveAndEmit('interactive', timeMsg, res);
        await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: currentStep.id });
        break;
      }

      case 'CUSTOM_MESSAGE': {
         const msg = replaceVars(currentStep.message);
         const res = await waService.sendTextMessage(contact.phone, msg);
         await saveAndEmit('text', msg, res);
         if (nextStep) {
            await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: nextStep.id });
         }
         break;
      }

      case 'CUSTOM_QUESTION': {
         const msg = replaceVars(currentStep.message);
         const res = await waService.sendTextMessage(contact.phone, msg);
         await saveAndEmit('text', msg, res);
         await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: currentStep.id });
         break;
      }

    } // End switch (currentStep.type)
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
