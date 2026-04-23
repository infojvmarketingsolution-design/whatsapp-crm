
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '/* PRO CRM FILTER HUB */ }';
const endMarker = '{showAddModal && (';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const head = content.substring(0, startIndex);
    const tail = content.substring(endIndex);
    
    const advancedFilterUI = `/* PRO CRM FILTER HUB */ }
      {showFilters && (
         <div className="fixed inset-0 z-[200] flex justify-end items-stretch bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowFilters(false)}>
            <div className="w-[500px] bg-white shadow-2xl flex flex-col animate-slide-left h-full" onClick={e=>e.stopPropagation()}>
               <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                  <div>
                     <h2 className="text-xl font-black text-slate-800 tracking-tight">Intelligence Filter</h2>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Granular Lead Data Mining</p>
                  </div>
                  <button onClick={() => setShowFilters(false)} className="p-2 text-slate-400 hover:text-slate-800 transition-all"><X size={24} /></button>
               </div>

               <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-[#fcfcfd]">
                  
                  {/* SECTION 1: LEAD OWNERSHIP */}
                  <div className="space-y-6">
                     <h3 className="text-[11px] font-black text-teal-600 uppercase tracking-widest border-b border-teal-50 pb-3 flex items-center">
                        <Users size={14} className="mr-2" /> Team Ownership
                     </h3>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Agent / Counsellor</label>
                        <select value={filters.agent} onChange={e=>setFilters({...filters, agent: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all">
                           <option value="ALL">All Team Members</option>
                           {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.role})</option>)}
                        </select>
                     </div>
                  </div>

                  {/* SECTION 2: ACADEMIC PROFILE */}
                  <div className="space-y-6">
                     <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center">
                        <Target size={14} className="mr-2" /> Academic Profile
                     </h3>
                     <div className="grid grid-cols-1 gap-5">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interested Program</label>
                           <input 
                              type="text" 
                              value={filters.program === 'ALL' ? '' : filters.program} 
                              onChange={e=>setFilters({...filters, program: e.target.value || 'ALL'})}
                              placeholder="Search Course..."
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Qualification</label>
                           <input 
                              type="text" 
                              value={filters.qualification === 'ALL' ? '' : filters.qualification} 
                              onChange={e=>setFilters({...filters, qualification: e.target.value || 'ALL'})}
                              placeholder="Search Degree..."
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400"
                           />
                        </div>
                     </div>
                  </div>

                  {/* SECTION 3: TIMELINE ENGINE */}
                  <div className="space-y-8">
                     <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center">
                        <Clock size={14} className="mr-2" /> Timeline Engine
                     </h3>
                     
                     <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter by Month</label>
                           <select value={filters.month} onChange={e=>setFilters({...filters, month: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all">
                              <option value="ALL">Any Month</option>
                              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                                 <option key={m} value={i}>{m}</option>
                              ))}
                           </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</label>
                              <input type="date" value={filters.startDate} onChange={e=>setFilters({...filters, startDate: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Date</label>
                              <input type="date" value={filters.endDate} onChange={e=>setFilters({...filters, endDate: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50" />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">From Time</label>
                              <input type="time" value={filters.startTime} onChange={e=>setFilters({...filters, startTime: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To Time</label>
                              <input type="time" value={filters.endTime} onChange={e=>setFilters({...filters, endTime: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50" />
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* SECTION 4: OPERATIONAL STATUS */}
                  <div className="space-y-6">
                     <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center">
                        <Activity size={14} className="mr-2" /> Operational Status
                     </h3>
                     <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lifecycle Status</label>
                           <select value={filters.status} onChange={e=>setFilters({...filters, status: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all">
                              <option value="ALL">All Lifecycle Statuses</option>
                              {['NEW LEAD', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'].map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pipeline Stage</label>
                           <select value={filters.stage} onChange={e=>setFilters({...filters, stage: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all">
                              <option value="ALL">All Pipeline Stages</option>
                              {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                     </div>
                  </div>

               </div>

               <div className="p-8 border-t border-slate-100 bg-white grid grid-cols-2 gap-4 shrink-0">
                  <button 
                     onClick={() => {
                        setFilters({ status: 'ALL', heat: 'ALL', stage: 'ALL', agent: 'ALL', source: 'ALL', program: 'ALL', qualification: 'ALL', minScore: 0, maxScore: 100, dateRange: 'ALL', startDate: '', endDate: '', startTime: '00:00', endTime: '23:59', month: 'ALL' });
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
    
    fs.writeFileSync(filePath, head + advancedFilterUI + tail);
    console.log('Advanced Intelligence Filter UI implemented.');
} else {
    console.log('Filter UI anchor points not found.');
}
