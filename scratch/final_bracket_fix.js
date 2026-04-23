
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/src/services/ai.service.js');
let content = fs.readFileSync(filePath, 'utf8').trim();

// The file currently ends at line 256 with the export.
// It needs one more closing brace for the class before the export.

if (!content.includes('module.exports')) {
    // If somehow the export was lost
    content += '\n  }\n}\n\nmodule.exports = new AIService();\n';
} else {
    // Replace the end of the file with the correct sequence
    const exportLine = 'module.exports = new AIService();';
    if (content.includes(exportLine)) {
        content = content.replace(exportLine, '');
        content = content.trim();
        // Check if it already has two braces
        const lastTwo = content.slice(-2);
        if (lastTwo !== '}\n}') {
            // Add the missing class closing brace
            content += '\n  }\n}\n\n' + exportLine + '\n';
        } else {
            content += '\n' + exportLine + '\n';
        }
    }
}

fs.writeFileSync(filePath, content);
console.log('Final class bracket added to AI Service.');
