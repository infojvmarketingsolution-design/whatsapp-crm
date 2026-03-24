import React, { useState, useEffect } from 'react';
import { RefreshCw, FileText, CheckCircle, Clock, XCircle, Trash2 } from 'lucide-react';

function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/templates', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/templates/sync', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        await fetchTemplates(); // Refresh list after sync
      } else {
        alert('Failed to sync templates.');
      }
    } catch (err) {
      console.error('Sync error:', err);
      alert('Error syncing templates.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this template from Meta?')) return;
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
         setTemplates(templates.filter(t => t._id !== id));
      } else {
         const err = await res.json();
         alert('Failed to delete: ' + (err.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting template');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'APPROVED': return <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-bold"><CheckCircle size={12} className="mr-1" /> Approved</span>;
      case 'PENDING': return <span className="flex items-center text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md text-xs font-bold"><Clock size={12} className="mr-1" /> Pending</span>;
      case 'REJECTED': return <span className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-bold"><XCircle size={12} className="mr-1" /> Rejected</span>;
      default: return null;
    }
  };

  return (
    <div className="p-8 bg-crm-bg min-h-full animate-fade-in-up relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Message Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and sync approved WhatsApp templates.</p>
        </div>
        <button onClick={handleSync} disabled={loading} className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-md text-sm font-bold shadow-soft hover:bg-gray-50 transition-colors">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Syncing...' : 'Sync from Meta'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(t => (
          <div key={t._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-premium transition-shadow">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <h3 className="font-bold text-gray-800 text-lg flex items-center truncate max-w-[200px]" title={t.name}>{t.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 font-medium">{t.category} • {t.language.toUpperCase()}</p>
               </div>
               {getStatusBadge(t.status)}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 font-medium mb-4 flex-1">
               {t.components?.find(c => c.type === 'BODY')?.text || 'No body content'}
            </div>
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
               <button onClick={() => handleDelete(t._id)} className="text-red-500 font-bold text-sm hover:text-red-700 transition-colors flex items-center px-2 py-1 rounded hover:bg-red-50">
                 <Trash2 size={16} className="mr-1" /> Delete
               </button>
               <button onClick={() => setSelectedTemplate(t)} className="text-blue-600 font-bold text-sm hover:text-blue-700 transition-colors flex items-center">
                 <FileText size={16} className="mr-1" /> View Details
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedTemplate.name}</h2>
                <div className="flex items-center mt-1 space-x-2">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">{selectedTemplate.category}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedTemplate.language}</span>
                </div>
              </div>
              <button onClick={() => setSelectedTemplate(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><XCircle size={20} className="text-gray-400" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* WhatsApp UI Simulation */}
              <div className="bg-[#E5DDD5] rounded-xl p-4 shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{backgroundImage: 'url("https://wweb.dev/assets/whatsapp-chat-bg.png")'}}></div>
                <div className="bg-white rounded-lg p-3 shadow-sm relative z-10 max-w-[90%] float-left">
                  {/* Header */}
                  {selectedTemplate.components?.find(c => c.type === 'HEADER') && (
                    <div className="font-bold text-gray-900 mb-1 py-1 border-b border-gray-100">
                      {selectedTemplate.components.find(c => c.type === 'HEADER').text}
                    </div>
                  )}
                  {/* Body */}
                  <div className="text-[14px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {selectedTemplate.components?.find(c => c.type === 'BODY')?.text || 'No content found.'}
                  </div>
                  {/* Footer */}
                  {selectedTemplate.components?.find(c => c.type === 'FOOTER') && (
                    <div className="text-xs text-gray-400 mt-2">
                      {selectedTemplate.components.find(c => c.type === 'FOOTER').text}
                    </div>
                  )}
                </div>
                
                {/* Buttons */}
                {selectedTemplate.components?.find(c => c.type === 'BUTTONS') && (
                   <div className="w-full mt-2 float-left max-w-[90%] space-y-1">
                      {selectedTemplate.components.find(c => c.type === 'BUTTONS').buttons.map((btn, idx) => (
                        <div key={idx} className="bg-white rounded-lg py-2.5 px-4 text-sm text-blue-500 font-bold text-center shadow-sm border-t border-gray-50">
                          {btn.text}
                        </div>
                      ))}
                   </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Metadata</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">External ID (Meta)</p>
                    <p className="text-sm text-gray-700 font-mono truncate">{selectedTemplate.externalId || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Status</p>
                    <p className="text-sm font-bold">{selectedTemplate.status}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setSelectedTemplate(null)}
                className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg text-sm hover:bg-black transition-all shadow-md"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Templates;
