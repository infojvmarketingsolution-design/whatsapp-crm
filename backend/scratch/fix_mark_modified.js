const fs = require('fs');
const p = './src/controllers/settings.controller.js';
if (fs.existsSync(p)) {
  let code = fs.readFileSync(p, 'utf8');
  const target = `settings.markModified(category);
     await settings.save();`;
  const replacement = `settings.markModified(category);
     if (category === 'automation') {
        settings.markModified('automation.aiPrompts');
        settings.markModified('automation.aiPrompts.prdFlowSteps');
        settings.markModified('automation.aiPrompts.programMap');
        settings.markModified('automation.aiPrompts.qualificationOptions');
     }
     await settings.save();`;
  if (code.includes(target)) {
     fs.writeFileSync(p, code.replace(target, replacement), 'utf8');
     console.log('Fixed markModified successfully!');
  } else {
     const target_r = target.replace(/\n/g, '\r\n');
     const replacement_r = replacement.replace(/\n/g, '\r\n');
     if (code.includes(target_r)) {
        fs.writeFileSync(p, code.replace(target_r, replacement_r), 'utf8');
        console.log('Fixed markModified successfully with CR!');
     } else {
        // try fallback split line by line
        let lines = code.split(/\r?\n/);
        let updated = false;
        for (let i = 0; i < lines.length; i++) {
           if (lines[i].includes('settings.markModified(category)')) {
              lines.splice(i + 1, 0, 
                 "     if (category === 'automation') {",
                 "        settings.markModified('automation.aiPrompts');",
                 "        settings.markModified('automation.aiPrompts.prdFlowSteps');",
                 "        settings.markModified('automation.aiPrompts.programMap');",
                 "        settings.markModified('automation.aiPrompts.qualificationOptions');",
                 "     }"
              );
              updated = true;
              break;
           }
        }
        if (updated) {
           fs.writeFileSync(p, lines.join('\n'), 'utf8');
           console.log('Fixed markModified line-by-line!');
        } else {
           console.log('Could not find markModified target!');
        }
     }
  }
}
