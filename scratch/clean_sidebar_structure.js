
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// I will clean up the sidebar and ensure each section is correctly wrapped.

const startMarker = '{/* LEFT PANEL: DATA LIST */}';
const endMarker = '{/* RIGHT PANEL: INTERACTION HUB */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const head = content.substring(0, startIndex);
    const tail = content.substring(endIndex);
    
    const cleanSidebar = `{/* LEFT PANEL: DATA LIST */}
                  <div className="w-[380px] bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar p-10 space-y-12">
                     
                     {/* SECTION 0: LEAD LIFECYCLE */}
                     <div className="space-y-6">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center">
                           <TrendingUp size={14} className="mr-2" /> Lifecycle Status
                        </h3>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead Status</label>
                           <select 
                              value={editedContact.status || 'NEW LEAD'} 
                              onChange={e=>handleFieldChange('status', e.target.value)}
                              className="w-full bg-transparent border-b border-slate-100 py-1.5 text-sm font-bold text-slate-800 outline-none cursor-pointer"
                           >
                              {['NEW LEAD', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'].map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                     </div>

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
                                          ? 'bg-teal-600 text-white shadow-lg' 
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

                  `;
    
    fs.writeFileSync(filePath, head + cleanSidebar + tail);
    console.log('Sidebar cleaned and structured correctly.');
} else {
    console.log('Anchor points not found.');
}
