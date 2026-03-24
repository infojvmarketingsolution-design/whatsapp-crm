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
    <div className="p-8 bg-crm-bg min-h-full animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Automation & Flows</h1>
          <p className="text-sm text-gray-500 mt-1">Visually build WhatsApp chatbots and automated sequences.</p>
        </div>
        <button onClick={handleCreateNew} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold shadow-soft hover:bg-blue-700 transition-colors">
          <Plus size={16} />
          <span>Create Blank Flow</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flows.map(f => (
            <div key={f._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-premium transition-shadow">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex-1 space-y-1 overflow-hidden pr-2">
                    <h3 className="font-bold text-gray-800 text-lg truncate" title={f.name}>{f.name}</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">
                       {f.triggerType} Trigger {f.triggerKeywords?.length > 0 && `("${f.triggerKeywords.join(', ')}")`}
                    </p>
                 </div>
                 {f.status === 'ACTIVE' ? (
                   <span className="shrink-0 flex items-center text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"><Play size={10} className="mr-1" /> Active</span>
                 ) : (
                   <span className="shrink-0 flex items-center text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"><Pause size={10} className="mr-1" /> Draft</span>
                 )}
              </div>
              <p className="text-sm text-gray-600 flex-1 line-clamp-2">{f.description}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <div className="flex space-x-1">
                   <button onClick={() => handleDelete(f._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete Flow">
                     <Trash2 size={16} />
                   </button>
                   <button 
                     onClick={() => openSettings(f)}
                     className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Settings"
                   >
                     <Settings size={16} />
                   </button>
                </div>
                <button onClick={() => navigate(`/flows/${f._id}`)} className="text-blue-600 font-bold text-sm hover:text-blue-800 transition-colors flex items-center bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md">
                   <Edit size={14} className="mr-1.5" /> Open Canvas
                </button>
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
                    <div className="grid grid-cols-2 gap-2">
                       <button 
                          onClick={() => setEditTrigger('KEYWORD')}
                          className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${editTrigger === 'KEYWORD' && editKeywords.trim() !== '' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                       >
                          Keyword Match
                       </button>
                       <button 
                          onClick={() => { setEditTrigger('KEYWORD'); setEditKeywords(''); }}
                          className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${(editTrigger === 'KEYWORD' && editKeywords.trim() === '') ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                       >
                          Catch-all (Default)
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
