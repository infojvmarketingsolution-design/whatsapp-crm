
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// I will find the Filter Modal block and replace it with a cleaner, more professional version.

const startMarker = '{/* ADVANCE FILTERS MODAL */}';
const endMarker = '{/* ADD LEAD MODAL */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const head = content.substring(0, startIndex);
    const tail = content.substring(endIndex);
    
    const cleanFilterModal = `{/* ADVANCE FILTERS MODAL */}
      {showFilters && (
         <div className="fixed inset-0 z-50 flex justify-end items-stretch bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowFilters(false)}>
            <div className="w-[450px] bg-white shadow-2xl flex flex-col animate-slide-left h-full" onClick={e=>e.stopPropagation()}>
               <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                  <div>
                     <h2 className="text-xl font-black text-slate-800 tracking-tight">Filter Workspace</h2>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Refine lead visibility</p>
                  </div>
                  <button onClick={() => setShowFilters(false)} className="p-2 text-slate-400 hover:text-slate-800 transition-all"><X size={24} /></button>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-[#fcfcfd]">
                  
                  {/* CATEGORY: STATUS & STAGE */}
                  <div className="space-y-6">
                     <h3 className="text-[11px] font-black text-teal-600 uppercase tracking-widest border-b border-teal-50 pb-3 flex items-center">
                        <Activity size={14} className="mr-2" /> Operational Status
                     </h3>
                     <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead Stage</label>
                           <select value={filters.stage} onChange={e=>setFilters({...filters, stage: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all">
                              <option value="ALL">All Stages</option>
                              {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lifecycle Status</label>
                           <select value={filters.status} onChange={e=>setFilters({...filters, status: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all">
                              <option value="ALL">All Statuses</option>
                              {['NEW LEAD', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'].map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                     </div>
                  </div>

                  {/* CATEGORY: OWNERSHIP */}
                  <div className="space-y-6">
                     <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center">
                        <Users size={14} className="mr-2" /> Team Ownership
                     </h3>
                     <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Agent</label>
                           <select value={filters.agent} onChange={e=>setFilters({...filters, agent: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all">
                              <option value="ALL">Any Member</option>
                              {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                           </select>
                        </div>
                        <div className="flex items-center space-x-4 pt-2">
                           <button 
                             onClick={() => setFilters({...filters, unreadOnly: !filters.unreadOnly})}
                             className={\`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border \${filters.unreadOnly ? 'bg-teal-600 border-teal-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:border-teal-200'}\`}
                           >
                              Unread Only
                           </button>
                           <button 
                             onClick={() => setFilters({...filters, withTasks: !filters.withTasks})}
                             className={\`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border \${filters.withTasks ? 'bg-teal-600 border-teal-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:border-teal-200'}\`}
                           >
                              Active Tasks
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* CATEGORY: LEAD ATTRIBUTES */}
                  <div className="space-y-6">
                     <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center">
                        <Search size={14} className="mr-2" /> Lead Attributes
                     </h3>
                     <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Min Lead Score</label>
                           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                              <div className="flex justify-between items-center">
                                 <span className="text-xl font-black text-teal-600">{filters.minScore}%</span>
                                 <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Precision HUNT</span>
                              </div>
                              <input 
                                 type="range" 
                                 min="0" max="100" 
                                 value={filters.minScore} 
                                 onChange={e=>setFilters({...filters, minScore: parseInt(e.target.value)})} 
                                 className="w-full accent-teal-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                              />
                           </div>
                        </div>
                     </div>
                  </div>

               </div>

               <div className="p-8 border-t border-slate-100 bg-white grid grid-cols-2 gap-4 shrink-0">
                  <button onClick={resetFilters} className="py-4 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">Reset All</button>
                  <button onClick={() => setShowFilters(false)} className="py-4 bg-teal-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 hover:bg-teal-700 transition-all">Apply Profile</button>
               </div>
            </div>
         </div>
      )}

      `;
    
    fs.writeFileSync(filePath, head + cleanFilterModal + tail);
    console.log('Advance Filter redesigned to match Pro CRM theme.');
} else {
    console.log('Filter Modal anchor points not found.');
}
