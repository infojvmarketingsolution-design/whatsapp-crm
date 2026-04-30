import React from 'react';
import { Search, X, Users, CheckSquare, ChevronRight } from 'lucide-react';

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = React.useState('');
  
  // Mock results
  const results = [
    { type: 'CONTACT', name: 'John Doe', sub: '+1 234 567 890', icon: Users, color: 'text-teal-600 bg-teal-50' },
    { type: 'TASK', name: 'Follow up with Mary', sub: 'Due in 2 hours', icon: CheckSquare, color: 'text-blue-600 bg-blue-50' },
  ].filter(r => r.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      {/* Search Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-white z-[300] flex flex-col animate-in fade-in duration-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center space-x-4 h-[calc(5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)]">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                autoFocus
                type="text"
                placeholder="Search anything..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600">
              Cancel
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {query.length > 0 ? (
              <>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Results</h3>
                <div className="space-y-4">
                  {results.length > 0 ? results.map((res, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-soft transition-all border border-transparent hover:border-slate-100 cursor-pointer">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-xl ${res.color}`}>
                          <res.icon size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{res.name}</p>
                          <p className="text-[10px] font-medium text-slate-400">{res.sub}</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300" />
                    </div>
                  )) : (
                    <div className="py-12 text-center space-y-4 opacity-40">
                      <Search size={48} className="mx-auto text-slate-300" />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No results found for "{query}"</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-8">
                 <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4">Quick Shortcuts</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-teal-50 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 cursor-pointer hover:bg-teal-100 transition-all">
                          <Users size={24} className="text-teal-600" />
                          <span className="text-[10px] font-black text-teal-700 uppercase tracking-tight">Recent Contacts</span>
                       </div>
                       <div className="p-4 bg-blue-50 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 cursor-pointer hover:bg-blue-100 transition-all">
                          <CheckSquare size={24} className="text-blue-600" />
                          <span className="text-[10px] font-black text-blue-700 uppercase tracking-tight">Pending Tasks</span>
                       </div>
                    </div>
                 </div>
                 
                 <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4">Recent Searches</h3>
                    <div className="space-y-2">
                       {['Instagram Campaign', 'Marketing Team', 'Template Drafts'].map((s, i) => (
                         <div key={i} className="flex items-center space-x-3 px-2 py-2 text-sm font-bold text-slate-500 hover:text-teal-600 cursor-pointer transition-colors">
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
