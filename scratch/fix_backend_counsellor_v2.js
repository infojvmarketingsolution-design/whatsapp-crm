
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/src/controllers/chat.controller.js');
let content = fs.readFileSync(filePath, 'utf8');

// Flexible regex to find assignedAgent block
const regex = /if\s+\(payload\.assignedAgent\s+!==\s+undefined\)\s+\{/;
const match = content.match(regex);

if (match) {
    const counsellorCode = `if (payload.assignedCounsellor !== undefined) {
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
         }\n\n         `;
    
    content = content.replace(match[0], counsellorCode + match[0]);
    fs.writeFileSync(filePath, content);
    console.log('Backend AssignedCounsellor logic implemented via regex.');
} else {
    console.log('Regex failed to find target in chat.controller.js');
}
