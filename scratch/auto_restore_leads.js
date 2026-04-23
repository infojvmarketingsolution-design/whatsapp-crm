
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/src/controllers/whatsapp.controller.js');
let content = fs.readFileSync(filePath, 'utf8');

const targetUpdate = 'await Contact.updateOne(';
const restoreRule = '          // 🔥 RESTORE VISIBILITY: If they message us, they are NOT archived anymore\n' +
          '          await Contact.updateOne(\n' +
          '            { phone: from },\n' +
          '            { \n' +
          '              lastProcessedMessageId: msgId,\n' +
          '              lastMessageAt: new Date(),\n' +
          '              isArchived: false,\n' +
          '              isClosed: false,\n' +
          '              status: "NEW LEAD"\n' +
          '            }\n' +
          '          );';

if (content.includes(targetUpdate)) {
    const startIdx = content.indexOf(targetUpdate);
    const endIdx = content.indexOf(');', startIdx) + 2;
    content = content.substring(0, startIdx) + restoreRule + content.substring(endIdx);
    fs.writeFileSync(filePath, content);
    console.log('Lead Auto-Restore rule added successfully.');
} else {
    console.log('Target code not found in controller.');
}
