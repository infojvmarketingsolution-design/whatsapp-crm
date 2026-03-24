import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Plus, Play, Pause, Settings, Trash2, Edit } from 'lucide-react';

function Flows() {
  const navigate = useNavigate();
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);

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
                   <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Settings">
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
    </div>
  );
}

export default Flows;
