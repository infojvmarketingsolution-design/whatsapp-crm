
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// The new accurate filter counting logic
const oldCountLogic = `  const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
     if (key === 'minScore' && val === 0) return false;
     if (key === 'maxScore' && val === 100) return false;
     if (key === 'minValue' && val === 0) return false;
     if (val === 'ALL' || val === false) return false;
     return true;
  }).length;`;

const newCountLogic = `  const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
     if (key === 'minScore' && val === 0) return false;
     if (key === 'maxScore' && val === 100) return false;
     if (key === 'startTime' && val === '00:00') return false;
     if (key === 'endTime' && val === '23:59') return false;
     if (key === 'startDate' && val === '') return false;
     if (key === 'endDate' && val === '') return false;
     if (val === 'ALL' || val === false || val === '') return false;
     return true;
  }).length;`;

if (content.includes(oldCountLogic)) {
    content = content.replace(oldCountLogic, newCountLogic);
    fs.writeFileSync(filePath, content);
    console.log('Filter counter logic fixed.');
} else {
    console.log('Old count logic not found. Trying flexible replacement...');
    const regex = /const activeFilterCount = Object\.entries\(filters\)\.filter\(\(\[key, val\]\) => \{[\s\S]+?\}\)\.length;/;
    if (regex.test(content)) {
        content = content.replace(regex, newCountLogic);
        fs.writeFileSync(filePath, content);
        console.log('Filter counter logic fixed via regex.');
    }
}
