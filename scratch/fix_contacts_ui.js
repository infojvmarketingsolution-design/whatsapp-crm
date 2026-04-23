
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Identify the grid block for Program and Time
const target = `                            <div className="grid grid-cols-2 gap-4">
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
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Preferred Time</label>
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
                            </div>`;

const replacement = `                            <div className="grid grid-cols-2 gap-4">
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
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Preferred Time</label>
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
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">AI Heat Level</label>
                                   <div className="relative">
                                      <Flame size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500" />
                                      <input 
                                        value={editedContact.heatLevel || ''} 
                                        onChange={e=>handleFieldChange('heatLevel', e.target.value)} 
                                        placeholder="Cold" 
                                        className="w-full bg-[#f9fafb] border border-slate-100 text-[11px] font-black text-slate-700 rounded-xl pl-11 pr-4 py-3 outline-none" 
                                      />
                                   </div>
                                </div>
                            </div>`;

// Note: Heat Level was in a separate block before. Let's see if we should remove the old one.
// Old block:
const heatBlock = `                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Heat Level</label>
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
                           </div>`;

// New replacement will include everything.
const fullReplacement = `                            <div className="grid grid-cols-2 gap-4">
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
                           </div>`;

// Combine the two blocks for search
const combinedTarget = target + "\n\n" + heatBlock;
const combinedTargetRN = target.replace(/\n/g, '\r\n') + "\r\n\r\n" + heatBlock.replace(/\n/g, '\r\n');

if (content.includes(combinedTarget)) {
    content = content.replace(combinedTarget, fullReplacement);
    fs.writeFileSync(filePath, content);
    console.log('Fixed successfully (LF).');
} else if (content.includes(combinedTargetRN)) {
    content = content.replace(combinedTargetRN, fullReplacement.replace(/\n/g, '\r\n'));
    fs.writeFileSync(filePath, content);
    console.log('Fixed successfully (CRLF).');
} else {
    console.log('Combined target not found.');
}
