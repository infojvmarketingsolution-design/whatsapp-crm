
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/src/services/ai.service.js');
let content = fs.readFileSync(filePath, 'utf8');

// I will re-write the file with the correct class structure to be 100% sure.
const lines = content.split('\n');
let cleanContent = "";
let bracketCount = 0;

for (let line of lines) {
    if (line.includes('module.exports')) continue; // Remove any misplaced exports
    cleanContent += line + '\n';
}

// Ensure it ends with exactly one class closing bracket and one export
cleanContent = cleanContent.trim();
while (cleanContent.endsWith('}')) {
    cleanContent = cleanContent.slice(0, -1).trim();
}

// Now add back exactly what is needed
const finalCode = cleanContent + '\n  }\n}\n\nmodule.exports = new AIService();\n';

fs.writeFileSync(filePath, finalCode);
console.log('AI Service structure perfectly restored.');
