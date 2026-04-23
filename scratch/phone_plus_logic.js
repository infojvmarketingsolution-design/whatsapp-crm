
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// I will refactor the Identity & Lifecycle sections for the new requirements.

const startMarker = '{/* LEFT PANEL: DATA LIST */}';
const endMarker = '{/* SECTION 2: EDUCATION & INTEREST */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const head = content.substring(0, startIndex);
    const tail = content.substring(endIndex);
    
    const updatedSidebar = `{/* LEFT PANEL: DATA LIST */}
                  <div className="w-[380px] bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar p-10 space-y-12">
                     
                     {/* SECTION 0: LEAD LIFECYCLE */}
                     <div className="space-y-6">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center">
                           <TrendingUp size={14} className="mr-2 text-teal-600" /> Lifecycle Status
                        </h3>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead Status</label>
                           <select 
                              value={editedContact.status || 'NEW LEAD'} 
                              onChange={e=>handleFieldChange('status', e.target.value)}
                              className="w-full bg-teal-50/30 border-b border-teal-100 py-2 px-3 text-sm font-bold text-teal-800 rounded-lg outline-none cursor-pointer hover:bg-teal-50 transition-all"
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
                               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead Surname</label>
                               <input value={editedContact.lastName || ''} onChange={e=>handleFieldChange('lastName', e.target.value)} placeholder="Enter Surname" className="w-full bg-slate-50/50 border-b border-slate-100 py-1.5 text-sm font-bold text-slate-800 outline-none focus:border-teal-500" />
                            </div>

                            <div className="space-y-1.5">
                               <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary WhatsApp</label>
                                  <button 
                                    onClick={() => document.getElementById('secondary-phone-input')?.focus()}
                                    className="p-1 bg-teal-50 text-teal-600 rounded hover:bg-teal-600 hover:text-white transition-all shadow-sm"
                                    title="Add Secondary Number"
                                  >
                                     <Plus size={12} strokeWidth={3} />
                                  </button>
                               </div>
                               <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  <Phone size={14} className="text-teal-600" />
                                  <span className="text-sm font-bold text-slate-400">{editedContact.phone}</span>
                                  <div className="ml-auto text-[8px] font-black text-slate-300 uppercase tracking-tighter">Read Only</div>
                               </div>
                            </div>

                            <div className="space-y-1.5 animate-fade-in">
                               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secondary WhatsApp</label>
                               <input 
                                 id="secondary-phone-input"
                                 value={editedContact.secondaryPhone || ''} 
                                 onChange={e=>handleFieldChange('secondaryPhone', e.target.value)} 
                                 placeholder="+ Add Alternative Mobile" 
                                 className="w-full bg-slate-50/50 border-b border-slate-100 py-1.5 text-sm font-bold text-slate-800 outline-none focus:border-teal-500" 
                               />
                            </div>

                            <div className="space-y-1.5">
                               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead Address</label>
                               <textarea value={editedContact.address || ''} onChange={e=>handleFieldChange('address', e.target.value)} placeholder="Residential Address" className="w-full bg-slate-50/50 border-b border-slate-100 py-1.5 text-sm font-bold text-slate-800 outline-none focus:border-teal-500 resize-none" rows={2} />
                            </div>
                        </div>
                     </div>
                  `;
    
    fs.writeFileSync(filePath, head + updatedSidebar + tail);
    console.log('Sidebar updated with read-only phone and + sign logic.');
} else {
    console.log('Anchor points not found.');
}
