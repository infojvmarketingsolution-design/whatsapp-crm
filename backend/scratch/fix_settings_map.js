const fs = require('fs');

const newMap = {
  "12th Pass": {
    "Trending Programs": [
      "B.Voc Cyber Security",
      "B.Voc Fintech",
      "B.Sc IT Ai & ML",
      "B.Sc IT Data Analytics"
    ],
    "Traditional Programs": [
      "B.Com",
      "B.Tech",
      "BBA"
    ]
  },
  "Graduation": {
    "Trending Programs": [
      "Cyber Security & Digital Forensics",
      "Cloud Automation",
      "Data Analytics",
      "Animation, VFX & Game Design",
      "Blockchain Technology",
      "Software & Mobile App Development"
    ],
    "Traditional Programs": [
      "M.Com",
      "MBA",
      "M.Tech",
      "M.Sc",
      "Other"
    ]
  }
};

// 1. Update settings.controller.js
const p1 = './src/controllers/settings.controller.js';
if (fs.existsSync(p1)) {
  let c1 = fs.readFileSync(p1, 'utf8');
  // Replace the programMap block
  const targetMapStart = "settings.automation.aiPrompts.programMap = {";
  const targetMapEnd = "}"; // matching structure
  // Let's replace the whole settings.automation.aiPrompts.programMap assignment block
  const startIdx = c1.indexOf(targetMapStart);
  if (startIdx !== -1) {
     // Find the closing brace of settings.automation.aiPrompts.programMap assignment (around line 99/100)
     const endKeyword = "updated = true;";
     const endIdx = c1.indexOf(endKeyword, startIdx);
     if (endIdx !== -1) {
        const replacement = `settings.automation.aiPrompts.programMap = ${JSON.stringify(newMap, null, 8).replace(/}$/, '      }')};\n           `;
        c1 = c1.substring(0, startIdx) + replacement + c1.substring(endIdx);
        fs.writeFileSync(p1, c1, 'utf8');
        console.log('Successfully updated programMap in settings.controller.js!');
     }
  } else {
     console.log('Could not find programMap block in settings.controller.js');
  }
}

// 2. Update force-migrate-settings.js
const p2 = './scripts/force-migrate-settings.js';
if (fs.existsSync(p2)) {
  let c2 = fs.readFileSync(p2, 'utf8');
  const targetStart = "const DEFAULT_PROGRAM_MAP = {";
  const targetEnd = "};";
  const startIdx = c2.indexOf(targetStart);
  if (startIdx !== -1) {
     const endIdx = c2.indexOf(targetEnd, startIdx);
     if (endIdx !== -1) {
        const replacement = `const DEFAULT_PROGRAM_MAP = ${JSON.stringify(newMap, null, 2)}`;
        c2 = c2.substring(0, startIdx) + replacement + c2.substring(endIdx);
        fs.writeFileSync(p2, c2, 'utf8');
        console.log('Successfully updated programMap in force-migrate-settings.js!');
     }
  } else {
     console.log('Could not find DEFAULT_PROGRAM_MAP in force-migrate-settings.js');
  }
}
