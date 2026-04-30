import React, { useState, useEffect } from 'react';
import { Search, X, Users, CheckSquare, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenantId');
        if (!token) return;

        // Fetch contacts for search
        const contactsRes = await fetch(`/api/chat/contacts`, {
          headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
        });
        
        // Fetch tasks for search
        const tasksRes = await fetch(`/api/chat/stats/pending-tasks`, {
          headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
        });

        let found = [];

        if (contactsRes.ok) {
          const contacts = await contactsRes.json();
          const filteredContacts = contacts.filter(c => 
            c.name?.toLowerCase().includes(query.toLowerCase()) || 
            c.phone?.includes(query)
          ).slice(0, 5);

          found = [
            ...found,
            ...filteredContacts.map(c => ({
              id: c._id,
              type: 'CONTACT',
              name: c.name || 'Unknown Contact',
              sub: c.phone || 'No phone',
              icon: Users,
              color: 'text-teal-600 bg-teal-50',
              link: `/inbox?contactId=${c._id}`
            }))
          ];
        }

        if (tasksRes.ok) {
          const taskData = await tasksRes.json();
          const allTasks = [...(taskData.telecallerTasks || []), ...(taskData.counsellorTasks || [])];
          const filteredTasks = allTasks.filter(t => 
            t.title?.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 5);

          found = [
            ...found,
            ...filteredTasks.map(t => ({
              id: t._id,
              type: 'TASK',
              name: t.title,
              sub: `Due: ${new Date(t.dueDate).toLocaleDateString()}`,
              icon: CheckSquare,
              color: 'text-blue-600 bg-blue-50',
              link: '/tasks'
            }))
          ];
        }

        setResults(found);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 400); // Debounce 400ms

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
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center space-x-4 h-[calc(5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)]">
            <div className="flex-1 relative">
              {loading ? (
                <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500 animate-spin" size={20} />
              ) : (
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              )}
              <input 
                autoFocus
                type="text"
                placeholder="Search leads, tasks, phones..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
            <button onClick={() => { onClose(); setQuery(''); }} className="p-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600">
              Cancel
            </button>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {query.length >= 2 ? (
              <>
                <div className="flex items-center justify-between ml-1">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Results</h3>
                   {loading && <span className="text-[9px] font-bold text-teal-600 animate-pulse uppercase tracking-tighter">Updating...</span>}
                </div>
                <div className="space-y-4">
                  {results.length > 0 ? results.map((res, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleSelect(res)}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-soft transition-all border border-transparent hover:border-slate-100 cursor-pointer group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl ${res.color} group-hover:scale-110 transition-transform`}>
                          <res.icon size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{res.name}</p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">{res.sub}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                         <span className="text-[9px] font-black text-slate-300 uppercase hidden group-hover:block">Open</span>
                         <ChevronRight size={18} className="text-slate-300 group-hover:text-teal-500" />
                      </div>
                    </div>
                  )) : !loading && (
                    <div className="py-12 text-center space-y-4 opacity-40">
                      <Search size={48} className="mx-auto text-slate-300" />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No results found for "{query}"</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                 <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4">Quick Shortcuts</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div onClick={() => { navigate('/inbox'); onClose(); }} className="p-5 bg-teal-50 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 cursor-pointer hover:bg-teal-100 transition-all shadow-sm border border-teal-100/50">
                          <div className="p-3 bg-white rounded-2xl text-teal-600 shadow-sm"><Users size={24} /></div>
                          <span className="text-[10px] font-black text-teal-700 uppercase tracking-tight">Recent Contacts</span>
                       </div>
                       <div onClick={() => { navigate('/tasks'); onClose(); }} className="p-5 bg-blue-50 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 cursor-pointer hover:bg-blue-100 transition-all shadow-sm border border-blue-100/50">
                          <div className="p-3 bg-white rounded-2xl text-blue-600 shadow-sm"><CheckSquare size={24} /></div>
                          <span className="text-[10px] font-black text-blue-700 uppercase tracking-tight">Pending Tasks</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="opacity-50 pointer-events-none">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4">Recent Searches</h3>
                    <div className="space-y-2">
                       {['Instagram Campaign', 'Marketing Team', 'Template Drafts'].map((s, i) => (
                         <div key={i} className="flex items-center space-x-3 px-2 py-2 text-sm font-bold text-slate-300">
                            <Search size={14} className="opacity-40" />
                            <span>{s}</span>
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
