const fs = require('fs');
const code = fs.readFileSync('./src/services/prdFlow.service.js', 'utf8');
const lines = code.split(/\r?\n/);
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('program category') || line.toLowerCase().includes('categorymessage')) {
     console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});
