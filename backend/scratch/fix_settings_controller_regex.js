const fs = require('fs');
const p1 = './src/controllers/settings.controller.js';
if (fs.existsSync(p1)) {
  let lines = fs.readFileSync(p1, 'utf8').split(/\r?\n/);
  let updated = false;
  for (let i = 0; i < lines.length; i++) {
     if (lines[i].includes('PROGRAM_SELECTION') && lines[i].includes('Program Selection') && !lines[i].includes('categoryMessage')) {
        lines[i] = lines[i].replace(
          "message: 'Please select your preferred program category.'",
          "message: 'Please select your preferred program category.', categoryMessage: 'Please select program category.'"
        );
        updated = true;
        console.log(`Updated settings.controller.js line ${i + 1}`);
     }
  }
  if (updated) {
     fs.writeFileSync(p1, lines.join('\n'), 'utf8');
     console.log('Successfully saved settings.controller.js updates!');
  } else {
     console.log('No matching line found in settings.controller.js!');
  }
}
