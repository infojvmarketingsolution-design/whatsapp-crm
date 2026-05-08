
const fs = require('fs');
const path = require('path');

const filePath = 'o:\\OneDrive\\Business\\Development\\Whatsapp Api + CRM (19 March 2026)\\frontend\\src\\pages\\Contacts.jsx';

let content = fs.readFileSync(filePath, 'utf-8');

// 1. Update Header
const oldHeader = '<th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Owner</th>';
const newHeader = '<th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Telecaller</th>\n                        <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Counsellor</th>';

content = content.replace(oldHeader, newHeader);

// 2. Update Body
const oldBody = `                           <td className="py-5 px-6 border-b border-gray-50" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center">
                                 <Users size={12} className="mr-2 text-gray-400" />
                                 <select 
                                    value={c.assignedAgent || ''} 
                                    onChange={(e) => {
                                       handleBulkAction("transfer_leads", e.target.value, [c._id]);
                                    }}
                                    className="bg-transparent text-[11px] font-bold text-slate-600 outline-none cursor-pointer border-none p-0 focus:ring-0 max-w-[120px] overflow-hidden text-ellipsis"
                                 >
                                    <option value="">Unassigned</option>
                                    {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                                 </select>
                              </div>
                           </td>`;

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

// Normalize line endings
const norm = (s) => s.replace(/\r\n/g, '\n').trim();
const contentNorm = content.replace(/\r\n/g, '\n');
const oldBodyNorm = norm(oldBody);

if (contentNorm.includes(oldBodyNorm)) {
    console.log("Direct match found");
    const result = contentNorm.replace(oldBodyNorm, norm(newBody));
    fs.writeFileSync(filePath, result);
    console.log("Success");
} else {
    console.log("Direct match failed. Trying fuzzy match...");
    // Just replace the header first as a fallback
    fs.writeFileSync(filePath, contentNorm.replace(oldHeader, newHeader));
    console.log("Header updated. Body still pending.");
}
