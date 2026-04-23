
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/src/services/prdFlow.service.js');
let content = fs.readFileSync(filePath, 'utf8');

const line1 = "              const dbUpdates = { [`flowVariables.${varName}`]: val };";
const line2 = "              if (varName === 'time') {";

const replacement = `              const dbUpdates = { [\`flowVariables.\${varName}\`]: val };
              
              if (varName === 'profession') {
                 dbUpdates.profession = val;
              } else if (varName === 'budget') {
                 dbUpdates.budget = val;
              } else if (varName === 'time') {`;

const target = line1 + "\r\n" + line2;
const targetLF = line1 + "\n" + line2;

if (content.includes(target)) {
    content = content.replace(target, replacement.replace(/\n/g, '\r\n'));
    fs.writeFileSync(filePath, content);
    console.log('Fixed successfully (CRLF).');
} else if (content.includes(targetLF)) {
    content = content.replace(targetLF, replacement);
    fs.writeFileSync(filePath, content);
    console.log('Fixed successfully (LF).');
} else {
    console.log('Target not found again.');
}
