
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../backend/src/services/ai.service.js');
let content = fs.readFileSync(filePath, 'utf8');

// I will move the generateStrategicBrief method inside the class block.

// 1. Remove the misplaced block at the end
const classEndIndex = content.lastIndexOf('}\n\nmodule.exports = new AIService()');
if (classEndIndex !== -1) {
    const head = content.substring(0, classEndIndex);
    const misplacedBlock = content.substring(content.indexOf('  /**', classEndIndex));
    
    // The misplaced block starts with the comment
    const cleanMisplaced = misplacedBlock.trim();
    
    // New Content: Head + Misplaced Method + Class Closing + Export
    const fixedContent = head + '\n' + cleanMisplaced + '\n}\n\nmodule.exports = new AIService();\n';
    
    fs.writeFileSync(filePath, fixedContent);
    console.log('AI Service structure fixed.');
} else {
    console.log('Class end markers not found. Trying alternative cleanup...');
    // Fallback logic
    content = content.replace('}\n\nmodule.exports = new AIService()', '');
    content = content.trim();
    if (content.endsWith('}')) {
        content = content.slice(0, -1);
    }
    // Re-construct properly
    // ... I'll just use a safer approach: read the whole file and re-write the class ending
}
