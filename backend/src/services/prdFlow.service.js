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
      { id: 'greeting', type: 'GREETING', title: 'Greeting Message', message: 'Welcome to our University 🎓\n\nWe’re excited to help you choose the right career path.', image: 'https://wapipulse.com/uploads/prompts/tenant_demo_001/prompt_1774743344804.jpeg' },
      { id: 'ask_name', type: 'NAME_CAPTURE', title: 'Ask Name', message: 'Please enter your full name.' },
      { id: 'qualification', type: 'QUALIFICATION', title: 'Ask Qualification', message: 'Nice to meet you {{name}} 😊\n\nPlease select your qualification.' },
      { id: 'program', type: 'PROGRAM_SELECTION', title: 'Program Selection', message: 'Please select your preferred program category.', categoryMessage: 'Please select program category.' },
      { id: 'call_time', type: 'CALL_TIME', title: 'Counselling Time', message: 'Excellent choice 🚀\n\nWhen should our counselor contact you?', buttons: ['Morning', 'Afternoon', 'Evening'] },
      { id: 'thank_you', type: 'CUSTOM_MESSAGE', title: 'Thank You Message', message: 'Thank you {{name}} 🙌\n\n🎓 Qualification: {{qualification}}\n📘 Program: {{program}}\n⏰ Time: {{time}}\n\nOur counselor will call you at your preferred time 📞\n\nThank you for your time, {{name}} 😊' }
    ];
    this.activeProcesses = new Set();
  }

  sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  getCleanProgramMap(settings) {
    let pMap = settings?.automation?.aiPrompts?.programMap;
    if (typeof pMap === 'string') {
      try { pMap = JSON.parse(pMap); } catch(e) {}
    }

    if (pMap && pMap.dynamicProgramMapping) {
      pMap = pMap.dynamicProgramMapping;
    }

    if (pMap && pMap.Services && Object.keys(pMap).length === 1) {
      pMap = pMap.Services;
    }

    if (pMap) {
      let normalized = false;
      let newPMap = {};
      for (const [key, value] of Object.entries(pMap)) {
        if (value && typeof value === 'object' && !Array.isArray(value) && Array.isArray(value.services)) {
          newPMap[key] = value.services;
          normalized = true;
        } else {
          newPMap[key] = value;
        }
      }
      if (normalized) pMap = newPMap;
    }

    if (!pMap || Object.keys(pMap).length === 0) return DEFAULT_PROGRAM_MAP;
    return pMap;
  }

  async assignFivestepAgentImmediately(tenantId, selectedService, phone, ContactModel, LeadModel) {
    const fs = require('fs');
    const logFile = require('path').join(__dirname, '../../fivestep_debug.log');
    const log = (msg) => {
      try { fs.appendFileSync(logFile, new Date().toISOString() + ' - ' + msg + '\n'); } catch(e){}
    };
    log(`[PRD] assignFivestepAgentImmediately called: tenantId=${tenantId}, selectedService="${selectedService}", phone=${phone}`);

    if (tenantId !== 'fivestep_599984' || !selectedService) {
      log('[PRD] Exiting: Not fivestep tenant or no selectedService');
      return null;
    }
    try {
      const User = require('../models/core/User');
      const service = selectedService.toUpperCase().trim();
      let targetAgentName = '';
      
      if (service.includes('ONLINE PROGRAM')) { targetAgentName = 'Darshil kanani'; }
      else if (service.includes('INTERNATIONAL COACHING')) { targetAgentName = 'Nikunj'; }
      else if (service.includes('VISA')) { targetAgentName = 'Hitesh Patel'; }
      else if (service.includes('MBBS')) { targetAgentName = 'Jayashree Kaushik Dave'; }
      else if (service.includes('TOUR')) { targetAgentName = 'Ishika'; }
      else if (service.includes('COACHING')) { targetAgentName = 'Kinjal Yogeshbhai Sadhu'; }

      log(`[PRD] parsed service="${service}", targetAgentName="${targetAgentName}"`);

      if (targetAgentName) {
        let matchedAgents = await User.find({ 
          tenantId, 
          name: { $regex: new RegExp(targetAgentName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i') },
          status: 'ACTIVE' 
        });
        
        if (!matchedAgents || matchedAgents.length === 0) {
          const firstName = targetAgentName.split(' ')[0];
          log(`[PRD] Exact match failed for ${targetAgentName}. Falling back to first name "${firstName}"`);
          matchedAgents = await User.find({
            tenantId,
            name: { $regex: new RegExp(firstName, 'i') },
            status: 'ACTIVE'
          });
        }

        log(`[PRD] matchedAgents count: ${matchedAgents ? matchedAgents.length : 0}`);
        
        if (matchedAgents && matchedAgents.length > 0) {
          matchedAgents.sort((a, b) => (a.lastLeadAssignedAt || 0) - (b.lastLeadAssignedAt || 0));
          const selectedAgent = matchedAgents[0];
          
          selectedAgent.lastLeadAssignedAt = new Date();
          selectedAgent.dailyLeadCount = (selectedAgent.dailyLeadCount || 0) + 1;
          await selectedAgent.save();
          
          const agentId = selectedAgent._id;
          
          const contactUpdate = await ContactModel.updateOne({ phone }, { $set: { assignedAgent: agentId } });
          const leadUpdate = await LeadModel.updateOne({ phone, tenantId }, { $set: { assignedAgent: agentId } });
          
          log(`[PRD] Immediate Fivestep assignment: Lead (${phone}) assigned to ${selectedAgent.name} (${targetAgentName}). Contact modified: ${contactUpdate.modifiedCount}, Lead modified: ${leadUpdate.modifiedCount}`);
          return agentId;
        } else {
          log('[PRD] No active matched agents found for role or name!');
        }
      }
    } catch (err) {
      log(`[PRD] Fivestep immediate assignment error: ${err.message} \n ${err.stack}`);
      console.error('[PRD] Fivestep immediate assignment error:', err);
    }
    return null;
  }

  getMatchedQualificationKey(programMap, qualification) {
    if (!programMap || !qualification) return null;
    const qualLower = qualification.toLowerCase().trim();
    
    // 1. Direct Case-Insensitive Match
    const directMatch = Object.keys(programMap).find(k => k.toLowerCase().trim() === qualLower);
    if (directMatch) return directMatch;

    // 2. Smart Mapping: If qualification contains '12' or 'twelfth' -> matches '12th'
    if (qualLower.includes('12') || qualLower.includes('twelfth')) {
      const match = Object.keys(programMap).find(k => k.toLowerCase().includes('12'));
      if (match) return match;
    }

    // 3. Smart Mapping: If qualification explicitly asks for "bachelor" programs (meaning they want to do a bachelor's) -> maps to 12th Pass
    if (qualLower.includes('bachelor')) {
      const match = Object.keys(programMap).find(k => k.toLowerCase().includes('12') || k.toLowerCase().includes('bachelor'));
      if (match) return match;
    }

    // 4. Smart Mapping: If qualification contains 'grad' or 'degree' or 'master' -> matches 'master' or 'grad'
    if (qualLower.includes('grad') || qualLower.includes('degree') || qualLower.includes('master') || qualLower.includes('post')) {
      const match = Object.keys(programMap).find(k => k.toLowerCase().includes('master') || k.toLowerCase().includes('grad') || k.toLowerCase().includes('post'));
      if (match) return match;
    }

    // 5. Substring Matches
    const substringMatch = Object.keys(programMap).find(k => {
      const cleanK = k.toLowerCase().trim();
      return cleanK.includes(qualLower) || qualLower.includes(cleanK);
    });
    if (substringMatch) return substringMatch;

    // 6. Fallback: standard mapping
    let mappedOption = qualLower;
    if (mappedOption.includes('master')) mappedOption = 'graduate';
    
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
    const baseUrl = (process.env.BASE_URL || 'https://wapipulse.com').replace(/\/$/, '');
    
    // Explicitly force all /uploads/ to go through /api/uploads/
    if (url.includes('/uploads/') && !url.includes('/api/uploads/')) {
      url = url.replace(/\/uploads\//, '/api/uploads/');
    }

    if (url.toLowerCase().endsWith('.webp') || url.toLowerCase().includes('.webp')) {
      // Meta Cloud API doesn't support WebP. Proxy and convert to standard JPEG
      if (url.startsWith('/api/uploads/')) {
        return `${baseUrl}/api/proxy-image?url=${encodeURIComponent(url)}`;
      }
      return `${baseUrl}/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${baseUrl}${url}`;
    return `${baseUrl}/${url}`;
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
      const greetingStep = steps.find(s => (s.type || '').toUpperCase() === 'GREETING') || steps.find(s => (s.type || '').toUpperCase() === 'NAME_CAPTURE');
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
      const customStepIndex = steps.findIndex(s => {
        const sType = (s.type || '').toUpperCase();
        return s.id === currentState && sType !== 'NAME_CAPTURE' && sType !== 'QUALIFICATION' && sType !== 'PROGRAM_SELECTION' && sType !== 'CALL_TIME';
      });
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
        


        const nameStep = steps.find(s => (s.type || '').toUpperCase() === 'NAME_CAPTURE');
        const hasSeparateNameCard = !!nameStep && (greetingStep?.type || '').toUpperCase() === 'GREETING' && steps.indexOf(greetingStep) < steps.indexOf(nameStep);

        if (!hasSeparateNameCard && !welcomeMsg.toLowerCase().includes('enter your full name') && !welcomeMsg.toLowerCase().includes('may i know your name')) {
          welcomeMsg = `${welcomeMsg.trim()}\n\nPlease enter your full name.`;
        }

        const greetButtons = greetingStep?.buttons || [];
        const replyButtons = greetButtons.filter(b => b.type === 'reply');
        const ctaButtons = greetButtons.filter(b => b.type === 'url' || b.type === 'call');

        const media = this.makeAbsolute(greetingImage);
        let resGreeting;
        let singleInteractiveSent = false;
        
        let mediaId = null;
        let mediaLink = media;

        // Bypass URL reachability issues by uploading the file directly if it exists locally
        if (media && (media.includes('/uploads/prompts/') || media.includes('/uploads/media/'))) {
          try {
            const urlObj = new URL(media);
            const fs = require('fs');
            const path = require('path');
            const localPath = path.join(__dirname, '../../public', urlObj.pathname.replace('/api', ''));
            
            if (fs.existsSync(localPath)) {
              console.log(`[PRD] Direct uploading local media to avoid Meta URL fetch issues: ${localPath}`);
              const ext = path.extname(localPath).toLowerCase();
              let mimeType = 'image/jpeg';
              if (ext === '.png') mimeType = 'image/png';
              else if (ext === '.webp') mimeType = 'image/webp';
              else if (ext === '.mp4') mimeType = 'video/mp4';
              else if (ext === '.pdf') mimeType = 'application/pdf';
              
              const uploadRes = await waService.uploadMedia(localPath, mimeType);
              if (uploadRes && uploadRes.id) {
                mediaId = uploadRes.id;
                mediaLink = null;
              }
            } else {
              console.warn(`[PRD] Local media file not found at ${localPath}. Clearing media to prevent Meta delivery failure.`);
              media = '';
              mediaLink = null;
              mediaId = null;
            }
          } catch (pathErr) {
            console.warn('[PRD] Could not parse media URL for direct upload:', pathErr.message);
          }
        }

        const replyLabels = replyButtons.map(b => (b.label || '').trim()).filter(l => l.length > 0);

        if (replyLabels.length > 0 && replyLabels.length <= 3 && !replyLabels.some(l => l.length > 20)) {
          if (media) {
            try {
              resGreeting = await waService.sendInteractiveButtonMessage(contact.phone, {
                header: { type: 'image', image: mediaId, link: mediaLink },
                body: welcomeMsg,
                buttons: replyLabels
              });
              await saveAndEmit('interactive', media ? `[Media] ${media}\n${welcomeMsg}` : welcomeMsg, resGreeting);
              singleInteractiveSent = true;
            } catch (mediaErr) {
              console.error('[PRD] Failed to send unified interactive media greeting:', mediaErr.message);
            }
          } else {
            try {
              resGreeting = await waService.sendInteractiveButtonMessage(contact.phone, {
                body: welcomeMsg,
                buttons: replyLabels
              });
              await saveAndEmit('interactive', welcomeMsg, resGreeting);
              singleInteractiveSent = true;
            } catch (err) {
              console.error('[PRD] Failed to send unified interactive greeting:', err.message);
            }
          }
        }

        // If not sent as a single interactive card (or failed), fall back to separate media/text sending
        if (!singleInteractiveSent) {
          if (media) {
            try {
              resGreeting = await waService.sendMedia(contact.phone, 'image', mediaId, welcomeMsg, mediaLink);
              await saveAndEmit('image', media ? `[Media] ${media}\n${welcomeMsg}` : welcomeMsg, resGreeting);
            } catch (mediaErr) {
              console.error('[PRD] Media send failed, falling back to text greeting:', mediaErr.message);
              resGreeting = await waService.sendTextMessage(contact.phone, welcomeMsg);
              await saveAndEmit('text', welcomeMsg, resGreeting);
            }
          } else {
            resGreeting = await waService.sendTextMessage(contact.phone, welcomeMsg);
            await saveAndEmit('text', welcomeMsg, resGreeting);
          }

          // Send split reply buttons
          for (const btn of replyButtons) {
            try {
              let bodyText = (btn.text || 'Selected Option:').trim();
              const resBtn = await waService.sendInteractiveButtonMessage(contact.phone, {
                body: bodyText,
                buttons: [btn.label]
              });
              await saveAndEmit('interactive', btn.label, resBtn);
            } catch (btnErr) {
              console.error('[PRD] Failed to send split reply button:', btnErr.message);
            }
          }
        }

        // Always send real interactive CTA buttons (URL and Call buttons) immediately after the main greeting card
        if (ctaButtons.length > 0) {
          for (const btn of ctaButtons) {
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
              }
            } catch (btnErr) {
              console.error('[PRD] Failed to send real interactive CTA button:', btnErr.message);
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
              await saveAndEmit('image', nameMedia ? `[Media] ${nameMedia}\n${nameMsg}` : nameMsg, resName);
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
        await this.transitionToNextStepAfter('ask_name', contact, ContactModel, prdFlowSteps, settings, waService, extractedName, io);
        
        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_QUALIFICATION
      // ==========================================
      if (currentState === 'ask_qualification') {
        const Settings = require('../models/core/Settings');
        const settings = await Settings.findOne({ tenantId });
        
        let programMap = this.getCleanProgramMap(settings);
        let options = settings?.automation?.aiPrompts?.qualificationOptions || ['12th Pass', 'Graduation', 'Other'];
        
        if (tenantId === 'fivestep_599984') {
          options = Object.keys(programMap).filter(k => !k.startsWith('_') && k !== 'categoryMessage');
        } else {
          if (!options || options.length === 0 || (options.length === 1 && !options[0])) {
            options = ['12th Pass', 'Graduation', 'Other'];
          }
        }

        let selectedOption = '';
        if (replyValue) {
          const matchBtn = replyValue.match(/btn_(\d+)/i);
          const matchLst = replyValue.match(/list_(\d+)/i);
          const idx = matchBtn ? parseInt(matchBtn[1]) : (matchLst ? parseInt(matchLst[1]) : -1);
          if (idx >= 0 && idx < options.length) {
            const opt = options[idx];
            selectedOption = typeof opt === 'string' ? opt : (opt?.label || opt?.description || '');
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
            selectedOption = typeof opt === 'string' ? opt : (opt?.label || opt?.description || '');
          }
        }

        // Fallbacks
        if (!selectedOption) {
          const optStrings = options.map(opt => typeof opt === 'string' ? opt : (opt?.label || opt?.description || ''));
          if (normalizedInput.includes('12') || normalizedInput.includes('twelfth')) selectedOption = optStrings.find(o => o.toLowerCase().includes('12')) || '12th Pass';
          else if (normalizedInput.includes('grad') || normalizedInput.includes('bachelor') || normalizedInput.includes('degree')) selectedOption = optStrings.find(o => o.toLowerCase().includes('grad') || o.toLowerCase().includes('bach')) || 'Graduation';
          else if (normalizedInput.includes('diploma')) selectedOption = optStrings.find(o => o.toLowerCase().includes('diploma')) || 'Diploma';
          else if (normalizedInput.includes('master') || normalizedInput.includes('postgrad')) selectedOption = optStrings.find(o => o.toLowerCase().includes('master')) || 'Master Completed';
          else if (normalizedInput.includes('10') || normalizedInput.includes('tenth') || normalizedInput.includes('ssc')) selectedOption = optStrings.find(o => o.toLowerCase().includes('10')) || '10th Pass';
          else if (normalizedInput.includes('working') || normalizedInput.includes('professional')) selectedOption = optStrings.find(o => o.toLowerCase().includes('working') || o.toLowerCase().includes('prof')) || 'Working Professional';
        }

        if (!selectedOption) {
          const optStrings = options.map(opt => typeof opt === 'string' ? opt : (opt?.label || opt?.description || ''));
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

        const matchedQualKey = this.getMatchedQualificationKey(programMap, selectedOption);

        if (tenantId === 'fivestep_599984' && selectedOption) {
          await this.assignFivestepAgentImmediately(tenantId, selectedOption, contact.phone, ContactModel, LeadModel);
        }

        if (matchedQualKey && programMap[matchedQualKey]) {
          const qualData = programMap[matchedQualKey];
          if (Array.isArray(qualData)) {
            await ContactModel.updateOne({ phone: contact.phone }, {
              $set: {
                qualification: selectedOption,
                'flowVariables.qualification': selectedOption,
                selectedStream: 'General',
                'flowVariables.selectedStream': 'General',
                currentFlowStep: 'ask_program'
              }
            });
            const progMsg = "Please select your preferred program.";
            await sendInteractiveOptions(progMsg, qualData);
          } else {
            const categories = Object.keys(qualData).filter(k => !k.startsWith('_') && k !== 'categoryMessage');
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
              const val = qualData[streamName];
              const programs = (val && typeof val === 'object' && !Array.isArray(val)) ? (val.programs || val.courses || val.Programs || val.Courses || val.Modes || val.modes || Object.values(val).find(Array.isArray) || []) : (val || []);
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
            const progStep = steps.find(s => (s.type || '').toUpperCase() === 'PROGRAM_SELECTION');
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
        let programMap = this.getCleanProgramMap(settings);

        const contactQual = contact.qualification || '';
        const matchedQualKey = this.getMatchedQualificationKey(programMap, contactQual);

        const qualData = matchedQualKey && programMap[matchedQualKey] ? programMap[matchedQualKey] : {};
        const categories = Array.isArray(qualData) ? [] : Object.keys(qualData).filter(k => !k.startsWith('_') && k !== 'categoryMessage');

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
          const programs = (val && typeof val === 'object' && !Array.isArray(val)) ? (val.programs || val.courses || val.Programs || val.Courses || val.Modes || val.modes || Object.values(val).find(Array.isArray) || []) : (val || []);
          const progMsg = "Please select your preferred program.";
          await sendInteractiveOptions(progMsg, programs);
        } else {
          const progStep = steps.find(s => (s.type || '').toUpperCase() === 'PROGRAM_SELECTION');
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
        let programMap = this.getCleanProgramMap(settings);

        const contactQual = contact.qualification || '';
        const matchedQualKey = this.getMatchedQualificationKey(programMap, contactQual);

        const streamName = contact.selectedStream || '';
        const val = (matchedQualKey && streamName && programMap[matchedQualKey]) ? programMap[matchedQualKey][streamName] : [];
        let programs = (val && typeof val === 'object' && !Array.isArray(val)) ? (val.programs || val.courses || val.Programs || val.Courses || val.Modes || val.modes || Object.values(val).find(Array.isArray) || []) : (val || []);

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
            currentFlowStep: 'ask_call_date'
          }
        });

        const fresh = await ContactModel.findOne({ phone: contact.phone });
        const nameVal = fresh.flowVariables?.name || fresh.name || 'Student';
        await this.transitionToNextStepAfter('PROGRAM_SELECTION', contact, ContactModel, steps, settings, waService, nameVal, io);

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // ==========================================
      // STATE: ASK_CALL_DATE
      // ==========================================
      if (currentState === 'ask_call_date') {
        const getISTDate = () => {
          const utc = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
          return new Date(utc + (3600000 * 5.5));
        };
        const istNow = getISTDate();
        const formatFull = (date) => {
          const d = date.getDate().toString().padStart(2, '0');
          const m = (date.getMonth() + 1).toString().padStart(2, '0');
          const y = date.getFullYear();
          return `${d}-${m}-${y}`;
        };

        const todayFull = formatFull(istNow);
        const tomorrowDate = new Date(istNow);
        tomorrowDate.setDate(istNow.getDate() + 1);
        const tomorrowFull = formatFull(tomorrowDate);

        const input = (replyValue || messageText || '').toLowerCase().trim();
        const isToday = input === 'btn_0' || input === 'today';
        const isTomorrow = input === 'btn_1' || input === 'tomorrow';
        const isPickDate = input === 'btn_2' || input.includes('custom') || input.includes('text');

        const slotsMsg = `Great! Please select your preferred time slot for Morning:`;
        const callTimeStep = (settings?.automation?.aiPrompts?.prdFlowSteps || []).find(s => (s.type || '').toUpperCase() === 'CALL_TIME');
        const customSlots = (callTimeStep && callTimeStep.buttons && callTimeStep.buttons.length > 0)
          ? callTimeStep.buttons.map(b => typeof b === 'string' ? b : (b.label || b.text || ''))
          : [
              '08:00 AM to 09:00 AM',
              '09:00 AM to 10:00 AM',
              '10:00 AM to 11:00 AM',
              '11:00 AM to 12:00 PM',
              '12:00 PM to 01:00 PM',
              '01:00 PM to 02:00 PM',
              '02:00 PM to 03:00 PM',
              '03:00 PM to 04:00 PM',
              '04:00 PM to 05:00 PM',
              '05:00 PM to 06:00 PM',
              '06:00 PM to 07:00 PM',
              '07:00 PM to 08:00 PM',
              '08:00 PM to 09:00 PM'
            ];

        const allTimeSlots = customSlots;
        let page1Slots = [];
        if (allTimeSlots.length <= 10) {
          page1Slots = [...allTimeSlots];
        } else {
          page1Slots = allTimeSlots.slice(0, 9).concat(['More Options... ➡️']);
        }

        if (isToday) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              'flowVariables.temp_call_date': todayFull,
              currentFlowStep: 'ask_call_time_slot'
            }
          });
          
          await this.sendInteractiveOptionsHelper(contact, waService, slotsMsg, page1Slots, settings, io, 'Show all Option');
        }
        else if (isTomorrow) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              'flowVariables.temp_call_date': tomorrowFull,
              currentFlowStep: 'ask_call_time_slot'
            }
          });
          
          await this.sendInteractiveOptionsHelper(contact, waService, slotsMsg, page1Slots, settings, io, 'Show all Option');
        }
        else if (isPickDate) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              currentFlowStep: 'ask_call_custom_date'
            }
          });
          const typeDateMsg = "Please type your preferred date in *DD-MM-YYYY* format (e.g., 25-05-2026):";
          const res = await waService.sendTextMessage(contact.phone, typeDateMsg);
          await saveAndEmit('text', typeDateMsg, res);
        }
        else {
          const dateButtons = [
            'TODAY',
            'TOMORROW',
            'CUSTOM DATE (TEXT)'
          ];
          const invalidMsg = "Invalid option. Please choose when should our counselor contact you:";
          await this.sendInteractiveOptionsHelper(contact, waService, invalidMsg, dateButtons, settings, io);
        }

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_CALL_CUSTOM_DATE
      // ==========================================
      if (currentState === 'ask_call_custom_date') {
        const inputDate = messageText.trim();
        const dateRegex = /^\d{1,2}-\d{1,2}-\d{4}$/;

        if (dateRegex.test(inputDate)) {
          const parts = inputDate.split('-');
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          const parsedDate = new Date(year, month, day);

          if (parsedDate.getFullYear() === year && parsedDate.getMonth() === month && parsedDate.getDate() === day) {
            await ContactModel.updateOne({ phone: contact.phone }, {
              $set: {
                'flowVariables.temp_call_date': inputDate,
                currentFlowStep: 'ask_call_time_slot'
              }
            });

            const slotsMsg = `Great! Please select your preferred time slot for Morning:`;
            const callTimeStep = (settings?.automation?.aiPrompts?.prdFlowSteps || []).find(s => (s.type || '').toUpperCase() === 'CALL_TIME');
            const customSlots = (callTimeStep && callTimeStep.buttons && callTimeStep.buttons.length > 0)
              ? callTimeStep.buttons.map(b => typeof b === 'string' ? b : (b.label || b.text || ''))
              : [
                  '08:00 AM to 09:00 AM',
                  '09:00 AM to 10:00 AM',
                  '10:00 AM to 11:00 AM',
                  '11:00 AM to 12:00 PM',
                  '12:00 PM to 01:00 PM',
                  '01:00 PM to 02:00 PM',
                  '02:00 PM to 03:00 PM',
                  '03:00 PM to 04:00 PM',
                  '04:00 PM to 05:00 PM',
                  '05:00 PM to 06:00 PM',
                  '06:00 PM to 07:00 PM',
                  '07:00 PM to 08:00 PM',
                  '08:00 PM to 09:00 PM'
                ];

            const allTimeSlots = customSlots;
            let page1Slots = [];
            if (allTimeSlots.length <= 10) {
              page1Slots = [...allTimeSlots];
            } else {
              page1Slots = allTimeSlots.slice(0, 9).concat(['More Options... ➡️']);
            }
            await this.sendInteractiveOptionsHelper(contact, waService, slotsMsg, page1Slots, settings, io, 'Show all Option');
          } else {
            const invalidMsg = "Invalid date. Please type a valid calendar date in *DD-MM-YYYY* format (e.g., 25-05-2026):";
            const res = await waService.sendTextMessage(contact.phone, invalidMsg);
            await saveAndEmit('text', invalidMsg, res);
          }
        } else {
          const invalidFormatMsg = "Invalid format. Please enter your preferred date in *DD-MM-YYYY* format (e.g., 25-05-2026):";
          const res = await waService.sendTextMessage(contact.phone, invalidFormatMsg);
          await saveAndEmit('text', invalidFormatMsg, res);
        }

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_CALL_TIME_PERIOD
      // ==========================================
      if (currentState === 'ask_call_time_period') {
        const input = (replyValue || messageText || '').toLowerCase().trim();
        const isMorning = input === 'btn_0' || input.includes('morning') || input === 'morning';
        const isAfternoon = input === 'btn_1' || input.includes('afternoon') || input === 'afternoon';
        const isEvening = input === 'btn_2' || input.includes('evening') || input === 'evening';

        let selectedPeriod = null;
        let periodSlots = [];

        if (isMorning) {
          selectedPeriod = 'Morning';
          periodSlots = [
            '08:00 AM to 09:00 AM',
            '09:00 AM to 10:00 AM',
            '10:00 AM to 11:00 AM',
            '11:00 AM to 12:00 PM'
          ];
        } else if (isAfternoon) {
          selectedPeriod = 'Afternoon';
          periodSlots = [
            '12:00 PM to 01:00 PM',
            '01:00 PM to 02:00 PM',
            '02:00 PM to 03:00 PM',
            '03:00 PM to 04:00 PM'
          ];
        } else if (isEvening) {
          selectedPeriod = 'Evening';
          periodSlots = [
            '04:00 PM to 05:00 PM',
            '05:00 PM to 06:00 PM',
            '06:00 PM to 07:00 PM',
            '07:00 PM to 08:00 PM',
            '08:00 PM to 09:00 PM'
          ];
        }

        if (selectedPeriod) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              'flowVariables.temp_call_period': selectedPeriod,
              currentFlowStep: 'ask_call_time_slot'
            }
          });

          const slotsMsg = `Great! Please select your preferred time slot for ${selectedPeriod}:`;
          await this.sendInteractiveOptionsHelper(contact, waService, slotsMsg, periodSlots, settings, io);
        } else {
          const timePeriodMsg = `Invalid option. Please select your preferred period for the counselling call:`;
          await this.sendInteractiveOptionsHelper(contact, waService, timePeriodMsg, ['Morning (8AM-12PM)', 'Afternoon (12-4PM)', 'Evening (4PM-9PM)'], settings, io);
        }

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_CALL_TIME_SLOT
      // ==========================================
      if (currentState === 'ask_call_time_slot') {
        const callTimeStep = (settings?.automation?.aiPrompts?.prdFlowSteps || []).find(s => (s.type || '').toUpperCase() === 'CALL_TIME');
        const customSlots = (callTimeStep && callTimeStep.buttons && callTimeStep.buttons.length > 0)
          ? callTimeStep.buttons.map(b => typeof b === 'string' ? b : (b.label || b.text || ''))
          : [
              '08:00 AM to 09:00 AM',
              '09:00 AM to 10:00 AM',
              '10:00 AM to 11:00 AM',
              '11:00 AM to 12:00 PM',
              '12:00 PM to 01:00 PM',
              '01:00 PM to 02:00 PM',
              '02:00 PM to 03:00 PM',
              '03:00 PM to 04:00 PM',
              '04:00 PM to 05:00 PM',
              '05:00 PM to 06:00 PM',
              '06:00 PM to 07:00 PM',
              '07:00 PM to 08:00 PM',
              '08:00 PM to 09:00 PM'
            ];

        const allTimeSlots = customSlots;
        let page1Slots = [];
        let page2Slots = [];
        if (allTimeSlots.length <= 10) {
          page1Slots = [...allTimeSlots];
        } else {
          page1Slots = allTimeSlots.slice(0, 9);
          page2Slots = allTimeSlots.slice(9);
        }

        let selectedSlot = null;
        const replyText = messageText.trim();
        const lowerText = replyText.toLowerCase();

        // 1. Check if user clicked "More Options... ➡️"
        if (allTimeSlots.length > 10 && (lowerText.includes('more options') || lowerText.includes('more times') || replyText === 'list_9')) {
          const slotsMsg = `Great! Please select your preferred time slot for Morning:`;
          const page2Opts = [
            ...page2Slots,
            '⬅️ Back to Main'
          ];
          await this.sendInteractiveOptionsHelper(contact, waService, slotsMsg, page2Opts, settings, io, 'Show all Option');
          this.activeProcesses.delete(lockKey);
          return;
        }

        // 2. Check if user clicked "⬅️ Back to Main"
        if (allTimeSlots.length > 10 && (lowerText.includes('back to main') || replyText === `list_${page2Slots.length}` || lowerText.includes('back'))) {
          const slotsMsg = `Great! Please select your preferred time slot for Morning:`;
          const page1Opts = [
            ...page1Slots,
            'More Options... ➡️'
          ];
          await this.sendInteractiveOptionsHelper(contact, waService, slotsMsg, page1Opts, settings, io, 'Show all Option');
          this.activeProcesses.delete(lockKey);
          return;
        }

        // 3. Try exact/partial matching against all slots
        const matchedOpt = allTimeSlots.find(opt => {
          return opt.toLowerCase() === lowerText || lowerText.includes(opt.toLowerCase());
        });

        if (matchedOpt) {
          selectedSlot = matchedOpt;
        }

        if (selectedSlot) {
          const freshContact = await ContactModel.findOne({ phone: contact.phone });
          const savedDate = freshContact.flowVariables?.temp_call_date || '';
          const name = freshContact.flowVariables?.name || freshContact.name || 'Student';
          const qual = freshContact.flowVariables?.qualification || freshContact.qualification || '';
          const prog = freshContact.flowVariables?.program || freshContact.selectedProgram || '';

          const finalMergedTime = `${savedDate} at ${selectedSlot}`;

          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              preferredCallTime: finalMergedTime,
              'flowVariables.time': finalMergedTime,
              currentFlowStep: 'ask_confirmation'
            }
          });

          const summaryMsg = `Please confirm your details:\n\nName: ${name}\nQualification: ${qual}\nProgram: ${prog}\nPreferred Call Time: ${finalMergedTime}\n\nIs this correct?`;
          await sendInteractiveOptions(summaryMsg, ['Yes', 'Edit']);
        } else {
          // Send Page 1 slots again on invalid option
          const slotsMsg = `Invalid option. Please select your preferred time slot for Morning:`;
          const page1Opts = (allTimeSlots.length <= 10)
            ? [...page1Slots]
            : [...page1Slots, 'More Options... ➡️'];
          await this.sendInteractiveOptionsHelper(contact, waService, slotsMsg, page1Opts, settings, io, 'Show all Option');
        }

        this.activeProcesses.delete(lockKey);
        return;
      }

      // ==========================================
      // STATE: ASK_CALL_TIME (Legacy Fallback)
      // ==========================================
      if (currentState === 'ask_call_time') {
        await ContactModel.updateOne({ phone: contact.phone }, { $set: { currentFlowStep: 'ask_call_date' } });
        const callTimeMsg = "When should our counselor contact you?";
        const dateButtons = [
          'TODAY',
          'TOMORROW',
          'CUSTOM DATE (TEXT)'
        ];
        await this.sendInteractiveOptionsHelper(contact, waService, callTimeMsg, dateButtons, settings, io);
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
          let assignedAgentId = fresh.assignedAgent || null;
          
          try {
            // Fivestep Specific Service-based Assignment
            if (tenantId === 'fivestep_599984' && qual && !assignedAgentId) {
              const ContactModel = tenantDb.model('Contact', ContactSchema);
              const LeadModel = tenantDb.model('Lead', LeadSchema);
              assignedAgentId = await this.assignFivestepAgentImmediately(tenantId, qual, contact.phone, ContactModel, LeadModel);
            }
          } catch (err) {
            console.error('[PRD] Fivestep assignment error:', err);
          }

          // Strictly prevent Fivestep from transferring leads to other users if not mapped
          if (!assignedAgentId && settings?.crm?.autoAssignment && tenantId !== 'fivestep_599984') {
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
              currentFlowStep: null
            }
          });

          // 4. Send Thank You Message (Dynamic from builder steps)
          let thankYouStep = steps.find(s => s.id === 'thank_you');
          if (!thankYouStep) {
            thankYouStep = steps.find(s => (s.message || s.text || '').toLowerCase().includes('thank you'));
          }
          let thankYouMsg = thankYouStep?.message || thankYouStep?.text || `Thank you ${name} 😊\n\nYour counselling request has been submitted successfully.\nOur counsellor will contact you at your preferred time.`;
          thankYouMsg = this.populatePlaceholders(thankYouMsg, fresh, name, qual, prog, time);

          const thankYouMedia = thankYouStep?.image ? this.makeAbsolute(thankYouStep.image) : '';
          let resTY;
          if (thankYouMedia) {
            try {
              resTY = await waService.sendMedia(contact.phone, 'image', null, thankYouMsg, thankYouMedia);
              await saveAndEmit('image', thankYouMedia ? `[Media] ${thankYouMedia}\n${thankYouMsg}` : thankYouMsg, resTY);
            } catch (tyErr) {
              resTY = await waService.sendTextMessage(contact.phone, thankYouMsg);
              await saveAndEmit('text', thankYouMsg, resTY);
            }
          } else {
            resTY = await waService.sendTextMessage(contact.phone, thankYouMsg);
            await saveAndEmit('text', thankYouMsg, resTY);
          }

          // 5. Send Additional Help Message (if defined in builder)
          let helpStep = steps.find(s => (s.message || s.text || '').toLowerCase().includes('help you with anything else') || (s.message || s.text || '').toLowerCase().includes('any other help'));
          
          if (helpStep) {
            await this.sleep(1500);
            let helpMsg = helpStep.message || helpStep.text || "May I help you with anything else?";
            let helpButtons = ['Yes', 'No'];
            if (helpStep.buttons && helpStep.buttons.length > 0) {
               helpButtons = helpStep.buttons.map(b => typeof b === 'string' ? b : b.label);
               if (helpButtons.length === 0 || (helpButtons.length === 1 && !helpButtons[0])) {
                 helpButtons = ['Yes', 'No'];
               }
            }
            await ContactModel.updateOne({ phone: contact.phone }, { $set: { currentFlowStep: 'ask_additional_help' } });
            await this.sendInteractiveOptionsHelper(contact, waService, helpMsg, helpButtons, settings, io);
          }
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

          // Retrieve updated contact to ensure all fields are current
          const updatedContact = await ContactModel.findOne({ phone: contact.phone });

          // Send admin handoff alert
          notificationService.sendAdminAlert(tenantId, {
            subject: 'Human Handoff Requested 🙋‍♂️',
            text: `Lead *${contact.name || contact.phone}* requested a human agent.`
          });

          // Reset flow session
          await this.clearPRDFlowSession(tenantId, contact.phone, ContactModel);

          // Emit real-time handoff request socket event to assigned agents/counsellors in CRM
          console.log(`[PRD Handoff] Emitting 'handoff_request' event. Tenant: ${tenantId}, Contact Phone: ${contact.phone}, AssignedAgent: ${updatedContact?.assignedAgent || 'none'}, AssignedCounsellor: ${updatedContact?.assignedCounsellor || 'none'}`);
          if (io) {
            const contactObj = updatedContact ? (typeof updatedContact.toObject === 'function' ? updatedContact.toObject() : updatedContact) : contact;
            io.to(tenantId).emit('handoff_request', {
              contact: contactObj,
              message: 'A new lead is waiting for your response'
            });
            console.log(`[PRD Handoff] Socket emit completed to room ${tenantId}`);
          } else {
            console.warn('[PRD Handoff] Warning: io is not available inside processStep');
          }
        }
        else if (isNo) {
          const Settings = require('../models/core/Settings');
          const settingsObj = await Settings.findOne({ tenantId });
          const uniName = settingsObj?.workspace?.name || "our institution";
          const goodbyeMsg = settingsObj?.automation?.aiPrompts?.goodbyeMessage || `Thank you for contacting Gandhinagar University.\nHave a great day!`;
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
      try {
         const tenantDb = require('../config/db').getTenantConnection(tenantId);
         const ContactModelLocal = tenantDb.model('Contact', require('../models/tenant/Contact'));
         const MessageModelLocal = tenantDb.model('Message', require('../models/tenant/Message'));
         const c = await ContactModelLocal.findOne({ phone: contact.phone });
         if (c) {
             const msgs = await MessageModelLocal.find({ contactId: c._id }).sort({ timestamp: -1 }).limit(10);
             const AIServiceLocal = require('./ai.service');
             const { score, heatLevel, botQuestionsAnswered } = await AIServiceLocal.calculateLeadScore(c, msgs);
             await ContactModelLocal.findByIdAndUpdate(c._id, { score, heatLevel, botQuestionsAnswered });
             if (io) io.to(tenantId).emit('lead_score_updated', { contactId: c._id, score, heatLevel, botQuestionsAnswered });
         }
      } catch (scoreErr) {
         console.error('[PRD] Score update failed:', scoreErr.message);
      }
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
    console.log("[PRD Flow] Steps in transition for", contact.phone, ":", JSON.stringify(steps.map(s => ({id: s.id, type: s.type})), null, 2));
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



    if (!nextStep) {
      // Fallbacks if no next step exists in visual builder
      if (completedLower.includes('program') || completedLower === 'program_selection') {
        await ContactModel.updateOne({ phone: contact.phone }, { $set: { currentFlowStep: 'ask_call_date' } });
        const callTimeMsg = "When should our counselor contact you?";
        const dateButtons = [
          'TODAY',
          'TOMORROW',
          'CUSTOM DATE (TEXT)'
        ];
        await this.sendInteractiveOptionsHelper(contact, waService, callTimeMsg, dateButtons, settings, io);
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

    const nextStepType = (nextStep.type || '').toUpperCase();
    console.log(`[PRD Flow] 🔀 Transitioning dynamically from "${completedTypeOrId}" to "${nextStep.title}" (Type: ${nextStepType}, ID: ${nextStep.id})`);

    if (nextStepType === 'CALL_TIME') {
      await ContactModel.updateOne({ phone: contact.phone }, { $set: { currentFlowStep: 'ask_call_date' } });
      let callTimeMsg = nextStep.message || nextStep.text || "When should our counselor contact you?";
      callTimeMsg = this.populatePlaceholders(callTimeMsg, contact, nameVal);
      const dateButtons = [
        'TODAY',
        'TOMORROW',
        'CUSTOM DATE (TEXT)'
      ];
      await this.sendInteractiveOptionsHelper(contact, waService, callTimeMsg, dateButtons, settings, io);
    }
    else if (nextStepType === 'CUSTOM_MESSAGE' || nextStepType === 'SUCCESS_PROOF') {
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
          await saveAndEmit('interactive', media ? `[Media] ${media}\n${msg}` : msg, resMsg);
          singleInteractiveSent = true;
        } catch (mediaErr) {
          console.error('[PRD] Failed to send single interactive media message, falling back to split sending:', mediaErr.message);
        }
      }

      if (!singleInteractiveSent) {
        if (media) {
          try {
            resMsg = await waService.sendMedia(contact.phone, 'image', null, msg, media);
            await saveAndEmit('image', media ? `[Media] ${media}\n${msg}` : msg, resMsg);
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
    else if (nextStepType === 'QUALIFICATION') {
      await ContactModel.updateOne({ phone: contact.phone }, { $set: { currentFlowStep: 'ask_qualification' } });
      let qualMsg = nextStep.message || nextStep.text || `Please select your qualification.`;
      qualMsg = this.populatePlaceholders(qualMsg, contact, nameVal);
      let options = settings?.automation?.aiPrompts?.qualificationOptions || ['12th Pass', 'Graduation', 'Other'];
      await this.sendInteractiveOptionsHelper(contact, waService, qualMsg, options, settings, io);
    }
    else if (nextStepType === 'PROGRAM_SELECTION') {
      const fresh = await ContactModel.findOne({ phone: contact.phone });
      const contactQual = fresh.qualification || '';
      
      let programMap = this.getCleanProgramMap(settings);

      const matchedQualKey = this.getMatchedQualificationKey(programMap, contactQual);

      if (matchedQualKey && programMap[matchedQualKey]) {
        const qualData = programMap[matchedQualKey];
        if (Array.isArray(qualData)) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              selectedStream: 'General',
              'flowVariables.selectedStream': 'General',
              currentFlowStep: 'ask_program'
            }
          });
          let progMsg = nextStep.message || nextStep.text || "Please select your preferred program.";
          progMsg = this.populatePlaceholders(progMsg, fresh, nameVal);
          await this.sendInteractiveOptionsHelper(contact, waService, progMsg, qualData, settings, io);
        } else {
          const categories = Object.keys(qualData).filter(k => !k.startsWith('_') && k !== 'categoryMessage');
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
            
            const val = qualData[streamName];
            const programs = (val && typeof val === 'object' && !Array.isArray(val)) ? (val.programs || val.courses || val.Programs || val.Courses || val.Modes || val.modes || Object.values(val).find(Array.isArray) || []) : (val || []);
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
    else if (nextStepType === 'NAME_CAPTURE') {
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
    else if (nextStepType === 'GREETING') {
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

  async sendInteractiveOptionsHelper(contact, waService, body, options, settings = null, io = null, buttonText = 'View Options') {
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
        buttonText,
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
      const { score, heatLevel, botQuestionsAnswered } = await AIService.calculateLeadScore(contact, messages);
      await Contact.findByIdAndUpdate(contactId, { score, heatLevel, botQuestionsAnswered });
      if (io) io.to(tenantId).emit('lead_score_updated', { contactId, score, heatLevel, botQuestionsAnswered });
    } catch (err) {}
  }
}

module.exports = new PRDFlowService();
