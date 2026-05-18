const fs = require('fs');
const path = './src/services/prdFlow.service.js';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `    else if (nextStep.type === 'PROGRAM_SELECTION') {
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
                             Object.keys(programMap).find(k => k.toLowerCase().trim().includes(contactQual.toLowerCase().trim()) || contactQual.toLowerCase().trim().includes(k.toLowerCase().trim()));`;

const newCode = `    else if (nextStep.type === 'PROGRAM_SELECTION') {
      const fresh = await ContactModel.findOne({ phone: contact.phone });
      const contactQual = fresh.qualification || '';
      
      let programMap = settings?.automation?.aiPrompts?.programMap;
      if (!programMap || Object.keys(programMap).length === 0) programMap = DEFAULT_PROGRAM_MAP;

      const matchedQualKey = Object.keys(programMap).find(k => k.toLowerCase().trim() === contactQual.toLowerCase().trim()) || 
                             Object.keys(programMap).find(k => {
                               const cleanK = k.toLowerCase().trim();
                               const cleanSel = contactQual.toLowerCase().trim();
                               return cleanK.includes(cleanSel) || cleanSel.includes(cleanK) ||
                                      (cleanSel.includes('grad') && cleanK.includes('grad'));
                             });`;

if (content.includes(targetStr)) {
  fs.writeFileSync(path, content.replace(targetStr, newCode), 'utf8');
  console.log('Successfully updated transitionToNextStepAfter inside prdFlow.service.js');
} else {
  console.log('Target string not found in transitionToNextStepAfter!');
}
