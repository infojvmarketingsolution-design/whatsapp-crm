const fs = require('fs');
const path = require('path');

const filePath = 'o:/OneDrive/Business/Development/Whatsapp Api + CRM (19 March 2026)/backend/src/controllers/chat.controller.js';
let content = fs.readFileSync(filePath, 'utf8');

const target = /\} else if \(action === 'update_contact'\) \{[\s\S]+?if \(payload\.score !== undefined\) contact\.score = payload\.score;/;

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
        if (payload.profession !== undefined) contact.profession = payload.profession;
        if (payload.companyName !== undefined) contact.companyName = payload.companyName;
        if (payload.linkedinUrl !== undefined) contact.linkedinUrl = payload.linkedinUrl;`;

if (target.test(content)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content);
    console.log('Controller updated successfully');
} else {
    console.log('Target not found in controller');
}
