const MessageSchema = require('../models/tenant/Message');
const ContactSchema = require('../models/tenant/Contact');
const SuccessStorySchema = require('../models/tenant/SuccessStory');
const BotAnalyticsSchema = require('../models/tenant/BotAnalytics');
const LeadSchema = require('../models/crm/Lead');
const { getTenantConnection } = require('../config/db');
const AIService = require('./ai.service');
const Settings = require('../models/core/Settings');
const mongoose = require('mongoose');
const assignmentService = require('./assignment.service');
const notificationService = require('./notification.service');
const schedulingService = require('./scheduling.service');
const integrationService = require('./integration.service');

class PRDFlowService {
  constructor() {
    this.DEFAULT_PRD_FLOW_STEPS = [
      { id: 'ask_name', type: 'NAME_CAPTURE', title: 'Greeting & Name Request', message: 'Welcome to Gandhinagar University 🎓\n\nWe’re excited to help you choose the right career path.\n\nMay I know your name?', image: 'https://wapipulse.com/uploads/prompts/tenant_demo_001/prompt_1774743344804.jpeg' },
      { id: 'qualification', type: 'QUALIFICATION', title: 'Qualification Request', message: 'Nice to meet you {{name}} 😊\n\nPlease select your qualification.' },
      { id: 'program', type: 'PROGRAM_SELECTION', title: 'Program Selection', message: 'Please select your preferred program category.' },
      { id: 'call_time', type: 'CALL_TIME', title: 'Consultation Call', message: 'Excellent choice 🚀\n\nWhen should our counselor contact you?', buttons: ['Morning', 'Afternoon', 'Evening'] },
      { id: 'thank_you', type: 'CUSTOM_MESSAGE', title: 'Thank You Message', message: 'Thank you {{name}} 🙌\n\n🎓 Qualification: {{qualification}}\n📘 Program: {{program}}\n⏰ Time: {{time}}\n\nOur counselor will call you at your preferred time 📞\n\nThank you for your time, {{name}} 😊' }
    ];
    this.activeProcesses = new Set();
  }

  sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  makeAbsolute(url) {
    if (!url || typeof url !== 'string' || url.trim() === '') return '';
    if (url.startsWith('http') || /^\d+$/.test(url)) return url;
    const baseUrl = (process.env.BASE_URL || 'https://wapipulse.com').replace(/\/$/, '');
    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  }

  async clearPRDFlowSession(tenantId, phone, Contact) {
    await Contact.updateOne(
      { phone },
      {
        $set: {
          currentFlowStep: null,
          currentFlowId: null,
          isFlowActive: false,
          flowVariables: {},
          selectedStream: null
        }
      }
    );
  }

