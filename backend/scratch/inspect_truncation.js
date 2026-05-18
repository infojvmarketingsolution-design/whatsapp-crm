const fs = require('fs');

const files = [
  './src/services/prdFlow.service.js',
  './src/services/whatsapp.service.js'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
     const code = fs.readFileSync(f, 'utf8');
     const lines = code.split(/\r?\n/);
     lines.forEach((line, i) => {
       if (line.includes('24') || line.includes('20') || line.includes('substring') || line.includes('slice')) {
          console.log(`${f} Line ${i + 1}: ${line.trim()}`);
       }
     });
  }
});
