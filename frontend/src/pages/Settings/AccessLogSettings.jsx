import React, { useState, useEffect } from 'react';
import { 
  History, 
  Clock, 
  User, 
  Activity,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

export default function AccessLogSettings() {
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
    <div className="animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <History className="mr-2 text-teal-600" size={20} />
              Login Activity Logs
            </h2>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">Track user logins, durations and system activity</p>
          </div>
          <button 
            onClick={() => fetchSessions(page)} 
            disabled={loading}
            className="p-2 hover:bg-white rounded-lg transition-colors text-gray-400 hover:text-teal-600"
            title="Refresh Logs"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-start space-x-3">
           <Info size={16} className="text-blue-600 mt-0.5" />
           <p className="text-xs text-blue-700 font-medium">
             Security Policy: All sessions are automatically terminated after 5 minutes of inactivity. Logs are kept for auditing purposes.
           </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Login Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent Action</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.length === 0 && !loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-sm italic">
                    No session activity recorded yet.
                  </td>
                </tr>
              ) : sessions.map((session) => (
                <tr key={session._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center mr-3">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm leading-none mb-1">{session.userName}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{session.userRole}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-gray-700">{formatDate(session.loginAt)}</div>
                    <div className="text-[10px] text-gray-400 font-medium">{formatTime(session.loginAt)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1.5">
                       <Clock size={12} className="text-gray-300" />
                       <span className="text-xs font-bold text-gray-700">{session.duration}m</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-[150px]">
                       <p className="text-[10px] font-bold text-gray-600 truncate">
                         {session.activitySummary.length > 0 
                           ? session.activitySummary[session.activitySummary.length - 1].action 
                           : 'No activity'}
                       </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                         session.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                         session.status === 'TIMEOUT' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                         'bg-gray-50 text-gray-500 border-gray-100'
                       }`}>
                         {session.status}
                       </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
           <p className="text-[10px] font-bold text-gray-400">Page {page} of {pages}</p>
           <div className="flex space-x-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="p-1.5 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(pages, p + 1))} 
                disabled={page === pages}
                className="p-1.5 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
