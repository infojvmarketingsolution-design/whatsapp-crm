import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Search, Filter, Phone, MessageSquare, Plus } from 'lucide-react';

const STATUSES = [
  { id: 'NEW LEAD', label: 'New Lead', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'CONTACTED', label: 'Contacted', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'INTERESTED', label: 'Interested', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { id: 'FOLLOW_UP', label: 'Follow Up', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'CLOSED_WON', label: 'Closed Won', color: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'CLOSED_LOST', label: 'Closed Lost', color: 'bg-red-100 text-red-800 border-red-200' },
];

export default function Pipeline() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [agents, setAgents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [qualificationFilter, setQualificationFilter] = useState('ALL');

  const QUALIFICATIONS = [
    '10th Pass',
    '12th Pass',
    'Diploma Completed',
    'Graduation Completed',
    'Master Completed'
  ];

  useEffect(() => {
    fetchContacts();
    fetchAgents();
  }, [qualificationFilter]);

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      let url = '/api/chat/contacts';
      if (qualificationFilter !== 'ALL') url += `?qualification=${encodeURIComponent(qualificationFilter)}`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) setContacts(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/agents', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) setAgents(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignAgent = async (contactId, agentId) => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      await fetch(`/api/chat/contacts/${contactId}/action`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_agent', payload: { agentId } })
      });
      fetchContacts();
      setActiveDropdown(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const contactId = e.dataTransfer.getData('contactId');
    if (!contactId) return;

    // Optimistic Update
    setContacts(prev => prev.map(c => c._id === contactId ? { ...c, status: newStatus } : c));

    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      await fetch(`/api/chat/contacts/${contactId}/action`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', payload: { status: newStatus } })
      });
    } catch (err) {
      console.error(err);
      fetchContacts();
    }
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/chat/contacts', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLeadName, phone: newLeadPhone, source: 'Pipeline Manual' })
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewLeadName('');
        setNewLeadPhone('');
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (contactId, action, payload = {}) => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/chat/contacts/${contactId}/action`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      if (res.ok) {
        if (action === 'archive_lead' || action === 'hard_delete_lead') {
          setContacts(prev => prev.filter(c => c._id !== contactId));
          setActiveDropdown(null);
        } else {
          fetchContacts();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 bg-white rounded-3xl shadow-[0_4px_30px_rgb(0,0,0,0.06)] overflow-hidden border border-gray-50 flex flex-col relative z-10 w-[calc(100%-12px)] ml-3 my-3">
      <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-[#fdfdfd]">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pipeline</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Drag and drop leads to advance stages.</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <select 
              value={qualificationFilter}
              onChange={(e) => setQualificationFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-brand-light/50 outline-none appearance-none cursor-pointer text-gray-700"
            >
              <option value="ALL">All Qualifications</option>
              {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input type="text" placeholder="Search..." className="bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-brand-light/50 outline-none" />
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2 bg-[var(--theme-bg)] hover:bg-teal-900 text-white px-4 py-2 rounded-xl font-bold text-sm transition shadow-sm">
            <Plus size={16} />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-6 bg-[#fcfcfd]">
        <div className="flex space-x-6 h-full min-w-max pb-4">
          {STATUSES.map(stage => {
            const columnContacts = contacts.filter(c => (c.status || 'NEW LEAD') === stage.id);
            return (
              <div 
                key={stage.id} 
                className="w-72 flex flex-col bg-gray-50/50 rounded-2xl border border-gray-100"
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, stage.id)}
              >
                <div className={`px-4 py-3 rounded-t-2xl border-b border-gray-100 flex justify-between items-center bg-white ${stage.color} border-l-4`}>
                   <h3 className="font-bold text-xs uppercase tracking-wider">{stage.label}</h3>
                   <span className="bg-white/50 text-current px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">{columnContacts.length}</span>
                </div>

                <div className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-3">
                  {columnContacts.map(c => (
                    <div 
                      key={c._id}
                      draggable
                      onDragStart={e => e.dataTransfer.setData('contactId', c._id)}
                      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group relative"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm text-gray-800 truncate pr-4">{c.name || c.phone}</h4>
                        <div className="relative">
                          <button onClick={() => setActiveDropdown(activeDropdown === c._id ? null : c._id)} className="text-gray-300 hover:text-gray-800 absolute -right-1 -top-1 p-2">
                            <MoreVertical size={14}/>
                          </button>
                          {activeDropdown === c._id && (
                             <div className="absolute right-0 top-6 mt-1 w-48 bg-white border border-gray-100 shadow-xl rounded-lg py-1 z-50">
                               <button onClick={() => navigate('/inbox')} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 border-b border-gray-50">Open Chat</button>
                               <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">Assign Counsellor</div>
                               <div className="max-h-32 overflow-y-auto">
                                 {agents.map(agent => (
                                    <button 
                                      key={agent._id} 
                                      onClick={() => handleAssignAgent(c._id, agent._id)}
                                      className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-teal-50 border-l-2 transition-all ${c.assignedAgent?._id === agent._id ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-transparent text-gray-600'}`}
                                    >
                                      {agent.name}
                                    </button>
                                 ))}
                               </div>
                               <button 
                                 onClick={() => {
                                   if (window.confirm("Archive this lead? It will be hidden from your pipeline and inbox (Fronthead delete).")) {
                                     handleAction(c._id, 'archive_lead');
                                   }
                                 }}
                                 className="w-full text-left px-4 py-2 text-xs font-bold text-orange-600 hover:bg-orange-50 border-t border-gray-50"
                               >
                                 Delete lead only fronthead
                               </button>
                               <button 
                                 onClick={() => {
                                   if (window.confirm("PERMANENTLY delete this lead and all history from the database? This cannot be undone.")) {
                                      handleAction(c._id, 'hard_delete_lead');
                                   }
                                 }}
                                 className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border-t border-gray-50"
                               >
                                 Delete this lead from database also
                               </button>
                             </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 font-medium flex items-center mb-2">
                         <Phone size={12} className="mr-1.5 opacity-70"/> {c.phone}
                      </div>

                      {(c.qualification || c.selectedProgram) && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {c.qualification && <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 uppercase">{c.qualification}</span>}
                          {c.selectedProgram && <span className="text-[9px] font-bold bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100 uppercase">{c.selectedProgram.substring(0, 20)}...</span>}
                        </div>
                      )}

                      {c.assignedAgent && (
                        <div className="flex items-center space-x-1.5 mb-3 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                          <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[8px] font-bold uppercase">{c.assignedAgent.name?.substring(0,2)}</div>
                          <span className="text-[10px] font-bold text-gray-600 truncate">{c.assignedAgent.name}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <span className="text-[10px] uppercase font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{c.source || 'Lead'}</span>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => navigate('/inbox')} className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:text-[var(--theme-text)] hover:bg-teal-50"><MessageSquare size={12}/></button>
                           <button onClick={() => navigate('/inbox')} className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:text-[var(--theme-text)] hover:bg-teal-50"><Phone size={12}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white p-7 rounded-3xl w-96 shadow-2xl animate-fade-in-up border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Add New Lead</h2>
              <form onSubmit={handleAddLead}>
                 <div className="space-y-4 mb-8">
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">Full Name</label>
                      <input type="text" value={newLeadName} onChange={e=>setNewLeadName(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--theme-border)] focus:ring-2 ring-brand-light/20 text-sm font-medium text-gray-800 transition-all" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">Phone Number</label>
                      <input type="tel" value={newLeadPhone} onChange={e=>setNewLeadPhone(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--theme-border)] focus:ring-2 ring-brand-light/20 text-sm font-medium text-gray-800 transition-all" placeholder="+91 9876543210" />
                    </div>
                 </div>
                 <div className="flex justify-end space-x-3">
                    <button type="button" onClick={()=>setShowAddModal(false)} className="px-5 py-2.5 font-bold text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 font-bold text-sm text-white bg-[var(--theme-bg)] hover:bg-teal-900 rounded-xl transition-transform hover:scale-105 active:scale-95 shadow-lg">Create Lead</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
