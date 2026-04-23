
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/src/controllers/chat.controller.js');
let content = fs.readFileSync(filePath, 'utf8');

// I will insert the assignedCounsellor logic into the update_contact block.

const targetCode = `         if (payload.assignedAgent !== undefined) {`;

const counsellorCode = `         if (payload.assignedCounsellor !== undefined) {
            const newCounsellor = payload.assignedCounsellor && payload.assignedCounsellor !== "" ? payload.assignedCounsellor : null;
            if (newCounsellor?.toString() !== contact.assignedCounsellor?.toString()) {
               contact.assignedCounsellor = newCounsellor;
               let agentName = 'Unassigned';
               if (newCounsellor) {
                  const agent = await User.findById(newCounsellor);
                  agentName = agent ? agent.name : 'Unknown';
               }
               contact.timeline.push({ 
                  eventType: 'COUNSELLOR_ASSIGNED', 
                  description: newCounsellor ? \`Assigned to Counsellor: \${agentName}\` : 'Counsellor unassigned', 
                  timestamp: new Date() 
               });
               contact.markModified('assignedCounsellor');
            }
         }\n\n`;

if (content.includes(targetCode)) {
    content = content.replace(targetCode, counsellorCode + targetCode);
    fs.writeFileSync(filePath, content);
    console.log('Backend AssignedCounsellor logic implemented.');
} else {
    console.log('Target code not found in chat.controller.js');
}
