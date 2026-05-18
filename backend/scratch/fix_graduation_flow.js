const fs = require('fs');
const path = './src/services/prdFlow.service.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add DEFAULT_PROGRAM_MAP constant at the top
const mapDecl = `const DEFAULT_PROGRAM_MAP = {
  "12th Pass": {
    "Trending Programs": ["B.Voc Cyber Security", "B.Voc Fintech", "B.Sc IT Ai & ML", "B.Sc IT Data Analytics"],
    "Traditional Programs": ["B.Com", "B.Tech", "BBA"]
  },
  "Graduation": {
    "Master Traditional Program": ["M.Com", "MBA", "M.Tech", "M.Sc", "Other"],
    "Master Trending Program": [
      "M.Sc IT in Cyber Security & Digital Forensics",
      "M.Sc IT in Cloud Automation",
      "M.Sc IT in Data Analytics",
      "M.Sc IT in Animation, VFX & Game Design",
      "M.Sc IT in Blockchain Technology",
      "M.Sc IT in Software & Mobile App Development"
    ]
  },
  "Working Professional": {
    "Executive Programs": ["Executive MBA", "Certification Courses"]
  }
};
`;

if (!content.includes('const DEFAULT_PROGRAM_MAP')) {
  // Insert right after the first line or a require statement
  const targetRequire = "const integrationService = require('./integration.service');\n";
  const pos = content.indexOf(targetRequire);
  if (pos !== -1) {
    content = content.substring(0, pos + targetRequire.length) + '\n' + mapDecl + '\n' + content.substring(pos + targetRequire.length);
  } else {
    content = mapDecl + '\n' + content;
  }
}

// 2. Define the new code for states
const startStr = '// ==========================================\n      // STATE: ASK_QUALIFICATION\n      // ==========================================';
const endStr = '// ==========================================\n      // STATE: ASK_CALL_TIME\n      // ==========================================';

const newCode = `// ==========================================
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
          const matchBtn = replyValue.match(/btn_(\\d+)/i);
          const matchLst = replyValue.match(/list_(\\d+)/i);
          const idx = matchBtn ? parseInt(matchBtn[1]) : (matchLst ? parseInt(matchLst[1]) : -1);
          if (idx >= 0 && idx < options.length) {
            selectedOption = options[idx];
          }
        }
        if (!selectedOption) {
          const matchIdx = options.findIndex(opt => {
            const cleanOpt = opt.toLowerCase().trim();
            return normalizedInput === cleanOpt || normalizedInput.includes(cleanOpt);
          });
          if (matchIdx !== -1) selectedOption = options[matchIdx];
        }

        // Fallbacks
        if (!selectedOption) {
          if (normalizedInput.includes('12') || normalizedInput.includes('twelfth')) selectedOption = options.find(o => o.toLowerCase().includes('12')) || '12th Pass';
          else if (normalizedInput.includes('grad') || normalizedInput.includes('bachelor') || normalizedInput.includes('degree')) selectedOption = options.find(o => o.toLowerCase().includes('grad') || o.toLowerCase().includes('bach')) || 'Graduation';
          else if (normalizedInput.includes('diploma')) selectedOption = options.find(o => o.toLowerCase().includes('diploma')) || 'Diploma';
          else if (normalizedInput.includes('master') || normalizedInput.includes('postgrad')) selectedOption = options.find(o => o.toLowerCase().includes('master')) || 'Master Completed';
          else if (normalizedInput.includes('10') || normalizedInput.includes('tenth') || normalizedInput.includes('ssc')) selectedOption = options.find(o => o.toLowerCase().includes('10')) || '10th Pass';
          else if (normalizedInput.includes('working') || normalizedInput.includes('professional')) selectedOption = options.find(o => o.toLowerCase().includes('working') || o.toLowerCase().includes('prof')) || 'Working Professional';
        }

        if (!selectedOption) {
          if (normalizedInput === 'other' || normalizedReply.includes('other')) {
            selectedOption = 'Other';
          } else {
            selectedOption = options.find(o => o.toLowerCase().includes('other')) || options[0] || '12th Pass';
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

        const matchedQualKey = Object.keys(programMap).find(k => k.toLowerCase().trim() === selectedOption.toLowerCase().trim()) || 
                               Object.keys(programMap).find(k => {
                                 const cleanK = k.toLowerCase().trim();
                                 const cleanSel = selectedOption.toLowerCase().trim();
                                 return cleanK.includes(cleanSel) || cleanSel.includes(cleanK) ||
                                        (cleanSel.includes('grad') && cleanK.includes('grad'));
                               });

        if (matchedQualKey && programMap[matchedQualKey]) {
          const categories = Object.keys(programMap[matchedQualKey]);
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
            const programs = programMap[matchedQualKey][streamName] || [];
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
            const catMsg = "Please select program category.";
            await sendInteractiveOptions(catMsg, categories);
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
          const customMsg = \`You selected: \${selectedOption}. Please type your preferred program.\`;
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
        const matchedQualKey = Object.keys(programMap).find(k => k.toLowerCase().trim() === contactQual.toLowerCase().trim()) || 
                               Object.keys(programMap).find(k => {
                                 const cleanK = k.toLowerCase().trim();
                                 const cleanSel = contactQual.toLowerCase().trim();
                                 return cleanK.includes(cleanSel) || cleanSel.includes(cleanK) ||
                                        (cleanSel.includes('grad') && cleanK.includes('grad'));
                               });

        const categories = matchedQualKey && programMap[matchedQualKey] ? Object.keys(programMap[matchedQualKey]) : [];

        let selectedCategory = '';
        if (replyValue) {
          const matchBtn = replyValue.match(/btn_(\\d+)/i);
          const matchLst = replyValue.match(/list_(\\d+)/i);
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

        if (selectedCategory) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              selectedStream: selectedCategory,
              'flowVariables.selectedStream': selectedCategory,
              currentFlowStep: 'ask_program'
            }
          });

          const programs = programMap[matchedQualKey][selectedCategory] || [];
          const progMsg = "Please select your preferred program.";
          await sendInteractiveOptions(progMsg, programs);
        } else {
          const errMsg = "Please select program category:";
          await sendInteractiveOptions(errMsg, categories.length ? categories : ['Traditional', 'Trending']);
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
        const matchedQualKey = Object.keys(programMap).find(k => k.toLowerCase().trim() === contactQual.toLowerCase().trim()) || 
                               Object.keys(programMap).find(k => {
                                 const cleanK = k.toLowerCase().trim();
                                 const cleanSel = contactQual.toLowerCase().trim();
                                 return cleanK.includes(cleanSel) || cleanSel.includes(cleanK) ||
                                        (cleanSel.includes('grad') && cleanK.includes('grad'));
                               });

        const streamName = contact.selectedStream || '';
        let programs = (matchedQualKey && streamName && programMap[matchedQualKey] && programMap[matchedQualKey][streamName]) ? programMap[matchedQualKey][streamName] : [];

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

      `;

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);
if (startIndex !== -1 && endIndex !== -1) {
  const finalContent = content.substring(0, startIndex) + newCode + content.substring(endIndex);
  fs.writeFileSync(path, finalContent, 'utf8');
  console.log('Successfully updated prdFlow.service.js with correct Graduation & Other flows.');
} else {
  console.log('Could not find start or end string!');
}
