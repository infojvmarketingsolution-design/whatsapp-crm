const fs = require('fs');
const path = './src/services/prdFlow.service.js';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `        } else if (categories.length > 1) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              currentFlowStep: 'ask_program_category'
            }
          });
          let catMsg = "Please select program category.";
          catMsg = this.populatePlaceholders(catMsg, fresh, nameVal);`;

const newCode = `        } else if (categories.length > 1) {
          await ContactModel.updateOne({ phone: contact.phone }, {
            $set: {
              currentFlowStep: 'ask_program_category'
            }
          });
          let catMsg = nextStep.message || nextStep.text || "Please select program category.";
          catMsg = this.populatePlaceholders(catMsg, fresh, nameVal);`;

if (content.includes(targetStr)) {
  fs.writeFileSync(path, content.replace(targetStr, newCode), 'utf8');
  console.log('Successfully updated catMsg inside prdFlow.service.js to be dynamic!');
} else {
  console.log('Target string for catMsg not found inside prdFlow.service.js!');
}
