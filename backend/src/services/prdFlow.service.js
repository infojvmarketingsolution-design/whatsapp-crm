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

const DEFAULT_PROGRAM_MAP = {
  "12th Pass": {
    "Trending Programs": ["B.Voc Cyber Security", "B.Voc Fintech", "B.Sc IT Ai & ML", "B.Sc IT Data Analytics"],
    "Traditional Programs": ["B.Com", "B.Tech", "BBA"]
  },
  "Graduation": {
    "Trending Programs": [
      "Cyber Security & Digital Forensics",
      "Cloud Automation",
      "Data Analytics",
      "Animation, VFX & Game Design",
      "Blockchain Technology",
      "Software & Mobile App Development"
    ],
    "Traditional Programs": [
      "M.Com",
      "MBA",
      "M.Tech",
      "M.Sc",
      "Other"
    ]
  }
};


class PRDFlowService {
  constructor() {
    this.DEFAULT_PRD_FLOW_STEPS = [
      { id: 'ask_name', type: 'NAME_CAPTURE', title: 'Greeting & Name Request', message: 'Welcome to Gandhinagar University 🎓\n\nWe’re excited to help you choose the right career path.\n\nMay I know your name?', image: 'https://wapipulse.com/uploads/prompts/tenant_demo_001/prompt_1774743344804.jpeg' },
      { id: 'qualification', type: 'QUALIFICATION', title: 'Qualification Request', message: 'Nice to meet you {{name}} 😊\n\nPlease select your qualification.' },
      { id: 'program', type: 'PROGRAM_SELECTION', title: 'Program Selection', message: 'Please select your preferred program category.', categoryMessage: 'Please select program category.' },
      { id: 'call_time', type: 'CALL_TIME', title: 'Consultation Call', message: 'Excellent choice 🚀\n\nWhen should our counselor contact you?', buttons: ['Morning', 'Afternoon', 'Evening'] },
      { id: 'thank_you', type: 'CUSTOM_MESSAGE', title: 'Thank You Message', message: 'Thank you {{name}} 🙌\n\n🎓 Qualification: {{qualification}}\n📘 Program: {{program}}\n⏰ Time: {{time}}\n\nOur counselor will call you at your preferred time 📞\n\nThank you for your time, {{name}} 😊' }
    ];
    this.activeProcesses = new Set();
  }

  sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  getMatchedQualificationKey(programMap, qualification) {
    if (!programMap || !qualification) return null;
    const qualLower = qualification.toLowerCase().trim();
    const directMatch = Object.keys(programMap).find(k => k.toLowerCase().trim() === qualLower);
    if (directMatch) return directMatch;
    let mappedOption = qualLower;
    if (mappedOption.includes('bachelor')) mappedOption = '12th pass';
    else if (mappedOption.includes('master')) mappedOption = 'graduate';
    const mappedMatch = Object.keys(programMap).find(k => k.toLowerCase().trim() === mappedOption);
    if (mappedMatch) return mappedMatch;
    return Object.keys(programMap).find(k => {
      const cleanK = k.toLowerCase().trim();
      return cleanK.includes(mappedOption) || mappedOption.includes(cleanK) ||
             (mappedOption.includes('grad') && cleanK.includes('grad'));
    });
  }

