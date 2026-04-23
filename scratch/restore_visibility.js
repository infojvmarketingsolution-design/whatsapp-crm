
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// I will remove the matchesTime from the final return to ensure visibility.

const targetCode = 'return isVisible && passesAdvanced;';

const restoredCode = `    // Final verification
    return isVisible && matchesSource && matchesProgram && matchesQual && matchesDate;`;

if (content.includes(targetCode)) {
    content = content.replace(targetCode, restoredCode);
    fs.writeFileSync(filePath, content);
    console.log('Visibility restored by removing strict time requirement.');
} else {
    // Try to find the old return if Turn 43 didn't apply
    const oldReturn = /return !c\.isArchived && matchesSearch && matchesStatus && matchesStage && matchesAgent && matchesSource && matchesProgram && matchesQual && matchesScore && matchesDate && matchesTime;/;
    if (oldReturn.test(content)) {
        content = content.replace(oldReturn, 'return !c.isArchived && matchesSearch && matchesStatus && matchesStage && matchesAgent && matchesSource && matchesProgram && matchesQual && matchesScore && matchesDate;');
        fs.writeFileSync(filePath, content);
        console.log('Visibility restored via legacy return fix.');
    }
}
