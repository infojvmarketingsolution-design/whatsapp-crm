const fs = require('fs');

// 1. Fix settings.controller.js
const p1 = './src/controllers/settings.controller.js';
if (fs.existsSync(p1)) {
  let c1 = fs.readFileSync(p1, 'utf8');
  const t1 = `             { id: 'program', type: 'PROGRAM_SELECTION', title: 'Program Selection', message: 'Please select your preferred program category.' },`;
  const n1 = `             { id: 'program', type: 'PROGRAM_SELECTION', title: 'Program Selection', message: 'Please select your preferred program category.', categoryMessage: 'Please select program category.' },`;
  if (c1.includes(t1)) {
    fs.writeFileSync(p1, c1.replace(t1, n1), 'utf8');
    console.log('Fixed settings.controller.js');
  } else {
    // try with \r
    const t1_r = t1.replace(/\n/g, '\r\n');
    const n1_r = n1.replace(/\n/g, '\r\n');
    if (c1.includes(t1_r)) {
      fs.writeFileSync(p1, c1.replace(t1_r, n1_r), 'utf8');
      console.log('Fixed settings.controller.js with CR');
    } else {
      console.log('Could not find target in settings.controller.js');
    }
  }
}

// 2. Fix force-migrate-settings.js (to migrate existing settings to include the categoryMessage field!)
const p2 = './scripts/force-migrate-settings.js';
if (fs.existsSync(p2)) {
  let c2 = fs.readFileSync(p2, 'utf8');
  // We want to add categoryMessage: 'Please select program category.' to all settings that are migrated!
  const t2 = `        doc.automation.aiPrompts.qualificationOptions = ['12th Pass', 'Graduation', 'Other'];`;
  const n2 = `        doc.automation.aiPrompts.qualificationOptions = ['12th Pass', 'Graduation', 'Other'];
        
        // Ensure PROGRAM_SELECTION step has a categoryMessage field
        if (doc.automation.aiPrompts.prdFlowSteps) {
           doc.automation.aiPrompts.prdFlowSteps = doc.automation.aiPrompts.prdFlowSteps.map(s => {
              if (s.type === 'PROGRAM_SELECTION' && !s.categoryMessage) {
                 return { ...s, categoryMessage: 'Please select program category.' };
              }
              return s;
           });
        }`;
  if (c2.includes(t2)) {
    fs.writeFileSync(p2, c2.replace(t2, n2), 'utf8');
    console.log('Fixed force-migrate-settings.js');
  } else {
    const t2_r = t2.replace(/\n/g, '\r\n');
    const n2_r = n2.replace(/\n/g, '\r\n');
    if (c2.includes(t2_r)) {
      fs.writeFileSync(p2, c2.replace(t2_r, n2_r), 'utf8');
      console.log('Fixed force-migrate-settings.js with CR');
    } else {
      console.log('Could not find target in force-migrate-settings.js');
    }
  }
}
