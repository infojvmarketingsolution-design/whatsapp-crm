
const fs = require('fs');
const filePath = 'o:\\OneDrive\\Business\\Development\\Whatsapp Api + CRM (19 March 2026)\\frontend\\src\\pages\\Contacts.jsx';
let content = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');

const newMobile = `                           <div className="flex flex-col space-y-0.5">
                              <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter flex items-center">
                                 <Users size={8} className="mr-1" /> {agents.find(a => a._id === c.assignedAgent)?.name || 'Unassigned'}
                              </span>
                              {c.assignedCounsellor && (
                                 <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter flex items-center">
                                    <Shield size={8} className="mr-1" /> {agents.find(a => a._id === c.assignedCounsellor)?.name || 'No Expert'}
                                 </span>
                              )}
                           </div>`;

const pattern = /<span className="text-\[10px\] font-black text-slate-500 uppercase tracking-tighter">\s*\{agents\.find\(a => a\._id === c\.assignedAgent\)\?\.name \|\| 'Unassigned'\}\s*<\/span>/;

if (pattern.test(content)) {
    console.log("Regex match found!");
    const result = content.replace(pattern, newMobile);
    fs.writeFileSync(filePath, result);
    console.log("Success");
} else {
    console.log("Regex match failed.");
}
