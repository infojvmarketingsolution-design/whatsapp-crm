const fs = require('fs');
const path = './src/services/prdFlow.service.js';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `    else if (nextStep.type === 'PROGRAM_SELECTION') {
      const fresh = await ContactModel.findOne({ phone: contact.phone });
      const q = fresh.qualification || '12th Pass';
      const isGrad = q.toLowerCase().includes('grad') || q.toLowerCase().includes('bachelor');
      await ContactModel.updateOne({ phone: contact.phone }, { 
        $set: { currentFlowStep: isGrad ? 'ask_program_category_grad' : 'ask_program_category_12th' } 
      });
      let catMsg = nextStep.message || nextStep.text || "Please select program category.";
      catMsg = this.populatePlaceholders(catMsg, fresh, nameVal);
      await this.sendInteractiveOptionsHelper(contact, waService, catMsg, isGrad ? ['Master Traditional Program', 'Master Trending Program'] : ['Traditional Program', 'Trending Program'], settings, io);
    }`;

const newCode = `    else if (nextStep.type === 'PROGRAM_SELECTION') {
      const fresh = await ContactModel.findOne({ phone: contact.phone });
      const contactQual = fresh.qualification || '';
      
      const defaultProgramMap = {
        "12th Pass": {
          "Trending Programs": ["B.Voc Cyber Security", "B.Voc Fintech", "B.Sc IT Ai & ML", "B.Sc IT Data Analytics"],
          "Traditional Programs": ["B.Com", "B.Tech", "BBA"]
        },
        "Graduate": {
          "Master Programs": ["MBA", "MCA", "M.Tech", "M.Sc"]
        },
        "Working Professional": {
          "Executive Programs": ["Executive MBA", "Certification Courses"]
        }
      };

      let programMap = settings?.automation?.aiPrompts?.programMap;
      if (!programMap || Object.keys(programMap).length === 0) programMap = defaultProgramMap;

      const matchedQualKey = Object.keys(programMap).find(k => k.toLowerCase().trim() === contactQual.toLowerCase().trim()) || 
                             Object.keys(programMap).find(k => k.toLowerCase().trim().includes(contactQual.toLowerCase().trim()) || contactQual.toLowerCase().trim().includes(k.toLowerCase().trim()));

      if (matchedQualKey && programMap[matchedQualKey]) {
        const categories = Object.keys(programMap[matchedQualKey]);
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
          await this.sendInteractiveOptionsHelper(contact, waService, progMsg, programMap[matchedQualKey][streamName] || [], settings, io);
        } else if (categories.length > 1) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              currentFlowStep: 'ask_program_category'
            }
          });
          let catMsg = "Please select program category.";
          catMsg = this.populatePlaceholders(catMsg, fresh, nameVal);
          await this.sendInteractiveOptionsHelper(contact, waService, catMsg, categories, settings, io);
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
    }`;

if (content.includes(targetStr)) {
  fs.writeFileSync(path, content.replace(targetStr, newCode), 'utf8');
  console.log('Success');
} else {
  console.log('Target string not found!');
}
