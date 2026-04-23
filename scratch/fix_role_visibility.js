
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/src/controllers/chat.controller.js');
let content = fs.readFileSync(filePath, 'utf8');

const targetCode = "    const isHighLevel = ['ADMIN', 'SUPER_ADMIN', 'BUSINESS_HEAD'].includes(userRole);";
const aggressiveCheck = "    const isHighLevel = ['ADMIN', 'SUPER_ADMIN', 'BUSINESS_HEAD', 'BUSINESS HEAD', 'OWNER'].includes(userRole.toUpperCase());";

if (content.includes(targetCode)) {
    content = content.replace(targetCode, aggressiveCheck);
    fs.writeFileSync(filePath, content);
    console.log('Role check updated successfully.');
} else {
    console.log('Target code not found in controller.');
}
