
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// I will replace the activeFilterCount logic with a more precise version.

const oldCounterCode = `   const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
      if (key === 'minScore' && val === 0) return false;
      if (key === 'maxScore' && val === 100) return false;
      if (key === 'startTime' && val === '00:00') return false;
      if (key === 'endTime' && val === '23:59') return false;
      if (key === 'startDate' && val === '') return false;
      if (key === 'endDate' && val === '') return false;
      if (val === 'ALL' || val === false || val === '') return false;
      return true;
   }).length;`;

const newCounterCode = `   const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
      // Exclude default values from the "Active Filter" count
      if (val === 'ALL' || val === false || val === '') return false;
      if (key === 'minScore' && val === 0) return false;
      if (key === 'maxScore' && val === 100) return false;
      if (key === 'startTime' && val === '00:00') return false;
      if (key === 'endTime' && val === '23:59') return false;
      if (key === 'startDate' && val === '') return false;
      if (key === 'endDate' && val === '') return false;
      if (key === 'minValue' && val === 0) return false;
      if (key === 'heat' && val === 'ALL') return false;
      return true;
   }).length;`;

if (content.includes(oldCounterCode)) {
    content = content.replace(oldCounterCode, newCounterCode);
    fs.writeFileSync(filePath, content);
    console.log('Active Filter Counter fixed.');
} else {
    // Try flexible regex if exact string match fails
    const regex = /const activeFilterCount = Object\.entries\(filters\)\.filter\(\(\[key, val\]\) => \{[\s\S]+?\}\)\.length;/;
    if (regex.test(content)) {
        content = content.replace(regex, newCounterCode);
        fs.writeFileSync(filePath, content);
        console.log('Active Filter Counter fixed via regex.');
    }
}
