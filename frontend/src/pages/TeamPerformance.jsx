import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserCheck, UserX, Target, Activity, 
  Search, Filter, ArrowUpRight, TrendingUp, 
  MessageSquare, Calendar, Shield, MoreVertical,
  ChevronRight, LayoutGrid, List, RefreshCw,
  Phone, Mail, Briefcase, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function TeamPerformance() {
  const navigate = useNavigate();
  const [teamStats, setTeamStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user.role || '').toUpperCase().replace(' ', '_');

  useEffect(() => {
    fetchTeamStats();
  }, []);

  const fetchTeamStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/stats/team', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTeamStats(data);
      } else {
        toast.error("Failed to fetch team data");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error fetching team stats");
    } finally {
      setLoading(false);
    }
  };

  const handleMonitorUser = (targetUser) => {
    // Redirect to Contacts with the user filter pre-applied
    // We pass the filter state via navigation or session storage
    sessionStorage.setItem('audit_target_agent', targetUser._id);
    toast.success(`Switching to ${targetUser.name}'s view...`);
    setTimeout(() => {
      navigate('/contacts');
    }, 800);
  };

  const filteredTeam = teamStats.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLeads = teamStats.reduce((sum, m) => sum + m.leadCount, 0);
  const avgEfficiency = teamStats.length > 0 
    ? Math.round(teamStats.reduce((sum, m) => sum + m.taskEfficiency, 0) / teamStats.length)
    : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-8 custom-scrollbar">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .shadow-premium { box-shadow: 0 4px 30px rgb(0,0,0,0.06); }
        .shadow-glow { box-shadow: 0 0 20px rgba(20, 184, 166, 0.2); }
      `}</style>

      {/* HEADER SECTION */}
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-premium">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center border border-teal-100 shadow-premium">
              <Users size={28} className="text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Team Performance Hub</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 flex items-center">
                <Shield size={12} className="mr-1.5 text-teal-500" /> Administrative oversight for team leads & conversion
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
             <div className="relative group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search teammate..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-6 py-3 outline-none focus:bg-white focus:ring-4 focus:ring-teal-50 focus:border-teal-200 text-xs font-bold text-slate-700 w-64 shadow-sm transition-all"
                />
             </div>
             <button onClick={fetchTeamStats} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all shadow-sm active:scale-95">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
             </button>
             <div className="flex bg-slate-100 p-1 rounded-xl shadow-sm border border-slate-200">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={16} /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><List size={16} /></button>
             </div>
          </div>
        </div>

        {/* TOP LEVEL STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-premium relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Network Reach</p>
                <div className="flex items-center space-x-3">
                   <h3 className="text-3xl font-black text-slate-800 leading-none">{totalLeads}</h3>
                   <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg tracking-tight">Active Leads</span>
                </div>
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-premium relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Operational Pulse</p>
                <div className="flex items-center space-x-3">
                   <h3 className="text-3xl font-black text-slate-800 leading-none">{avgEfficiency}%</h3>
                   <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg tracking-tight">Avg Efficacy</span>
                </div>
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-premium relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Workforce Active</p>
                <div className="flex items-center space-x-3">
                   <h3 className="text-3xl font-black text-slate-800 leading-none">{teamStats.filter(m => m.isAvailable).length}</h3>
                   <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg tracking-tight">Available</span>
                </div>
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-premium relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Team Composition</p>
                <div className="flex items-center space-x-3">
                   <h3 className="text-3xl font-black text-slate-800 leading-none">{teamStats.length}</h3>
                   <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg tracking-tight">Verified Staff</span>
                </div>
              </div>
           </div>
        </div>

        {/* TEAM GRID / LIST */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
             <RefreshCw size={40} className="text-slate-200 animate-spin" />
             <p className="text-slate-400 font-bold text-sm tracking-tighter">Synchronizing Team Performance Metrics...</p>
          </div>
        ) : filteredTeam.length === 0 ? (
          <div className="py-20 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
             <AlertCircle size={48} className="text-slate-200 mb-4" />
             <h3 className="text-xl font-black text-slate-800">No Teammates Found</h3>
             <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">Adjust search or invite staff.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredTeam.map((member, idx) => (
               <div key={member._id} className="bg-white rounded-3xl border border-slate-200 shadow-premium hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="p-6">
                     <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                           <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center font-black text-xl group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-500 transition-all shadow-sm">
                              {member.name.charAt(0)}
                           </div>
                           <div>
                              <h4 className="text-base font-black text-slate-800 tracking-tight leading-tight mb-1">{member.name}</h4>
                              <div className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg inline-block ${
                                member.role === 'BUSINESS_HEAD' ? 'bg-indigo-50 text-indigo-600' :
                                member.role === 'MANAGER_COUNSELLOUR' ? 'bg-orange-50 text-orange-600' :
                                'bg-teal-50 text-teal-600'
                              }`}>
                                {member.role.replace('_', ' ')}
                              </div>
                           </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1.5">
                           <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${member.isAvailable ? 'bg-teal-50 border-teal-100 text-teal-600 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${member.isAvailable ? 'bg-teal-500 animate-pulse' : 'bg-slate-300'}`} />
                              <span className="text-[7px] font-black uppercase tracking-widest whitespace-nowrap">
                                 {member.isAvailable ? 'Receiving Leads' : 'Leads Paused'}
                              </span>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Assigned Leads</p>
                           <p className="text-xl font-black text-slate-800">{member.leadCount}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Task Efficacy</p>
                           <div className="flex items-center space-x-1.5">
                             <p className="text-xl font-black text-slate-800">{member.taskEfficiency}%</p>
                             <TrendingUp size={14} className="text-teal-500" />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                           <span>Task Velocity</span>
                           <span className="text-slate-800">{member.completedTasks} / {member.totalTasks}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                           <div className="h-full bg-slate-800 rounded-full shadow-glow transition-all duration-1000" style={{ width: `${member.taskEfficiency}%` }}></div>
                        </div>
                     </div>
                  </div>

                  <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                     <div className="flex -space-x-2">
                        {Object.entries(member.statusBreakdown || {}).slice(0, 3).map(([status, count]) => (
                           <div key={status} className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[9px] font-black text-slate-700 shadow-sm" title={`${status}: ${count}`}>
                              {count}
                           </div>
                        ))}
                     </div>
                     <button 
                       onClick={() => handleMonitorUser(member)}
                       className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all flex items-center active:scale-95"
                     >
                        Audit Leads <ArrowUpRight size={14} className="ml-1.5" />
                     </button>
                  </div>
               </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-premium overflow-hidden">
             <table className="w-full">
                <thead>
                   <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="py-5 px-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Teammate Identity</th>
                      <th className="py-5 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</th>
                      <th className="py-5 px-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Leads</th>
                      <th className="py-5 px-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Volume</th>
                      <th className="py-5 px-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filteredTeam.map(member => (
                      <tr key={member._id} className="hover:bg-teal-50/20 transition-colors group">
                         <td className="py-5 px-8">
                            <div className="flex items-center space-x-4">
                               <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center font-black text-sm group-hover:bg-teal-600 group-hover:text-white transition-all shadow-sm">
                                  {member.name.charAt(0)}
                               </div>
                               <div>
                                  <p className="text-[13px] font-black text-slate-800 tracking-tight leading-tight mb-0.5">{member.name}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1.5">{member.email}</p>
                                  <div className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg border text-[7px] font-black uppercase tracking-widest ${member.isAvailable ? 'bg-teal-50 border-teal-100 text-teal-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                     <div className={`w-1 h-1 rounded-full ${member.isAvailable ? 'bg-teal-500 animate-pulse' : 'bg-slate-300'}`} />
                                     <span>{member.isAvailable ? 'Receiving Leads' : 'Leads Paused'}</span>
                                  </div>
                               </div>
                            </div>
                         </td>
                         <td className="py-5 px-6">
                            <div className="flex items-center space-x-3">
                               <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-teal-500 shadow-glow" style={{ width: `${member.taskEfficiency}%` }}></div>
                               </div>
                               <span className="text-[11px] font-black text-slate-700">{member.taskEfficiency}%</span>
                            </div>
                         </td>
                         <td className="py-5 px-6 text-center">
                            <span className="text-[13px] font-black text-slate-800">{member.leadCount}</span>
                         </td>
                         <td className="py-5 px-6 text-center">
                            <span className="text-[13px] font-black text-slate-800">{member.completedTasks} <span className="text-slate-300 mx-1">/</span> {member.totalTasks}</span>
                         </td>
                         <td className="py-5 px-8 text-right">
                            <button 
                              onClick={() => handleMonitorUser(member)}
                              className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-200 hover:shadow-md rounded-xl transition-all active:scale-90"
                            >
                               <ArrowUpRight size={16} />
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}

      </div>
    </div>
  );
}
