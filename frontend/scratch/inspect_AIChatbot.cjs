const fs = require('fs');
const code = fs.readFileSync('./src/pages/AIChatbot/AIChatbot.jsx', 'utf8');
const lines = code.split(/\r?\n/);
lines.forEach((line, i) => {
  if (line.toLowerCase().includes('qualification') || line.toLowerCase().includes('button') || line.toLowerCase().includes('option')) {
     console.log(`Line ${i + 1}: ${line.trim()}`);
  }
});
