
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Using the exact markers found in the file
const startMarker = '/* ADVANCED FILTER PRO CONSOLE (SIDEBAR) */}';
const endMarker = '{showAddModal && (';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const head = content.substring(0, startIndex);
    const tail = content.substring(endIndex);
    
    const cleanFilterModal = `/* PRO CRM FILTER HUB */ }
      {showFilters && (
         <div className="fixed inset-0 z-[200] flex justify-end items-stretch bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowFilters(false)}>
            <div className="w-[480px] bg-white shadow-2xl flex flex-col animate-slide-left h-full" onClick={e=>e.stopPropagation()}>
               <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                  <div>
                     <h2 className="text-xl font-black text-slate-800 tracking-tight">Filter Workspace</h2>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Refine lead visibility</p>
                  </div>
                  <button onClick={() => setShowFilters(false)} className="p-2 text-slate-400 hover:text-slate-800 transition-all"><X size={24} /></button>
               </div>

               <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-[#fcfcfd]">
                  
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

                  {/* CATEGORY: OWNERSHIP & SOURCE */}
                  <div className="space-y-6">
                     <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center">
                        <Users size={14} className="mr-2" /> Ownership & Origin
                     </h3>
                     <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Agent</label>
                           <select value={filters.agent} onChange={e=>setFilters({...filters, agent: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all">
                              <option value="ALL">Any Member</option>
                              {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source Origin</label>
                           <select value={filters.source} onChange={e=>setFilters({...filters, source: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all">
                              <option value="ALL">Any Source</option>
                              {['Manual Entry', 'Meta Ads', 'Google Ads', 'Referral', 'Email Campaign', 'WhatsApp Blast'].map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                     </div>
                  </div>

                  {/* CATEGORY: QUALITY METRICS */}
                  <div className="space-y-6">
                     <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center">
                        <Target size={14} className="mr-2" /> Quality Metrics
                     </h3>
                     <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-8">
                        <div>
                           <div className="flex justify-between items-center mb-4">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Min Lead Score</label>
                              <span className="text-lg font-black text-teal-600">{filters.minScore}%</span>
                           </div>
                           <input 
                              type="range" min="0" max="100" 
                              value={filters.minScore} 
                              onChange={e=>setFilters({...filters, minScore: parseInt(e.target.value)})} 
                              className="w-full accent-teal-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                           />
                        </div>
                        <div>
                           <div className="flex justify-between items-center mb-4">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Min Value (₹)</label>
                              <span className="text-lg font-black text-teal-600">₹ {(filters.minValue / 1000).toFixed(0)}K+</span>
                           </div>
                           <input 
                              type="range" min="0" max="200000" step="5000"
                              value={filters.minValue} 
                              onChange={e=>setFilters({...filters, minValue: parseInt(e.target.value)})} 
                              className="w-full accent-teal-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                           />
                        </div>
                     </div>
                  </div>

               </div>

               <div className="p-8 border-t border-slate-100 bg-white grid grid-cols-2 gap-4 shrink-0">
                  <button 
                     onClick={() => {
                        setFilters({ status: 'ALL', heat: 'ALL', stage: 'ALL', agent: 'ALL', source: 'ALL', minScore: 0, maxScore: 100, minValue: 0, hasUnread: false, hasTasks: false, dateRange: 'ALL' });
                        toast.success("Filters Reset");
                     }}
                     className="py-4 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                  >
                     Reset All
                  </button>
                  <button onClick={() => setShowFilters(false)} className="py-4 bg-teal-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 hover:bg-teal-700 transition-all">Apply Filter</button>
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
