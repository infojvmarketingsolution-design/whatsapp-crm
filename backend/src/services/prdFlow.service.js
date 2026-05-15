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
const { aggressiveNormalize } = require('../utils/text.utils');

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

  async processStep(tenantId, contact, messageText, waService, io, isAutoFollowup = false, replyValue = null) {
    const lockKey = `${tenantId}_${contact.phone}`;
    if (this.activeProcesses.has(lockKey) && !isAutoFollowup) return;
    this.activeProcesses.add(lockKey);

    console.log(`[PRD] 🌀 Node: ${contact.currentFlowStep || 'START'} | Msg: ${messageText} | Reply: ${replyValue}`);

    // --- PAUSE CHECK ---
    if (contact.isBotPaused) {
      if (contact.botPauseUntil && new Date() > new Date(contact.botPauseUntil)) {
         // Auto-resume if timer expired
         await Contact.updateOne({ phone: contact.phone }, { isBotPaused: false, botPauseUntil: null });
      } else {
         console.log(`[PRD] ⏹️ Bot is paused for ${contact.phone}. Skipping automation.`);
         return;
      }
    }

    try {
      const tenantDb = getTenantConnection(tenantId);
      const Contact = tenantDb.model('Contact', ContactSchema);
      const Message = tenantDb.model('Message', MessageSchema);
      const Lead = tenantDb.model('Lead', LeadSchema);
      const SuccessStory = tenantDb.model('SuccessStory', SuccessStorySchema);

      const settings = await Settings.findOne({ tenantId });
      const aiPrompts = settings?.automation?.aiPrompts || {};
      
      const defaultProgramMap = {
        "10th Pass": { "Diploma Programs": ["Diploma in IT", "Diploma in Computer", "Diploma in Civil"] },
        "12th Pass": {
          "Trending Programs": ["B.Sc Cyber Security", "B.Sc AI & ML", "B.Sc Animation", "B.Sc Cloud Automation", "B.Sc Software Development", "B.Sc Blockchain Technology", "B.Sc Data Analytics"],
          "Traditional Programs": ["B.Com", "B.Tech", "BBA"]
        },
        "Graduate": { "Master Programs": ["MCA", "MBA", "M.Tech"] },
        "Working Professional": { "Executive Programs": ["Executive MBA", "Part-time M.Tech"] }
      };

      const qualificationOptions = aiPrompts.qualificationOptions && aiPrompts.qualificationOptions.length > 0 ? aiPrompts.qualificationOptions : ['10th Pass', '12th Pass', 'Graduate', 'Working Professional'];
      const programMap = (aiPrompts.programMap && Object.keys(aiPrompts.programMap).length > 0) ? aiPrompts.programMap : defaultProgramMap;
      const flowStepsRaw = (aiPrompts.prdFlowSteps && aiPrompts.prdFlowSteps.length > 0) ? aiPrompts.prdFlowSteps : this.DEFAULT_PRD_FLOW_STEPS;

      // Normalize flow steps to executable format
      const flowSteps = flowStepsRaw.map(step => {
        if (step.data) return step;
        let nodeData = { text: step.message, msgType: 'TEXT', buttons: step.buttons };
        if (step.type === 'GREETING') { 
           nodeData.msgType = (step.buttons && step.buttons.length) ? 'INTERACTIVE' : (step.image ? 'IMAGE' : 'TEXT'); 
           nodeData.mediaUrl = step.image; 
        }
        else if (step.type === 'NAME_CAPTURE') { nodeData.msgType = 'QUESTION'; nodeData.variableName = 'name'; }
        else if (step.type === 'QUALIFICATION') { nodeData.msgType = 'LIST_MESSAGE'; nodeData.variableName = 'qualification'; nodeData.listOptions = qualificationOptions; }
        else if (step.type === 'PROGRAM_SELECTION') { nodeData.msgType = 'LIST_MESSAGE'; nodeData.variableName = 'program'; nodeData.isProgramSelection = true; }
        else if (step.type === 'CALL_TIME') { nodeData.msgType = 'INTERACTIVE'; nodeData.variableName = 'time'; nodeData.buttons = step.buttons || step.options || ['Morning', 'Afternoon', 'Evening']; }
        else if (step.type === 'CUSTOM_MESSAGE') { nodeData.msgType = (step.buttons && step.buttons.length) ? 'INTERACTIVE' : (step.image ? 'IMAGE' : 'TEXT'); nodeData.mediaUrl = step.image; }
        else if (step.type === 'CUSTOM_QUESTION') { nodeData.msgType = (step.buttons && step.buttons.length) ? 'INTERACTIVE' : 'QUESTION'; nodeData.variableName = `custom_${step.id}`; }
        else if (step.type === 'SUCCESS_PROOF') { nodeData.msgType = (step.buttons && step.buttons.length) ? 'INTERACTIVE' : (step.image ? 'IMAGE' : 'TEXT'); nodeData.mediaUrl = step.image; nodeData.isSuccessProof = true; }
        return { id: step.id, type: 'messageNode', data: nodeData };
      });

      const aggressiveNormalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

      const replaceVars = (str) => {
        if (!str) return '';
        const vars = contact.flowVariables || {};
        const name = vars.name || contact.name || 'Friend';
        return str.replace(/\{{1,2}name\}{1,2}/gi, name)
                  .replace(/\{{1,2}qualification\}{1,2}/gi, vars.qualification || 'qualification')
                  .replace(/\{{1,2}program\}{1,2}/gi, vars.program || 'program')
                  .replace(/\{{1,2}time\}{1,2}/gi, vars.time || 'time');
      };

      const saveAndEmit = async (type, payload, waResult) => {
        const msgId = waResult?.messages?.[0]?.id || `out_${Date.now()}`;
        const msg = await Message.create({ contactId: contact._id, messageId: msgId, direction: 'OUTBOUND', type, content: payload, status: 'SENT' });
        if (io) io.to(tenantId).emit('current_chat_message', { ...msg._doc, contact });
      };

      // Find current node
      let currentStepId = contact.currentFlowStep || flowSteps[0]?.id;
      let stepToProcess = flowSteps.find(s => s.id === currentStepId) || flowSteps[0];
      
      let consumeInput = !!contact.currentFlowStep && !isAutoFollowup;
      let iterations = 0;

      while (stepToProcess && iterations < 10) {
        iterations++;
        const nodeData = stepToProcess.data || {};
        const varName = nodeData.variableName;
        let forceStay = false;

        // --- PHASE A: HANDLE INPUT ---
        if (consumeInput && varName) {
          let val = (replyValue && !replyValue.startsWith('list_') ? replyValue : messageText || '').trim();
          const nv = aggressiveNormalize(val);

          if (varName === 'name') {
            const extName = await AIService.extractData(val, 'NAME');
            val = (extName && extName.length < 50) ? extName : val;
            await Contact.updateOne({ phone: contact.phone }, { $set: { name: val, 'flowVariables.name': val } });
            contact.name = val;
            if (!contact.flowVariables) contact.flowVariables = {};
            contact.flowVariables.name = val;
          } 
          else if (varName === 'qualification') {
            let matched = qualificationOptions.find(o => aggressiveNormalize(o) === nv);
            if (!matched) matched = qualificationOptions.find(o => aggressiveNormalize(o).includes(nv) || nv.includes(aggressiveNormalize(o)));
            
            if (matched) {
              await Contact.updateOne({ phone: contact.phone }, { $set: { qualification: matched, selectedStream: null, 'flowVariables.qualification': matched, 'flowVariables.selectedStream': null } });
              contact.qualification = matched;
              contact.selectedStream = null;
              if (!contact.flowVariables) contact.flowVariables = {};
              contact.flowVariables.qualification = matched;
              contact.flowVariables.selectedStream = null;
            }
          } 
          else if (varName === 'program' && nodeData.isProgramSelection) {
             const currentQual = contact.qualification || contact.flowVariables?.qualification || '';
             const tqc = aggressiveNormalize(currentQual);
             
             // 🎯 DEFINE MAPPINGS
             let qm = {};
             const qk = Object.keys(programMap).find(k => aggressiveNormalize(k) === tqc || (tqc && aggressiveNormalize(k).includes(tqc)));
             qm = qk ? programMap[qk] : {};

             if (Array.isArray(qm)) qm = { "Programs": qm };
             const categories = Object.keys(qm);
             const stream = contact.selectedStream || contact.flowVariables?.selectedStream;

             // Logic: If user selected a category, save it and show programs. Otherwise save program.
             const matchedCategory = categories.find(c => aggressiveNormalize(c) === nv || aggressiveNormalize(c).includes(nv));
             if (matchedCategory) {
                await Contact.updateOne({ phone: contact.phone }, { $set: { selectedStream: matchedCategory, 'flowVariables.selectedStream': matchedCategory } });
                contact.selectedStream = matchedCategory;
                contact.flowVariables.selectedStream = matchedCategory;
                forceStay = true;
             } else if (categories.length > 1) {
                // If they gave an invalid category but categories exist, force them to stay to see the categories again
                forceStay = true;
             } else {
                await Contact.updateOne({ phone: contact.phone }, { $set: { selectedProgram: val, 'flowVariables.program': val, 'flowVariables.selectedStream': null } });
                contact.selectedProgram = val;
                contact.flowVariables.program = val;
                contact.flowVariables.selectedStream = null;
             }
          }
          else {
            const dbUpdates = { [`flowVariables.${varName}`]: val };
            if (varName === 'profession') dbUpdates.profession = val;
            else if (varName === 'budget') dbUpdates.budget = val;
            else if (varName === 'time') {
               dbUpdates.preferredCallTime = val;
               
               // AUTO LEAD GENERATION
               try {
                  let assignedAgentId = null;
                  if (settings?.crm?.autoAssignment) assignedAgentId = await assignmentService.getNextAgentForTenant(tenantId);

                  await Lead.create({ 
                     tenantId, 
                     name: contact.flowVariables.name, 
                     phone: contact.phone, 
                     qualification: contact.flowVariables.qualification, 
                     selectedProgram: contact.flowVariables.program, 
                     status: 'QUALIFIED',
                     assignedAgent: assignedAgentId,
                     leadSource: 'AI Qualified'
                  });

                  notificationService.sendAdminAlert(tenantId, {
                     subject: 'New AI Qualified Lead 🎓',
                     text: `Lead *${contact.flowVariables.name}* (${contact.phone}) qualified.\nQual: ${contact.flowVariables.qualification}\nProg: ${contact.flowVariables.program}`
                  });
               } catch (e) { console.error("[PRD] Lead Error:", e); }
            }

            await Contact.updateOne({ phone: contact.phone }, { $set: dbUpdates });
            if (!contact.flowVariables) contact.flowVariables = {};
            contact.flowVariables[varName] = val;

            if (varName === 'additionalHelp') {
                if (aggressiveNormalize(val) === 'yes') {
                   await waService.sendTextMessage(contact.phone, "Connecting you to our expert agent 👨‍💼");
                   await Contact.updateOne({ phone: contact.phone }, { isBotPaused: true });
                   notificationService.sendAdminAlert(tenantId, {
                      subject: 'Human Handoff Requested 🙋‍♂️',
                      text: `Lead *${contact.name || contact.phone}* requested a human agent.`
                   });
                   return;
                } else {
                   await waService.sendTextMessage(contact.phone, `Thank you ${contact.flowVariables.name || contact.name || ''}, have a great day! 🌟`);
                   return;
                }
            }
          }
          
          // --- HANDOFF DETECTION ---
          if (aggressiveNormalize(val) === 'talktoagent' || aggressiveNormalize(val) === 'help') {
             await Contact.updateOne({ phone: contact.phone }, { isBotPaused: true });
             notificationService.sendAdminAlert(tenantId, {
                subject: 'Human Handoff Requested 🙋‍♂️',
                text: `Lead *${contact.name || contact.phone}* requested a human agent.`
             });
             await waService.sendTextMessage(contact.phone, "Sure! I've alerted our team. An agent will be with you shortly. 👨‍💻");
             return;
          }
        }

        // --- PHASE B: NEXT STEP TRANSITION ---
        if (consumeInput && !forceStay) {
          const idx = flowSteps.findIndex(s => s.id === stepToProcess.id);
          if (idx !== -1 && flowSteps[idx+1]) {
            stepToProcess = flowSteps[idx+1];
            consumeInput = false;
            continue;
          } else {
            await Contact.updateOne({ phone: contact.phone }, { $unset: { currentFlowStep: '' } });
            break;
          }
        }

        // --- PHASE C: LOG ANALYTICS ---
        const BotAnalytics = tenantDb.model('BotAnalytics', BotAnalyticsSchema);
        await BotAnalytics.create({
          tenantId,
          contactId: contact._id,
          nodeId: currentNode.id,
          nodeType: currentNode.type,
          eventType: (currentNode.type === 'SUCCESS_PROOF' || currentNode.type === 'CALL_TIME') ? 'CONVERSION' : 'VIEW'
        });

        if (currentNode.type === 'SUCCESS_PROOF' || currentNode.type === 'CALL_TIME') {
           integrationService.triggerWebhook(tenantId, 'BOT_CONVERSION', {
              contact: { id: contact._id, phone: contact.phone, name: contact.name },
              node: currentNode.id,
              type: currentNode.type
           });
        }

        // --- PHASE D: EXECUTE CURRENT STEP (SEND) ---
        let text = replaceVars(nodeData.text || '');
        if (nodeData.isSuccessProof) {
          const stories = await SuccessStory.find({ status: 'ACTIVE' }).limit(3);
          if (stories.length > 0) {
            const storyText = stories.map(s => `🎓 *${s.studentName}*\nPlaced at: *${s.company}*\nPackage: *${s.package}*\n_"${s.quote}"_`).join('\n\n');
            text = `${text}\n\n${storyText}`;
          }
        }
        
        const media = this.makeAbsolute(nodeData.mediaUrl || '');

        if (nodeData.msgType === 'IMAGE' && media) {
          const res = await waService.sendMedia(contact.phone, 'image', /^\d+$/.test(media) ? media : null, text, /^\d+$/.test(media) ? null : media);
          await saveAndEmit('image', text, res);
        }
        else if (nodeData.msgType === 'LIST_MESSAGE') {
          let opts = nodeData.listOptions || [];
          let body = text;

          if (nodeData.isProgramSelection) {
            const currentQual = contact.qualification || contact.flowVariables?.qualification || '';
            const stream = contact.selectedStream || contact.flowVariables?.selectedStream;
            const tqc = aggressiveNormalize(currentQual);
            
            let qm = {};
            const qk = Object.keys(programMap).find(k => aggressiveNormalize(k) === tqc || (tqc && aggressiveNormalize(k).includes(tqc)));
            qm = qk ? programMap[qk] : {};

            if (Array.isArray(qm)) qm = { "Programs": qm };
            const categories = Object.keys(qm);

            if (!stream) {
              if (categories.length === 1) {
                const auto = categories[0];
                await Contact.updateOne({ phone: contact.phone }, { $set: { selectedStream: auto, 'flowVariables.selectedStream': auto } });
                contact.selectedStream = auto;
                contact.flowVariables.selectedStream = auto;
                opts = Array.isArray(qm[auto]) ? qm[auto] : [];
                if (tqc.includes('10')) body = `Great choice {{name}}! 🎓\n\nHere are Diploma programs for you:`;
                else body = `Select your program under ${auto}:`;
              } else {
                opts = categories.length > 0 ? categories : ['General Inquiry'];
                if (tqc.includes('12')) body = `Please select your preferred program category.`;
                else if (tqc.includes('grad') || tqc.includes('bach')) body = `🎯 *Top Master Programs* 🔥\n\nChoose your interest, {{name}} 👇`;
                else body = "Please select your preferred program category.";
              }
            } else {
              opts = qm[stream] || ['General Inquiry'];
              body = `Choose a program in ${stream}:`;
            }
          }

          if (nodeData.isProgramSelection && !contact.selectedStream && !contact.flowVariables?.selectedStream && opts.length > 0 && opts.length <= 3) {
             const res = await waService.sendInteractiveButtonMessage(contact.phone, { body, buttons: opts.slice(0, 3) });
             await saveAndEmit('interactive', body, res);
          } else {
             const isCourseLevel = nodeData.isProgramSelection && (contact.selectedStream || contact.flowVariables?.selectedStream);
             const buttonText = isCourseLevel ? 'View Courses' : 'Select Option';
             const sectionTitle = isCourseLevel ? (contact.selectedStream || contact.flowVariables?.selectedStream) : 'Available Options';
             const listBody = isCourseLevel ? 'Please select your preferred course' : body;
             const headerText = isCourseLevel ? (contact.selectedStream || contact.flowVariables?.selectedStream) : undefined;

             await waService.sendListMessage(contact.phone, { header: headerText, body: listBody, buttonText: buttonText, sections: [{ title: sectionTitle, rows: opts.slice(0, 10).map((o, i) => ({ id: `list_${i}`, title: String(o).substring(0, 24) })) }] });
             await saveAndEmit('interactive', body, null);
          }

          await Contact.updateOne({ phone: contact.phone }, { currentFlowStep: stepToProcess.id });
          return;
        }
        else if (nodeData.msgType === 'INTERACTIVE') {
          const btns = nodeData.buttons || ['Morning', 'Afternoon', 'Evening'];
          const parsedBtns = btns.map(b => typeof b === 'string' ? { type: 'reply', label: b, value: b } : b);
          const hasUrlOrCall = parsedBtns.find(b => b.type === 'url' || b.type === 'call');

          if (media) {
             // Send media separately first if there's media on an interactive node
             await waService.sendMedia(contact.phone, 'image', /^\d+$/.test(media) ? media : null, '', /^\d+$/.test(media) ? null : media);
          }

          if (hasUrlOrCall) {
            const res = await waService.sendCtaMessage(contact.phone, { type: hasUrlOrCall.type, body: text, title: hasUrlOrCall.label, value: hasUrlOrCall.value });
            await saveAndEmit('interactive', text, res);
          } else {
            // Handle specialized button types
            const handoffBtn = parsedBtns.find(b => b.type === 'handoff');
            if (handoffBtn) {
               // If a handoff button is clicked, we essentially pause the bot immediately
               // But usually, we wait for the user to actually click it.
               // For now, we'll just treat 'handoff' as a trigger for the 'Talk to Agent' logic
            }
            
            const scheduleBtn = parsedBtns.find(b => b.type === 'schedule');
            if (scheduleBtn) {
               // Logic to inject dynamic slots
            }

            const replyLabels = parsedBtns.map(b => b.label);
            const res = await waService.sendInteractiveButtonMessage(contact.phone, { body: text, buttons: replyLabels.slice(0, 3) });
            await saveAndEmit('interactive', text, res);
          }
          
          if (nodeData.variableName) {
            await Contact.updateOne({ phone: contact.phone }, { currentFlowStep: stepToProcess.id });
            return;
          }
        }
        else {
          let res;
          if (media) {
             res = await waService.sendMedia(contact.phone, 'image', /^\d+$/.test(media) ? media : null, text, /^\d+$/.test(media) ? null : media);
             await saveAndEmit('image', text, res);
          } else {
             res = await waService.sendTextMessage(contact.phone, text);
             await saveAndEmit('text', text, res);
          }
          if (nodeData.msgType === 'QUESTION') {
            await Contact.updateOne({ phone: contact.phone }, { currentFlowStep: stepToProcess.id });
            return;
          }
        }

        // Advance to next step for purely informational nodes
        const idx = flowSteps.findIndex(s => s.id === stepToProcess.id);
        if (idx !== -1 && flowSteps[idx+1]) {
          stepToProcess = flowSteps[idx+1];
          consumeInput = false;
          await this.sleep(1000);
        } else {
          await Contact.updateOne({ phone: contact.phone }, { $unset: { currentFlowStep: '' } });
          break;
        }
      }
    } catch (err) {
      console.error(`[PRD] ❌ Error:`, err);
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
