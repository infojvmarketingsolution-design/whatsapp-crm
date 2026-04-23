
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update handleFieldChange to include automatic status/stage mapping
const oldHandler = `  const handleFieldChange = (field, value) => {
     setEditedContact(prev => ({ ...prev, [field]: value }));
     setShowSaveFab(true);
  };`;

const newHandler = `  const handleFieldChange = (field, value) => {
     setEditedContact(prev => {
        let updates = { ...prev, [field]: value };
        
        // AUTOMATIC PIPELINE MAPPING
        if (field === 'admissionStatus') {
           if (value === 'Admitted') {
              updates.pipelineStage = 'Won';
              updates.status = 'CLOSED_WON';
           } else if (value === 'Cancelled') {
              updates.pipelineStage = 'Lost';
              updates.status = 'CLOSED_LOST';
           }
        }
        
        return updates;
     });
     setShowSaveFab(true);
  };`;

if (content.includes(oldHandler)) {
    content = content.replace(oldHandler, newHandler);
    fs.writeFileSync(filePath, content);
    console.log('Smart Field Logic implemented.');
} else {
    console.log('Could not find handleFieldChange. Trying flexible replacement...');
    const regex = /const handleFieldChange = \(field, value\) => \{[\s\S]+?setShowSaveFab\(true\);\s+\};/;
    if (regex.test(content)) {
        content = content.replace(regex, newHandler);
        fs.writeFileSync(filePath, content);
        console.log('Smart Field Logic implemented via regex.');
    }
}
