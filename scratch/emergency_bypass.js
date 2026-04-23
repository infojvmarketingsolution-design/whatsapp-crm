
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// EMERGENCY BYPASS: Force leads to show up regardless of complex filters.

const searchLogic = `    const matchesSearch = !searchTerm || (
      (c.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.phone || '').includes(searchTerm)
    );`;

const emergencyReturn = `    // EMERGENCY BYPASS: Ensuring lead visibility
    const matchesCore = matchesSearch && (filters.status === 'ALL' || c.status === filters.status) && (filters.stage === 'ALL' || c.pipelineStage === filters.stage);
    return !c.isArchived && matchesCore;`;

const regex = /const filteredContacts = contacts\.filter\(c => \{[\s\S]+?return [\s\S]+?;\s+\}\);/;

if (regex.test(content)) {
    const newEngine = `  const filteredContacts = contacts.filter(c => {
${searchLogic}
${emergencyReturn}
  });`;
    
    content = content.replace(regex, newEngine);
    fs.writeFileSync(filePath, content);
    console.log('Emergency bypass applied. Leads SHOULD show up now.');
} else {
    console.log('Could not find filter engine to bypass.');
}
