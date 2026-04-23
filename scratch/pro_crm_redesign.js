
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Use Regex to find the entire profile section and replace it with the "Pro CRM" version.
const profileBlockRegex = /<div className="fixed inset-0 z-\[150\] flex justify-end bg-slate-900\/60 backdrop-blur-\[8px\] animate-fade-in"[\s\S]+?<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+\)\}/i;

const proCrmDesign = `<div className="fixed inset-0 z-[150] flex justify-end bg-slate-900/40 animate-fade-in" onClick={() => setShowProfile(false)}>
            <div 
              className="w-[1000px] h-full bg-[#fcfcfd] shadow-2xl flex flex-col animate-slide-left relative"
              onClick={(e) => e.stopPropagation()}
            >
               {/* PRO CRM HEADER */}
               <div className="bg-white border-b border-slate-200 px-10 py-6 flex items-center justify-between shrink-0">
                   <div className="flex items-center space-x-6">
                       <div className="w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-teal-500/20">
                          {editedContact.firstName ? editedContact.firstName.charAt(0) : (selectedContact.name?.charAt(0) || 'U')}
                       </div>
                       <div>
                          <div className="flex items-center space-x-3">
                             <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                {editedContact.firstName || editedContact.name || 'Lead'} {editedContact.lastName || ''}
                             </h2>
                             <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-teal-100">{editedContact.status || 'NEW LEAD'}</span>
                          </div>
                          <div className="flex items-center space-x-6 mt-1 text-slate-500 text-[11px] font-bold">
                             <span className="flex items-center"><Phone size={12} className="mr-2 text-teal-600" /> {editedContact.phone}</span>
                             <span className="flex items-center"><Briefcase size={12} className="mr-2" /> {editedContact.profession || 'Not Specified'}</span>
                          </div>
                       </div>
                   </div>

                   <div className="flex items-center space-x-3">
                       <button 
                         onClick={() => updateContactDetail(selectedContact._id, editedContact)}
                         disabled={!showSaveFab || isUpdatingContact}
                         className="px-8 py-3 bg-teal-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-teal-500/20 hover:bg-teal-700 transition-all disabled:opacity-50"
                       >
                          {isUpdatingContact ? 'Saving...' : 'Update Lead'}
                       </button>
                       <button onClick={() => setShowProfile(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>
                   </div>
               </div>

               <div className="flex-1 flex overflow-hidden">
                  {/* LEFT PANEL: PRO DATA LIST */}
                  <div className="w-[380px] bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar p-10 space-y-10">
                     
                     <div className="space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                           <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Lead Intelligence</h3>
                           <div className="px-2 py-0.5 bg-teal-50 text-teal-600 rounded text-[9px] font-black">AI POWERED</div>
                        </div>

                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Qualification Overview</label>
                              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm font-medium text-slate-700 leading-relaxed italic">
                                 {editedContact.qualification || 'AI is analyzing this conversation...'}
                              </div>
                           </div>

                           <div className="grid grid-cols-1 gap-6">
                              {[
                                { label: 'Target Program', value: editedContact.selectedProgram, field: 'selectedProgram' },
                                { label: 'Career Goal', value: editedContact.flowVariables?.careerGoal, field: 'flowVariables.careerGoal' },
                                { label: 'Investment Budget', value: editedContact.budget, field: 'budget' },
                                { label: 'Callback Preferred', value: editedContact.preferredCallTime, field: 'preferredCallTime' }
                              ].map((item, idx) => (
                                <div key={idx} className="space-y-1.5">
                                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</label>
                                   <input 
                                      value={item.value || ''} 
                                      onChange={e=>handleFieldChange(item.field, e.target.value)} 
                                      placeholder="Not Captured" 
                                      className="w-full bg-white border-b border-slate-100 py-1 text-sm font-bold text-slate-800 outline-none focus:border-teal-500 transition-all placeholder:text-slate-200"
                                   />
                                </div>
                              ))}

                              <div className="space-y-2">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lead Heat Level</label>
                                 <div className="flex space-x-2">
                                    {['Cold', 'Warm', 'Hot'].map(lvl => (
                                       <button 
                                          key={lvl}
                                          onClick={() => handleFieldChange('heatLevel', lvl)}
                                          className={\`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all \${
                                             editedContact.heatLevel === lvl 
                                             ? 'bg-teal-600 text-white shadow-md' 
                                             : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
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

                     <div className="space-y-6">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">Internal Tags</h3>
                        <div className="flex flex-wrap gap-2">
                           {(editedContact.tags || []).map(tag => (
                              <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-bold uppercase tracking-widest">{tag}</span>
                           ))}
                           <button className="px-3 py-1 border border-dashed border-slate-300 rounded-lg text-[9px] font-bold text-slate-400 hover:text-teal-600 transition-all">+ Add Tag</button>
                        </div>
                     </div>
                  </div>

                  {/* RIGHT PANEL: INTERACTION HUB */}
                  <div className="flex-1 flex flex-col bg-white overflow-hidden">
                     <div className="px-10 flex space-x-10 border-b border-slate-200 bg-white shrink-0">
                        {['Timeline', 'Chat history', 'Strategic Notes'].map(tab => {
                           const tabId = tab.toLowerCase().split(' ')[0];
                           const isActive = activeTab === (tabId === 'chat' ? 'chatlog' : tabId === 'strategic' ? 'internalnotes' : tabId);
                           return (
                              <button 
                                key={tab} 
                                onClick={() => setActiveTab(tabId === 'chat' ? 'chatlog' : tabId === 'strategic' ? 'internalnotes' : tabId)} 
                                className={\`py-5 text-[11px] font-black uppercase tracking-widest relative transition-all \${isActive ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}\`}
                              >
                                 {tab}
                                 {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"></div>}
                              </button>
                           );
                        })}
                     </div>

                     <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
                        {activeTab === 'timeline' && (
                           <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
                               {(selectedContact.timeline || []).filter(e => !e.description.includes('Contact details updated')).slice().reverse().map((event, idx) => (
                                  <div key={idx} className="relative pl-12">
                                     <div className="absolute left-0 top-1 w-[35px] h-[35px] rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center z-10"><Activity size={14} className="text-slate-400" /></div>
                                     <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                           <p className="text-[14px] font-bold text-slate-800">{event.description}</p>
                                           <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{event.eventType}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center"><Clock size={10} className="mr-2" /> {formatDateTime(event.timestamp)}</p>
                                     </div>
                                  </div>
                               ))}
                           </div>
                        )}

                        {activeTab === 'chatlog' && (
                           <div className="space-y-6">
                              {recentMessages.length === 0 ? (
                                 <div className="p-20 text-center text-slate-300 text-sm font-bold uppercase tracking-widest">No messages yet</div>
                              ) : recentMessages.map((msg, idx) => (
                                 <div key={idx} className={\`flex \${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}\`}>
                                    <div className={\`p-4 px-6 rounded-2xl text-sm font-bold max-w-[80%] \${msg.direction === 'OUTBOUND' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'}\`}>
                                       {msg.content}
                                       <div className={\`mt-2 text-[9px] font-bold uppercase \${msg.direction === 'OUTBOUND' ? 'text-white/60' : 'text-slate-400'}\`}>{formatDateTime(msg.createdAt)}</div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}

                        {activeTab === 'internalnotes' && (
                           <div className="space-y-8">
                              <div className="space-y-4">
                                 <textarea 
                                   value={noteInput} 
                                   onChange={e=>setNoteInput(e.target.value)} 
                                   placeholder="Add an internal note..." 
                                   className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm font-bold text-slate-700 outline-none" 
                                   rows={4} 
                                 />
                                 <div className="flex justify-end">
                                    <button 
                                      onClick={()=>addInternalNote(selectedContact._id)} 
                                      disabled={isAddingNote || !noteInput.trim()} 
                                      className="px-8 py-3 bg-teal-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-teal-700 transition-all shadow-md shadow-teal-500/10"
                                    >
                                       Save Note
                                    </button>
                                 </div>
                              </div>
                              <div className="space-y-6">
                                 {(selectedContact.notes || []).slice().reverse().map((note, idx) => (
                                    <div key={idx} className="p-6 border border-slate-100 rounded-2xl space-y-4 bg-slate-50/30">
                                       <p className="text-[14px] font-bold text-slate-700 leading-relaxed italic">"{note.content}"</p>
                                       <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                          <div className="flex items-center space-x-2">
                                             <div className="w-6 h-6 rounded bg-teal-100 flex items-center justify-center text-teal-600">{note.createdBy?.charAt(0).toUpperCase()}</div>
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

               <div className="px-10 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center"><ShieldCheck size={12} className="mr-2 text-teal-600" /> Professional Lead Hub</div>
                  <span>WapiPulse v1.2.5 • Official Record</span>
               </div>
            </div>
         </div>\n      )}`;

if (profileBlockRegex.test(content)) {
    content = content.replace(profileBlockRegex, proCrmDesign);
    fs.writeFileSync(filePath, content);
    console.log('Sidebar transformed to Pro CRM design.');
} else {
    console.log('Profile block regex failed.');
}
