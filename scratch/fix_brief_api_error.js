
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/src/controllers/chat.controller.js');
let content = fs.readFileSync(filePath, 'utf8');

// The fix: Initialize Message model correctly
const oldBriefCode = `      } else if (action === 'generate_brief') {
          const messages = await Message.find({ contactId }).sort({ createdAt: 1 });`;

const newBriefCode = `      } else if (action === 'generate_brief') {
          const Message = req.tenantDb.model('Message', MessageSchema);
          const messages = await Message.find({ contactId }).sort({ createdAt: 1 });`;

if (content.includes(oldBriefCode)) {
    content = content.replace(oldBriefCode, newBriefCode);
    fs.writeFileSync(filePath, content);
    console.log('Backend generate_brief action fixed with proper model initialization.');
} else {
    console.log('Target code not found. Trying flexible replacement...');
    const regex = /else if \(action === 'generate_brief'\) \{[\s\S]+?const messages = await Message\.find/;
    if (regex.test(content)) {
        content = content.replace(regex, `else if (action === 'generate_brief') {
          const Message = req.tenantDb.model('Message', MessageSchema);
          const messages = await Message.find`);
        fs.writeFileSync(filePath, content);
        console.log('Fixed via regex.');
    }
}
