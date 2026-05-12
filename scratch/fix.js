const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/AIChatbot/AIChatbot.jsx', 'utf8');
c = c.replace(/\{\(step\.type === 'GREETING' \|\| step\.type === 'SUCCESS_PROOF'\) && \(/g, "{(step.type !== 'PROGRAM_SELECTION' && step.type !== 'QUALIFICATION' && step.type !== 'CALL_TIME') && (");
fs.writeFileSync('frontend/src/pages/AIChatbot/AIChatbot.jsx', c);
console.log('done');
