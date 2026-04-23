
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// The issue is that the profile block is missing its closing )} 
// Look for the end of the profile div and add it.

const target = `                  </div>
               </div>
            </div>
         </div>

      {/* ADVANCED FILTER PRO CONSOLE (SIDEBAR) */}`;

const replacement = `                  </div>
               </div>
            </div>
         </div>
      )}

      {/* ADVANCED FILTER PRO CONSOLE (SIDEBAR) */}`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content);
    console.log('Syntax error fixed successfully.');
} else {
    console.log('Target not found. Trying flexible regex...');
    // Flexible regex to find the end of the profile block before the filter console
    const regex = /v2\.5 Professional[\s\S]+?<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+\n?\s+\{\/\* ADVANCED/i;
    const match = content.match(regex);
    if (match) {
        const fixed = match[0].replace('</div>\n\n      {/* ADVANCED', '</div>\n      )}\n\n      {/* ADVANCED').replace('</div>\r\n\r\n      {/* ADVANCED', '</div>\r\n      )}\r\n\r\n      {/* ADVANCED');
        content = content.replace(regex, fixed);
        fs.writeFileSync(filePath, content);
        console.log('Syntax error fixed via regex.');
    } else {
        console.log('Could not find the syntax error location.');
    }
}
