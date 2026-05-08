
import os

file_path = r'o:\OneDrive\Business\Development\Whatsapp Api + CRM (19 March 2026)\frontend\src\pages\Contacts.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Header
old_header = '<th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Owner</th>'
new_header = '<th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Telecaller</th>\n                        <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Counsellor</th>'

content = content.replace(old_header, new_header)

# 2. Update Body
# We use a very specific block to avoid multiple matches if possible
old_body = """                           <td className="py-5 px-6 border-b border-gray-50" onClick={(e) => e.stopPropagation()}>
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
                           </td>"""

new_body = """                           <td className="py-5 px-6 border-b border-gray-50" onClick={(e) => e.stopPropagation()}>
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
                           </td>"""

# Handle potential CRLF issues by normalizing before replacement
content_norm = content.replace('\r\n', '\n')
old_body_norm = old_body.replace('\r\n', '\n')
new_body_norm = new_body.replace('\r\n', '\n')

if old_body_norm in content_norm:
    content_norm = content_norm.replace(old_body_norm, new_body_norm)
    # Write back with original line endings if possible, or just use LF (standard for JS)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content_norm)
    print("Success")
else:
    print("Failure: old_body not found")
    # Try finding it with different indentation or whitespace
    import re
    # Escape special characters in old_body for regex
    pattern = re.escape(old_body_norm).replace(r'\ ', r'\s*').replace(r'\n', r'\s*\n\s*')
    if re.search(pattern, content_norm):
        print("Regex match found!")
        content_norm = re.sub(pattern, new_body_norm, content_norm)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content_norm)
        print("Success via regex")
    else:
        print("Failure: even regex couldn't find it")
