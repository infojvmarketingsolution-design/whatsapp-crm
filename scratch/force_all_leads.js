
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// DEEP CLEANUP: Force every lead to show up. No exceptions.

const regex = /const filteredContacts = contacts\.filter\(c => \{[\s\S]+?\}\);/;
const forcedEngine = `  const filteredContacts = contacts; // FORCED VISIBILITY BYPASS`;

if (regex.test(content)) {
    content = content.replace(regex, forcedEngine);
    fs.writeFileSync(filePath, content);
    console.log('Deep cleanup applied. All filters bypassed.');
} else {
    console.log('Could not find filter engine to force visibility.');
}
