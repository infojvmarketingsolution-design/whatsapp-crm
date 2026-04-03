import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Search, Filter, Phone, MessageSquare, Plus, Flame, Snowflake, Zap, TrendingUp, DollarSign, Calendar, Clock, Edit3, X, Check } from 'lucide-react';

const STATUSES = [
  { id: 'NEW LEAD', label: 'New Lead', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Zap },
  { id: 'CONTACTED', label: 'Contacted', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: MessageSquare },
  { id: 'INTERESTED', label: 'Interested', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: TrendingUp },
  { id: 'FOLLOW_UP', label: 'Follow Up', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Calendar },
  { id: 'CLOSED_WON', label: 'Closed Won', color: 'bg-green-100 text-green-800 border-green-200', icon: Check },
  { id: 'CLOSED_LOST', label: 'Closed Lost', color: 'bg-red-100 text-red-800 border-red-200', icon: X },
];

export default function Pipeline() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [agents, setAgents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', phone: '', value: 0, urgency: '1-3 Months' });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [qualificationFilter, setQualificationFilter] = useState('ALL');
  const [editingValueId, setEditingValueId] = useState(null);
  const [tempValue, setTempValue] = useState('');

  const QUALIFICATIONS = [
    '10th Pass', '12th Pass', 'Diploma Completed', 'Graduation Completed', 'Master Completed'
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

  const handleUpdateLeadValue = async (contactId) => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      await fetch(`/api/chat/contacts/${contactId}/action`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           action: 'update_property', 
           payload: { estimatedValue: parseFloat(tempValue) || 0 } 
        })
      });
      setContacts(prev => prev.map(c => c._id === contactId ? { ...c, estimatedValue: parseFloat(tempValue) || 0 } : c));
      setEditingValueId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const contactId = e.dataTransfer.getData('contactId');
    if (!contactId) return;

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
        body: JSON.stringify({ 
           name: newLead.name, 
           phone: newLead.phone, 
           estimatedValue: newLead.value,
           purchaseTimeline: newLead.urgency,
           source: 'Pipeline Pro' 
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewLead({ name: '', phone: '', value: 0, urgency: '1-3 Months' });
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

  const getHeatIcon = (contact) => {
    const hoursSinceMessage = (new Date() - new Date(contact.lastMessageAt || contact.createdAt)) / (1000 * 60 * 60);
    if (contact.purchaseTimeline === 'Immediate') return <Flame className="text-orange-500 animate-pulse" size={14} />;
    if (hoursSinceMessage < 12) return <Flame className="text-yellow-500" size={14} />;
    if (hoursSinceMessage > 48) return <Snowflake className="text-blue-300" size={14} />;
    return <Zap className="text-gray-400" size={14} />;
  };

  const getRelativeTime = (date) => {
    if (!date) return 'No activity';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds/60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds/3600)}h ago`;
    return `${Math.floor(seconds/86400)}d ago`;
  };

  return (
    <div className="flex-1 bg-white rounded-3xl shadow-[0_4px_30px_rgb(0,0,0,0.06)] overflow-hidden border border-gray-50 flex flex-col relative z-10 w-[calc(100%-12px)] ml-3 my-3">
      <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-[#fdfdfd]">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center border border-teal-100 shadow-premium">
             <TrendingUp className="text-teal-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Sales Pipeline</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Scale your growth with intelligent lead tracking</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <div className="relative group">
            <Filter className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <select 
              value={qualificationFilter}
              onChange={(e) => setQualificationFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-6 text-[11px] font-black uppercase outline-none appearance-none cursor-pointer text-slate-600 hover:border-teal-500 transition-all shadow-sm"
            >
              <option value="ALL">All Qualifications</option>
              {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-premium hover:shadow-glow hover:-translate-y-0.5 transform active:scale-95">
            <Plus size={16} className="text-teal-400" />
            <span>Create Deal</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-6 bg-[#fcfcfd] scrollbar-hide">
        <div className="flex space-x-6 h-full min-w-max pb-4">
          {STATUSES.map(stage => {
            const columnContacts = contacts.filter(c => (c.status || 'NEW LEAD') === stage.id);
            const totalValue = columnContacts.reduce((sum, c) => sum + (c.estimatedValue || 0), 0);
            
            return (
              <div 
                key={stage.id} 
                className="w-80 flex flex-col bg-gray-50/50 rounded-3xl border border-gray-100/50"
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, stage.id)}
              >
                <div className={`px-4 py-4 rounded-t-3xl border-b border-gray-200/50 flex justify-between items-center bg-white ${stage.color} border-l-4 shadow-sm`}>
                   <div className="flex items-center space-x-2">
                     <stage.icon size={14} className="opacity-70" />
                     <h3 className="font-black text-[10px] uppercase tracking-[0.1em]">{stage.label}</h3>
                   </div>
                   <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-slate-800">₹{totalValue.toLocaleString()}</span>
                      <span className="text-[9px] font-bold opacity-60 uppercase">{columnContacts.length} Deals</span>
                   </div>
                </div>

                <div className="flex-1 p-3 overflow-y-auto scrollbar-hide space-y-4">
                  {columnContacts.map(c => (
                    <div 
                      key={c._id}
                      draggable
                      onDragStart={e => e.dataTransfer.setData('contactId', c._id)}
                      className="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft cursor-grab active:cursor-grabbing hover:shadow-premium transition-all group relative border-l-2 hover:border-l-slate-800"
                    >
                      {/* Heat Sensor */}
                      <div className="absolute -left-2 top-4 bg-white p-1 rounded-full shadow-sm border border-gray-100 flex items-center justify-center">
                         {getHeatIcon(c)}
                      </div>

                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0 pr-6">
                           <h4 className="font-black text-[13px] text-slate-800 truncate leading-none mb-1 capitalize group-hover:text-teal-600 transition-colors cursor-pointer" onClick={() => navigate('/inbox')}>
                              {c.name || 'Anonymous User'}
                           </h4>
                           <p className="text-[10px] font-medium text-slate-400 tracking-tight flex items-center">
                              <Phone size={10} className="mr-1 opacity-50"/> {c.phone}
                           </p>
                        </div>
                        
                        <div className="relative">
                          <button onClick={() => setActiveDropdown(activeDropdown === c._id ? null : c._id)} className="text-slate-300 hover:text-slate-800 p-1 rounded-lg transition-colors">
                            <MoreVertical size={16}/>
                          </button>
                          {activeDropdown === c._id && (
                             <div className="absolute right-0 top-8 w-56 bg-white border border-gray-100 shadow-2xl rounded-2xl py-2 z-50 animate-scale-in">
                               <button onClick={() => navigate('/inbox')} className="w-full text-left px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 flex items-center">
                                  <MessageSquare size={14} className="mr-3 text-teal-500" /> Open Chat
                               </button>
                               <div className="px-5 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">Deal Actions</div>
                               <button onClick={() => { setEditingValueId(c._id); setTempValue(c.estimatedValue || 0); setActiveDropdown(null); }} className="w-full text-left px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 flex items-center">
                                  <DollarSign size={14} className="mr-3 text-blue-500" /> Update Value
                               </button>
                               <button onClick={() => { handleAction(c._id, 'archive_lead'); }} className="w-full text-left px-5 py-3 text-[11px] font-black uppercase tracking-wider text-orange-600 hover:bg-orange-50 flex items-center border-t border-slate-50">
                                  <Snowflake size={14} className="mr-3" /> Archive Lead
                               </button>
                               <button onClick={() => { handleAction(c._id, 'hard_delete_lead'); }} className="w-full text-left px-5 py-3 text-[11px] font-black uppercase tracking-wider text-red-600 hover:bg-red-50 flex items-center border-t border-slate-50">
                                  <X size={14} className="mr-3" /> Permanent Delete
                               </button>
                             </div>
                          )}
                        </div>
                      </div>

                      {/* Dynamic Deal Value */}
                      <div className="mb-4 bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex items-center justify-between group/val">
                         <div className="flex items-center text-slate-500">
                            <DollarSign size={14} className="mr-1.5 opacity-50" />
                            {editingValueId === c._id ? (
                               <div className="flex items-center space-x-2">
                                  <input 
                                     type="number" 
                                     autoFocus
                                     value={tempValue}
                                     onChange={(e) => setTempValue(e.target.value)}
                                     onBlur={() => handleUpdateLeadValue(c._id)}
                                     className="w-20 bg-white border-2 border-teal-500 rounded px-1.5 py-0.5 text-xs font-black text-slate-900 outline-none"
                                  />
                               </div>
                            ) : (
                               <span className="text-xs font-black text-slate-900">₹{(c.estimatedValue || 0).toLocaleString()}</span>
                            )}
                         </div>
                         <button onClick={() => { setEditingValueId(c._id); setTempValue(c.estimatedValue || 0); }} className="p-1 hover:bg-white rounded transition-colors opacity-0 group-hover/val:opacity-100">
                            <Edit3 size={10} className="text-slate-400" />
                         </button>
                      </div>

                      {/* Intelligence Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                         {(c.purchaseTimeline || c.budget) && (
                            <div className="flex items-center space-x-1 px-2 py-1 bg-teal-50 text-teal-700 rounded-lg border border-teal-100 text-[9px] font-black uppercase">
                               <Clock size={10} />
                               <span>{c.purchaseTimeline || 'Urgent'}</span>
                            </div>
                         )}
                         {c.qualification && (
                            <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-[9px] font-black uppercase tracking-tighter">
                               <span>{c.qualification?.substring(0, 15)}</span>
                            </div>
                         )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div className="flex items-center text-slate-400">
                           <Clock size={10} className="mr-1 opacity-50" />
                           <span className="text-[9px] font-black uppercase tracking-tight">{getRelativeTime(c.lastMessageAt || c.updatedAt)}</span>
                        </div>
                        <div className="flex space-x-2">
                           <button onClick={() => navigate('/inbox')} className="w-7 h-7 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-all border border-transparent hover:border-teal-200">
                              <MessageSquare size={12}/>
                           </button>
                           <button onClick={() => navigate('/inbox')} className="w-7 h-7 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-200">
                              <Phone size={12}/>
                           </button>
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

      {/* Add Lead Modal - UPGRADED */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-[6px] animate-fade-in p-4" onClick={() => setShowAddModal(false)}>
           <div className="bg-white p-10 rounded-[40px] w-full max-w-lg shadow-2xl relative overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
              <div className="absolute right-8 top-8">
                 <button onClick={() => setShowAddModal(false)} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-all hover:rotate-90">
                    <X size={24} />
                 </button>
              </div>

              <div className="mb-10">
                 <div className="w-16 h-16 bg-teal-50 rounded-3xl flex items-center justify-center mb-6 shadow-premium border border-teal-100">
                    <TrendingUp className="text-teal-600" size={32} />
                 </div>
                 <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Initialize New Deal</h2>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Surface high-intent leads to your pipeline</p>
              </div>

              <form onSubmit={handleAddLead} className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                       <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Client Name</label>
                       <input type="text" value={newLead.name} onChange={e=>setNewLead({...newLead, name: e.target.value})} required className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 outline-none focus:border-teal-500 focus:bg-white text-sm font-black text-slate-800 transition-all" placeholder="Enter full name..." />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                       <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">WhatsApp Number</label>
                       <input type="tel" value={newLead.phone} onChange={e=>setNewLead({...newLead, phone: e.target.value})} required className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 outline-none focus:border-teal-500 focus:bg-white text-sm font-black text-slate-800 transition-all" placeholder="+91..." />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                       <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Deal Value (₹)</label>
                       <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input type="number" value={newLead.value} onChange={e=>setNewLead({...newLead, value: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl pl-10 pr-5 py-4 outline-none focus:border-teal-500 focus:bg-white text-sm font-black text-slate-800 transition-all" placeholder="0" />
                       </div>
                    </div>
                    <div className="col-span-2">
                       <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Purchase Urgency</label>
                       <select value={newLead.urgency} onChange={e=>setNewLead({...newLead, urgency: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-4 outline-none focus:border-teal-500 focus:bg-white text-sm font-black text-slate-800 transition-all appearance-none cursor-pointer">
                          <option value="Immediate">🔥 Immediate (Highly Urgent)</option>
                          <option value="1-3 Months">⚡ 1-3 Months (Interested)</option>
                          <option value="Just Exploring">🧊 Just Exploring (Cold)</option>
                       </select>
                    </div>
                 </div>
                 
                 <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[20px] text-xs font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-premium hover:shadow-glow hover:-translate-y-1 transform active:scale-95">
                    Launch Deal to Pipeline
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
