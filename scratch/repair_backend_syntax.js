
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/src/controllers/chat.controller.js');
let content = fs.readFileSync(filePath, 'utf8');

// The Correct Full Code for the brief action
const correctCode = `} else if (action === 'generate_brief') {
          const Message = req.tenantDb.model('Message', MessageSchema);
          const messages = await Message.find({ contactId }).sort({ createdAt: 1 });
          const brief = await AIService.generateStrategicBrief(messages, contact);
          if (!brief) return res.status(400).json({ message: 'AI Brief generation failed' });
          
          return res.json({ brief });
       } else if (action === 'update_contact') {`;

// Regex to find the broken block
const brokenRegex = /\} else if \(action === 'generate_brief'\) \{[\s\S]+?const messages = await Message\.find\s+\} else if \(action === 'update_contact'\) \{/;

if (brokenRegex.test(content)) {
    content = content.replace(brokenRegex, correctCode);
    fs.writeFileSync(filePath, content);
    console.log('Backend syntax fully repaired.');
} else {
    // Fallback if the previous regex didn't match exactly as expected
    console.log('Broken block not found via regex. Performing manual cleanup...');
    const searchStr = "const messages = await Message.find";
    const index = content.indexOf(searchStr);
    if (index !== -1) {
        const head = content.substring(0, index);
        const tailStart = content.indexOf("} else if (action === 'update_contact') {", index);
        if (tailStart !== -1) {
            const tail = content.substring(tailStart);
            const mid = `const messages = await Message.find({ contactId }).sort({ createdAt: 1 });
          const brief = await AIService.generateStrategicBrief(messages, contact);
          if (!brief) return res.status(400).json({ message: 'AI Brief generation failed' });
          
          return res.json({ brief });
       `;
            fs.writeFileSync(filePath, head + mid + tail);
            console.log('Backend syntax repaired via manual cleanup.');
        }
    }
}