  async processStep(tenantId, contact, messageText, waService, io, isAutoFollowup = false, replyValue = null) {
    const lockKey = `${tenantId}_${contact.phone}`;
    if (this.activeProcesses.has(lockKey) && !isAutoFollowup) return;
    this.activeProcesses.add(lockKey);

    const currentState = contact.currentFlowStep || 'START';
    console.log(`[PRD State Machine] 🌀 State: ${currentState} | Msg: "${messageText}" | ReplyValue: "${replyValue}"`);

    // --- PAUSE CHECK ---
    if (contact.isBotPaused) {
      if (contact.botPauseUntil && new Date() > new Date(contact.botPauseUntil)) {
         // Auto-resume if timer expired
         await Contact.updateOne({ phone: contact.phone }, { isBotPaused: false, botPauseUntil: null });
      } else {
         console.log(`[PRD] ⏹️ Bot is paused for ${contact.phone}. Skipping automation.`);
         this.activeProcesses.delete(lockKey);
         return;
      }
    }

    try {
      const tenantDb = getTenantConnection(tenantId);
      const ContactModel = tenantDb.model('Contact', ContactSchema);
      const MessageModel = tenantDb.model('Message', MessageSchema);
      const LeadModel = tenantDb.model('Lead', LeadSchema);
      const SuccessStoryModel = tenantDb.model('SuccessStory', SuccessStorySchema);
      const BotAnalyticsModel = tenantDb.model('BotAnalytics', BotAnalyticsSchema);

      const settings = await Settings.findOne({ tenantId });
      const aiPrompts = settings?.automation?.aiPrompts || {};
      const steps = aiPrompts.prdFlowSteps || [];
      const greetingStep = steps.find(s => s.type === 'GREETING');
      let greetingImage = greetingStep?.image || aiPrompts.greetingImage || '';
      if (!greetingImage || greetingImage.includes('tenant_demo_001') || greetingImage.includes('prompt_1774743344804')) {
        greetingImage = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80';
      }

      const saveAndEmit = async (type, payload, waResult) => {
        const msgId = waResult?.messages?.[0]?.id || `out_${Date.now()}`;
        const msg = await MessageModel.create({ 
          contactId: contact._id, 
          messageId: msgId, 
          direction: 'OUTBOUND', 
          type, 
          content: payload, 
          status: 'SENT' 
        });
        if (io) io.to(tenantId).emit('new_message', { ...msg._doc, contact });
      };

      const sendInteractiveOptions = async (body, options) => {
        if (options.length <= 3) {
          const res = await waService.sendInteractiveButtonMessage(contact.phone, { body, buttons: options });
          await saveAndEmit('interactive', body, res);
        } else {
          const res = await waService.sendListMessage(contact.phone, {
            body,
            buttonText: 'View Options',
            sections: [{
              title: 'Available Options',
              rows: options.slice(0, 10).map((opt, i) => ({ id: `list_${i}`, title: opt.substring(0, 24) }))
            }]
          });
          await saveAndEmit('interactive', body, res);
        }
      };

      const normalizedInput = (messageText || '').trim().toLowerCase();
      const normalizedReply = (replyValue || '').trim().toLowerCase();

      // --- LOG ANALYTICS ---
      try {
        await BotAnalyticsModel.create({
          tenantId,
          contactId: contact._id,
          nodeId: currentState,
          nodeType: 'PRD_STATE',
          eventType: 'VIEW'
        });
      } catch (analyticsErr) {
        console.error('[PRD] Analytics Log Error:', analyticsErr);
      }

      // ==========================================
      // STATE: CUSTOM STEP RESUMING
      // ==========================================
      const customStepIndex = steps.findIndex(s => s.id === currentState);
      if (customStepIndex !== -1) {
        console.log(`[PRD Flow] 📥 User replied to custom step: "${steps[customStepIndex].title}"`);
        const fresh = await ContactModel.findOne({ phone: contact.phone });
        const nameVal = fresh.flowVariables?.name || fresh.name || 'Student';
        await this.transitionToNextStepAfter(currentState, contact, ContactModel, steps, settings, waService, nameVal, io);
        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: START (GREETING SCREEN)
      // ==========================================
      if (currentState === 'START') {
        // Reset and initialize session
        await ContactModel.updateOne({ phone: contact.phone }, {
          $set: {
            currentFlowStep: 'ask_name',
            isFlowActive: true,
            flowVariables: {},
            qualification: null,
            selectedStream: null,
            selectedProgram: null,
            preferredCallTime: null
          }
        });

        const uniName = settings?.workspace?.name || "our institution";
        let welcomeMsg = greetingStep?.message || greetingStep?.text || `Welcome to ${uniName} Admission Assistant 👋\nI’m here to help you choose the right program.`;
        
        // Append visual interactive buttons dynamically as beautiful clickable links inside the caption
        if (greetingStep?.buttons && greetingStep.buttons.length > 0) {
          const formattedButtons = greetingStep.buttons.map(btn => {
            if (btn.type === 'url') {
              let url = (btn.label || '').trim();
              if (url && !url.startsWith('http')) {
                url = `https://${url}`;
              }
              return `🌐 Website: ${url}`;
            } else if (btn.type === 'call') {
              return `📞 Call: ${btn.label}`;
            } else if (btn.type === 'reply') {
              return `💬 Option: ${btn.label}`;
            } else {
              return `${btn.label}`;
            }
          }).filter(Boolean);

          if (formattedButtons.length > 0) {
            welcomeMsg = `${welcomeMsg.trim()}\n\n${formattedButtons.join('\n')}`;
          }
        }

        const nameStep = steps.find(s => s.type === 'NAME_CAPTURE');
        const hasSeparateNameCard = !!nameStep && greetingStep?.type === 'GREETING';

        if (!hasSeparateNameCard && !welcomeMsg.toLowerCase().includes('enter your full name') && !welcomeMsg.toLowerCase().includes('may i know your name')) {
          welcomeMsg = `${welcomeMsg.trim()}\n\nPlease enter your full name.`;
        }

        const media = this.makeAbsolute(greetingImage);
        let resGreeting;
        if (media) {
          try {
            resGreeting = await waService.sendMedia(contact.phone, 'image', null, welcomeMsg, media);
            await saveAndEmit('image', welcomeMsg, resGreeting);
          } catch (mediaErr) {
            console.error('[PRD] Media send failed, falling back to text greeting:', mediaErr.message);
            resGreeting = await waService.sendTextMessage(contact.phone, welcomeMsg);
            await saveAndEmit('text', welcomeMsg, resGreeting);
          }
        } else {
          resGreeting = await waService.sendTextMessage(contact.phone, welcomeMsg);
          await saveAndEmit('text', welcomeMsg, resGreeting);
        }

        // Send premium real WhatsApp interactive buttons (URL and Call buttons) immediately after the greeting card
        if (greetingStep?.buttons && greetingStep.buttons.length > 0) {
          for (const btn of greetingStep.buttons) {
            try {
              if (btn.type === 'url') {
                let url = (btn.label || '').trim();
                if (url && !url.startsWith('http')) {
                  url = `https://${url}`;
                }
                const resCta = await waService.sendCtaMessage(contact.phone, {
                  type: 'url',
                  body: `Official Website:`,
                  title: 'Open Website',
                  value: url
                });
                await saveAndEmit('interactive', 'Open Website', resCta);
              } else if (btn.type === 'call') {
                const resCta = await waService.sendCtaMessage(contact.phone, {
                  type: 'call',
                  body: `Hotline Support:`,
                  title: 'Call Counselor',
                  value: btn.label
                });
                await saveAndEmit('interactive', 'Call Counselor', resCta);
              } else if (btn.type === 'reply') {
                const resBtn = await waService.sendInteractiveButtonMessage(contact.phone, {
                  body: `Selected Option:`,
                  buttons: [btn.label]
                });
                await saveAndEmit('interactive', btn.label, resBtn);
              }
            } catch (btnErr) {
              console.error('[PRD] Failed to send real interactive button:', btnErr.message);
            }
          }
        }

        // 🚀 IF SEPARATE NAME CARD IS PRESENT, SEND IT IMMEDIATELY AFTER GREETING WITH A 1.5S DELAY
        if (hasSeparateNameCard) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          const nameMsg = nameStep.message || nameStep.text || "May I know your name?";
          const nameImage = nameStep.image || '';
          const nameMedia = this.makeAbsolute(nameImage);
          let resName;
          
          if (nameMedia) {
            try {
              resName = await waService.sendMedia(contact.phone, 'image', null, nameMsg, nameMedia);
              await saveAndEmit('image', nameMsg, resName);
            } catch (mediaErr) {
              resName = await waService.sendTextMessage(contact.phone, nameMsg);
              await saveAndEmit('text', nameMsg, resName);
            }
          } else {
            resName = await waService.sendTextMessage(contact.phone, nameMsg);
            await saveAndEmit('text', nameMsg, resName);
          }
        }
        
        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_NAME
      // ==========================================
      if (currentState === 'ask_name') {
        const nameInput = messageText.trim();
        if (nameInput.length < 2) {
          const errMsg = "Please enter a valid full name (minimum 2 characters).";
          const resErr = await waService.sendTextMessage(contact.phone, errMsg);
          await saveAndEmit('text', errMsg, resErr);
          this.activeProcesses.delete(lockKey);
          return;
        }

        // Clean & Save Name
        let extractedName = nameInput;
        try {
          extractedName = await AIService.extractData(nameInput, 'NAME');
          if (!extractedName || extractedName.length > 50) extractedName = nameInput;
        } catch (e) {
          console.error('[PRD] AI Extraction Name Failed:', e.message);
        }

        // Fetch settings dynamically to check if QUALIFICATION step is deleted from visual builder
        const Settings = require('../models/core/Settings');
        const settings = await Settings.findOne({ tenantId });
        const prdFlowSteps = settings?.automation?.aiPrompts?.prdFlowSteps || [];
        const hasQualStep = prdFlowSteps.some(s => s.type === 'QUALIFICATION');

        if (!hasQualStep) {
          // 🚀 QUALIFICATION STEP IS DELETED - SKIP IT!
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              name: extractedName,
              'flowVariables.name': extractedName,
              qualification: 'Direct Onboarding',
              'flowVariables.qualification': 'Direct Onboarding',
              currentFlowStep: 'ask_program_category_12th' // Skip direct to program categories selection
            }
          });

          const progStep = prdFlowSteps.find(s => s.type === 'PROGRAM_SELECTION');
          let catMsg = progStep?.message || progStep?.text || "Please select program category.";
          catMsg = this.populatePlaceholders(catMsg, contact, extractedName);

          await sendInteractiveOptions(catMsg, ['Traditional Program', 'Trending Program']);

          this.activeProcesses.delete(lockKey);
          return;
        }

        // Standard flow - Qualification Choice step is active
        await ContactModel.updateOne({ phone: contact.phone }, {
          $set: {
            name: extractedName,
            'flowVariables.name': extractedName,
            currentFlowStep: 'ask_qualification'
          }
        });

        const qualStep = prdFlowSteps.find(s => s.type === 'QUALIFICATION');
        let qualMsg = qualStep?.message || qualStep?.text || `Nice to meet you ${extractedName} 😊\n\nPlease select your qualification.`;
        qualMsg = this.populatePlaceholders(qualMsg, contact, extractedName);

        let options = settings?.automation?.aiPrompts?.qualificationOptions || ['12th Pass', 'Graduation', 'Other'];
        if (!options || options.length === 0 || (options.length === 1 && !options[0])) {
          options = ['12th Pass', 'Graduation', 'Other'];
        }

        await sendInteractiveOptions(qualMsg, options);
        
        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_QUALIFICATION
      // ==========================================
      if (currentState === 'ask_qualification') {
        const Settings = require('../models/core/Settings');
        const settings = await Settings.findOne({ tenantId });
        let options = settings?.automation?.aiPrompts?.qualificationOptions || ['12th Pass', 'Graduation', 'Other'];
        if (!options || options.length === 0 || (options.length === 1 && !options[0])) {
          options = ['12th Pass', 'Graduation', 'Other'];
        }

        // 1. Resolve selected option based on replyValue or manual input match
        let selectedOption = '';
        if (replyValue) {
          const matchBtn = replyValue.match(/btn_(\d+)/i);
          const matchLst = replyValue.match(/list_(\d+)/i);
          const idx = matchBtn ? parseInt(matchBtn[1]) : (matchLst ? parseInt(matchLst[1]) : -1);
          if (idx >= 0 && idx < options.length) {
            selectedOption = options[idx];
          }
        }

        // Try to match by text comparison
        if (!selectedOption) {
          const matchIdx = options.findIndex(opt => {
            const cleanOpt = opt.toLowerCase().trim();
            return normalizedInput === cleanOpt || normalizedInput.includes(cleanOpt);
          });
          if (matchIdx !== -1) {
            selectedOption = options[matchIdx];
          }
        }

        // Dynamic fallbacks
        if (!selectedOption) {
          if (normalizedInput.includes('12') || normalizedInput.includes('twelfth')) {
            selectedOption = options.find(o => o.toLowerCase().includes('12')) || '12th Pass';
          } else if (normalizedInput.includes('grad') || normalizedInput.includes('bachelor') || normalizedInput.includes('degree')) {
            selectedOption = options.find(o => o.toLowerCase().includes('grad') || o.toLowerCase().includes('bach')) || 'Graduation';
          } else if (normalizedInput.includes('diploma')) {
            selectedOption = options.find(o => o.toLowerCase().includes('diploma')) || 'Diploma Completed';
          } else if (normalizedInput.includes('master') || normalizedInput.includes('postgrad')) {
            selectedOption = options.find(o => o.toLowerCase().includes('master')) || 'Master Completed';
          } else if (normalizedInput.includes('10') || normalizedInput.includes('tenth') || normalizedInput.includes('ssc')) {
            selectedOption = options.find(o => o.toLowerCase().includes('10')) || '10th Pass';
          }
        }

        // Ultimate default
        if (!selectedOption) {
          selectedOption = options.find(o => o.toLowerCase().includes('other')) || options[0] || '12th Pass';
        }

        const is12th = selectedOption.toLowerCase().includes('12') || selectedOption.toLowerCase().includes('twelfth') || selectedOption.toLowerCase().includes('10') || selectedOption.toLowerCase().includes('tenth');
        const isGrad = selectedOption.toLowerCase().includes('grad') || selectedOption.toLowerCase().includes('bachelor') || selectedOption.toLowerCase().includes('master') || selectedOption.toLowerCase().includes('degree') || selectedOption.toLowerCase().includes('postgrad');

        if (is12th) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              qualification: selectedOption,
              'flowVariables.qualification': selectedOption,
              currentFlowStep: 'ask_program_category_12th'
            }
          });

          const catMsg = "Please select program category.";
          await sendInteractiveOptions(catMsg, ['Traditional Program', 'Trending Program']);
        }
        else if (isGrad) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              qualification: selectedOption,
              'flowVariables.qualification': selectedOption,
              currentFlowStep: 'ask_program_category_grad'
            }
          });

          const catMsg = "Please select program category.";
          await sendInteractiveOptions(catMsg, ['Master Traditional Program', 'Master Trending Program']);
        }
        else {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              qualification: selectedOption,
              'flowVariables.qualification': selectedOption,
              currentFlowStep: 'ask_custom_qualification'
            }
          });

          const customQualMsg = `You selected: ${selectedOption}. Please type your preferred program or stream.`;
          const res = await waService.sendTextMessage(contact.phone, customQualMsg);
          await saveAndEmit('text', customQualMsg, res);
        }

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_CUSTOM_QUALIFICATION
      // ==========================================
      if (currentState === 'ask_custom_qualification') {
        const customQual = messageText.trim();
        await ContactModel.updateOne({ phone: contact.phone }, {
          $set: {
            qualification: customQual,
            'flowVariables.qualification': customQual,
            currentFlowStep: 'ask_custom_program'
          }
        });

        const customProgMsg = "Please type your preferred program.";
        const res = await waService.sendTextMessage(contact.phone, customProgMsg);
        await saveAndEmit('text', customProgMsg, res);

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_CUSTOM_PROGRAM
      // ==========================================
      if (currentState === 'ask_custom_program') {
        const customProg = messageText.trim();
        await ContactModel.updateOne({ phone: contact.phone }, {
          $set: {
            selectedProgram: customProg,
            'flowVariables.program': customProg,
            currentFlowStep: 'ask_call_time'
          }
        });

        const callTimeMsg = "What would be the best time for our counsellor to call you?";
        await sendInteractiveOptions(callTimeMsg, [
          'Immediate',
          'Within 2 hours',
          'Morning (9am - 12pm)',
          'Afternoon (12pm - 4pm)',
          'Evening (4pm - 7pm)'
        ]);

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_PROGRAM_CATEGORY_12TH
      // ==========================================
      if (currentState === 'ask_program_category_12th') {
        const programMap = settings?.automation?.aiPrompts?.programMap || {};
        const contactQual = contact.qualification || '12th Pass';
        const matchedQualKey = Object.keys(programMap).find(k => k.toLowerCase().trim() === contactQual.toLowerCase().trim()) || '12th Pass';
        const categories = programMap[matchedQualKey] ? Object.keys(programMap[matchedQualKey]) : ['Traditional Program', 'Trending Program'];

        let selectedCategory = '';
        if (replyValue) {
          const matchBtn = replyValue.match(/btn_(\d+)/i);
          const matchLst = replyValue.match(/list_(\d+)/i);
          const idx = matchBtn ? parseInt(matchBtn[1]) : (matchLst ? parseInt(matchLst[1]) : -1);
          if (idx >= 0 && idx < categories.length) {
            selectedCategory = categories[idx];
          }
        }
        if (!selectedCategory) {
          const matchIdx = categories.findIndex(cat => {
            const cleanCat = cat.toLowerCase().trim();
            return normalizedInput === cleanCat || normalizedInput.includes(cleanCat);
          });
          if (matchIdx !== -1) {
            selectedCategory = categories[matchIdx];
          }
        }

        const isTraditional = selectedCategory ? selectedCategory.toLowerCase().includes('trad') : (normalizedInput.includes('traditional') || normalizedReply === 'btn_0' || normalizedReply.includes('traditional'));
        const isTrending = selectedCategory ? selectedCategory.toLowerCase().includes('trend') : (normalizedInput.includes('trending') || normalizedReply === 'btn_1' || normalizedReply.includes('trending'));

        if (isTraditional) {
          const streamName = selectedCategory || 'Traditional Program';
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              selectedStream: streamName,
              'flowVariables.selectedStream': streamName,
              currentFlowStep: 'ask_program_traditional_12th'
            }
          });

          let programs = programMap[matchedQualKey]?.[streamName] || ['B.Com', 'BBA', 'B.Tech', 'B.Sc', 'Other'];
          if (!programs || programs.length === 0) {
            programs = ['B.Com', 'BBA', 'B.Tech', 'B.Sc', 'Other'];
          }

          const progMsg = "Please select your preferred program.";
          await sendInteractiveOptions(progMsg, programs);
        }
        else if (isTrending) {
          const streamName = selectedCategory || 'Trending Program';
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              selectedStream: streamName,
              'flowVariables.selectedStream': streamName,
              currentFlowStep: 'ask_program_trending_12th'
            }
          });

          let programs = programMap[matchedQualKey]?.[streamName] || [
            'B.Sc IT in Cyber Security & Digital Forensics',
            'B.Sc IT in Cloud Automation',
            'B.Sc IT in Data Analytics',
            'B.Sc IT in Animation, VFX & Game Design',
            'B.Sc IT in Blockchain Technology',
            'B.Sc IT in Software & Mobile App Development'
          ];
          if (!programs || programs.length === 0) {
            programs = [
              'B.Sc IT in Cyber Security & Digital Forensics',
              'B.Sc IT in Cloud Automation',
              'B.Sc IT in Data Analytics',
              'B.Sc IT in Animation, VFX & Game Design',
              'B.Sc IT in Blockchain Technology',
              'B.Sc IT in Software & Mobile App Development'
            ];
          }

          const progMsg = "Please select your preferred program.";
          await sendInteractiveOptions(progMsg, programs);
        }
        else {
          const errMsg = "Invalid option. Please select program category:";
          await sendInteractiveOptions(errMsg, categories);
        }

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_PROGRAM_CATEGORY_GRAD
      // ==========================================
      if (currentState === 'ask_program_category_grad') {
        const programMap = settings?.automation?.aiPrompts?.programMap || {};
        const contactQual = contact.qualification || 'Graduation';
        const matchedQualKey = Object.keys(programMap).find(k => k.toLowerCase().trim() === contactQual.toLowerCase().trim()) || 'Graduate';
        const categories = programMap[matchedQualKey] ? Object.keys(programMap[matchedQualKey]) : ['Master Traditional Program', 'Master Trending Program'];

        let selectedCategory = '';
        if (replyValue) {
          const matchBtn = replyValue.match(/btn_(\d+)/i);
          const matchLst = replyValue.match(/list_(\d+)/i);
          const idx = matchBtn ? parseInt(matchBtn[1]) : (matchLst ? parseInt(matchLst[1]) : -1);
          if (idx >= 0 && idx < categories.length) {
            selectedCategory = categories[idx];
          }
        }
        if (!selectedCategory) {
          const matchIdx = categories.findIndex(cat => {
            const cleanCat = cat.toLowerCase().trim();
            return normalizedInput === cleanCat || normalizedInput.includes(cleanCat);
          });
          if (matchIdx !== -1) {
            selectedCategory = categories[matchIdx];
          }
        }

        const isTraditional = selectedCategory ? selectedCategory.toLowerCase().includes('trad') : (normalizedInput.includes('traditional') || normalizedReply === 'btn_0' || normalizedReply.includes('traditional'));
        const isTrending = selectedCategory ? selectedCategory.toLowerCase().includes('trend') : (normalizedInput.includes('trending') || normalizedReply === 'btn_1' || normalizedReply.includes('trending'));

        if (isTraditional) {
          const streamName = selectedCategory || 'Master Traditional Program';
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              selectedStream: streamName,
              'flowVariables.selectedStream': streamName,
              currentFlowStep: 'ask_program_traditional_grad'
            }
          });

          let programs = programMap[matchedQualKey]?.[streamName] || ['M.Com', 'MBA', 'M.Tech', 'M.Sc', 'Other'];
          if (!programs || programs.length === 0) {
            programs = ['M.Com', 'MBA', 'M.Tech', 'M.Sc', 'Other'];
          }

          const progMsg = "Please select your preferred master program.";
          await sendInteractiveOptions(progMsg, programs);
        }
        else if (isTrending) {
          const streamName = selectedCategory || 'Master Trending Program';
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              selectedStream: streamName,
              'flowVariables.selectedStream': streamName,
              currentFlowStep: 'ask_program_trending_grad'
            }
          });

          let programs = programMap[matchedQualKey]?.[streamName] || [
            'M.Sc IT in Cyber Security & Digital Forensics',
            'M.Sc IT in Cloud Automation',
            'M.Sc IT in Data Analytics',
            'M.Sc IT in Animation, VFX & Game Design',
            'M.Sc IT in Blockchain Technology',
            'M.Sc IT in Software & Mobile App Development'
          ];
          if (!programs || programs.length === 0) {
            programs = [
              'M.Sc IT in Cyber Security & Digital Forensics',
              'M.Sc IT in Cloud Automation',
              'M.Sc IT in Data Analytics',
              'M.Sc IT in Animation, VFX & Game Design',
              'M.Sc IT in Blockchain Technology',
              'M.Sc IT in Software & Mobile App Development'
            ];
          }

          const progMsg = "Please select your preferred master program.";
          await sendInteractiveOptions(progMsg, programs);
        }
        else {
          const errMsg = "Invalid option. Please select program category:";
          await sendInteractiveOptions(errMsg, categories);
        }

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_PROGRAM_TRADITIONAL_12TH
      // ==========================================
      if (currentState === 'ask_program_traditional_12th') {
        const programMap = settings?.automation?.aiPrompts?.programMap || {};
        const contactQual = contact.qualification || '12th Pass';
        const matchedQualKey = Object.keys(programMap).find(k => k.toLowerCase().trim() === contactQual.toLowerCase().trim()) || '12th Pass';
        const streamName = contact.selectedStream || 'Traditional Program';

        let traditional12thOpts = programMap[matchedQualKey]?.[streamName] || ['B.Com', 'BBA', 'B.Tech', 'B.Sc', 'Other'];
        if (!traditional12thOpts || traditional12thOpts.length === 0) {
          traditional12thOpts = ['B.Com', 'BBA', 'B.Tech', 'B.Sc', 'Other'];
        }

        let selectedProg = messageText.trim();

        if (replyValue && replyValue.startsWith('list_')) {
          const idx = parseInt(replyValue.split('_')[1]);
          if (idx >= 0 && idx < traditional12thOpts.length) {
            selectedProg = traditional12thOpts[idx];
          }
        }

        if (selectedProg.toLowerCase() === 'other' || normalizedInput === 'other' || replyValue?.toLowerCase().includes('other')) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              currentFlowStep: 'ask_custom_program'
            }
          });

          const customProgMsg = "Please type your preferred program.";
          const res = await waService.sendTextMessage(contact.phone, customProgMsg);
          await saveAndEmit('text', customProgMsg, res);
        }
        else {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              selectedProgram: selectedProg,
              'flowVariables.program': selectedProg
            }
          });

          const fresh = await ContactModel.findOne({ phone: contact.phone });
          const nameVal = fresh.flowVariables?.name || fresh.name || 'Student';
          await this.transitionToNextStepAfter('PROGRAM_SELECTION', contact, ContactModel, steps, settings, waService, nameVal, io);
        }

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_PROGRAM_TRENDING_12TH
      // ==========================================
      if (currentState === 'ask_program_trending_12th') {
        const programMap = settings?.automation?.aiPrompts?.programMap || {};
        const contactQual = contact.qualification || '12th Pass';
        const matchedQualKey = Object.keys(programMap).find(k => k.toLowerCase().trim() === contactQual.toLowerCase().trim()) || '12th Pass';
        const streamName = contact.selectedStream || 'Trending Program';

        let trending12thOpts = programMap[matchedQualKey]?.[streamName] || [
          'B.Sc IT in Cyber Security & Digital Forensics',
          'B.Sc IT in Cloud Automation',
          'B.Sc IT in Data Analytics',
          'B.Sc IT in Animation, VFX & Game Design',
          'B.Sc IT in Blockchain Technology',
          'B.Sc IT in Software & Mobile App Development'
        ];
        if (!trending12thOpts || trending12thOpts.length === 0) {
          trending12thOpts = [
            'B.Sc IT in Cyber Security & Digital Forensics',
            'B.Sc IT in Cloud Automation',
            'B.Sc IT in Data Analytics',
            'B.Sc IT in Animation, VFX & Game Design',
            'B.Sc IT in Blockchain Technology',
            'B.Sc IT in Software & Mobile App Development'
          ];
        }

        let selectedProg = messageText.trim();

        if (replyValue && replyValue.startsWith('list_')) {
          const idx = parseInt(replyValue.split('_')[1]);
          if (idx >= 0 && idx < trending12thOpts.length) {
            selectedProg = trending12thOpts[idx];
          }
        }

        await ContactModel.updateOne({ phone: contact.phone }, {
          $set: {
            selectedProgram: selectedProg,
            'flowVariables.program': selectedProg
          }
        });

        const fresh = await ContactModel.findOne({ phone: contact.phone });
        const nameVal = fresh.flowVariables?.name || fresh.name || 'Student';
        await this.transitionToNextStepAfter('PROGRAM_SELECTION', contact, ContactModel, steps, settings, waService, nameVal, io);

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_PROGRAM_TRADITIONAL_GRAD
      // ==========================================
      if (currentState === 'ask_program_traditional_grad') {
        const programMap = settings?.automation?.aiPrompts?.programMap || {};
        const contactQual = contact.qualification || 'Graduation';
        const matchedQualKey = Object.keys(programMap).find(k => k.toLowerCase().trim() === contactQual.toLowerCase().trim()) || 'Graduate';
        const streamName = contact.selectedStream || 'Master Traditional Program';

        let traditionalGradOpts = programMap[matchedQualKey]?.[streamName] || ['M.Com', 'MBA', 'M.Tech', 'M.Sc', 'Other'];
        if (!traditionalGradOpts || traditionalGradOpts.length === 0) {
          traditionalGradOpts = ['M.Com', 'MBA', 'M.Tech', 'M.Sc', 'Other'];
        }

        let selectedProg = messageText.trim();

        if (replyValue && replyValue.startsWith('list_')) {
          const idx = parseInt(replyValue.split('_')[1]);
          if (idx >= 0 && idx < traditionalGradOpts.length) {
            selectedProg = traditionalGradOpts[idx];
          }
        }

        if (selectedProg.toLowerCase() === 'other' || normalizedInput === 'other' || replyValue?.toLowerCase().includes('other')) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              currentFlowStep: 'ask_custom_program'
            }
          });

          const customProgMsg = "Please type your preferred master program.";
          const res = await waService.sendTextMessage(contact.phone, customProgMsg);
          await saveAndEmit('text', customProgMsg, res);
        }
        else {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              selectedProgram: selectedProg,
              'flowVariables.program': selectedProg
            }
          });

          const fresh = await ContactModel.findOne({ phone: contact.phone });
          const nameVal = fresh.flowVariables?.name || fresh.name || 'Student';
          await this.transitionToNextStepAfter('PROGRAM_SELECTION', contact, ContactModel, steps, settings, waService, nameVal, io);
        }

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_PROGRAM_TRENDING_GRAD
      // ==========================================
      if (currentState === 'ask_program_trending_grad') {
        const programMap = settings?.automation?.aiPrompts?.programMap || {};
        const contactQual = contact.qualification || 'Graduation';
        const matchedQualKey = Object.keys(programMap).find(k => k.toLowerCase().trim() === contactQual.toLowerCase().trim()) || 'Graduate';
        const streamName = contact.selectedStream || 'Master Trending Program';

        let trendingGradOpts = programMap[matchedQualKey]?.[streamName] || [
          'M.Sc IT in Cyber Security & Digital Forensics',
          'M.Sc IT in Cloud Automation',
          'M.Sc IT in Data Analytics',
          'M.Sc IT in Animation, VFX & Game Design',
          'M.Sc IT in Blockchain Technology',
          'M.Sc IT in Software & Mobile App Development'
        ];
        if (!trendingGradOpts || trendingGradOpts.length === 0) {
          trendingGradOpts = [
            'M.Sc IT in Cyber Security & Digital Forensics',
            'M.Sc IT in Cloud Automation',
            'M.Sc IT in Data Analytics',
            'M.Sc IT in Animation, VFX & Game Design',
            'M.Sc IT in Blockchain Technology',
            'M.Sc IT in Software & Mobile App Development'
          ];
        }

        let selectedProg = messageText.trim();

        if (replyValue && replyValue.startsWith('list_')) {
          const idx = parseInt(replyValue.split('_')[1]);
          if (idx >= 0 && idx < trendingGradOpts.length) {
            selectedProg = trendingGradOpts[idx];
          }
        }

        await ContactModel.updateOne({ phone: contact.phone }, {
          $set: {
            selectedProgram: selectedProg,
            'flowVariables.program': selectedProg
          }
        });

        const fresh = await ContactModel.findOne({ phone: contact.phone });
        const nameVal = fresh.flowVariables?.name || fresh.name || 'Student';
        await this.transitionToNextStepAfter('PROGRAM_SELECTION', contact, ContactModel, steps, settings, waService, nameVal, io);

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_CALL_TIME
      // ==========================================
      if (currentState === 'ask_call_time') {
        const callTimeOpts = [
          'Immediate',
          'Within 2 hours',
          'Morning (9am - 12pm)',
          'Afternoon (12pm - 4pm)',
          'Evening (4pm - 7pm)'
        ];
        let timeVal = messageText.trim();

        if (replyValue && replyValue.startsWith('list_')) {
          const idx = parseInt(replyValue.split('_')[1]);
          if (idx >= 0 && idx < callTimeOpts.length) {
            timeVal = callTimeOpts[idx];
          }
        }

        // Fetch fresh contact details to construct summary
        const fresh = await ContactModel.findOne({ phone: contact.phone });
        const name = fresh.flowVariables?.name || fresh.name || 'Student';
        const qual = fresh.flowVariables?.qualification || fresh.qualification || '';
        const prog = fresh.flowVariables?.program || fresh.selectedProgram || '';

        await ContactModel.updateOne({ phone: contact.phone }, {
          $set: {
            preferredCallTime: timeVal,
            'flowVariables.time': timeVal,
            currentFlowStep: 'ask_confirmation'
          }
        });

        const summaryMsg = `Please confirm your details:\n\nName: ${name}\nQualification: ${qual}\nProgram: ${prog}\nPreferred Call Time: ${timeVal}\n\nIs this correct?`;
        await sendInteractiveOptions(summaryMsg, ['Yes', 'Edit']);

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_CONFIRMATION
      // ==========================================
      if (currentState === 'ask_confirmation') {
        const isYes = normalizedInput === 'yes' || normalizedReply === 'btn_0' || normalizedReply.includes('yes');
        const isEdit = normalizedInput === 'edit' || normalizedReply === 'btn_1' || normalizedReply.includes('edit');

        if (isYes) {
          const fresh = await ContactModel.findOne({ phone: contact.phone });
          const name = fresh.flowVariables?.name || fresh.name;
          const qual = fresh.flowVariables?.qualification || fresh.qualification;
          const prog = fresh.flowVariables?.program || fresh.selectedProgram;
          const time = fresh.flowVariables?.time || fresh.preferredCallTime;

          // 1. Assign Counsellor / Telecaller automatically if configured
          let assignedAgentId = null;
          if (settings?.crm?.autoAssignment) {
            try {
              assignedAgentId = await assignmentService.getNextAgentForTenant(tenantId);
            } catch (err) {
              console.error('[PRD] Handoff assignment failed:', err);
            }
          }

          // 2. Insert Lead record into the dynamic tenant CRM DB
          try {
            await LeadModel.create({
              name,
              phone: contact.phone,
              qualification: qual,
              selectedProgram: prog,
              preferredCallTime: time,
              status: 'QUALIFIED',
              assignedAgent: assignedAgentId,
              leadSource: 'AI Qualified'
            });

            // Trigger Real-time notifications and Alerts
            notificationService.sendAdminAlert(tenantId, {
              subject: 'New AI Qualified Lead 🎓',
              text: `Lead *${name}* (${contact.phone}) qualified.\nQual: ${qual}\nProg: ${prog}\nTime: ${time}`
            });
          } catch (leadErr) {
            console.error('[PRD] Failed to save Lead to CRM DB:', leadErr);
          }

          // 3. Update Contact fields
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              status: 'NEW LEAD',
              qualification: qual,
              selectedStream: fresh.selectedStream,
              selectedProgram: prog,
              preferredCallTime: time,
              currentFlowStep: 'ask_additional_help'
            }
          });

          // 4. Send Thank You Message (Dynamic from builder steps)
          const thankYouStep = steps.find(s => s.id === 'thank_you' || s.type === 'CUSTOM_MESSAGE');
          let thankYouMsg = thankYouStep?.message || thankYouStep?.text || `Thank you ${name} 😊\n\nYour counselling request has been submitted successfully.\nOur counsellor will contact you at your preferred time.`;
          thankYouMsg = this.populatePlaceholders(thankYouMsg, fresh, name, qual, prog, time);

          const thankYouMedia = thankYouStep?.image ? this.makeAbsolute(thankYouStep.image) : '';
          let resTY;
          if (thankYouMedia) {
            try {
              resTY = await waService.sendMedia(contact.phone, 'image', null, thankYouMsg, thankYouMedia);
              await saveAndEmit('image', thankYouMsg, resTY);
            } catch (tyErr) {
              resTY = await waService.sendTextMessage(contact.phone, thankYouMsg);
              await saveAndEmit('text', thankYouMsg, resTY);
            }
          } else {
            resTY = await waService.sendTextMessage(contact.phone, thankYouMsg);
            await saveAndEmit('text', thankYouMsg, resTY);
          }

          // 5. Sequence preservation sleep
          await this.sleep(1500);

          // 6. Ask Additional Help question
          const helpMsg = "Do you need any other help?";
          await sendInteractiveOptions(helpMsg, ['Yes', 'No']);
        }
        else if (isEdit) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              currentFlowStep: 'ask_qualification'
            }
          });

          const Settings = require('../models/core/Settings');
          const settings = await Settings.findOne({ tenantId });
          let options = settings?.automation?.aiPrompts?.qualificationOptions || ['12th Pass', 'Graduation', 'Other'];
          if (!options || options.length === 0 || (options.length === 1 && !options[0])) {
            options = ['12th Pass', 'Graduation', 'Other'];
          }

          const editMsg = "Let's re-enter your details. Please select your qualification.";
          await sendInteractiveOptions(editMsg, options);
        }
        else {
          // Construct confirmation summary again on invalid input
          const fresh = await ContactModel.findOne({ phone: contact.phone });
          const name = fresh.flowVariables?.name || fresh.name || 'Student';
          const qual = fresh.flowVariables?.qualification || fresh.qualification || '';
          const prog = fresh.flowVariables?.program || fresh.selectedProgram || '';
          const time = fresh.flowVariables?.time || fresh.preferredCallTime || '';

          const summaryMsg = `Invalid option. Please confirm your details:\n\nName: ${name}\nQualification: ${qual}\nProgram: ${prog}\nPreferred Call Time: ${time}\n\nIs this correct?`;
          await sendInteractiveOptions(summaryMsg, ['Yes', 'Edit']);
        }

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_ADDITIONAL_HELP
      // ==========================================
      if (currentState === 'ask_additional_help') {
        const isYes = normalizedInput === 'yes' || normalizedReply === 'btn_0' || normalizedReply.includes('yes');
        const isNo = normalizedInput === 'no' || normalizedReply === 'btn_1' || normalizedReply.includes('no');

        if (isYes) {
          const connectMsg = "Connecting you with our counsellor…";
          const res = await waService.sendTextMessage(contact.phone, connectMsg);
          await saveAndEmit('text', connectMsg, res);

          // Pause chatbot so live agent takes over
          await ContactModel.updateOne({ phone: contact.phone }, { $set: { isBotPaused: true } });

          // Send admin handoff alert
          notificationService.sendAdminAlert(tenantId, {
            subject: 'Human Handoff Requested 🙋‍♂️',
            text: `Lead *${contact.name || contact.phone}* requested a human agent.`
          });

          // Reset flow session
          await this.clearPRDFlowSession(tenantId, contact.phone, ContactModel);
        }
        else if (isNo) {
          const Settings = require('../models/core/Settings');
          const settingsObj = await Settings.findOne({ tenantId });
          const uniName = settingsObj?.workspace?.name || "our institution";
          const goodbyeMsg = `Thank you for contacting ${uniName}.\nHave a great day!`;
          const res = await waService.sendTextMessage(contact.phone, goodbyeMsg);
          await saveAndEmit('text', goodbyeMsg, res);

          // Reset flow session
          await this.clearPRDFlowSession(tenantId, contact.phone, ContactModel);
        }
        else {
          const helpMsg = "Invalid option. Do you need any other help?";
          await sendInteractiveOptions(helpMsg, ['Yes', 'No']);
        }

        this.activeProcesses.delete(lockKey);
        return;
      }

    } catch (err) {
      console.error(`[PRD State Machine] ❌ Error in processStep:`, err);
    } finally {
      this.activeProcesses.delete(lockKey);
    }
  }

  populatePlaceholders(text, contact, name = '', qual = '', prog = '', time = '') {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/\{\{\s*name\s*\}\}/gi, name || contact.flowVariables?.name || contact.name || 'Student')
      .replace(/\{\{\s*contact\s*\}\}/gi, contact.phone || '')
      .replace(/\{\{\s*qualification\s*\}\}/gi, qual || contact.flowVariables?.qualification || contact.qualification || '')
      .replace(/\{\{\s*program\s*\}\}/gi, prog || contact.flowVariables?.program || contact.selectedProgram || '')
      .replace(/\{\{\s*time\s*\}\}/gi, time || contact.flowVariables?.time || contact.preferredCallTime || '');
  }

  async transitionToNextStepAfter(completedTypeOrId, contact, ContactModel, steps, settings, waService, nameVal, io = null) {
    const MessageSchema = require('../models/tenant/Message');
    const { getTenantConnection } = require('../config/db');

    // 1. Find index of completed step
    let completedIdx = steps.findIndex(s => s.id === completedTypeOrId || s.type === completedTypeOrId);
    if (completedIdx === -1) {
      if (completedTypeOrId.includes('program')) {
        completedIdx = steps.findIndex(s => s.type === 'PROGRAM_SELECTION');
      } else if (completedTypeOrId.includes('qualification')) {
        completedIdx = steps.findIndex(s => s.type === 'QUALIFICATION');
      } else if (completedTypeOrId.includes('name')) {
        completedIdx = steps.findIndex(s => s.type === 'NAME_CAPTURE');
      } else if (completedTypeOrId.includes('call_time')) {
        completedIdx = steps.findIndex(s => s.type === 'CALL_TIME');
      }
    }

    const nextStep = (completedIdx !== -1 && completedIdx + 1 < steps.length) ? steps[completedIdx + 1] : null;

    if (!nextStep) {
      // Fallbacks if no next step exists in visual builder
      if (completedTypeOrId.includes('program') || completedTypeOrId === 'PROGRAM_SELECTION') {
        await ContactModel.updateOne({ phone: contact.phone }, { $set: { currentFlowStep: 'ask_call_time' } });
        const callTimeMsg = "What would be the best time for our counsellor to call you?";
        await this.sendInteractiveOptionsHelper(contact, waService, callTimeMsg, [
          'Immediate', 'Within 2 hours', 'Morning (9am - 12pm)', 'Afternoon (12pm - 4pm)', 'Evening (4pm - 7pm)'
        ]);
        return;
      }
      
      // Default to ask_confirmation
      await ContactModel.updateOne({ phone: contact.phone }, { $set: { currentFlowStep: 'ask_confirmation' } });
      const fresh = await ContactModel.findOne({ phone: contact.phone });
      const name = fresh.flowVariables?.name || fresh.name || 'Student';
      const qual = fresh.flowVariables?.qualification || fresh.qualification || '';
      const prog = fresh.flowVariables?.program || fresh.selectedProgram || '';
      const timeVal = fresh.flowVariables?.time || fresh.preferredCallTime || '';
      const summaryMsg = `Please confirm your details:\n\nName: ${name}\nQualification: ${qual}\nProgram: ${prog}\nPreferred Call Time: ${timeVal}\n\nIs this correct?`;
      await this.sendInteractiveOptionsHelper(contact, waService, summaryMsg, ['Yes', 'Edit']);
      return;
    }

    console.log(`[PRD Flow] 🔀 Transitioning dynamically from "${completedTypeOrId}" to "${nextStep.title}" (Type: ${nextStep.type}, ID: ${nextStep.id})`);

    if (nextStep.type === 'CALL_TIME') {
      await ContactModel.updateOne({ phone: contact.phone }, { $set: { currentFlowStep: 'ask_call_time' } });
      const callTimeMsg = nextStep.message || nextStep.text || "What would be the best time for our counsellor to call you?";
      const buttons = (nextStep.buttons && nextStep.buttons.length > 0) ? nextStep.buttons : [
        'Immediate', 'Within 2 hours', 'Morning (9am - 12pm)', 'Afternoon (12pm - 4pm)', 'Evening (4pm - 7pm)'
      ];
      await this.sendInteractiveOptionsHelper(contact, waService, callTimeMsg, buttons);
    }
    else if (nextStep.type === 'CUSTOM_MESSAGE' || nextStep.type === 'SUCCESS_PROOF') {
      await ContactModel.updateOne({ phone: contact.phone }, { $set: { currentFlowStep: nextStep.id } });

      // Construct fresh values if available
      const fresh = await ContactModel.findOne({ phone: contact.phone });
      const qualVal = fresh.flowVariables?.qualification || fresh.qualification || '';
      const progVal = fresh.flowVariables?.program || fresh.selectedProgram || '';
      const timeVal = fresh.flowVariables?.time || fresh.preferredCallTime || '';

      let msg = nextStep.message || nextStep.text || '';
      msg = this.populatePlaceholders(msg, fresh, nameVal, qualVal, progVal, timeVal);

      const image = nextStep.image || '';
      const media = this.makeAbsolute(image);

      const saveAndEmit = async (type, payload, waResult) => {
        const tenantDb = getTenantConnection(settings.tenantId);
        const MessageModel = tenantDb.model('Message', MessageSchema);
        const msgId = waResult?.messages?.[0]?.id || `out_${Date.now()}`;
        const msgDoc = await MessageModel.create({ 
          contactId: contact._id, 
          messageId: msgId, 
          direction: 'OUTBOUND', 
          type, 
          content: payload, 
          status: 'SENT' 
        });
        if (io) io.to(settings.tenantId).emit('new_message', { ...msgDoc._doc, contact });
      };

      let resMsg;
      if (media) {
        try {
          resMsg = await waService.sendMedia(contact.phone, 'image', null, msg, media);
          await saveAndEmit('image', msg, resMsg);
        } catch (mediaErr) {
          resMsg = await waService.sendTextMessage(contact.phone, msg);
          await saveAndEmit('text', msg, resMsg);
        }
      } else {
        resMsg = await waService.sendTextMessage(contact.phone, msg);
        await saveAndEmit('text', msg, resMsg);
      }

      // If the custom step has interactive buttons, send them! Otherwise send a "Continue" button or wait for any text reply
      if (nextStep.buttons && nextStep.buttons.length > 0) {
        const buttonLabels = nextStep.buttons.map(b => typeof b === 'string' ? b : b.label);
        await this.sendInteractiveOptionsHelper(contact, waService, "Please select an option:", buttonLabels);
      } else {
        await this.sendInteractiveOptionsHelper(contact, waService, "Press below to proceed:", ["Continue ➡️"]);
      }
    }
    else if (nextStep.type === 'QUALIFICATION') {
      await ContactModel.updateOne({ phone: contact.phone }, { $set: { currentFlowStep: 'ask_qualification' } });
      const qualMsg = nextStep.message || nextStep.text || `Please select your qualification.`;
      let options = settings?.automation?.aiPrompts?.qualificationOptions || ['12th Pass', 'Graduation', 'Other'];
      await this.sendInteractiveOptionsHelper(contact, waService, qualMsg, options);
    }
    else if (nextStep.type === 'PROGRAM_SELECTION') {
      const fresh = await ContactModel.findOne({ phone: contact.phone });
      const q = fresh.qualification || '12th Pass';
      const isGrad = q.toLowerCase().includes('grad') || q.toLowerCase().includes('bachelor');
      await ContactModel.updateOne({ phone: contact.phone }, { 
        $set: { currentFlowStep: isGrad ? 'ask_program_category_grad' : 'ask_program_category_12th' } 
      });
      const catMsg = nextStep.message || nextStep.text || "Please select program category.";
      await this.sendInteractiveOptionsHelper(contact, waService, catMsg, isGrad ? ['Master Traditional Program', 'Master Trending Program'] : ['Traditional Program', 'Trending Program']);
    }
    else {
      await ContactModel.updateOne({ phone: contact.phone }, { $set: { currentFlowStep: 'ask_additional_help' } });
      const thankYouMsg = `Thank you ${nameVal} 😊\n\nYour request has been submitted. Our counselor will contact you.`;
      await waService.sendTextMessage(contact.phone, thankYouMsg);
    }
  }

  async sendInteractiveOptionsHelper(contact, waService, body, options) {
    if (options.length <= 3) {
      await waService.sendInteractiveButtonMessage(contact.phone, { body, buttons: options });
    } else {
      await waService.sendListMessage(contact.phone, {
        body,
        buttonText: 'View Options',
        sections: [{
          title: 'Available Options',
          rows: options.slice(0, 10).map((opt, i) => ({ id: `list_${i}`, title: opt.substring(0, 24) }))
        }]
      });
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
