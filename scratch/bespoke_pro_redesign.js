
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. COMPLETELY REDESIGN THE ENTIRE SLIDE-OVER STRUCTURE
// We will replace the entire content of the showProfile conditional block.

const startMarker = '{showProfile && selectedContact && editedContact && (';
const endMarker = ')}'; // This is tricky due to nested closures.

// I'll use a regex to target the entire fixed-inset-0 div for the profile.
const profileBlockRegex = /<div className="fixed inset-0 z-\[150\] flex justify-end bg-slate-900\/40 backdrop-blur-\[6px\] animate-fade-in"[\s\S]+?<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+\)\}/i;

const bespokeDesign = `<div className="fixed inset-0 z-[150] flex justify-end bg-slate-900/60 backdrop-blur-[8px] animate-fade-in" onClick={() => setShowProfile(false)}>
            <div 
              className="w-[1100px] h-full bg-white shadow-2xl flex flex-col animate-slide-left relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
               {/* BESPOKE HEADER: LUXURY FEEL */}
               <div className="bg-white p-12 pb-8 flex items-end justify-between shrink-0 relative z-20">
                   <div className="flex items-center space-x-10">
                       <div className="relative group">
                           <div className="w-24 h-24 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-4xl font-light text-white shadow-2xl group-hover:scale-105 transition-transform duration-500">
                              {editedContact.firstName ? editedContact.firstName.charAt(0) : (selectedContact.name?.charAt(0) || 'U')}
                           </div>
                           <div className="absolute -top-3 -right-3 w-12 h-12 bg-emerald-500 rounded-full border-8 border-white flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                              {editedContact.score || 0}%
                           </div>
                       </div>
                       <div className="space-y-2">
                           <div className="flex items-center space-x-4">
                              <h2 className="text-5xl font-black tracking-tight text-slate-900">
                                 {editedContact.firstName || editedContact.name || 'Lead'} {editedContact.lastName || ''}
                              </h2>
                              <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{editedContact.status || 'ACTIVE'}</span>
                           </div>
                           <div className="flex items-center space-x-8 text-slate-400">
                              <span className="flex items-center text-xs font-bold uppercase tracking-widest"><Phone size={14} className="mr-3 text-emerald-500" /> {editedContact.phone}</span>
                              <span className="flex items-center text-xs font-bold uppercase tracking-widest"><Briefcase size={14} className="mr-3" /> {editedContact.profession || 'NO PROFESSION'}</span>
                           </div>
                       </div>
                   </div>

                   <div className="flex items-center space-x-4 mb-2">
                       <button 
                         onClick={() => updateContactDetail(selectedContact._id, editedContact)}
                         disabled={!showSaveFab || isUpdatingContact}
                         className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all duration-300 disabled:opacity-30"
                       >
                          {isUpdatingContact ? 'Syncing...' : 'Finalize Record'}
                       </button>
                       <button onClick={() => setShowProfile(false)} className="p-4 text-slate-300 hover:text-slate-900 transition-colors"><X size={32} strokeWidth={1} /></button>
                   </div>
               </div>

               <div className="flex-1 flex overflow-hidden">
                  {/* LEFT PANEL: DATA FACT SHEET */}
                  <div className="w-[450px] bg-slate-50/50 border-r border-slate-100 overflow-y-auto custom-scrollbar p-12 pt-4 space-y-16">
                     
                     {/* INQUIRY FACT SHEET */}
                     <div className="space-y-10">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                           <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">AI Inquiry Intel</h3>
                           <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></div> Live Capture</span>
                        </div>

                        <div className="space-y-10">
                           {/* OVERVIEW: CLEAN TYPOGRAPHY */}
                           <div className="space-y-4">
                              <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Lead Qualification Overview</label>
                              <textarea 
                                value={editedContact.qualification || ''} 
                                onChange={e=>handleFieldChange('qualification', e.target.value)} 
                                placeholder="Waiting for intelligence..." 
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-600 leading-relaxed outline-none resize-none placeholder:text-slate-200" 
                                rows={4}
                              />
                           </div>

                           <div className="grid grid-cols-1 gap-10">
                              {[
                                { label: 'Target Program', value: editedContact.selectedProgram, field: 'selectedProgram', icon: <Target size={16}/> },
                                { label: 'Career Ambition', value: editedContact.flowVariables?.careerGoal, field: 'flowVariables.careerGoal', icon: <Activity size={16}/> },
                                { label: 'Investment Budget', value: editedContact.budget, field: 'budget', icon: <Wallet size={16}/> },
                                { label: 'Contact Window', value: editedContact.preferredCallTime, field: 'preferredCallTime', icon: <Clock size={16}/> }
                              ].map((item, idx) => (
                                <div key={idx} className="space-y-3 group">
                                   <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center">
                                      <span className="mr-3 opacity-30 group-hover:opacity-100 transition-opacity">{item.icon}</span>
                                      {item.label}
                                   </label>
                                   <input 
                                      value={item.value || ''} 
                                      onChange={e=>handleFieldChange(item.field, e.target.value)} 
                                      placeholder="Not Disclosed" 
                                      className="w-full bg-transparent border-b border-slate-100 pb-2 text-[13px] font-black text-slate-800 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-200"
                                   />
                                </div>
                              ))}

                              <div className="space-y-3">
                                 <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center">
                                    <Flame size={16} className="mr-3 opacity-30" />
                                    AI Engagement Heat
                                 </label>
                                 <div className="flex space-x-3">
                                    {['Cold', 'Warm', 'Hot'].map(lvl => (
                                       <button 
                                          key={lvl}
                                          onClick={() => handleFieldChange('heatLevel', lvl)}
                                          className={\`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all \${
                                             editedContact.heatLevel === lvl 
                                             ? 'bg-slate-900 text-white shadow-lg' 
                                             : 'bg-white border border-slate-100 text-slate-300 hover:border-slate-300'
                                          }\`}
                                       >
                                          {lvl}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* TAGS */}
                     <div className="space-y-6">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] border-b border-slate-200 pb-4">Internal Markers</h3>
                        <div className="flex flex-wrap gap-3">
                           {(editedContact.tags || []).map(tag => (
                              <span key={tag} className="px-4 py-2 bg-white border border-slate-100 rounded-2xl text-[9px] font-black text-slate-500 uppercase tracking-[0.1em] shadow-sm">{tag}</span>
                           ))}
                           <button className="px-4 py-2 border border-dashed border-slate-200 rounded-2xl text-[9px] font-black text-slate-300 uppercase tracking-[0.1em] hover:text-emerald-500 hover:border-emerald-500 transition-all">+ Add Marker</button>
                        </div>
                     </div>
                  </div>

                  {/* RIGHT PANEL: INTERACTION HUB */}
                  <div className="flex-1 flex flex-col bg-white overflow-hidden">
                     <div className="px-16 flex space-x-16 border-b border-slate-100 bg-white z-10 shrink-0">
                        {['Timeline', 'Chat history', 'Strategic Notes'].map(tab => {
                           const tabId = tab.toLowerCase().split(' ')[0];
                           const isActive = activeTab === (tabId === 'chat' ? 'chatlog' : tabId === 'strategic' ? 'internalnotes' : tabId);
                           return (
                              <button 
                                key={tab} 
                                onClick={() => setActiveTab(tabId === 'chat' ? 'chatlog' : tabId === 'strategic' ? 'internalnotes' : tabId)} 
                                className={\`py-8 text-[11px] font-black uppercase tracking-[0.25em] relative transition-all \${isActive ? 'text-slate-900' : 'text-slate-300 hover:text-slate-500'}\`}
                              >
                                 {tab}
                                 {isActive && <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900"></div>}
                              </button>
                           );
                        })}
                     </div>

                     <div className="flex-1 overflow-y-auto custom-scrollbar p-16 space-y-16">
                        {activeTab === 'timeline' && (
                           <div className="space-y-12 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
                               {(selectedContact.timeline || []).filter(e => !e.description.includes('Contact details updated')).slice().reverse().map((event, idx) => (
                                  <div key={idx} className="relative pl-14 animate-fade-in" style={{ animationDelay: \`\${idx * 50}ms\` }}>
                                     <div className="absolute left-0 top-1.5 w-[40px] h-[40px] rounded-full bg-white border border-slate-100 flex items-center justify-center z-10 shadow-sm"><Activity size={14} className="text-slate-400" /></div>
                                     <div className="space-y-2">
                                        <div className="flex justify-between items-start">
                                           <p className="text-[15px] font-bold text-slate-800 leading-relaxed">{event.description}</p>
                                           <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">{event.eventType}</span>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center"><Clock size={12} className="mr-2" /> {formatDateTime(event.timestamp)}</p>
                                     </div>
                                  </div>
                               ))}
                           </div>
                        )}

                        {activeTab === 'chatlog' && (
                           <div className="space-y-8">
                              {recentMessages.length === 0 ? (
                                 <div className="p-20 text-center space-y-6">
                                    <MessageSquare size={48} strokeWidth={1} className="text-slate-200 mx-auto" />
                                    <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">History is quiet.</p>
                                 </div>
                              ) : recentMessages.map((msg, idx) => (
                                 <div key={idx} className={\`flex \${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}\`}>
                                    <div className={\`p-6 px-8 rounded-3xl text-[14px] font-bold leading-relaxed max-w-[75%] \${msg.direction === 'OUTBOUND' ? 'bg-slate-900 text-white rounded-br-none' : 'bg-slate-50 text-slate-600 rounded-bl-none'}\`}>
                                       {msg.content}
                                       <div className={\`mt-3 text-[9px] font-black uppercase tracking-widest \${msg.direction === 'OUTBOUND' ? 'text-white/40' : 'text-slate-300'}\`}>{formatDateTime(msg.createdAt)}</div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}

                        {activeTab === 'internalnotes' && (
                           <div className="space-y-12">
                              <div className="space-y-6">
                                 <textarea 
                                   value={noteInput} 
                                   onChange={e=>setNoteInput(e.target.value)} 
                                   placeholder="Add a high-level strategic note..." 
                                   className="w-full bg-slate-50 border-none rounded-3xl p-8 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-200" 
                                   rows={5} 
                                 />
                                 <div className="flex justify-end">
                                    <button 
                                      onClick={()=>addInternalNote(selectedContact._id)} 
                                      disabled={isAddingNote || !noteInput.trim()} 
                                      className="px-12 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-600 transition-all disabled:opacity-30"
                                    >
                                       Save Strategic Note
                                    </button>
                                 </div>
                              </div>
                              <div className="space-y-8">
                                 {(selectedContact.notes || []).slice().reverse().map((note, idx) => (
                                    <div key={idx} className="p-10 border border-slate-100 rounded-[3rem] space-y-6 group hover:border-emerald-100 transition-colors">
                                       <p className="text-[16px] font-bold text-slate-700 leading-relaxed italic">"{note.content}"</p>
                                       <div className="flex items-center justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                          <div className="flex items-center space-x-3">
                                             <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">{note.createdBy?.charAt(0).toUpperCase()}</div>
                                             <span>{note.createdBy}</span>
                                          </div>
                                          <span>{formatDateTime(note.createdAt)}</span>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               <div className="px-12 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
                  <div className="flex items-center"><ShieldCheck size={14} className="mr-3 text-emerald-500" /> Enterprise Data Isolation Active</div>
                  <div className="flex items-center space-x-8">
                     <span>Ref: {selectedContact._id.toUpperCase()}</span>
                     <span>v2.5 Professional</span>
                  </div>
               </div>
            </div>
         </div>`;

if (profileBlockRegex.test(content)) {
    content = content.replace(profileBlockRegex, bespokeDesign);
    fs.writeFileSync(filePath, content);
    console.log('Profile transformed to Bespoke Pro design.');
} else {
    console.log('Profile block regex failed.');
}
