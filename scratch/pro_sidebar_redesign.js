
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Use Regex to find the entire LEFT SIDEBAR content and replace it with a PRO version.
const sidebarRegex = /\{{0,1}\/\* LEFT SIDEBAR: IDENTITY & AI INSIGHTS \*\/\}[\s\S]+?\{{0,1}\/\* RIGHT PANEL: INTERACTION HUB \*\/\}/i;

const proSidebar = `{/* LEFT SIDEBAR: SIMPLE & PRO DETAILS */}
                 <div className="w-[400px] bg-white border-r border-slate-100 overflow-y-auto custom-scrollbar p-10 space-y-10">
                    
                    {/* CORE IDENTITY HEADER */}
                    <div className="space-y-1">
                       <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">Lead Identity</h3>
                       <div className="grid grid-cols-2 gap-4">
                          <input 
                             value={editedContact.firstName || editedContact.name || ''} 
                             onChange={e=>handleFieldChange('firstName', e.target.value)} 
                             className="text-lg font-black text-slate-800 bg-transparent border-none p-0 outline-none placeholder:text-slate-200"
                             placeholder="First Name"
                          />
                          <input 
                             value={editedContact.lastName || ''} 
                             onChange={e=>handleFieldChange('lastName', e.target.value)} 
                             className="text-lg font-black text-slate-800 bg-transparent border-none p-0 outline-none placeholder:text-slate-200"
                             placeholder="Last Name"
                          />
                       </div>
                       <div className="flex items-center text-xs font-bold text-slate-400">
                          <Phone size={12} className="mr-2 text-teal-500" /> {editedContact.phone}
                       </div>
                    </div>

                    <div className="h-px bg-slate-50"></div>

                    {/* INQUIRY INTELLIGENCE (The "Relevant Details") */}
                    <div className="space-y-8">
                       <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">Inquiry Intelligence</h3>
                       
                       <div className="space-y-6">
                          {/* OVERVIEW */}
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">AI Qualification Summary</label>
                             <textarea 
                                value={editedContact.qualification || ''} 
                                onChange={e=>handleFieldChange('qualification', e.target.value)} 
                                placeholder="Waiting for AI summary..." 
                                className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-600 outline-none focus:border-teal-200 transition-all resize-none" 
                                rows={3}
                             />
                          </div>

                          {/* GRID DETAILS */}
                          <div className="grid grid-cols-1 gap-6">
                             {[
                                { label: 'Target Program', value: editedContact.selectedProgram, field: 'selectedProgram', icon: <Target size={14}/>, color: 'text-teal-500' },
                                { label: 'Career Goal', value: editedContact.flowVariables?.careerGoal, field: 'flowVariables.careerGoal', icon: <Activity size={14}/>, color: 'text-purple-400' },
                                { label: 'Est. Budget', value: editedContact.budget, field: 'budget', icon: <Wallet size={14}/>, color: 'text-blue-400' },
                                { label: 'Call Time', value: editedContact.preferredCallTime, field: 'preferredCallTime', icon: <Clock size={14}/>, color: 'text-orange-400' }
                             ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between group">
                                   <div className="flex items-center space-x-3">
                                      <div className={\`\${item.color} opacity-40 group-hover:opacity-100 transition-opacity\`}>{item.icon}</div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</label>
                                   </div>
                                   <input 
                                      value={item.value || ''} 
                                      onChange={e=>handleFieldChange(item.field, e.target.value)} 
                                      placeholder="Not set" 
                                      className="text-right text-[11px] font-black text-slate-700 bg-transparent border-none outline-none placeholder:text-slate-200 w-1/2"
                                   />
                                </div>
                             ))}

                             {/* HEAT LEVEL (Special) */}
                             <div className="flex items-center justify-between group">
                                <div className="flex items-center space-x-3">
                                   <Flame size={14} className={\`\${editedContact.heatLevel === 'Hot' ? 'text-red-500' : 'text-slate-300'} transition-colors\`} />
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Heat Level</label>
                                </div>
                                <select 
                                   value={editedContact.heatLevel} 
                                   onChange={e=>handleFieldChange('heatLevel', e.target.value)} 
                                   className="text-right text-[11px] font-black text-slate-700 bg-transparent border-none outline-none appearance-none cursor-pointer"
                                >
                                   {['Cold', 'Warm', 'Hot'].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                                </select>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="h-px bg-slate-50"></div>

                    {/* PROFESSIONAL TAGS / METADATA */}
                    <div className="space-y-4">
                       <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">Lead Tags</h3>
                       <div className="flex flex-wrap gap-2">
                          {(editedContact.tags || []).map(tag => (
                             <span key={tag} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">{tag}</span>
                          ))}
                          <button className="px-3 py-1 border border-dashed border-slate-200 rounded-lg text-[9px] font-black text-slate-300 uppercase tracking-widest hover:border-teal-300 hover:text-teal-500 transition-all">+ Add Tag</button>
                       </div>
                    </div>

                 </div>

                 {/* RIGHT PANEL: INTERACTION HUB */}`;

if (sidebarRegex.test(content)) {
    content = content.replace(sidebarRegex, proSidebar);
    fs.writeFileSync(filePath, content);
    console.log('Sidebar transformed to Simple & Pro design.');
} else {
    console.log('Sidebar regex failed. Trying more aggressive approach.');
    // Aggressive approach: find from the start of the panel flex to the right panel
    const aggRegex = /<div className="flex-1 flex overflow-hidden">[\s\S]+?\{{0,1}\/\* RIGHT PANEL: INTERACTION HUB \*\/\}/i;
    const aggReplacement = `<div className="flex-1 flex overflow-hidden">
                 ${proSidebar}`;
    if (aggRegex.test(content)) {
        content = content.replace(aggRegex, aggReplacement);
        fs.writeFileSync(filePath, content);
        console.log('Sidebar transformed via aggressive regex.');
    }
}
