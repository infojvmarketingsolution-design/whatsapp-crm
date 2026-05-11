const MessageSchema = require('../models/tenant/Message');
const ContactSchema = require('../models/tenant/Contact');
const LeadSchema = require('../models/crm/Lead');
const { getTenantConnection } = require('../config/db');
const AIService = require('./ai.service');
const Settings = require('../models/core/Settings');
const mongoose = require('mongoose');
const assignmentService = require('./assignment.service');
const notificationService = require('./notification.service');

class PRDFlowService {
  constructor() {
    this.DEFAULT_PRD_FLOW_STEPS = [
      { id: 'greeting', type: 'messageNode', data: { msgType: 'IMAGE', text: 'Hello 👋 Welcome to JV Group!', mediaUrl: 'https://wapipulse.com/uploads/prompts/tenant_demo_001/prompt_1774743344804.jpeg' } },
      { id: 'ask_name', type: 'messageNode', data: { msgType: 'QUESTION', text: 'Great! May I know your name?', variableName: 'name' } },
      { id: 'profession', type: 'messageNode', data: { msgType: 'QUESTION', text: '{{name}}, what is your current profession? 💼', variableName: 'profession' } },
      { id: 'qualification', type: 'messageNode', data: { msgType: 'LIST_MESSAGE', text: '{{name}}, please select your last qualification 👇', variableName: 'qualification', listOptions: ['10th Pass', '12th Pass', 'Diploma Complete', 'Graduation complete', 'Master complete', 'phD complete'] } },
      { id: 'program', type: 'messageNode', data: { msgType: 'LIST_MESSAGE', text: 'Great {{name}}! Please select your preferred program:', variableName: 'program' } },
      { id: 'budget', type: 'messageNode', data: { msgType: 'INTERACTIVE', text: '{{name}}, what is your estimated budget for the course? 💰', variableName: 'budget', buttons: ['Under 50k', '50k - 1 Lakh', 'Above 1 Lakh'] } },
      { id: 'careerGoal', type: 'messageNode', data: { msgType: 'QUESTION', text: '{{name}}, what is your long-term career goal? 🎯', variableName: 'careerGoal' } },
      { id: 'call_time', type: 'messageNode', data: { msgType: 'INTERACTIVE', text: '{{name}}, what is your preferred time for a call? 📞', variableName: 'time', buttons: ['Morning', 'Afternoon', 'Evening'] } },
      { id: 'thank_you', type: 'messageNode', data: { msgType: 'TEXT', text: 'Thank you {{name}} 🙌\n🎓 Qual: {{qualification}}\n📘 Prog: {{program}}\n💰 Budget: {{budget}}\n⏰ Time: {{time}}' } }
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

    try {
      const tenantDb = getTenantConnection(tenantId);
      const Contact = tenantDb.model('Contact', ContactSchema);
      const Message = tenantDb.model('Message', MessageSchema);
      const Lead = tenantDb.model('Lead', LeadSchema);

      const settings = await Settings.findOne({ tenantId });
      const aiPrompts = settings?.automation?.aiPrompts || {};
      
      const qualificationOptions = aiPrompts.qualificationOptions || ['10th Pass', '12th Pass', 'Diploma Complete', 'Graduation complete', 'Master complete', 'phD complete'];
      const programMap = aiPrompts.programMap || {};
      const flowStepsRaw = (aiPrompts.prdFlowSteps && aiPrompts.prdFlowSteps.length > 0) ? aiPrompts.prdFlowSteps : this.DEFAULT_PRD_FLOW_STEPS;

      // Normalize flow steps to executable format
      const flowSteps = flowStepsRaw.map(step => {
        if (step.data) return step;
        let nodeData = { text: step.message, msgType: 'TEXT' };
        if (step.type === 'GREETING') { nodeData.msgType = step.image ? 'IMAGE' : 'TEXT'; nodeData.mediaUrl = step.image; }
        else if (step.type === 'NAME_CAPTURE') { nodeData.msgType = 'QUESTION'; nodeData.variableName = 'name'; }
        else if (step.type === 'QUALIFICATION') { nodeData.msgType = 'LIST_MESSAGE'; nodeData.variableName = 'qualification'; nodeData.listOptions = qualificationOptions; }
        else if (step.type === 'PROGRAM_SELECTION') { nodeData.msgType = 'LIST_MESSAGE'; nodeData.variableName = 'program'; nodeData.isProgramSelection = true; }
        else if (step.type === 'CALL_TIME') { nodeData.msgType = 'INTERACTIVE'; nodeData.variableName = 'time'; nodeData.buttons = step.options || ['Morning', 'Afternoon', 'Evening']; }
        else if (step.type === 'CUSTOM_QUESTION') { nodeData.msgType = 'QUESTION'; nodeData.variableName = `custom_${step.id}`; }
        return { id: step.id, type: 'messageNode', data: nodeData };
      });

      const aggressiveNormalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

      const replaceVars = (str) => {
        if (!str) return '';
        const vars = contact.flowVariables || {};
        const name = vars.name || contact.name || 'Friend';
        return str.replace(/\{{1,2}name\}{1,2}/gi, name)
                  .replace(/\{{1,2}qualification\}{1,2}/gi, vars.qualification || 'qualification')
                  .replace(/\{{1,2}program\}{1,2}/gi, vars.program || 'program');
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
            await Contact.updateOne({ phone: contact.phone }, { name: val, 'flowVariables.name': val });
            contact.name = val;
            if (!contact.flowVariables) contact.flowVariables = {};
            contact.flowVariables.name = val;
          } 
          else if (varName === 'qualification') {
            let matched = qualificationOptions.find(o => aggressiveNormalize(o) === nv);
            if (!matched) matched = qualificationOptions.find(o => aggressiveNormalize(o).includes(nv) || nv.includes(aggressiveNormalize(o)));
            
            if (matched) {
              await Contact.updateOne({ phone: contact.phone }, { qualification: matched, 'flowVariables.qualification': matched, 'flowVariables.selectedStream': null });
              contact.qualification = matched;
              if (!contact.flowVariables) contact.flowVariables = {};
              contact.flowVariables.qualification = matched;
              contact.flowVariables.selectedStream = null;
            }
          } 
          else if (varName === 'program' && nodeData.isProgramSelection) {
             const currentQual = contact.flowVariables?.qualification || '';
             const tqc = aggressiveNormalize(currentQual);
             
             // 🎯 DEFINE MAPPINGS
             let qm = {};
             if (tqc.includes('12') || tqc.includes('hsc')) {
               qm = { "TRENDING PROGRAMS": ["B.Sc IT (Cyber Security)", "AI & ML", "Cloud Automation", "Animation, VFX & Games"], "TRADITIONAL PROGRAMS": ["BBA", "B.Com", "BCA", "B.Sc"] };
             } else if (tqc.includes('10') || tqc.includes('ssc')) {
               qm = { "DIPLOMA PROGRAMS": ["Diploma in Engineering", "IT Diploma", "Animation Diploma"] };
             } else if (tqc.includes('diplomacomplete')) {
               qm = { "BACHELOR PROGRAMS": ["Electrical Engineering", "Civil Engineering", "Mechanical Engineering"] };
             } else if (tqc.includes('grad') || tqc.includes('bach')) {
               qm = { "TRENDING MASTER PROGRAMS": ["M.Sc IT (Cyber Security)", "AI & ML", "Cloud Automation", "Animation, VFX & Games"], "TRADITIONAL MASTER PROGRAMS": ["MBA", "M.Com", "MCA", "M.Sc"] };
             } else if (tqc.includes('mastercomplete')) {
               qm = { "PHD PROGRAMS": ["PhD in Marketing", "PhD in Civil Engineering", "PhD in IT"] };
             } else if (tqc.includes('phdcomplete')) {
               qm = { "POST-DOC": ["Research Fellowship", "Academic Leadership"] };
             } else {
                const qk = Object.keys(programMap).find(k => aggressiveNormalize(k) === tqc || aggressiveNormalize(k).includes(tqc));
                qm = qk ? programMap[qk] : {};
             }

             if (Array.isArray(qm)) qm = { "Programs": qm };
             const categories = Object.keys(qm);
             const stream = contact.flowVariables?.selectedStream;

             // Logic: If user selected a category, save it and show programs. Otherwise save program.
             const matchedCategory = categories.find(c => aggressiveNormalize(c) === nv || aggressiveNormalize(c).includes(nv));
             if (matchedCategory) {
                await Contact.updateOne({ phone: contact.phone }, { 'flowVariables.selectedStream': matchedCategory });
                contact.flowVariables.selectedStream = matchedCategory;
                forceStay = true;
             } else {
                await Contact.updateOne({ phone: contact.phone }, { selectedProgram: val, 'flowVariables.program': val, 'flowVariables.selectedStream': null });
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

        // --- PHASE C: EXECUTE CURRENT STEP (SEND) ---
        const text = replaceVars(nodeData.text || '');
        const media = this.makeAbsolute(nodeData.mediaUrl || '');

        if (nodeData.msgType === 'IMAGE' && media) {
          const res = await waService.sendMedia(contact.phone, 'image', /^\d+$/.test(media) ? media : null, text, /^\d+$/.test(media) ? null : media);
          await saveAndEmit('image', text, res);
        }
        else if (nodeData.msgType === 'LIST_MESSAGE') {
          let opts = nodeData.listOptions || [];
          let body = text;

          if (nodeData.isProgramSelection) {
            const currentQual = contact.flowVariables?.qualification || '';
            const stream = contact.flowVariables?.selectedStream;
            const tqc = aggressiveNormalize(currentQual);
            
            let qm = {};
             if (tqc.includes('12') || tqc.includes('hsc')) { qm = { "TRENDING PROGRAMS": ["B.Sc IT (Cyber Security)", "AI & ML", "Cloud Automation", "Animation, VFX & Games"], "TRADITIONAL PROGRAMS": ["BBA", "B.Com", "BCA", "B.Sc"] }; }
             else if (tqc.includes('10') || tqc.includes('ssc')) { qm = { "DIPLOMA PROGRAMS": ["Diploma in Engineering", "IT Diploma", "Animation Diploma"] }; }
             else if (tqc.includes('diplomacomplete')) { qm = { "BACHELOR PROGRAMS": ["Electrical Engineering", "Civil Engineering", "Mechanical Engineering"] }; }
             else if (tqc.includes('grad') || tqc.includes('bach')) { qm = { "TRENDING MASTER PROGRAMS": ["M.Sc IT (Cyber Security)", "AI & ML", "Cloud Automation", "Animation, VFX & Games"], "TRADITIONAL MASTER PROGRAMS": ["MBA", "M.Com", "MCA", "M.Sc"] }; }
             else if (tqc.includes('mastercomplete')) { qm = { "PHD PROGRAMS": ["PhD in Marketing", "PhD in Civil Engineering", "PhD in IT"] }; }
             else if (tqc.includes('phdcomplete')) { qm = { "POST-DOC": ["Research Fellowship", "Academic Leadership"] }; }
             else { const qk = Object.keys(programMap).find(k => aggressiveNormalize(k) === tqc || aggressiveNormalize(k).includes(tqc)); qm = qk ? programMap[qk] : {}; }

            if (Array.isArray(qm)) qm = { "Programs": qm };
            const categories = Object.keys(qm);

            if (!stream) {
              if (categories.length === 1) {
                const auto = categories[0];
                await Contact.updateOne({ phone: contact.phone }, { 'flowVariables.selectedStream': auto });
                contact.flowVariables.selectedStream = auto;
                opts = Array.isArray(qm[auto]) ? qm[auto] : [];
                body = `Select your program under ${auto}:`;
              } else {
                opts = categories.length > 0 ? categories : ['General Inquiry'];
                body = "Select your preferred stream:";
              }
            } else {
              opts = qm[stream] || ['General Inquiry'];
              body = `Choose a program in ${stream}:`;
            }
          }

          await waService.sendListMessage(contact.phone, { body, buttonText: 'Options', sections: [{ title: 'Options', rows: opts.slice(0, 10).map((o, i) => ({ id: `list_${i}`, title: String(o).substring(0, 24) })) }] });
          await saveAndEmit('interactive', body, null);
          await Contact.updateOne({ phone: contact.phone }, { currentFlowStep: stepToProcess.id });
          return;
        }
        else if (nodeData.msgType === 'INTERACTIVE') {
          const btns = nodeData.buttons || ['Morning', 'Afternoon', 'Evening'];
          await waService.sendInteractiveButtonMessage(contact.phone, { body: text, buttons: btns.slice(0, 3) });
          await saveAndEmit('interactive', text, null);
          await Contact.updateOne({ phone: contact.phone }, { currentFlowStep: stepToProcess.id });
          return;
        }
        else {
          const res = await waService.sendTextMessage(contact.phone, text);
          await saveAndEmit('text', text, res);
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
