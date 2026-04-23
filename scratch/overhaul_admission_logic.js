
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Change default activeTab to 'chatlog'
content = content.replace(/const \[activeTab, setActiveTab\] = useState\('timeline'\);/, "const [activeTab, setActiveTab] = useState('chatlog');");

// 2. Overhaul the Profile Block with new fields and Admission Logic
const profileBlockRegex = /<div className="fixed inset-0 z-\[150\] flex justify-end bg-slate-900\/40 animate-fade-in"[\s\S]+?<\/div>\s+\)\}/i;

const updatedProfileDesign = `<div className="fixed inset-0 z-[150] flex justify-end bg-slate-900/40 animate-fade-in" onClick={() => setShowProfile(false)}>
            <div 
              className="w-[1000px] h-full bg-[#fcfcfd] shadow-2xl flex flex-col animate-slide-left relative"
              onClick={(e) => e.stopPropagation()}
            >
               {/* CRM HEADER: IDENTITY & PIPELINE STATUS */}
               <div className="bg-white border-b border-slate-200 px-10 py-6 flex items-center justify-between shrink-0">
                   <div className="flex items-center space-x-6">
                       <div className="w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                          {editedContact.firstName ? editedContact.firstName.charAt(0) : (selectedContact.name?.charAt(0) || 'U')}
                       </div>
                       <div>
                          <div className="flex items-center space-x-3">
                             <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                {editedContact.firstName || editedContact.name || 'Lead'} {editedContact.lastName || ''}
                             </h2>
                             <select 
                                value={editedContact.pipelineStage || 'Discovery'} 
                                onChange={e=>handleFieldChange('pipelineStage', e.target.value)}
                                className="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-teal-100 outline-none cursor-pointer"
                             >
                                {PIPELINE_STAGES.map(stage => <option key={stage} value={stage}>{stage}</option>)}
                             </select>
                          </div>
                          <div className="flex items-center space-x-6 mt-1 text-slate-500 text-[11px] font-bold">
                             <span className="flex items-center"><Phone size={12} className="mr-2 text-teal-600" /> {editedContact.phone}</span>
                             <span className="flex items-center text-slate-300 font-medium">Ref: {selectedContact._id.toUpperCase()}</span>
                          </div>
                       </div>
                   </div>

                   <div className="flex items-center space-x-3">
                       <button 
                         onClick={() => updateContactDetail(selectedContact._id, editedContact)}
                         disabled={!showSaveFab || isUpdatingContact}
                         className="px-8 py-3 bg-teal-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-teal-500/20 hover:bg-teal-700 transition-all disabled:opacity-50"
                       >
                          {isUpdatingContact ? 'Syncing...' : 'Update Record'}
                       </button>
                       <button onClick={() => setShowProfile(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>
                   </div>
               </div>

               <div className="flex-1 flex overflow-hidden">
                  {/* LEFT PANEL: DATA LIST */}
                  <div className="w-[380px] bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar p-10 space-y-12">
                     
                     {/* SECTION 1: IDENTITY & COMMUNICATION */}
                     <div className="space-y-6">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center">
                           <Users size={14} className="mr-2" /> Identity & Contact
                        </h3>
                        <div className="grid grid-cols-1 gap-5">
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Surname / Last Name</label>
                               <input value={editedContact.lastName || ''} onChange={e=>handleFieldChange('lastName', e.target.value)} placeholder="Enter Surname" className="w-full bg-slate-50/50 border-b border-slate-100 py-1.5 text-sm font-bold text-slate-800 outline-none focus:border-teal-500" />
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secondary Number</label>
                               <input value={editedContact.secondaryPhone || ''} onChange={e=>handleFieldChange('secondaryPhone', e.target.value)} placeholder="Alternative Contact" className="w-full bg-slate-50/50 border-b border-slate-100 py-1.5 text-sm font-bold text-slate-800 outline-none focus:border-teal-500" />
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead Address</label>
                               <textarea value={editedContact.address || ''} onChange={e=>handleFieldChange('address', e.target.value)} placeholder="Residential Address" className="w-full bg-slate-50/50 border-b border-slate-100 py-1.5 text-sm font-bold text-slate-800 outline-none focus:border-teal-500 resize-none" rows={2} />
                            </div>
                        </div>
                     </div>

                     {/* SECTION 2: EDUCATION & INTEREST */}
                     <div className="space-y-6">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center">
                           <Target size={14} className="mr-2" /> Program & Education
                        </h3>
                        <div className="grid grid-cols-1 gap-5">
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Qualification</label>
                               <input value={editedContact.qualification || ''} onChange={e=>handleFieldChange('qualification', e.target.value)} placeholder="Highest Degree" className="w-full bg-slate-50/50 border-b border-slate-100 py-1.5 text-sm font-bold text-slate-800 outline-none focus:border-teal-500" />
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interested Program</label>
                               <input value={editedContact.selectedProgram || ''} onChange={e=>handleFieldChange('selectedProgram', e.target.value)} placeholder="Target Course" className="w-full bg-slate-50/50 border-b border-slate-100 py-1.5 text-sm font-bold text-slate-800 outline-none focus:border-teal-500" />
                            </div>
                        </div>
                     </div>

                     {/* SECTION 3: ASSIGNMENT CONTROL */}
                     <div className="space-y-6">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center">
                           <Headphones size={14} className="mr-2" /> Team Ownership
                        </h3>
                        <div className="grid grid-cols-1 gap-5">
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Telecaller</label>
                               <select 
                                 value={editedContact.assignedAgent || ''} 
                                 onChange={e=>handleFieldChange('assignedAgent', e.target.value)}
                                 className="w-full bg-transparent border-b border-slate-100 py-1.5 text-sm font-bold text-slate-800 outline-none cursor-pointer"
                               >
                                  <option value="">No Telecaller Assigned</option>
                                  {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.role})</option>)}
                               </select>
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Counsellor</label>
                               <select 
                                 value={editedContact.assignedCounsellor || ''} 
                                 onChange={e=>handleFieldChange('assignedCounsellor', e.target.value)}
                                 className="w-full bg-transparent border-b border-slate-100 py-1.5 text-sm font-bold text-slate-800 outline-none cursor-pointer"
                               >
                                  <option value="">No Counsellor Assigned</option>
                                  {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.role})</option>)}
                               </select>
                            </div>
                        </div>
                     </div>

                     {/* SECTION 4: UNIVERSITY VISIT & ADMISSION */}
                     <div className="space-y-6">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center">
                           <Landmark size={14} className="mr-2" /> Admission Pipeline
                        </h3>
                        <div className="space-y-6">
                           <div className="space-y-3">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">University Visit Done?</label>
                              <div className="flex space-x-2">
                                 {['Not Visited', 'Visited'].map(status => (
                                    <button 
                                       key={status}
                                       onClick={() => handleFieldChange('visitStatus', status)}
                                       className={\`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all \${
                                          editedContact.visitStatus === status 
                                          ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20' 
                                          : 'bg-slate-50 text-slate-300 hover:bg-slate-100'
                                       }\`}
                                    >
                                       {status}
                                    </button>
                                 ))}
                              </div>
                           </div>

                           {editedContact.visitStatus === 'Visited' && (
                              <div className="space-y-6 animate-fade-in">
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admission Status</label>
                                    <select 
                                       value={editedContact.admissionStatus || 'None'} 
                                       onChange={e=>handleFieldChange('admissionStatus', e.target.value)}
                                       className="w-full bg-transparent border-b border-slate-100 py-1.5 text-sm font-bold text-slate-800 outline-none"
                                    >
                                       <option value="None">Select Status</option>
                                       <option value="Pending">Admission Pending</option>
                                       <option value="Admitted">Admission Done</option>
                                       <option value="Cancelled">Admission Cancelled</option>
                                    </select>
                                 </div>

                                 {editedContact.admissionStatus === 'Admitted' && (
                                    <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                       <div className="space-y-1.5">
                                          <label className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Collection Fee</label>
                                          <input type="number" value={editedContact.collectionAmount || 0} onChange={e=>handleFieldChange('collectionAmount', e.target.value)} className="w-full bg-teal-50/50 border-b border-teal-200 py-1.5 text-sm font-bold text-slate-800 outline-none" />
                                       </div>
                                       <div className="space-y-1.5">
                                          <label className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Pending Fee</label>
                                          <input type="number" value={editedContact.pendingCollectionAmount || 0} onChange={e=>handleFieldChange('pendingCollectionAmount', e.target.value)} className="w-full bg-orange-50/50 border-b border-orange-200 py-1.5 text-sm font-bold text-slate-800 outline-none" />
                                       </div>
                                    </div>
                                 )}
                              </div>
                           )}
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
                                 <div className="p-20 text-center text-slate-300 text-sm font-bold uppercase tracking-widest">History is quiet</div>
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
            </div>
         </div>\n      )}`;

if (profileBlockRegex.test(content)) {
    content = content.replace(profileBlockRegex, updatedProfileDesign);
    fs.writeFileSync(filePath, content);
    console.log('Sidebar overhauled with Admission Logic successfully.');
} else {
    console.log('Profile block regex failed.');
}
