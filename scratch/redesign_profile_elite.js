
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// I will replace the showProfile block with a much cleaner, professional version.

const startMarker = '{showProfile && selectedContact && editedContact && (';
const endMarker = '{/* RIGHT PANEL: INTERACTION HUB */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const head = content.substring(0, startIndex);
    const tail = content.substring(endIndex);
    
    const eliteProfileUI = `{showProfile && selectedContact && editedContact && (
         <div className="fixed inset-0 z-[150] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowProfile(false)}>
            <div 
              className="w-[1050px] h-full bg-white shadow-2xl flex flex-col animate-slide-left relative"
              onClick={(e) => e.stopPropagation()}
            >
               {/* ELITE PROFILE HEADER */}
               <div className="bg-white border-b border-slate-100 px-12 py-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-8">
                        <div className="w-20 h-20 rounded-[2rem] bg-teal-600 flex items-center justify-center text-3xl font-black text-white shadow-xl rotate-3">
                           {editedContact.firstName ? editedContact.firstName.charAt(0) : (selectedContact.name?.charAt(0) || 'U')}
                        </div>
                        <div>
                           <div className="flex items-center space-x-4">
                              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                 {editedContact.firstName || editedContact.name || 'Lead'} {editedContact.lastName || ''}
                              </h2>
                              <div className="px-4 py-1.5 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">
                                 {editedContact.pipelineStage || 'Discovery'}
                              </div>
                           </div>
                           <div className="flex items-center space-x-8 mt-2 text-slate-400 text-[12px] font-bold">
                              <span className="flex items-center"><Phone size={14} className="mr-2 text-teal-500" /> {editedContact.phone}</span>
                              <span className="flex items-center"><Hash size={14} className="mr-2 text-slate-200" /> {selectedContact._id.slice(-6).toUpperCase()}</span>
                           </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => updateContactDetail(selectedContact._id, editedContact)}
                          disabled={!showSaveFab || isUpdatingContact}
                          className="px-10 py-4 bg-teal-600 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl shadow-teal-500/20 hover:bg-teal-700 transition-all disabled:opacity-30 disabled:grayscale"
                        >
                           {isUpdatingContact ? 'Syncing...' : 'Update Record'}
                        </button>
                        <button onClick={() => setShowProfile(false)} className="p-3 bg-slate-50 text-slate-300 hover:text-slate-900 rounded-2xl transition-all hover:bg-slate-100"><X size={24} /></button>
                    </div>
               </div>

               <div className="flex-1 flex overflow-hidden">
                  {/* LEFT PANEL: DATA FACT SHEET */}
                  <div className="w-[420px] bg-[#f8fafc] overflow-y-auto custom-scrollbar p-10 space-y-10">
                     
                     {/* DATA CARD: LIFECYCLE */}
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center justify-between">
                           <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Pulse</h3>
                           <Activity size={16} className="text-teal-500" />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Lead Status</label>
                           <select 
                              value={editedContact.status || 'NEW LEAD'} 
                              onChange={e=>handleFieldChange('status', e.target.value)}
                              className="w-full bg-slate-50 border-none py-4 px-5 text-sm font-black text-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                           >
                              {['NEW LEAD', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'].map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Pipeline Phase</label>
                           <select 
                              value={editedContact.pipelineStage || 'Discovery'} 
                              onChange={e=>handleFieldChange('pipelineStage', e.target.value)}
                              className="w-full bg-slate-50 border-none py-4 px-5 text-sm font-black text-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                           >
                              {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                     </div>

                     {/* DATA CARD: IDENTITY */}
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
                        <div className="flex items-center justify-between">
                           <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Profile Identity</h3>
                           <User size={16} className="text-slate-300" />
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Lead Surname</label>
                              <input value={editedContact.lastName || ''} onChange={e=>handleFieldChange('lastName', e.target.value)} placeholder="Last Name" className="w-full bg-white border-b-2 border-slate-50 py-2 text-base font-bold text-slate-800 outline-none focus:border-teal-500 transition-all" />
                           </div>

                           <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                 <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Contact Repository</label>
                                 <button onClick={() => document.getElementById('sec-phone')?.focus()} className="text-[9px] font-black text-teal-600 uppercase tracking-widest">+ Add Channel</button>
                              </div>
                              <div className="space-y-3">
                                 <div className="flex items-center space-x-4 bg-teal-50/50 p-4 rounded-2xl border border-teal-100/50">
                                    <div className="p-2 bg-teal-600 text-white rounded-lg"><Phone size={14} /></div>
                                    <div>
                                       <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-0.5">Primary WhatsApp</p>
                                       <p className="text-sm font-black text-slate-700">{editedContact.phone}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="p-2 bg-slate-200 text-slate-500 rounded-lg"><Plus size={14} /></div>
                                    <div className="flex-1">
                                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Secondary WhatsApp</p>
                                       <input id="sec-phone" value={editedContact.secondaryPhone || ''} onChange={e=>handleFieldChange('secondaryPhone', e.target.value)} placeholder="Add Number..." className="w-full bg-transparent border-none p-0 text-sm font-black text-slate-700 outline-none placeholder:text-slate-300" />
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Lead Address</label>
                              <textarea value={editedContact.address || ''} onChange={e=>handleFieldChange('address', e.target.value)} placeholder="Full Address..." className="w-full bg-white border-b-2 border-slate-50 py-2 text-sm font-bold text-slate-800 outline-none focus:border-teal-500 resize-none" rows={2} />
                           </div>
                        </div>
                     </div>

                     {/* DATA CARD: ACADEMICS */}
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
                        <div className="flex items-center justify-between">
                           <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Academic Brief</h3>
                           <Target size={16} className="text-slate-300" />
                        </div>
                        <div className="space-y-6">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Last Qualification</label>
                              <input value={editedContact.qualification || ''} onChange={e=>handleFieldChange('qualification', e.target.value)} className="w-full bg-white border-b-2 border-slate-50 py-2 text-sm font-bold text-slate-800 outline-none focus:border-teal-500" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Target Program</label>
                              <input value={editedContact.selectedProgram || ''} onChange={e=>handleFieldChange('selectedProgram', e.target.value)} className="w-full bg-white border-b-2 border-slate-50 py-2 text-sm font-bold text-slate-800 outline-none focus:border-teal-500" />
                           </div>
                        </div>
                     </div>

                     {/* DATA CARD: OWNERSHIP */}
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
                        <div className="flex items-center justify-between">
                           <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Team Ownership</h3>
                           <Users size={16} className="text-slate-300" />
                        </div>
                        <div className="space-y-6">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Assigned Telecaller</label>
                              <select value={editedContact.assignedAgent || ''} onChange={e=>handleFieldChange('assignedAgent', e.target.value)} className="w-full bg-slate-50 border-none py-3 px-4 text-sm font-black text-slate-700 rounded-xl outline-none">
                                 <option value="">No Assignment</option>
                                 {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                              </select>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Assigned Counsellor</label>
                              <select value={editedContact.assignedCounsellor || ''} onChange={e=>handleFieldChange('assignedCounsellor', e.target.value)} className="w-full bg-slate-50 border-none py-3 px-4 text-sm font-black text-slate-700 rounded-xl outline-none">
                                 <option value="">No Assignment</option>
                                 {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                              </select>
                           </div>
                        </div>
                     </div>

                     {/* DATA CARD: ADMISSION PIPELINE */}
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
                        <div className="flex items-center justify-between">
                           <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Admission Pipeline</h3>
                           <Landmark size={16} className="text-teal-600" />
                        </div>
                        <div className="space-y-6">
                           <div className="space-y-3">
                              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Campus Visit Status</label>
                              <div className="grid grid-cols-2 gap-3">
                                 {['Not Visited', 'Visited'].map(status => (
                                    <button 
                                       key={status}
                                       onClick={() => handleFieldChange('visitStatus', status)}
                                       className={\`py-3 rounded-2xl text-[10px] font-black uppercase transition-all \${editedContact.visitStatus === status ? 'bg-teal-600 text-white shadow-lg' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}\`}
                                    >
                                       {status}
                                    </button>
                                 ))}
                              </div>
                           </div>

                           {editedContact.visitStatus === 'Visited' && (
                              <div className="space-y-6 animate-fade-in">
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Admission Verdict</label>
                                    <select value={editedContact.admissionStatus || 'None'} onChange={e=>handleFieldChange('admissionStatus', e.target.value)} className="w-full bg-slate-50 border-none py-3 px-4 text-sm font-black text-slate-700 rounded-xl outline-none">
                                       <option value="None">Verdict Pending</option>
                                       <option value="Admitted">Admission Done</option>
                                       <option value="Cancelled">Admission Cancelled</option>
                                    </select>
                                 </div>
                                 {editedContact.admissionStatus === 'Admitted' && (
                                    <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                       <div className="space-y-1.5">
                                          <label className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Collected</label>
                                          <input type="number" value={editedContact.collectionAmount || 0} onChange={e=>handleFieldChange('collectionAmount', e.target.value)} className="w-full bg-teal-50 border-b-2 border-teal-100 py-2 text-sm font-black text-teal-700 outline-none" />
                                       </div>
                                       <div className="space-y-1.5">
                                          <label className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Pending</label>
                                          <input type="number" value={editedContact.pendingCollectionAmount || 0} onChange={e=>handleFieldChange('pendingCollectionAmount', e.target.value)} className="w-full bg-orange-50 border-b-2 border-orange-100 py-2 text-sm font-black text-orange-700 outline-none" />
                                       </div>
                                    </div>
                                 )}
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* RIGHT PANEL: INTERACTION HUB */}
`;
    
    fs.writeFileSync(filePath, head + eliteProfileUI + tail);
    console.log('Contact Profile redesigned to Elite Admin theme.');
} else {
    console.log('Contact Profile markers not found.');
}
