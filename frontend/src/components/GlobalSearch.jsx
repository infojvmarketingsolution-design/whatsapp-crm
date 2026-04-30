import React, { useState, useEffect } from 'react';
import { 
  Search, X, Users, CheckSquare, ChevronRight, Loader2, 
  Settings, Smartphone, Layout, Megaphone, MessageSquare, User, ShieldCheck, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SYSTEM_PAGES = [
  { type: 'NAV', name: 'Settings', sub: 'Workspace, Profile & Billing', icon: Settings, link: '/settings', color: 'text-slate-600 bg-slate-100' },
  { type: 'NAV', name: 'API Setup', sub: 'WhatsApp Business API Config', icon: Smartphone, link: '/api-setup', color: 'text-indigo-600 bg-indigo-50' },
  { type: 'NAV', name: 'Message Templates', sub: 'Manage Approved Templates', icon: Layout, link: '/templates', color: 'text-purple-600 bg-purple-50' },
  { type: 'NAV', name: 'Campaigns', sub: 'Bulk Marketing & Broadcasts', icon: Megaphone, link: '/campaigns', color: 'text-orange-600 bg-orange-50' },
  { type: 'NAV', name: 'Inbox / Chat', sub: 'Real-time Lead Management', icon: MessageSquare, link: '/inbox', color: 'text-emerald-600 bg-emerald-50' },
  { type: 'NAV', name: 'Tasks & CRM', sub: 'Follow-ups & Overdue Items', icon: CheckSquare, link: '/tasks', color: 'text-blue-600 bg-blue-50' },
  { type: 'NAV', name: 'Profile Settings', sub: 'Manage Personal Information', icon: User, link: '/profile', color: 'text-teal-600 bg-teal-50' },
  { type: 'NAV', name: 'Flow Builder', sub: 'Automation & Chatbots', icon: Zap, link: '/flows', color: 'text-yellow-600 bg-yellow-50' },
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

        // 1. Filter System Pages
        const navResults = SYSTEM_PAGES.filter(p => 
          p.name.toLowerCase().includes(query.toLowerCase()) || 
          p.sub.toLowerCase().includes(query.toLowerCase())
        ).map(p => ({ ...p, id: p.link }));

        // Only fetch from backend if query is 2+ chars
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
              name: c.name || 'Unknown Contact',
              sub: c.phone || 'No phone',
              icon: Users,
              color: 'text-teal-600 bg-teal-50',
              link: `/inbox?contactId=${c._id}`
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
              sub: `Due: ${new Date(t.dueDate).toLocaleDateString()}`,
              icon: CheckSquare,
              color: 'text-blue-600 bg-blue-50',
              link: '/tasks'
            })));
          }
        }

        setResults([...navResults, ...backendResults]);
      } catch (err) {
        console.error('Search failed', err);
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
        <div className="fixed inset-0 bg-white z-[300] flex flex-col animate-in fade-in duration-200">
          <div className="p-6 border-b border-slate-100 flex items-center space-x-4 h-[calc(5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-white/80 backdrop-blur-md sticky top-0">
            <div className="flex-1 relative">
              {loading ? (
                <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500 animate-spin" size={20} />
              ) : (
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              )}
              <input 
                autoFocus
                type="text"
                placeholder="Search leads, tasks, settings..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-inner"
              />
            </div>
            <button onClick={() => { onClose(); setQuery(''); }} className="px-4 py-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-rose-500 transition-colors">
              Cancel
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {query.length > 0 ? (
              <>
                <div className="flex items-center justify-between ml-1 px-1">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Results</h3>
                   {loading && <span className="text-[9px] font-bold text-teal-600 animate-pulse uppercase tracking-tighter">Syncing...</span>}
                </div>
                <div className="space-y-3">
                  {results.length > 0 ? results.map((res, idx) => (
                    <div 
                      key={res.id || idx} 
                      onClick={() => handleSelect(res)}
                      className="flex items-center justify-between p-4 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all cursor-pointer group active:scale-[0.98]"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-2xl ${res.color} group-hover:scale-110 transition-transform shadow-sm`}>
                          <res.icon size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 leading-tight">{res.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{res.sub}</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  )) : !loading && (
                    <div className="py-20 text-center space-y-4">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                         <Search size={40} className="text-slate-200" />
                      </div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No matching results found</p>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">Try searching for "API", "Task", or a phone number</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                 <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-6 px-1">Global Navigation</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div onClick={() => { navigate('/inbox'); onClose(); }} className="group p-6 bg-emerald-50/50 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4 cursor-pointer hover:bg-emerald-100 transition-all border border-emerald-100/30">
                          <div className="p-4 bg-white rounded-2xl text-emerald-600 shadow-md group-hover:scale-110 transition-transform"><MessageSquare size={28} /></div>
                          <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Open Inbox</span>
                       </div>
                       <div onClick={() => { navigate('/tasks'); onClose(); }} className="group p-6 bg-blue-50/50 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4 cursor-pointer hover:bg-blue-100 transition-all border border-blue-100/30">
                          <div className="p-4 bg-white rounded-2xl text-blue-600 shadow-md group-hover:scale-110 transition-transform"><CheckSquare size={28} /></div>
                          <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">My Tasks</span>
                       </div>
                    </div>
                 </div>
                 
                 <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4 px-1">Recently Used Modules</h3>
                    <div className="space-y-3">
                       {SYSTEM_PAGES.slice(0, 3).map((p, i) => (
                         <div key={i} onClick={() => handleSelect(p)} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl hover:bg-white hover:shadow-soft transition-all cursor-pointer border border-transparent hover:border-slate-100">
                            <div className="flex items-center space-x-3">
                               <p.icon size={16} className="text-slate-400" />
                               <span className="text-xs font-bold text-slate-600">{p.name}</span>
                            </div>
                            <ChevronRight size={14} className="text-slate-300" />
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
