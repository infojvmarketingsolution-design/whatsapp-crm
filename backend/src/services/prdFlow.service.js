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

        // 1. Display Welcome Image & Welcome Message + Name Request in a single unified post!
        let welcomeMsg = greetingStep?.message || greetingStep?.text || "Welcome to ABC Institute Admission Assistant 👋\nI’m here to help you choose the right program.";
        
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

        if (!welcomeMsg.toLowerCase().includes('enter your full name') && !welcomeMsg.toLowerCase().includes('may i know your name')) {
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
          catMsg = catMsg.replace(/\{\{name\}\}/gi, extractedName).replace(/\{\{contact\}\}/gi, contact.phone);

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
        qualMsg = qualMsg.replace(/\{\{name\}\}/gi, extractedName).replace(/\{\{contact\}\}/gi, contact.phone);

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
        const isTraditional = normalizedInput.includes('traditional') || normalizedReply === 'btn_0' || normalizedReply.includes('traditional');
        const isTrending = normalizedInput.includes('trending') || normalizedReply === 'btn_1' || normalizedReply.includes('trending');

        if (isTraditional) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              selectedStream: 'Traditional Program',
              'flowVariables.selectedStream': 'Traditional Program',
              currentFlowStep: 'ask_program_traditional_12th'
            }
          });

          const progMsg = "Please select your preferred program.";
          await sendInteractiveOptions(progMsg, ['B.Com', 'BBA', 'B.Tech', 'B.Sc', 'Other']);
        }
        else if (isTrending) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              selectedStream: 'Trending Program',
              'flowVariables.selectedStream': 'Trending Program',
              currentFlowStep: 'ask_program_trending_12th'
            }
          });

          const progMsg = "Please select your preferred program.";
          await sendInteractiveOptions(progMsg, [
            'B.Sc IT in Cyber Security & Digital Forensics',
            'B.Sc IT in Cloud Automation',
            'B.Sc IT in Data Analytics',
            'B.Sc IT in Animation, VFX & Game Design',
            'B.Sc IT in Blockchain Technology',
            'B.Sc IT in Software & Mobile App Development'
          ]);
        }
        else {
          const errMsg = "Invalid option. Please select program category:";
          await sendInteractiveOptions(errMsg, ['Traditional Program', 'Trending Program']);
        }

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_PROGRAM_CATEGORY_GRAD
      // ==========================================
      if (currentState === 'ask_program_category_grad') {
        const isTraditional = normalizedInput.includes('traditional') || normalizedReply === 'btn_0' || normalizedReply.includes('traditional');
        const isTrending = normalizedInput.includes('trending') || normalizedReply === 'btn_1' || normalizedReply.includes('trending');

        if (isTraditional) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              selectedStream: 'Master Traditional Program',
              'flowVariables.selectedStream': 'Master Traditional Program',
              currentFlowStep: 'ask_program_traditional_grad'
            }
          });

          const progMsg = "Please select your preferred master program.";
          await sendInteractiveOptions(progMsg, ['M.Com', 'MBA', 'M.Tech', 'M.Sc', 'Other']);
        }
        else if (isTrending) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              selectedStream: 'Master Trending Program',
              'flowVariables.selectedStream': 'Master Trending Program',
              currentFlowStep: 'ask_program_trending_grad'
            }
          });

          const progMsg = "Please select your preferred master program.";
          await sendInteractiveOptions(progMsg, [
            'M.Sc IT in Cyber Security & Digital Forensics',
            'M.Sc IT in Cloud Automation',
            'M.Sc IT in Data Analytics',
            'M.Sc IT in Animation, VFX & Game Design',
            'M.Sc IT in Blockchain Technology',
            'M.Sc IT in Software & Mobile App Development'
          ]);
        }
        else {
          const errMsg = "Invalid option. Please select program category:";
          await sendInteractiveOptions(errMsg, ['Master Traditional Program', 'Master Trending Program']);
        }

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_PROGRAM_TRADITIONAL_12TH
      // ==========================================
      if (currentState === 'ask_program_traditional_12th') {
        const traditional12thOpts = ['B.Com', 'BBA', 'B.Tech', 'B.Sc', 'Other'];
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
              'flowVariables.program': selectedProg,
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
        }

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_PROGRAM_TRENDING_12TH
      // ==========================================
      if (currentState === 'ask_program_trending_12th') {
        const trending12thOpts = [
          'B.Sc IT in Cyber Security & Digital Forensics',
          'B.Sc IT in Cloud Automation',
          'B.Sc IT in Data Analytics',
          'B.Sc IT in Animation, VFX & Game Design',
          'B.Sc IT in Blockchain Technology',
          'B.Sc IT in Software & Mobile App Development'
        ];
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
            'flowVariables.program': selectedProg,
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
      // STATE: ASK_PROGRAM_TRADITIONAL_GRAD
      // ==========================================
      if (currentState === 'ask_program_traditional_grad') {
        const traditionalGradOpts = ['M.Com', 'MBA', 'M.Tech', 'M.Sc', 'Other'];
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
              'flowVariables.program': selectedProg,
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
        }

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_PROGRAM_TRENDING_GRAD
      // ==========================================
      if (currentState === 'ask_program_trending_grad') {
        const trendingGradOpts = [
          'M.Sc IT in Cyber Security & Digital Forensics',
          'M.Sc IT in Cloud Automation',
          'M.Sc IT in Data Analytics',
          'M.Sc IT in Animation, VFX & Game Design',
          'M.Sc IT in Blockchain Technology',
          'M.Sc IT in Software & Mobile App Development'
        ];
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
            'flowVariables.program': selectedProg,
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

          // 4. Send Thank You Message
          const thankYouMsg = `Thank you ${name} 😊\n\nYour counselling request has been submitted successfully.\nOur counsellor will contact you at your preferred time.`;
          const resTY = await waService.sendTextMessage(contact.phone, thankYouMsg);
          await saveAndEmit('text', thankYouMsg, resTY);

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
          const goodbyeMsg = "Thank you for contacting ABC Institute.\nHave a great day!";
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
