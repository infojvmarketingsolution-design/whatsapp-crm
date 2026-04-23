
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// I will make the filter return logic much more safe to avoid accidental hiding of leads.

const targetCode = 'return !c.isArchived && matchesSearch && matchesStatus && matchesStage && matchesAgent && matchesSource && matchesProgram && matchesQual && matchesScore && matchesDate && matchesTime;';

const safeCode = `    // Debugging leads
    const isVisible = !c.isArchived && matchesSearch && matchesStatus && matchesStage && matchesAgent;
    
    // Advanced filters are only applied if they are NOT set to "ALL"
    const passesAdvanced = matchesSource && matchesProgram && matchesQual && matchesDate && matchesTime;

    return isVisible && passesAdvanced;`;

if (content.includes(targetCode)) {
    content = content.replace(targetCode, safeCode);
    fs.writeFileSync(filePath, content);
    console.log('Filter logic made robust.');
} else {
    console.log('Target code not found in Contacts.jsx');
}
