const fs = require('fs');
const path = require('path');

const filePath = 'o:/OneDrive/Business/Development/Whatsapp Api + CRM (19 March 2026)/backend/src/controllers/chat.controller.js';
let content = fs.readFileSync(filePath, 'utf8');

const target = /\} else if \(action === 'update_contact'\) \{[\s\n\r]+if \(payload\.name\) contact\.name = payload\.name;[\s\n\r]+if \(payload\.email\) contact\.email = payload\.email;[\s\n\r]+if \(payload\.address\) contact\.address = payload\.address;[\s\n\r]+if \(payload\.status\) contact\.status = payload\.status;[\s\n\r]+contact\.timeline\.push\(\{ eventType: 'CONTACT_UPDATED', description: 'Contact details updated', timestamp: new Date\(\) \}\);[\s\S]+?contact\.timeline\.push\(\{ eventType: 'STATUS_CHANGE', description: \`Moved to \$\{payload\.status\}\`, timestamp: new Date\(\) \}\);/;

const replacement = `} else if (action === 'update_contact') {
        if (payload.name !== undefined) contact.name = payload.name;
        if (payload.email !== undefined) contact.email = payload.email;
        if (payload.address !== undefined) contact.address = payload.address;
        if (payload.status !== undefined) contact.status = payload.status;
        if (payload.budget !== undefined) contact.budget = payload.budget;
        if (payload.purchaseTimeline !== undefined) contact.purchaseTimeline = payload.purchaseTimeline;
        if (payload.decisionMakerStatus !== undefined) contact.decisionMakerStatus = payload.decisionMakerStatus;
        if (payload.heatLevel !== undefined) contact.heatLevel = payload.heatLevel;
        if (payload.score !== undefined) contact.score = payload.score;
        
        contact.timeline.push({ eventType: 'CONTACT_UPDATED', description: 'Contact details updated', timestamp: new Date() });
        if (payload.status) {
           contact.timeline.push({ eventType: 'STATUS_CHANGE', description: \`Moved to \${payload.status}\`, timestamp: new Date() });
        }`;

if (target.test(content)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content);
    console.log('Controller updated successfully');
} else {
    console.log('Target not found in controller');
}
