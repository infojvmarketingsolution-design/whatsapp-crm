const fs = require('fs');
const code = fs.readFileSync('./src/services/whatsapp.service.js', 'utf8');
const lines = code.split(/\r?\n/);
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('cta') || line.toLowerCase().includes('call') || line.toLowerCase().includes('url')) {
     console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});
