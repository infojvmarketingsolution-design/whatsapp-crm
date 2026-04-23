
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/src/controllers/chat.controller.js');
let content = fs.readFileSync(filePath, 'utf8');

// I will add the generate_brief action to the action handler.
const AIService = "const AIService = require('../services/ai.service');";
const targetCode = `} else if (action === 'update_contact') {`;

const briefActionCode = `} else if (action === 'generate_brief') {
         const messages = await Message.find({ contactId }).sort({ createdAt: 1 });
         const brief = await AIService.generateStrategicBrief(messages, contact);
         if (!brief) return res.status(400).json({ message: 'AI Brief generation failed' });
         
         return res.json({ brief });
      `;

if (content.includes(targetCode)) {
    content = content.replace(targetCode, briefActionCode + targetCode);
    
    // Ensure AIService is imported (if not already there)
    if (!content.includes("const AIService = require('../services/ai.service');")) {
        content = "const AIService = require('../services/ai.service');\n" + content;
    }
    
    fs.writeFileSync(filePath, content);
    console.log('Backend generate_brief action implemented.');
} else {
    console.log('Target code not found in chat.controller.js');
}
