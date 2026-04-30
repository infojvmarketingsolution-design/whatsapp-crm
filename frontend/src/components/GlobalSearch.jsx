import React, { useState, useEffect } from 'react';
import { 
  Search, X, Users, CheckSquare, ChevronRight, Loader2, 
  Settings, Smartphone, Layout, Megaphone, MessageSquare, User, ShieldCheck, Zap,
  Compass, History, Sparkles, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SYSTEM_PAGES = [
  { type: 'NAV', name: 'System Settings', sub: 'Workspace & API configuration', icon: Settings, link: '/settings', color: 'text-slate-600 bg-slate-100' },
  { type: 'NAV', name: 'API Credentials', sub: 'WABA & Meta developer keys', icon: Smartphone, link: '/api-setup', color: 'text-indigo-600 bg-indigo-50' },
  { type: 'NAV', name: 'Message Templates', sub: 'Approved HSM & Utility templates', icon: Layout, link: '/templates', color: 'text-purple-600 bg-purple-50' },
  { type: 'NAV', name: 'Campaign Studio', sub: 'Blast analytics & scheduling', icon: Megaphone, link: '/campaigns', color: 'text-orange-600 bg-orange-50' },
  { type: 'NAV', name: 'Unified Inbox', sub: 'Real-time conversation stream', icon: MessageSquare, link: '/inbox', color: 'text-emerald-600 bg-emerald-50' },
  { type: 'NAV', name: 'CRM & Tasks', sub: 'Workflow & lead automation', icon: CheckSquare, link: '/tasks', color: 'text-blue-600 bg-blue-50' },
];

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query || query.length < 1) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenantId');
        if (!token) return;

        const navResults = SYSTEM_PAGES.filter(p => 
          p.name.toLowerCase().includes(query.toLowerCase()) || 
          p.sub.toLowerCase().includes(query.toLowerCase())
        ).map(p => ({ ...p, id: p.link }));

        let backendResults = [];
        if (query.length >= 2) {
          const [contactsRes, tasksRes] = await Promise.all([
            fetch(`/api/chat/contacts`, { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId } }),
            fetch(`/api/chat/stats/pending-tasks`, { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId } })
          ]);

          if (contactsRes.ok) {
            const contacts = await contactsRes.json();
            const filteredContacts = contacts.filter(c => 
              c.name?.toLowerCase().includes(query.toLowerCase()) || 
              c.phone?.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, ''))
            ).slice(0, 5);

            backendResults.push(...filteredContacts.map(c => ({
              id: c._id,
              type: 'CONTACT',
              name: c.name || 'Unknown Lead',
              sub: c.phone || 'No phone attached',
              icon: Users,
              color: 'text-emerald-600 bg-emerald-50',
              link: `/inbox?contactId=${c._id}`,
              badge: 'Lead'
            })));
          }

          if (tasksRes.ok) {
            const taskData = await tasksRes.json();
            const allTasks = [...(taskData.telecallerTasks || []), ...(taskData.counsellorTasks || [])];
            const filteredTasks = allTasks.filter(t => 
              t.title?.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 5);

            backendResults.push(...filteredTasks.map(t => ({
              id: t._id,
              type: 'TASK',
              name: t.title,
              sub: `Deadline: ${new Date(t.dueDate).toLocaleDateString()}`,
              icon: CheckSquare,
              color: 'text-blue-600 bg-blue-50',
              link: '/tasks',
              badge: 'CRM'
            })));
          }
        }

        setResults([...navResults, ...backendResults]);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (res) => {
    navigate(res.link);
    onClose();
    setQuery('');
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[300] flex flex-col animate-in fade-in duration-300">
          {/* Main Search Container */}
          <div className="mx-auto w-full max-w-2xl mt-[env(safe-area-inset-top)] sm:mt-20 h-full sm:h-auto sm:max-h-[80vh] bg-white sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            
            {/* Professional Search Header */}
            <div className="relative p-6 border-b border-slate-100 flex items-center bg-slate-50/30">
               <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-blue-500/5 opacity-50"></div>
               <div className="relative flex-1 flex items-center space-x-4">
                  {loading ? (
                    <Loader2 className="text-teal-500 animate-spin" size={24} />
                  ) : (
                    <Search className="text-slate-400" size={24} />
                  )}
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Search intelligence, leads, systems..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none text-lg font-bold text-slate-800 placeholder:text-slate-300 focus:ring-0"
                  />
               </div>
               <button 
                  onClick={() => { onClose(); setQuery(''); }} 
                  className="relative p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
               >
                  <X size={20} />
               </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {query.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                     <div className="flex items-center space-x-2">
                        <Sparkles size={14} className="text-teal-500" />
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intelligence Results</h3>
                     </div>
                     {loading && <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping"></div>}
                  </div>
                  
                  <div className="space-y-2">
                    {results.length > 0 ? results.map((res, idx) => (
                      <div 
                        key={res.id || idx} 
                        onClick={() => handleSelect(res)}
                        className="group flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-slate-100 shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl ${res.color} group-hover:scale-110 transition-all shadow-sm`}>
                            <res.icon size={20} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                               <p className="text-sm font-black text-slate-800 leading-tight">{res.name}</p>
                               {res.badge && (
                                 <span className="px-2 py-0.5 bg-slate-100 text-[8px] font-black text-slate-500 rounded-md uppercase tracking-wider">{res.badge}</span>
                               )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{res.sub}</p>
                          </div>
                        </div>
                        <ArrowUpRight size={18} className="text-slate-200 group-hover:text-teal-500 transition-all" />
                      </div>
                    )) : !loading && (
                      <div className="py-20 text-center opacity-30">
                         <Compass size={64} className="mx-auto mb-4 text-slate-300" />
                         <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Intelligence Found</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-10">
                   {/* Quick Shortcuts Section */}
                   <div>
                      <div className="flex items-center space-x-2 mb-6 px-2">
                         <Compass size={14} className="text-teal-500" />
                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Launch</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div onClick={() => { navigate('/inbox'); onClose(); }} className="group p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100/50 flex flex-col items-center justify-center text-center space-y-4 cursor-pointer hover:bg-white hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 active:scale-95">
                            <div className="p-4 bg-white text-emerald-600 rounded-2xl shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                               <MessageSquare size={28} />
                            </div>
                            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Open Workspace</span>
                         </div>
                         
                         <div onClick={() => { navigate('/tasks'); onClose(); }} className="group p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100/50 flex flex-col items-center justify-center text-center space-y-4 cursor-pointer hover:bg-white hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 active:scale-95">
                            <div className="p-4 bg-white text-blue-600 rounded-2xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                               <CheckSquare size={28} />
                            </div>
                            <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Manage Tasks</span>
                         </div>
                      </div>
                   </div>

                   {/* Core Modules List */}
                   <div>
                      <div className="flex items-center space-x-2 mb-4 px-2">
                         <History size={14} className="text-slate-400" />
                         <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Systems</h3>
                      </div>
                      <div className="space-y-2">
                         {SYSTEM_PAGES.slice(0, 4).map((p, i) => (
                           <div key={i} onClick={() => handleSelect(p)} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl hover:bg-white hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]">
                              <div className="flex items-center space-x-4">
                                 <div className={`p-2.5 rounded-xl bg-white shadow-sm text-slate-400 group-hover:${p.color.split(' ')[0]} transition-colors`}>
                                    <p.icon size={18} />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-700">{p.name}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{p.sub}</span>
                                 </div>
                              </div>
                              <ChevronRight size={16} className="text-slate-200 group-hover:text-teal-500 transition-all" />
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* Professional Footer */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-center">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Press <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded-md shadow-sm mx-1">Esc</span> to dismiss intelligence</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
