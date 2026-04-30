import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Plus, Play, Pause, Settings, Trash2, Edit, Zap } from 'lucide-react';

function Flows() {
  const navigate = useNavigate();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [editName, setEditName] = useState('');
  const [editTrigger, setEditTrigger] = useState('KEYWORD');
  const [editKeywords, setEditKeywords] = useState('');
  const [editSmartMatch, setEditSmartMatch] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/flows', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        setFlows(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Untitled Flow', description: 'New automation flow' })
      });
      if (res.ok) {
        const newFlow = await res.json();
        navigate(`/flows/${newFlow._id}`);
      }
    } catch (err) {
      alert('Failed to create flow');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this flow permanently?')) return;
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/flows/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        setFlows(flows.filter(f => f._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openSettings = (flow) => {
    setSelectedFlow(flow);
    setEditName(flow.name);
    setEditTrigger(flow.triggerType || 'KEYWORD');
    setEditKeywords(flow.triggerKeywords?.join(', ') || '');
    setEditSmartMatch(flow.isSmartMatch || false);
    setIsSettingsOpen(true);
  };

  const handleUpdate = async () => {
    if (!editName) return alert('Name is required');
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const keywordsArray = editKeywords.split(',').map(k => k.trim()).filter(Boolean);
      
      const res = await fetch(`/api/flows/${selectedFlow._id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name: editName, 
            triggerType: editTrigger, 
            triggerKeywords: (editKeywords.trim() === '' && editTrigger === 'KEYWORD') ? [''] : keywordsArray,
            isSmartMatch: editSmartMatch
        })
      });

      if (res.ok) {
        fetchFlows();
        setIsSettingsOpen(false);
      } else {
        alert('Failed to update flow');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-crm-bg min-h-full animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight flex items-center">
             <Zap className="mr-3 text-blue-600" size={24} /> Automation & Flows
          </h1>
          <p className="text-[10px] sm:text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest leading-relaxed">Visually build WhatsApp chatbots & automated sequences.</p>
        </div>
        <button onClick={handleCreateNew} className="w-full sm:w-auto flex items-center justify-center space-x-3 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-glow hover:bg-blue-700 transition-all active:scale-95">
          <Plus size={18} />
          <span>New Flow</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500 animate-pulse">Loading flow engine...</div>
      ) : flows.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <Bot size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No active automations</h2>
            <p className="text-gray-500 max-w-sm mb-6">Create your first visually-orchestrated WhatsApp bot to engage your customers automatically.</p>
            <button onClick={handleCreateNew} className="px-6 py-2.5 bg-blue-600 text-white rounded-md text-sm font-bold shadow-soft hover:bg-blue-700 transition-colors">Start Building</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {flows.map(f => (
            <div key={f._id} className="bg-white rounded-[2rem] shadow-premium border border-slate-100 p-6 sm:p-8 flex flex-col hover:shadow-glow transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                 <div className="flex-1 space-y-1 overflow-hidden pr-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Flow Identity</p>
                    <h3 className="font-black text-slate-800 text-lg tracking-tight truncate group-hover:text-blue-600 transition-colors" title={f.name}>{f.name}</h3>
                    <div className="flex items-center space-x-2 mt-2">
                       <Zap size={12} className="text-blue-600" />
                       <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest truncate">
                          {f.triggerType} Trigger {f.triggerKeywords?.length > 0 && `("${f.triggerKeywords.join(', ')}")`}
                       </p>
                    </div>
                 </div>
                 <div className="transform scale-90 origin-right">
                   {f.status === 'ACTIVE' ? (
                     <span className="flex items-center text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse"><Play size={10} className="mr-2" /> Active</span>
                   ) : (
                     <span className="flex items-center text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"><Pause size={10} className="mr-2" /> Draft</span>
                   )}
                 </div>
              </div>
              
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50 flex-1 mb-6">
                 <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3 italic">
                    {f.description || "No description provided for this automation sequence."}
                 </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button 
                   onClick={() => navigate(`/flows/${f._id}`)} 
                   className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-3 shadow-glow hover:bg-slate-800 transition-all active:scale-95"
                >
                   <Edit size={14} />
                   <span>Orchestrate</span>
                </button>
                <div className="flex space-x-2">
                   <button 
                      onClick={() => openSettings(f)}
                      className="p-4 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 rounded-2xl transition-all active:scale-90 shadow-sm"
                   >
                      <Settings size={18} />
                   </button>
                   <button 
                      onClick={() => handleDelete(f._id)}
                      className="p-4 bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-2xl transition-all active:scale-90 border border-rose-100/50"
                   >
                      <Trash2 size={18} />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-premium w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <h2 className="text-xl font-bold text-gray-800">Flow Settings</h2>
                 <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
              </div>
              <div className="p-6 space-y-5">
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Flow Name</label>
                    <input 
                       type="text" 
                       className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" 
                       value={editName}
                       onChange={(e) => setEditName(e.target.value)}
                       placeholder="e.g. Welcome Customer"
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trigger Rule</label>
                     <div className="grid grid-cols-3 gap-2">
                        <button 
                           onClick={() => setEditTrigger('KEYWORD')}
                           className={`p-2.5 rounded-lg border text-[10px] font-bold transition-all ${editTrigger === 'KEYWORD' && editKeywords.trim() !== '' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                        >
                           Keyword Match
                        </button>
                        <button 
                           onClick={() => { setEditTrigger('NEW_MESSAGE'); setEditKeywords(''); }}
                           className={`p-2.5 rounded-lg border text-[10px] font-bold transition-all ${editTrigger === 'NEW_MESSAGE' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                        >
                           Welcome (First Msg)
                        </button>
                        <button 
                           onClick={() => { setEditTrigger('KEYWORD'); setEditKeywords(''); }}
                           className={`p-2.5 rounded-lg border text-[10px] font-bold transition-all ${(editTrigger === 'KEYWORD' && editKeywords.trim() === '') ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                        >
                           Catch-all
                        </button>
                     </div>
                 </div>

                 {editTrigger === 'KEYWORD' && editKeywords.trim() !== '' && (
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Keywords (comma separated)</label>
                           <textarea 
                              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 min-h-[80px]" 
                              value={editKeywords}
                              onChange={(e) => setEditKeywords(e.target.value)}
                              placeholder="hello, hi, help"
                           />
                           <p className="text-[10px] text-gray-400">Flow triggers when a customer message contains any of these words.</p>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 group hover:border-blue-300 transition-colors">
                           <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                <Zap size={16} fill={editSmartMatch ? "currentColor" : "none"} />
                              </div>
                              <div>
                                 <p className="text-[11px] font-bold text-gray-700 uppercase tracking-tighter">Smart AI Match 🔥</p>
                                 <p className="text-[10px] text-gray-400">Handle typos (e.g. "helo" → "hello")</p>
                              </div>
                           </div>
                           <button 
                              onClick={() => setEditSmartMatch(!editSmartMatch)}
                              type="button"
                              className={`w-10 h-5 rounded-full relative transition-colors ${editSmartMatch ? 'bg-blue-600' : 'bg-gray-200'}`}
                           >
                              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${editSmartMatch ? 'right-1' : 'left-1'}`}></div>
                           </button>
                        </div>
                    </div>
                 )}
                  {editTrigger === 'NEW_MESSAGE' && (
                     <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-xs text-green-800 leading-relaxed font-semibold">
                           <span className="mr-1.5">👋</span> 
                           This flow will trigger **only once** when a brand new contact sends their very first message to you.
                        </p>
                     </div>
                  )}
                  
                  {editTrigger === 'KEYWORD' && editKeywords.trim() === '' && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                       <p className="text-xs text-purple-800 leading-relaxed font-semibold">
                          <span className="mr-1.5">🚀</span> 
                          This flow will trigger **automatically** for every message that doesn't match any other keyword-specific flow.
                       </p>
                    </div>
                 )}
              </div>
              <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end space-x-3">
                 <button onClick={() => setIsSettingsOpen(false)} className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
                 <button 
                    onClick={handleUpdate}
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-soft hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center"
                 >
                    {isSaving ? 'Updating...' : 'Save Settings'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default Flows;
