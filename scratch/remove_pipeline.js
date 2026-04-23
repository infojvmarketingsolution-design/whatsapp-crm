
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Use Regex to find and remove the HIGH-FIDELITY PIPELINE section.
// It's inside a div with className="bg-white/80 backdrop-blur-md px-12 py-6 ..."
const pipelineRegex = /\{{0,1}\/\* HIGH-FIDELITY PIPELINE \*\/\}[\s\S]+?<div className="bg-white\/80 backdrop-blur-md px-12 py-6[\s\S]+?<\/div>[\s\S]+?<\/div>/i;

if (pipelineRegex.test(content)) {
    content = content.replace(pipelineRegex, '');
    console.log('Pipeline bar removed successfully.');
} else {
    console.log('Pipeline regex failed. Trying fallback...');
    // Fallback search for the specific className pattern
    const fallbackRegex = /<div className="bg-white\/80 backdrop-blur-md px-12 py-6[\s\S]+?PIPELINE_STAGES\.map[\s\S]+?<\/div>[\s\S]+?<\/div>/i;
    if (fallbackRegex.test(content)) {
        content = content.replace(fallbackRegex, '');
        console.log('Pipeline bar removed via fallback.');
    } else {
        console.log('Could not find the pipeline section.');
    }
}

fs.writeFileSync(filePath, content);
console.log('Profile cleanup complete.');
