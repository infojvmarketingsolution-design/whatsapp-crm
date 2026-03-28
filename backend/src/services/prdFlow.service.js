const MessageSchema = require('../models/tenant/Message');
const ContactSchema = require('../models/tenant/Contact');
const LeadSchema = require('../models/crm/Lead');
const { getTenantConnection } = require('../config/db');
const AIService = require('./ai.service');
const Settings = require('../models/core/Settings');
const mongoose = require('mongoose');


class PRDFlowService {
  constructor() {
    this.QUALIFICATION_OPTIONS = [
      '10th Pass',
      '12th Pass',
      'Diploma Completed',
      'Graduation Completed',
      'Master Completed'
    ];

    this.PROGRAM_MAP = {
      '10th Pass': {
        'Diploma Programs': ['Diploma in Engineering', 'IT Diploma', 'Animation Diploma']
      },
      '12th Pass': {
        'Trending Programs': ['B.Sc IT (Cyber Security)', 'AI & ML', 'Cloud Automation', 'Animation, VFX & Game Design'],
        'Traditional Programs': ['BBA', 'B.Com', 'BCA', 'B.Sc']
      },
      'Diploma Completed': {
        'Bachelor Programs': ['Electrical Engineering', 'Civil Engineering', 'Mechanical Engineering']
      },
      'Graduation Completed': {
        'Trending Master Programs': ['M.Sc IT (Cyber Security)', 'AI & ML', 'Cloud Automation', 'Animation, VFX & Game Design'],
        'Traditional Master Programs': ['MBA', 'M.Com', 'MCA', 'M.Sc']
      },
      'Master Completed': {
        'PhD Programs': ['PhD in Marketing', 'PhD in Civil Engineering', 'PhD in IT']
      }
    };
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

    switch (currentState) {
      case 'START_PRD_FLOW': {
        const greeting = replaceVars(prompts.greetingMessage);
        // Use default if empty or not provided
        const greetingImg = (prompts.greetingImage && prompts.greetingImage.trim() !== '') 
          ? prompts.greetingImage 
          : 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=60';
        
        console.log(`[PRD Flow] START_PRD_FLOW for ${contact.phone}. Image: ${greetingImg}`);

        // PRD Step 1: Send Greeting Image + Text (Joined as one message)
        if (greetingImg) {
          try {
            const isId = /^\d+$/.test(greetingImg);
            console.log(`[PRD Flow] 🚀 Attempting Joint Greeting: ${isId ? 'ID' : 'URL'} | Contact: ${contact.phone}`);
            
            const imgRes = await waService.sendMedia(contact.phone, 'image', isId ? greetingImg : null, greeting, isId ? null : greetingImg);
            await saveAndEmit('image', `[Media] ${greetingImg}\n${greeting}`, imgRes);
            console.log(`[PRD Flow] ✅ Joint Greeting Sent.`);
          } catch (mediaErr) {
            console.error(`[PRD Flow] ❌ Joint Send Failed, Falling back:`, mediaErr.message);
            const gRes = await waService.sendTextMessage(contact.phone, greeting);
            await saveAndEmit('text', greeting, gRes);
          }
        } else {
            console.log(`[PRD Flow] 📝 No image set. Sending text-only greeting.`);
            const gRes = await waService.sendTextMessage(contact.phone, greeting);
            await saveAndEmit('text', greeting, gRes);
        }

        // PRD Step 3: Send Name Prompt as a separate message
        // Add a 1s delay so greeting/image arrive first
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const nPrompt = replaceVars(prompts.namePrompt);
        const nameRes = await waService.sendTextMessage(contact.phone, nPrompt);
        await saveAndEmit('text', nPrompt, nameRes);
        
        await Contact.findByIdAndUpdate(contact._id, { currentFlowStep: 'AWAITING_NAME' });
        triggerScoreUpdate();
        break;
      }

      case 'AWAITING_NAME': {
        const cleanMessage = messageText.trim();
        const words = cleanMessage.split(/\s+/);
        let name = cleanMessage;
        
        // Fast-Mode: If message is 1-2 words, skip OpenAI to save 3-5 seconds
        if (words.length > 2) {
          console.log(`[PRD Flow] Complex name detected, calling AI extraction...`);
          name = await AIService.extractData(cleanMessage, 'NAME');
        } else {
          console.log(`[PRD Flow] Fast-mode name capture: ${name}`);
        }

        const reply = replaceVars(prompts.programListPrompt).replace(/{{name}}/g, name);
        
        await waService.sendListMessage(contact.phone, {
          header: 'Education Qualification',
          body: reply,
          buttonText: 'Select Qualification',
          sections: [{
            title: 'Current Level',
            rows: this.QUALIFICATION_OPTIONS.map((opt, i) => ({
              id: `qual_${i}`,
              title: opt
            }))
          }]
        });
        await saveAndEmit('interactive', reply, null);
        await Contact.findByIdAndUpdate(contact._id, { 
          name, 
          currentFlowStep: 'AWAITING_QUALIFICATION',
          [`flowVariables.name`]: name,
          $push: { timeline: { eventType: 'AI_MILESTONE', description: `Name captured: ${name}`, timestamp: new Date() } }
        });
        triggerScoreUpdate();
        break;
      }

      case 'AWAITING_QUALIFICATION': {
        let qual = messageText.trim();
        // Check if message matches any of our qualification options exactly
        if (!this.QUALIFICATION_OPTIONS.includes(qual)) {
           // Fallback check: maybe it matched a row ID or has minor case diff
           const matched = this.QUALIFICATION_OPTIONS.find(opt => opt.toLowerCase() === qual.toLowerCase());
           if (matched) qual = matched;
           else return; // Ignore if it doesn't match a valid qualification
        }

        const sections = Object.keys(this.PROGRAM_MAP[qual]).map(secTitle => ({
          title: secTitle,
          rows: this.PROGRAM_MAP[qual][secTitle].map((progName, i) => ({
            id: `prog_${qual.substring(0,3)}_${i}`,
            title: progName
          }))
        }));

        let reply = `Great, ${contact.name || 'Friend'}! Please select your preferred program for *${qual}*:`;
        
        await waService.sendListMessage(contact.phone, {
          header: 'Program Selection',
          body: reply,
          buttonText: 'View Programs',
          sections
        });
        await saveAndEmit('interactive', reply, null);

        await Contact.findByIdAndUpdate(contact._id, { 
          currentFlowStep: 'AWAITING_PROGRAM',
          qualification: qual,
          [`flowVariables.qualification`]: qual,
          $push: { timeline: { eventType: 'AI_MILESTONE', description: `Qualification captured: ${qual}`, timestamp: new Date() } }
        });
        triggerScoreUpdate();
        break;
      }

      case 'AWAITING_PROGRAM': {
        const selectedProgram = messageText;
        
        // 1. Combine Program Confirmation & Conversion Boosters into one professional message
        const acknowledgment = `Great choice! *${selectedProgram}* is an excellent program. 🎓\n\n⚠️ *Hurry ${contact.name || ''}!* Only limited seats available. Admissions are filling fast for this intake.\n\n🎁 *Good News!* You may be eligible for a Scholarship up to 30%. Our counsellor will guide you on how to claim it.`;
        await waService.sendTextMessage(contact.phone, acknowledgment);

        // 2. Success Proof (Photo/Video) - Kept separate as it usually contains media
        const success = replaceVars(prompts.successProofMessage);
        const successImg = prompts.successProofImage;
        
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

        // 3. Ask Call Time (Immediate interactive follow-up)
        const timeMsg = replaceVars(prompts.callTimePrompt);
        const res = await waService.sendInteractiveButtonMessage(contact.phone, {
          body: timeMsg,
          buttons: ['Morning (10AM-1PM)', 'Afternoon (1PM-5PM)', 'Evening (5PM-8PM)']
        });
        await saveAndEmit('interactive', timeMsg, res);

        await Contact.findByIdAndUpdate(contact._id, { 
          currentFlowStep: 'AWAITING_CALL_TIME',
          selectedProgram: selectedProgram,
          [`flowVariables.selectedProgram`]: selectedProgram,
          $push: { timeline: { eventType: 'AI_MILESTONE', description: `Program selected: ${selectedProgram}`, timestamp: new Date() } }
        });
        break;
      }

      case 'AWAITING_CALL_TIME': {
        const preferredTime = messageText;
        const vars = contact.flowVariables || {};
        
        // Final Summary
        const summary = `Thank you ${contact.name || ''} 🙌\n\nHere are your details:\n🎓 Qualification: ${vars.qualification}\n📘 Selected Program: ${vars.selectedProgram}\n⏰ Preferred Time: ${preferredTime}\n\nOur counsellor will call you at your selected time 📞`;
        await waService.sendTextMessage(contact.phone, summary);

        // Create Lead in CRM
        try {
          await Lead.create({
            name: contact.name || 'WhatsApp User',
            phone: contact.phone,
            qualification: vars.qualification,
            selectedProgram: vars.selectedProgram,
            preferredCallTime: preferredTime,
            leadSource: 'whatsapp_ai_bot',
            status: 'QUALIFIED'
          });
        } catch (err) {
          console.error('[PRD Flow] Lead creation error:', err.message);
        }

        const helpMsg = `May I help you with anything else?`;
        const res = await waService.sendInteractiveButtonMessage(contact.phone, {
          body: helpMsg,
          buttons: ['Yes', 'No']
        });
        await saveAndEmit('interactive', helpMsg, res);

        await Contact.findByIdAndUpdate(contact._id, { 
          currentFlowStep: 'AWAITING_ADDITIONAL_HELP',
          preferredCallTime: preferredTime,
          $push: { timeline: { eventType: 'AI_MILESTONE', description: `Counsellor call scheduled for: ${preferredTime}`, timestamp: new Date() } }
        });
        break;
      }

      case 'AWAITING_ADDITIONAL_HELP': {
        if (messageText.toLowerCase().includes('yes')) {
          const transferMsg = replaceVars(prompts.agentTransferPrompt);
          await waService.sendTextMessage(contact.phone, transferMsg);
          // Flag for human agent
          await Contact.findByIdAndUpdate(contact._id, { 
            status: 'FOLLOW_UP',
            $unset: { currentFlowStep: "" },
            $push: { timeline: { eventType: 'HANDOVER', description: `User requested human assistance.`, timestamp: new Date() } }
          });
        } else {
          const bye = `Thank you ${contact.name || ''}, have a great day! 🌟`;
          await waService.sendTextMessage(contact.phone, bye);
          await Contact.findByIdAndUpdate(contact._id, { 
            $unset: { currentFlowStep: "" },
            $push: { timeline: { eventType: 'AI_JOURNEY_COMPLETE', description: `User finished flow without assistance.`, timestamp: new Date() } }
          });
        }
        break;
      }

      default:
        // Reset or fallback
        await Contact.findByIdAndUpdate(contact._id, { $unset: { currentFlowStep: "" } });
        break;
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
