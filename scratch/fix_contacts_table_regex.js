
const fs = require('fs');
const filePath = 'o:\\OneDrive\\Business\\Development\\Whatsapp Api + CRM (19 March 2026)\\frontend\\src\\pages\\Contacts.jsx';
let content = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');

const newBody = `                           <td className="py-5 px-6 border-b border-gray-50" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center">
                                 <Users size={12} className="mr-2 text-blue-400" />
                                 <select 
                                    value={c.assignedAgent || ''} 
                                    onChange={(e) => {
                                       handleBulkAction("transfer_leads", e.target.value, [c._id]);
                                    }}
                                    className="bg-transparent text-[11px] font-bold text-slate-600 outline-none cursor-pointer border-none p-0 focus:ring-0 max-w-[100px] overflow-hidden text-ellipsis"
                                 >
                                    <option value="">Unassigned</option>
                                    {agents.filter(a => ['TELECALLER', 'AGENT', 'ADMIN'].includes(a.role?.toUpperCase())).map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                                 </select>
                              </div>
                           </td>
                           <td className="py-5 px-6 border-b border-gray-50" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center">
                                 <Shield size={12} className="mr-2 text-indigo-400" />
                                 <select 
                                    value={c.assignedCounsellor || ''} 
                                    onChange={(e) => {
                                       updateContactDetail(c._id, { ...c, assignedCounsellor: e.target.value });
                                    }}
                                    className="bg-transparent text-[11px] font-bold text-slate-600 outline-none cursor-pointer border-none p-0 focus:ring-0 max-w-[100px] overflow-hidden text-ellipsis"
                                 >
                                    <option value="">No Expert</option>
                                    {agents.filter(a => ['MANAGER_COUNSELLOUR', 'MANAGER_COUNSELOR', 'COUNSELLOUR', 'COUNSELLOR', 'COUNSELOR', 'MANAGER COUNSELLOUR'].includes(a.role?.toUpperCase())).map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                                 </select>
                              </div>
                           </td>`;

// Regex to find the <td> block for assignedAgent
const pattern = /<td className="py-5 px-6 border-b border-gray-50" onClick=\{\(e\) => e\.stopPropagation\(\)\}>\s*<div className="flex items-center">\s*<Users size=\{12\} className="mr-2 text-gray-400" \/>\s*<select[\s\S]*?<\/select>\s*<\/div>\s*<\/td>/;

if (pattern.test(content)) {
    console.log("Regex match found!");
    const result = content.replace(pattern, newBody);
    fs.writeFileSync(filePath, result);
    console.log("Success");
} else {
    console.log("Regex match failed.");
}