  makeAbsolute(url) {
    if (!url || typeof url !== 'string' || url.trim() === '') return '';
    if (url.toLowerCase().endsWith('.webp') || url.toLowerCase().includes('.webp')) {
      // Meta Cloud API doesn't support WebP. Proxy and convert to standard JPG on the fly!
      if (url.startsWith('http')) {
        return `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=jpg&q=90`;
      }
    }
    if (url.startsWith('http') || /^\d+$/.test(url)) {
      if (url.includes('localhost') || url.includes('127.0.0.1')) return '';
      return url;
    }
    const baseUrl = (process.env.BASE_URL || 'https://wapipulse.com').replace(/\/$/, '');
    if (!baseUrl || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      return '';
    }
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
      console.log('[PRD FLOW DEBUG] Loaded steps count:', steps.length);
      const greetingStep = steps.find(s => s.type === 'GREETING') || steps.find(s => s.type === 'NAME_CAPTURE');
      if (greetingStep) {
         console.log('[PRD FLOW DEBUG] Greeting step buttons:', JSON.stringify(greetingStep.buttons, null, 2));
      }
      let greetingImage = '';
      if (greetingStep) {
        if (greetingStep.image === undefined) {
          greetingImage = aiPrompts.greetingImage || '';
        } else {
          greetingImage = greetingStep.image || '';
        }
      } else {
        greetingImage = aiPrompts.greetingImage || '';
      }

      // Default demo fallback only if they have absolutely no custom steps at all
      if (!greetingImage && (!steps || steps.length === 0)) {
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
        const optionStrings = options.map(opt => {
          if (typeof opt === 'string') return opt;
          if (opt && typeof opt === 'object') return opt.label || opt.title || '';
          return '';
        });

        const hasLongOption = optionStrings.some(opt => opt.length > 20);
        if (options.length <= 3 && !hasLongOption) {
          const res = await waService.sendInteractiveButtonMessage(contact.phone, { body, buttons: optionStrings });
          await saveAndEmit('interactive', body, res);
        } else {
          const res = await waService.sendListMessage(contact.phone, {
            body,
            buttonText: 'View Options',
            sections: [{
              title: 'Available Options',
              rows: options.slice(0, 10).map((opt, i) => {
                if (typeof opt === 'string') {
                  return {
                    id: `list_${i}`,
                    title: opt.substring(0, 24),
                    description: opt.length > 24 ? opt.substring(0, 72) : undefined
                  };
                } else {
                  const title = (opt?.label || opt?.title || '').trim().substring(0, 24);
                  const desc = (opt?.description || opt?.text || '').trim().substring(0, 72);
                  return {
                    id: `list_${i}`,
                    title: title || `Option ${i+1}`,
                    description: desc || undefined
                  };
                }
              })
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
      const customStepIndex = steps.findIndex(s => s.id === currentState && s.type !== 'NAME_CAPTURE' && s.type !== 'QUALIFICATION' && s.type !== 'PROGRAM_SELECTION' && s.type !== 'CALL_TIME');
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
        


        const nameStep = steps.find(s => s.type === 'NAME_CAPTURE');
        const hasSeparateNameCard = !!nameStep && greetingStep?.type === 'GREETING' && steps.indexOf(greetingStep) < steps.indexOf(nameStep);

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
                let url = (btn.value || '').trim();
                let label = (btn.label || '').trim();
                
                // Smart Heal: If value is stale ('option') or empty, and label is a URL, swap them!
                if ((!url || url === 'option' || url === 'reply') && (label.startsWith('http') || label.includes('.'))) {
                  url = label;
                  label = 'Open Website';
                }
                if (!url) {
                  url = label;
                  label = 'Open Website';
                }
                
                let title = label || 'Open Website';
                if (url && !url.startsWith('http')) {
                  url = `https://${url}`;
                }
                let bodyText = (btn.text || 'Official Website:').trim();
                const resCta = await waService.sendCtaMessage(contact.phone, {
                  type: 'url',
                  body: bodyText,
                  title: title,
                  value: url
                });
                await saveAndEmit('interactive', title, resCta);
              } else if (btn.type === 'call') {
                let phone = (btn.value || '').trim();
                let label = (btn.label || '').trim();
                
                // Smart Heal: If phone is stale ('option') or empty, and label contains digits, swap them!
                if ((!phone || phone === 'option' || phone === 'reply') && /\d/.test(label)) {
                  phone = label;
                  label = 'Call Counselor';
                }
                if (!phone) {
                  phone = label;
                  label = 'Call Counselor';
                }
                
                let title = label || 'Call Counselor';
                let bodyText = (btn.text || 'Hotline Support:').trim();
                const resBtn = await waService.sendInteractiveButtonMessage(contact.phone, {
                  body: `${bodyText}\n📞 ${phone}`,
                  buttons: [title.substring(0, 20)]
                });
                await saveAndEmit('interactive', title, resBtn);
              } else if (btn.type === 'reply') {
                let bodyText = (btn.text || 'Selected Option:').trim();
                const resBtn = await waService.sendInteractiveButtonMessage(contact.phone, {
                  body: bodyText,
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
        
        // Check if the input matches any button labels from the greeting step
        const btnLabels = greetingStep?.buttons?.map(b => (b.label || b.title || '').toLowerCase().trim()) || [];
        if (btnLabels.includes(nameInput.toLowerCase())) {
          console.log(`[PRD] User clicked a button "${nameInput}" instead of entering name.`);
          const askNameMsg = "Please enter your full name to proceed.";
          const res = await waService.sendTextMessage(contact.phone, askNameMsg);
          await saveAndEmit('text', askNameMsg, res);
          this.activeProcesses.delete(lockKey);
          return;
        }

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

        // Fetch settings dynamically
        const Settings = require('../models/core/Settings');
        const settings = await Settings.findOne({ tenantId });
        const prdFlowSteps = settings?.automation?.aiPrompts?.prdFlowSteps || [];

        // Save name to database immediately
        await ContactModel.updateOne({ phone: contact.phone }, {
          $set: {
            name: extractedName,
            'flowVariables.name': extractedName
          }
        });

        // Trigger dynamic transition to next step after NAME_CAPTURE
        await this.transitionToNextStepAfter('NAME_CAPTURE', contact, ContactModel, prdFlowSteps, settings, waService, extractedName, io);
        
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

        let selectedOption = '';
        if (replyValue) {
          const matchBtn = replyValue.match(/btn_(\d+)/i);
          const matchLst = replyValue.match(/list_(\d+)/i);
          const idx = matchBtn ? parseInt(matchBtn[1]) : (matchLst ? parseInt(matchLst[1]) : -1);
          if (idx >= 0 && idx < options.length) {
            const opt = options[idx];
            selectedOption = typeof opt === 'string' ? opt : (opt?.description || opt?.label || '');
          }
        }
        if (!selectedOption) {
          const matchIdx = options.findIndex(opt => {
            const cleanOpt = typeof opt === 'string'
              ? opt.toLowerCase().trim()
              : (opt?.description || opt?.label || '').toLowerCase().trim();
            const cleanLabel = typeof opt === 'string'
              ? ''
              : (opt?.label || '').toLowerCase().trim();
            return normalizedInput === cleanOpt || normalizedInput.includes(cleanOpt) ||
                   (cleanLabel && (normalizedInput === cleanLabel || normalizedInput.includes(cleanLabel)));
          });
          if (matchIdx !== -1) {
            const opt = options[matchIdx];
            selectedOption = typeof opt === 'string' ? opt : (opt?.description || opt?.label || '');
          }
        }

        // Fallbacks
        if (!selectedOption) {
          const optStrings = options.map(opt => typeof opt === 'string' ? opt : (opt?.description || opt?.label || ''));
          if (normalizedInput.includes('12') || normalizedInput.includes('twelfth')) selectedOption = optStrings.find(o => o.toLowerCase().includes('12')) || '12th Pass';
          else if (normalizedInput.includes('grad') || normalizedInput.includes('bachelor') || normalizedInput.includes('degree')) selectedOption = optStrings.find(o => o.toLowerCase().includes('grad') || o.toLowerCase().includes('bach')) || 'Graduation';
          else if (normalizedInput.includes('diploma')) selectedOption = optStrings.find(o => o.toLowerCase().includes('diploma')) || 'Diploma';
          else if (normalizedInput.includes('master') || normalizedInput.includes('postgrad')) selectedOption = optStrings.find(o => o.toLowerCase().includes('master')) || 'Master Completed';
          else if (normalizedInput.includes('10') || normalizedInput.includes('tenth') || normalizedInput.includes('ssc')) selectedOption = optStrings.find(o => o.toLowerCase().includes('10')) || '10th Pass';
          else if (normalizedInput.includes('working') || normalizedInput.includes('professional')) selectedOption = optStrings.find(o => o.toLowerCase().includes('working') || o.toLowerCase().includes('prof')) || 'Working Professional';
        }

        if (!selectedOption) {
          const optStrings = options.map(opt => typeof opt === 'string' ? opt : (opt?.description || opt?.label || ''));
          if (normalizedInput === 'other' || normalizedReply.includes('other')) {
            selectedOption = 'Other';
          } else {
            selectedOption = optStrings.find(o => o.toLowerCase().includes('other')) || optStrings[0] || '12th Pass';
          }
        }

        // Check if selectedOption is 'Other'
        if (selectedOption.toLowerCase() === 'other') {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              qualification: 'Other',
              'flowVariables.qualification': 'Other',
              currentFlowStep: 'ask_other_qualification'
            }
          });
          const otherQualMsg = "Please type your qualification.";
          const res = await waService.sendTextMessage(contact.phone, otherQualMsg);
          await saveAndEmit('text', otherQualMsg, res);
          this.activeProcesses.delete(lockKey);
          return;
        }

        let programMap = settings?.automation?.aiPrompts?.programMap;
        if (!programMap || Object.keys(programMap).length === 0) programMap = DEFAULT_PROGRAM_MAP;

        const matchedQualKey = this.getMatchedQualificationKey(programMap, selectedOption);

        if (matchedQualKey && programMap[matchedQualKey]) {
          const categories = Object.keys(programMap[matchedQualKey]).filter(k => !k.startsWith('_') && k !== 'categoryMessage');
          if (categories.length === 1) {
            // Skip category selection if only 1 category
            const streamName = categories[0];
            await ContactModel.updateOne({ phone: contact.phone }, {
              $set: {
                qualification: selectedOption,
                'flowVariables.qualification': selectedOption,
                selectedStream: streamName,
                'flowVariables.selectedStream': streamName,
                currentFlowStep: 'ask_program'
              }
            });
            const val = programMap[matchedQualKey][streamName];
            const programs = (val && typeof val === 'object' && !Array.isArray(val)) ? (val.programs || val.courses || []) : (val || []);
            const progMsg = "Please select your preferred program.";
            await sendInteractiveOptions(progMsg, programs);
          } else if (categories.length > 1) {
            await ContactModel.updateOne({ phone: contact.phone }, {
              $set: {
                qualification: selectedOption,
                'flowVariables.qualification': selectedOption,
                currentFlowStep: 'ask_program_category'
              }
            });
            const progStep = steps.find(s => s.type === 'PROGRAM_SELECTION');
            let catMsg = programMap[matchedQualKey]?._categoryMessage || programMap[matchedQualKey]?.categoryMessage || progStep?.categoryMessage || progStep?.message || progStep?.text || "Please select program category.";
            catMsg = this.populatePlaceholders(catMsg, contact, contact.flowVariables?.name || contact.name || 'Student');

            const categoryOptions = categories.map(key => {
              const val = programMap[matchedQualKey][key];
              if (val && typeof val === 'object' && !Array.isArray(val)) {
                return {
                  label: val.label || key,
                  description: val.description || ''
                };
              }
              return key;
            });

            await sendInteractiveOptions(catMsg, categoryOptions);
          } else {
             // No categories, ask custom
             await ContactModel.updateOne({ phone: contact.phone }, {
              $set: {
                qualification: selectedOption,
                'flowVariables.qualification': selectedOption,
                currentFlowStep: 'ask_custom_program'
              }
            });
            const customMsg = "Please type your preferred program.";
            const res = await waService.sendTextMessage(contact.phone, customMsg);
            await saveAndEmit('text', customMsg, res);
          }
        } else {
          // Qualification not found in map, ask custom
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              qualification: selectedOption,
              'flowVariables.qualification': selectedOption,
              currentFlowStep: 'ask_custom_program'
            }
          });
          const customMsg = `You selected: ${selectedOption}. Please type your preferred program.`;
          const res = await waService.sendTextMessage(contact.phone, customMsg);
          await saveAndEmit('text', customMsg, res);
        }

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_OTHER_QUALIFICATION
      // ==========================================
      if (currentState === 'ask_other_qualification') {
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
      // STATE: ASK_PROGRAM_CATEGORY
      // ==========================================
      if (currentState === 'ask_program_category') {
        let programMap = settings?.automation?.aiPrompts?.programMap;
        if (!programMap || Object.keys(programMap).length === 0) programMap = DEFAULT_PROGRAM_MAP;

        const contactQual = contact.qualification || '';
        const matchedQualKey = this.getMatchedQualificationKey(programMap, contactQual);

        const categories = matchedQualKey && programMap[matchedQualKey] 
          ? Object.keys(programMap[matchedQualKey]).filter(k => !k.startsWith('_') && k !== 'categoryMessage') 
          : [];

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
            const val = programMap[matchedQualKey][cat];
            const label = (val && typeof val === 'object' && !Array.isArray(val)) ? (val.label || cat) : cat;
            const description = (val && typeof val === 'object' && !Array.isArray(val)) ? (val.description || '') : '';
            const cleanCat = cat.toLowerCase().trim();
            const cleanLabel = label.toLowerCase().trim();
            const cleanDesc = description.toLowerCase().trim();
            return normalizedInput === cleanCat || normalizedInput.includes(cleanCat) ||
                   normalizedInput === cleanLabel || normalizedInput.includes(cleanLabel) ||
                   (cleanDesc && (normalizedInput === cleanDesc || normalizedInput.includes(cleanDesc)));
          });
          if (matchIdx !== -1) {
            selectedCategory = categories[matchIdx];
          }
        }

        if (selectedCategory) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              selectedStream: selectedCategory,
              'flowVariables.selectedStream': selectedCategory,
              currentFlowStep: 'ask_program'
            }
          });

          const val = programMap[matchedQualKey][selectedCategory];
          const programs = (val && typeof val === 'object' && !Array.isArray(val)) ? (val.programs || val.courses || []) : (val || []);
          const progMsg = "Please select your preferred program.";
          await sendInteractiveOptions(progMsg, programs);
        } else {
          const progStep = steps.find(s => s.type === 'PROGRAM_SELECTION');
          let errMsg = programMap[matchedQualKey]?._categoryMessage || programMap[matchedQualKey]?.categoryMessage || progStep?.categoryMessage || progStep?.message || progStep?.text || "Please select program category:";
          errMsg = this.populatePlaceholders(errMsg, contact, contact.flowVariables?.name || contact.name || 'Student');
          
          const categoryOptions = categories.map(key => {
            const val = programMap[matchedQualKey][key];
            if (val && typeof val === 'object' && !Array.isArray(val)) {
              return {
                label: val.label || key,
                description: val.description || ''
              };
            }
            return key;
          });

          await sendInteractiveOptions(errMsg, categoryOptions);
        }

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_PROGRAM
      // ==========================================
      if (currentState === 'ask_program') {
        let programMap = settings?.automation?.aiPrompts?.programMap;
        if (!programMap || Object.keys(programMap).length === 0) programMap = DEFAULT_PROGRAM_MAP;

        const contactQual = contact.qualification || '';
        const matchedQualKey = this.getMatchedQualificationKey(programMap, contactQual);

        const streamName = contact.selectedStream || '';
        const val = (matchedQualKey && streamName && programMap[matchedQualKey]) ? programMap[matchedQualKey][streamName] : [];
        let programs = (val && typeof val === 'object' && !Array.isArray(val)) ? (val.programs || val.courses || []) : (val || []);

        let selectedProg = messageText.trim();

        if (replyValue && replyValue.startsWith('list_')) {
          const idx = parseInt(replyValue.split('_')[1]);
          if (idx >= 0 && idx < programs.length) {
            selectedProg = programs[idx];
          }
        } else if (replyValue && replyValue.startsWith('btn_')) {
          const idx = parseInt(replyValue.split('_')[1]);
          if (idx >= 0 && idx < programs.length) {
            selectedProg = programs[idx];
          }
        }

        if (selectedProg.toLowerCase() === 'other' || normalizedInput === 'other' || replyValue?.toLowerCase().includes('other')) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              currentFlowStep: 'ask_custom_program'
            }
          });
          const isMaster = streamName.toLowerCase().includes('master') || contactQual.toLowerCase().includes('grad');
          const customProgMsg = isMaster ? "Please type your preferred master program." : "Please type your preferred program.";
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
    if (!steps || steps.length === 0) steps = this.DEFAULT_PRD_FLOW_STEPS || [];
    const MessageSchema = require('../models/tenant/Message');
    const { getTenantConnection } = require('../config/db');

    // 1. Find index of completed step (with robust case-insensitivity)
    const completedLower = (completedTypeOrId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    let completedIdx = steps.findIndex(s => {
      const sId = (s.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const sType = (s.type || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return sId === completedLower || sType === completedLower;
    });

    if (completedIdx === -1) {
      if (completedLower.includes('program')) {
        completedIdx = steps.findIndex(s => (s.type || '').toUpperCase() === 'PROGRAM_SELECTION');
      } else if (completedLower.includes('qualification')) {
        completedIdx = steps.findIndex(s => (s.type || '').toUpperCase() === 'QUALIFICATION');
      } else if (completedLower.includes('name')) {
        completedIdx = steps.findIndex(s => (s.type || '').toUpperCase() === 'NAME_CAPTURE');
      } else if (completedLower.includes('calltime') || completedLower.includes('time')) {
        completedIdx = steps.findIndex(s => (s.type || '').toUpperCase() === 'CALL_TIME');
      } else if (completedLower.includes('greeting')) {
        completedIdx = steps.findIndex(s => (s.type || '').toUpperCase() === 'GREETING');
      }
    }

    let nextStep = (completedIdx !== -1 && completedIdx + 1 < steps.length) ? steps[completedIdx + 1] : null;

    if (!nextStep && (completedLower === 'namecapture' || completedLower === 'name_capture')) {
      if (steps.length > 0) {
        // If name capture was completed but not found in list, go to first step that is not name capture
        nextStep = steps.find(s => (s.type || '').toUpperCase() !== 'NAME_CAPTURE') || steps[0];
      }
    }

    if (!nextStep) {
      // Fallbacks if no next step exists in visual builder
      if (completedLower.includes('program') || completedLower === 'program_selection') {
        await ContactModel.updateOne({ phone: contact.phone }, { $set: { currentFlowStep: 'ask_call_time' } });
        const callTimeMsg = "What would be the best time for our counsellor to call you?";
        await this.sendInteractiveOptionsHelper(contact, waService, callTimeMsg, [
          'Immediate', 'Within 2 hours', 'Morning (9am - 12pm)', 'Afternoon (12pm - 4pm)', 'Evening (4pm - 7pm)'
        ], settings, io);
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
      await this.sendInteractiveOptionsHelper(contact, waService, summaryMsg, ['Yes', 'Edit'], settings, io);
      return;
    }

    console.log(`[PRD Flow] 🔀 Transitioning dynamically from "${completedTypeOrId}" to "${nextStep.title}" (Type: ${nextStep.type}, ID: ${nextStep.id})`);

    if (nextStep.type === 'CALL_TIME') {
      await ContactModel.updateOne({ phone: contact.phone }, { $set: { currentFlowStep: 'ask_call_time' } });
      const callTimeMsg = nextStep.message || nextStep.text || "What would be the best time for our counsellor to call you?";
      const buttons = (nextStep.buttons && nextStep.buttons.length > 0) ? nextStep.buttons : [
        'Immediate', 'Within 2 hours', 'Morning (9am - 12pm)', 'Afternoon (12pm - 4pm)', 'Evening (4pm - 7pm)'
      ];
      await this.sendInteractiveOptionsHelper(contact, waService, callTimeMsg, buttons, settings, io);
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
      let singleInteractiveSent = false;
      const buttonLabels = (nextStep.buttons && nextStep.buttons.length > 0)
        ? nextStep.buttons.map(b => typeof b === 'string' ? b : b.label)
        : ["Continue ➡️"];

      if (media && buttonLabels.length <= 3 && !buttonLabels.some(opt => opt.length > 20)) {
        try {
          resMsg = await waService.sendInteractiveButtonMessage(contact.phone, {
            header: { type: 'image', link: media },
            body: msg || "Please select an option:",
            buttons: buttonLabels
          });
          await saveAndEmit('interactive', msg, resMsg);
          singleInteractiveSent = true;
        } catch (mediaErr) {
          console.error('[PRD] Failed to send single interactive media message, falling back to split sending:', mediaErr.message);
        }
      }

      if (!singleInteractiveSent) {
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
          await this.sendInteractiveOptionsHelper(contact, waService, "Please select an option:", buttonLabels, settings, io);
        } else {
          await this.sendInteractiveOptionsHelper(contact, waService, "Press below to proceed:", ["Continue ➡️"], settings, io);
        }
      }
    }
    else if (nextStep.type === 'QUALIFICATION') {
      await ContactModel.updateOne({ phone: contact.phone }, { $set: { currentFlowStep: 'ask_qualification' } });
      let qualMsg = nextStep.message || nextStep.text || `Please select your qualification.`;
      qualMsg = this.populatePlaceholders(qualMsg, contact, nameVal);
      let options = settings?.automation?.aiPrompts?.qualificationOptions || ['12th Pass', 'Graduation', 'Other'];
      await this.sendInteractiveOptionsHelper(contact, waService, qualMsg, options, settings, io);
    }
    else if (nextStep.type === 'PROGRAM_SELECTION') {
      const fresh = await ContactModel.findOne({ phone: contact.phone });
      const contactQual = fresh.qualification || '';
      
      let programMap = settings?.automation?.aiPrompts?.programMap;
      if (!programMap || Object.keys(programMap).length === 0) programMap = DEFAULT_PROGRAM_MAP;

      const matchedQualKey = this.getMatchedQualificationKey(programMap, contactQual);

      if (matchedQualKey && programMap[matchedQualKey]) {
        const categories = Object.keys(programMap[matchedQualKey]).filter(k => !k.startsWith('_') && k !== 'categoryMessage');
        if (categories.length === 1) {
          const streamName = categories[0];
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              selectedStream: streamName,
              'flowVariables.selectedStream': streamName,
              currentFlowStep: 'ask_program'
            }
          });
          let progMsg = nextStep.message || nextStep.text || "Please select your preferred program.";
          progMsg = this.populatePlaceholders(progMsg, fresh, nameVal);
          
          const val = programMap[matchedQualKey][streamName];
          const programs = (val && typeof val === 'object' && !Array.isArray(val)) ? (val.programs || val.courses || []) : (val || []);
          await this.sendInteractiveOptionsHelper(contact, waService, progMsg, programs, settings, io);
        } else if (categories.length > 1) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              currentFlowStep: 'ask_program_category'
            }
          });
          let catMsg = programMap[matchedQualKey]?._categoryMessage || programMap[matchedQualKey]?.categoryMessage || nextStep.categoryMessage || nextStep.message || nextStep.text || "Please select program category.";
          catMsg = this.populatePlaceholders(catMsg, fresh, nameVal);

          const categoryOptions = categories.map(key => {
            const val = programMap[matchedQualKey][key];
            if (val && typeof val === 'object' && !Array.isArray(val)) {
              return {
                label: val.label || key,
                description: val.description || ''
              };
            }
            return key;
          });

          await this.sendInteractiveOptionsHelper(contact, waService, catMsg, categoryOptions, settings, io);
        } else {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: { currentFlowStep: 'ask_custom_program' }
          });
          let customMsg = "Please type your preferred program.";
          customMsg = this.populatePlaceholders(customMsg, fresh, nameVal);
          const res = await waService.sendTextMessage(contact.phone, customMsg);
          // Wait, saveAndEmit is not defined in this scope, let's use sendInteractiveOptionsHelper for tracking
          await this.sendInteractiveOptionsHelper(contact, waService, customMsg, ["Skip"], settings, io);
        }
      } else {
        await ContactModel.updateOne({ phone: contact.phone }, {
          $set: { currentFlowStep: 'ask_custom_program' }
        });
        let customMsg = "Please type your preferred program.";
        customMsg = this.populatePlaceholders(customMsg, fresh, nameVal);
        const res = await waService.sendTextMessage(contact.phone, customMsg);
      }
    }
    else if (nextStep.type === 'NAME_CAPTURE') {
      await ContactModel.updateOne({ phone: contact.phone }, { $set: { currentFlowStep: 'ask_name' } });
      let nameMsg = nextStep.message || nextStep.text || `May I know your name?`;
      nameMsg = this.populatePlaceholders(nameMsg, contact, nameVal);
      
      const image = nextStep.image || '';
      const media = this.makeAbsolute(image);
      if (media) {
        try {
          await waService.sendMedia(contact.phone, 'image', null, nameMsg, media);
        } catch (err) {
          await waService.sendTextMessage(contact.phone, nameMsg);
        }
      } else {
        await waService.sendTextMessage(contact.phone, nameMsg);
      }
    }
    else if (nextStep.type === 'GREETING') {
      let greetMsg = nextStep.message || nextStep.text || `Welcome!`;
      greetMsg = this.populatePlaceholders(greetMsg, contact, nameVal);
      
      const image = nextStep.image || '';
      const media = this.makeAbsolute(image);
      if (media) {
        try {
          await waService.sendMedia(contact.phone, 'image', null, greetMsg, media);
        } catch (err) {
          await waService.sendTextMessage(contact.phone, greetMsg);
        }
      } else {
        await waService.sendTextMessage(contact.phone, greetMsg);
      }
      
      // Auto transition to the next step after GREETING!
      await this.transitionToNextStepAfter(nextStep.id, contact, ContactModel, steps, settings, waService, nameVal, io);
    }
    else {
      await ContactModel.updateOne({ phone: contact.phone }, { $set: { currentFlowStep: 'ask_additional_help' } });
      const thankYouMsg = `Thank you ${nameVal} 😊\n\nYour request has been submitted. Our counselor will contact you.`;
      const resTy = await waService.sendTextMessage(contact.phone, thankYouMsg);
      if (settings?.tenantId) {
        try {
          const { getTenantConnection } = require('../config/db');
          const MessageSchema = require('../models/tenant/Message');
          const tenantDb = getTenantConnection(settings.tenantId);
          const MessageModel = tenantDb.model('Message', MessageSchema);
          const msgId = resTy?.messages?.[0]?.id || resTy?.messageId || `out_${Date.now()}`;
          const msgDoc = await MessageModel.create({
            contactId: contact._id,
            messageId: msgId,
            direction: 'OUTBOUND',
            type: 'text',
            content: thankYouMsg,
            status: 'SENT'
          });
          if (io) io.to(settings.tenantId).emit('new_message', { ...msgDoc._doc, contact });
        } catch (err) {
          console.error('[PRD ThankYou] Save/Emit failed:', err.message);
        }
      }
    }
  }

  async sendInteractiveOptionsHelper(contact, waService, body, options, settings = null, io = null) {
    let res;
    // Normalize options array to clean strings for buttons path
    const optionStrings = options.map(opt => {
      if (typeof opt === 'string') return opt;
      if (opt && typeof opt === 'object') return opt.label || opt.title || '';
      return '';
    });

    const hasLongOption = optionStrings.some(opt => opt.length > 20);
    const hasDescriptions = options.some(opt => typeof opt === 'object' && opt?.description);
    if (options.length <= 3 && !hasLongOption && !hasDescriptions) {
      res = await waService.sendInteractiveButtonMessage(contact.phone, { body, buttons: optionStrings });
    } else {
      res = await waService.sendListMessage(contact.phone, {
        body,
        buttonText: 'View Options',
        sections: [{
          title: 'Available Options',
          rows: options.slice(0, 10).map((opt, i) => {
            if (typeof opt === 'string') {
              return {
                id: `list_${i}`,
                title: opt.substring(0, 24),
                description: opt.length > 24 ? opt.substring(0, 72) : undefined
              };
            } else {
              const title = (opt?.label || opt?.title || '').trim().substring(0, 24);
              const desc = (opt?.description || opt?.text || '').trim().substring(0, 72);
              return {
                id: `list_${i}`,
                title: title || `Option ${i+1}`,
                description: desc || undefined
              };
            }
          })
        }]
      });
    }

    if (settings?.tenantId) {
      try {
        const { getTenantConnection } = require('../config/db');
        const MessageSchema = require('../models/tenant/Message');
        const tenantDb = getTenantConnection(settings.tenantId);
        const MessageModel = tenantDb.model('Message', MessageSchema);
        const msgId = res?.messages?.[0]?.id || res?.messageId || `out_${Date.now()}`;
        const msgDoc = await MessageModel.create({
          contactId: contact._id,
          messageId: msgId,
          direction: 'OUTBOUND',
          type: 'interactive',
          content: body,
          status: 'SENT'
        });
        if (io) {
          io.to(settings.tenantId).emit('new_message', { ...msgDoc._doc, contact });
        }
      } catch (err) {
        console.error('[PRD Helper] Save/Emit failed:', err.message);
      }
    }
    return res;
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
