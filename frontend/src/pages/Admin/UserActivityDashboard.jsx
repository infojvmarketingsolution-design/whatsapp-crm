import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Clock, 
  User, 
  MessageSquare, 
  LogOut, 
  Calendar,
  Activity,
  ArrowLeft,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserActivityDashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchSessions = async (p = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/sessions?pageNumber=${p}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
        setPages(data.pages);
        setPage(data.page);
      }
    } catch (err) {
      console.error('Fetch sessions fail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(() => fetchSessions(page), 30000); // Auto refresh every 30s
    return () => clearInterval(interval);
  }, [page]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center text-slate-400 hover:text-slate-600 mb-4 text-xs font-bold uppercase tracking-widest transition-colors">
            <ArrowLeft size={14} className="mr-2" /> Back
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Access Logs</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">User Activity & Session Duration Monitoring</p>
        </div>
        <button 
          onClick={() => fetchSessions(page)} 
          disabled={loading}
          className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition-all flex items-center space-x-2"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span className="text-xs font-black uppercase">Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Active Sessions" value={sessions.filter(s => s.status === 'ACTIVE').length} icon={Activity} color="emerald" />
        <StatCard title="Today's Logins" value={sessions.filter(s => new Date(s.loginAt).toDateString() === new Date().toDateString()).length} icon={Calendar} color="blue" />
        <StatCard title="Auto-Timeouts" value={sessions.filter(s => s.status === 'TIMEOUT').length} icon={Clock} color="amber" />
      </div>

      <div className="bg-white rounded-[32px] shadow-soft border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Details</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Login Date/Time</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Activity</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Logout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sessions.map((session) => (
                <tr key={session._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mr-4 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm leading-none mb-1">{session.userName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{session.userRole}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-700">{formatDate(session.loginAt)}</p>
                      <p className="text-xs font-medium text-slate-400">{formatTime(session.loginAt)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-2">
                       <Clock size={14} className="text-slate-300" />
                       <span className="text-sm font-black text-slate-700">{session.duration} mins</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="max-w-xs">
                       <p className="text-xs font-bold text-slate-600 truncate">
                         {session.activitySummary.length > 0 
                           ? session.activitySummary[session.activitySummary.length - 1].action 
                           : 'No activity yet'}
                       </p>
                       <p className="text-[10px] text-slate-400 italic mt-1 font-medium">
                         {session.activitySummary.length} actions recorded
                       </p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-start">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 ${
                         session.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                         session.status === 'TIMEOUT' ? 'bg-amber-100 text-amber-700' :
                         'bg-slate-100 text-slate-600'
                       }`}>
                         {session.status}
                       </span>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">{formatTime(session.logoutAt)}</p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex justify-between items-center">
           <p className="text-xs font-bold text-slate-400">Showing page {page} of {pages}</p>
           <div className="flex space-x-2">
              <button 
                onClick={() => setPage(Math.max(1, page - 1))} 
                disabled={page === 1}
                className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => setPage(Math.min(pages, page + 1))} 
                disabled={page === pages}
                className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
              >
                <ChevronRight size={18} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-soft border border-slate-100 flex items-center space-x-6">
      <div className={`w-14 h-14 rounded-2xl ${colors[color]} flex items-center justify-center`}>
        <Icon size={28} />
      </div>
      <div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{title}</h3>
        <p className="text-3xl font-black text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
}
