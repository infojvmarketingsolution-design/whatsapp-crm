const fs = require('fs');
const code = fs.readFileSync('./src/services/prdFlow.service.js', 'utf8');
const lines = code.split(/\r?\n/);
lines.forEach((line, i) => {
  if (line.includes('transitionToNextStepAfter') || line.includes('QUALIFICATION') || line.includes('buttons')) {
     console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});
