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
      {/* HEADER SECTION */}
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg">
                <Users size={24} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Team Performance Hub</h1>
            </div>
            <p className="text-slate-400 font-bold text-sm lowercase tracking-tight flex items-center">
              <Shield size={14} className="mr-2 text-teal-500" /> Administrative oversight for team leads & task conversion.
            </p>
          </div>

          <div className="flex items-center space-x-3">
             <div className="relative group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search teammate..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-white border border-slate-200 rounded-2xl pl-12 pr-6 py-3.5 outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-300 text-sm font-bold text-slate-800 w-64 shadow-sm transition-all"
                />
             </div>
             <button onClick={fetchTeamStats} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
             </button>
             <div className="flex bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
                <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><LayoutGrid size={18} /></button>
                <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><List size={18} /></button>
             </div>
          </div>
        </div>

        {/* TOP LEVEL STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Network Reach</p>
              <div className="flex items-end space-x-3">
                 <h3 className="text-4xl font-black text-slate-900 leading-none">{totalLeads}</h3>
                 <span className="text-[13px] font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-lg mb-1 tracking-tighter flex items-center">Total Active Leads</span>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Operational Pulse</p>
              <div className="flex items-end space-x-3">
                 <h3 className="text-4xl font-black text-slate-900 leading-none">{avgEfficiency}%</h3>
                 <span className="text-[13px] font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-lg mb-1 tracking-tighter">Avg Task Efficiency</span>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Workforce Active</p>
              <div className="flex items-end space-x-3">
                 <h3 className="text-4xl font-black text-slate-900 leading-none">{teamStats.filter(m => m.isAvailable).length}</h3>
                 <span className="text-[13px] font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg mb-1 tracking-tighter">Available Agents</span>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Team Composition</p>
              <div className="flex items-end space-x-3">
                 <h3 className="text-4xl font-black text-slate-900 leading-none">{teamStats.length}</h3>
                 <span className="text-[13px] font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg mb-1 tracking-tighter">Verified Teammates</span>
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
          <div className="py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center">
             <AlertCircle size={48} className="text-slate-200 mb-4" />
             <h3 className="text-xl font-black text-slate-900">No Teammates Found</h3>
             <p className="text-slate-400 font-bold text-sm mt-2">Adjust your search parameters or invite new staff.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredTeam.map((member, idx) => (
               <div key={member._id} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="p-8">
                     <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center space-x-5">
                           <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center font-black text-xl group-hover:bg-slate-900 group-hover:text-white transition-all">
                              {member.name.charAt(0)}
                           </div>
                           <div>
                              <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight mb-1">{member.name}</h4>
                              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
                                member.role === 'BUSINESS_HEAD' ? 'bg-indigo-100 text-indigo-700' :
                                member.role === 'MANAGER_COUNSELLOUR' ? 'bg-orange-100 text-orange-700' :
                                'bg-teal-100 text-teal-700'
                              }`}>
                                {member.role.replace('_', ' ')}
                              </span>
                           </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full shadow-glow ${member.isAvailable ? 'bg-teal-500' : 'bg-slate-200'}`} />
                     </div>

                     <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-slate-50 p-5 rounded-3xl">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Assigned Leads</p>
                           <p className="text-2xl font-black text-slate-900">{member.leadCount}</p>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-3xl">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Task Efficacy</p>
                           <div className="flex items-end space-x-2">
                             <p className="text-2xl font-black text-slate-900">{member.taskEfficiency}%</p>
                             <TrendingUp size={16} className="text-teal-500 mb-1.5" />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">
                           <span>Task Velocity</span>
                           <span>{member.completedTasks} / {member.totalTasks}</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                           <div className="h-full bg-slate-900 rounded-full shadow-glow transition-all duration-1000" style={{ width: `${member.taskEfficiency}%` }}></div>
                        </div>
                     </div>
                  </div>

                  <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                     <div className="flex -space-x-2">
                        {Object.entries(member.statusBreakdown || {}).slice(0, 3).map(([status, count]) => (
                           <div key={status} className="w-8 h-8 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center text-[10px] font-black text-slate-800 shadow-sm" title={`${status}: ${count}`}>
                              {count}
                           </div>
                        ))}
                     </div>
                     <button 
                       onClick={() => handleMonitorUser(member)}
                       className="px-6 py-3 bg-white border border-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-sm hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center"
                     >
                        Audit Leads <ArrowUpRight size={14} className="ml-2" />
                     </button>
                  </div>
               </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
             <table className="w-full">
                <thead>
                   <tr className="bg-slate-50/50">
                      <th className="py-6 px-10 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Teammate Identity</th>
                      <th className="py-6 px-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</th>
                      <th className="py-6 px-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Leads</th>
                      <th className="py-6 px-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Volume</th>
                      <th className="py-6 px-10 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filteredTeam.map(member => (
                      <tr key={member._id} className="hover:bg-slate-50/30 transition-colors group">
                         <td className="py-6 px-10">
                            <div className="flex items-center space-x-5">
                               <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center font-black text-base group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                  {member.name.charAt(0)}
                               </div>
                               <div>
                                  <p className="text-[13px] font-black text-slate-900 tracking-tight leading-tight mb-1">{member.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 lowercase">{member.email}</p>
                               </div>
                            </div>
                         </td>
                         <td className="py-6 px-8">
                            <div className="flex items-center space-x-3">
                               <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-teal-500" style={{ width: `${member.taskEfficiency}%` }}></div>
                               </div>
                               <span className="text-[11px] font-black text-slate-700">{member.taskEfficiency}%</span>
                            </div>
                         </td>
                         <td className="py-6 px-8 text-center">
                            <span className="text-[13px] font-black text-slate-900">{member.leadCount}</span>
                         </td>
                         <td className="py-6 px-8 text-center">
                            <span className="text-[13px] font-black text-slate-900">{member.completedTasks} <span className="text-slate-300 mx-1">/</span> {member.totalTasks}</span>
                         </td>
                         <td className="py-6 px-10 text-right">
                            <button 
                              onClick={() => handleMonitorUser(member)}
                              className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:shadow-md rounded-xl transition-all"
                            >
                               <ArrowUpRight size={18} />
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
