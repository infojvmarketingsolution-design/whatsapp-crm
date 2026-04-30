
import fs from 'fs';

const content = fs.readFileSync('o:/OneDrive/Business/Development/Whatsapp Api + CRM (19 March 2026)/frontend/src/pages/Tasks.jsx', 'utf8');

let openDivs = 0;

const lines = content.split('\n');
lines.forEach((line, i) => {
    const od = (line.match(/<div/g) || []).length;
    const cd = (line.match(/<\/div>/g) || []).length;

    const old = openDivs;
    openDivs += od - cd;

    if (openDivs !== old) {
        if (i > 950 && i < 1050) {
            console.log(`${i+1}: Divs: ${openDivs} (Change: ${od-cd})`);
        }
    }
});

console.log(`Final counts: Divs: ${openDivs}`);
