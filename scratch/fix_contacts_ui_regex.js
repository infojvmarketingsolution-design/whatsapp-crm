
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Use Regex to find the AI Bot Intelligence section and replace everything inside it.
// Starts after "AI Bot Intelligence" header and ends before "Basic Identity" header.

const regex = /AI Bot Intelligence[\s\S]+?Basic Identity/i;

const replacement = `AI Bot Intelligence
                           </h3>
                           <div className="px-2 py-0.5 bg-teal-50 text-teal-600 rounded-md text-[9px] font-black uppercase tracking-widest">Auto-Captured</div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6">
                            <div>
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5 ml-1">AI Extracted Overview</label>
                               <div className="relative group">
                                  <div className="absolute inset-0 bg-teal-50/30 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-all"></div>
                                  <textarea 
                                    value={editedContact.qualification || ''} 
                                    onChange={e=>handleFieldChange('qualification', e.target.value)} 
                                    placeholder="AI is summarizing this profile..." 
                                    className="w-full bg-[#f9fafb] border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:border-teal-300/50 transition-all shadow-inner relative z-10" 
                                    rows={3}
                                  />
                               </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Target Program</label>
                                   <div className="relative">
                                      <Target size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500" />
                                      <input 
                                        value={editedContact.selectedProgram || ''} 
                                        onChange={e=>handleFieldChange('selectedProgram', e.target.value)} 
                                        placeholder="Not selected" 
                                        className="w-full bg-[#f9fafb] border border-slate-100 text-[11px] font-black text-slate-700 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-teal-300/50 transition-all" 
                                      />
                                   </div>
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Career Objective</label>
                                   <div className="relative">
                                      <Activity size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
                                      <input 
                                        value={editedContact.flowVariables?.careerGoal || ''} 
                                        onChange={e=>handleFieldChange('flowVariables.careerGoal', e.target.value)} 
                                        placeholder="Ambition not set" 
                                        className="w-full bg-[#f9fafb] border border-slate-100 text-[11px] font-black text-slate-700 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-teal-300/50 transition-all" 
                                      />
                                   </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">AI Heat Level</label>
                                  <div className="relative">
                                     <Flame size={14} className={\`absolute left-4 top-1/2 -translate-y-1/2 \${editedContact.heatLevel === 'Hot' ? 'text-red-500' : 'text-slate-300'}\`} />
                                     <select 
                                       value={editedContact.heatLevel} 
                                       onChange={e=>handleFieldChange('heatLevel', e.target.value)} 
                                       className="w-full bg-[#f9fafb] border border-slate-100 text-[11px] font-black text-slate-700 rounded-xl pl-11 pr-4 py-3 outline-none cursor-pointer"
                                     >
                                        {['Cold', 'Warm', 'Hot'].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                                     </select>
                                  </div>
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Estimated Budget</label>
                                  <div className="relative">
                                     <Wallet size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" />
                                     <input 
                                       value={editedContact.budget || ''} 
                                       onChange={e=>handleFieldChange('budget', e.target.value)} 
                                       placeholder="Not disclosed" 
                                       className="w-full bg-[#f9fafb] border border-slate-100 text-[11px] font-black text-slate-700 rounded-xl pl-11 pr-4 py-3 outline-none" 
                                     />
                                  </div>
                               </div>
                           </div>

                           <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Preferred Callback Time</label>
                                   <div className="relative">
                                      <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400" />
                                      <input 
                                        value={editedContact.preferredCallTime || ''} 
                                        onChange={e=>handleFieldChange('preferredCallTime', e.target.value)} 
                                        placeholder="Anytime" 
                                        className="w-full bg-[#f9fafb] border border-slate-100 text-[11px] font-black text-slate-700 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-teal-300/50 transition-all" 
                                      />
                                   </div>
                                </div>
                           </div>
                        </div>
                     </section>
                     
                     {/* SECTION: Core Identity`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content);
    console.log('Fixed successfully via Regex.');
} else {
    console.log('Regex target not found.');
}
