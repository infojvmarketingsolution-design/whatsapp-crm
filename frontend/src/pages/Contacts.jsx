import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, X, Mail, MapPin, Phone, Users, 
  Clock, Activity, Target, Tag, Save, Filter, 
  Briefcase, Building2, Download, MoreVertical, 
  Flame, Sun, Snowflake, ArrowUpRight, Send, ShieldCheck, History, Calendar, CheckCircle2, TrendingUp, Globe, Smartphone, Bell
} from 'lucide-react';

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  
  // Profile Detail States
  const [selectedContact, setSelectedContact] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [recentMessages, setRecentMessages] = useState([]);
  const [isRefreshingMessages, setIsRefreshingMessages] = useState(false);
  const [isUpdatingContact, setIsUpdatingContact] = useState(false);

  // Design states
  const [activeTab, setActiveTab] = useState('timeline');
  const [noteInput, setNoteInput] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Form State
  const [editedContact, setEditedContact] = useState(null);
  const [showSaveFab, setShowSaveFab] = useState(false);
  const [interestInput, setInterestInput] = useState('');

  const PIPELINE_STAGES = ['Discovery', 'Qualified', 'Proposal', 'Negotiation', 'Closing'];

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      if (!token) return;
      const res = await fetch('/api/chat/contacts', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
         const data = await res.json();
         setContacts(data);
         if (selectedContact) {
            const updated = data.find(c => c._id === selectedContact._id);
            if (updated) {
               setSelectedContact(updated);
               setEditedContact(updated);
            }
         }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchRecentMessages = async (contactId) => {
    if (!contactId) return;
    setIsRefreshingMessages(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/chat/messages/${contactId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        setRecentMessages(data.slice(-5));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshingMessages(false);
    }
  };

  const updateContactDetail = async (contactId, updates) => {
    setIsUpdatingContact(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/chat/action`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, action: 'update_contact', payload: updates })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedContact(data.contact);
        setEditedContact(data.contact);
        setShowSaveFab(false);
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingContact(false);
    }
  };

  const addInternalNote = async (contactId) => {
    if (!noteInput.trim()) return;
    setIsAddingNote(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/chat/action`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, action: 'add_note', payload: { note: noteInput } })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedContact(data.contact);
        setNoteInput('');
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/chat/contacts', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLeadName, phone: newLeadPhone, source: 'Manual Entry' })
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

  const filteredContacts = contacts.filter(c => 
    !c.isArchived && (
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.phone || '').includes(searchTerm)
    )
  );

  const handleRowClick = (contact) => {
     setSelectedContact(contact);
     setEditedContact(contact);
     setShowProfile(true);
     fetchRecentMessages(contact._id);
     setShowSaveFab(false);
     setActiveTab('timeline');
  };

  const handleFieldChange = (field, value) => {
     setEditedContact(prev => ({ ...prev, [field]: value }));
     setShowSaveFab(true);
  };

  const formatDateTime = (dateStr) => {
     if (!dateStr) return 'N/A';
     const d = new Date(dateStr);
     return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-crm-bg min-h-screen flex flex-col animate-fade-in font-sans">
      <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-40 flex items-center justify-between shadow-sm">
         <div>
            <h1 className="text-sm font-bold text-gray-500 tracking-wider uppercase flex items-center">
               <Users className="mr-2 text-[var(--theme-text)]" size={16} /> Contacts DB
            </h1>
         </div>
         <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 text-xs">
               <div className="text-right">
                  <p className="text-gray-400 font-bold uppercase tracking-tighter text-[9px]">Total Records</p>
                  <p className="font-bold text-gray-700">{contacts.length}</p>
               </div>
               <div className="w-[1px] h-6 bg-gray-100 mx-2"></div>
               <div>
                  <p className="text-[var(--theme-text)] font-bold uppercase tracking-tighter text-[9px]">High Intent</p>
                  <p className="font-bold text-gray-700">{contacts.filter(c => c.score > 70).length}</p>
               </div>
            </div>
            <button 
              onClick={() => setShowAddModal(true)} 
              className="px-5 py-2 bg-[var(--theme-bg)] text-white text-xs font-bold rounded-lg hover:shadow-glow transition transform hover:-translate-y-0.5 active:scale-95"
            >
               <span>+ Add Contact</span>
            </button>
         </div>
      </div>

      <div className="p-8 flex-1 flex flex-col max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Workspace Contacts</h2>
              <div className="flex items-center space-x-3">
                 <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-300" size={16} />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search identity or mobile..." 
                      className="bg-white border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-sm font-medium text-gray-700 placeholder-gray-300 focus:ring-2 focus:ring-[var(--theme-border)]/20 outline-none transition-all w-[300px]"
                    />
                 </div>
                 <button className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-[var(--theme-text)] hover:border-[var(--theme-border)]/50 transition"><Filter size={16} /></button>
              </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-premium overflow-hidden">
             <div className="overflow-x-auto h-full custom-scrollbar">
                <table className="w-full text-left border-collapse">
                   <thead className="bg-gray-50/50 border-b border-gray-100">
                     <tr>
                        <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">Context</th>
                        <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">Pipeline</th>
                        <th className="py-4 px-8 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {filteredContacts.map((c, i) => (
                       <tr key={c._id || i} onClick={() => handleRowClick(c)} className="cursor-pointer group hover:bg-[var(--theme-bg)]/5 transition-colors">
                          <td className="py-4 px-6">
                             <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-400 group-hover:bg-[var(--theme-bg)] group-hover:text-white transition-colors">
                                   {c.firstName ? c.firstName.charAt(0) : (c.name?.charAt(0) || 'U')}
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-gray-800 leading-none mb-1">
                                      {c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : (c.name || 'Unknown')}
                                   </p>
                                   <p className="text-[10px] font-semibold text-gray-400">{c.phone}</p>
                                </div>
                             </div>
                          </td>
                          <td className="py-4 px-6">
                             <div className="flex items-center space-x-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                   c.pipelineStage === 'Closing' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                }`}>{c.pipelineStage || 'Discovery'}</span>
                                <div className="flex items-center space-x-1 opacity-30">
                                   {[1,2,3,4,5].map(step => (
                                      <div key={step} className={`w-1 h-1 rounded-full ${step <= (PIPELINE_STAGES.indexOf(c.pipelineStage) + 1) ? 'bg-[var(--theme-bg)] opacity-100' : 'bg-gray-300'}`}></div>
                                   ))}
                                </div>
                             </div>
                          </td>
                          <td className="py-4 px-8 text-right">
                             <button className="p-2 text-gray-300 hover:text-gray-800 transition-colors"><MoreVertical size={16} /></button>
                          </td>
                       </tr>
                     ))}
                   </tbody>
                </table>
             </div>
          </div>
      </div>

      {showProfile && selectedContact && editedContact && (
        <div className="fixed inset-0 z-[150] flex justify-end bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={() => setShowProfile(false)}>
           <div 
             className="w-[900px] h-full bg-white shadow-2xl flex flex-col animate-slide-up relative"
             onClick={(e) => e.stopPropagation()}
           >
              {/* ADVANCED PROFILE HEADER */}
              <div className="bg-slate-900 p-6 text-white relative shadow-lg shrink-0 flex items-center justify-between z-10">
                  <div className="flex items-center space-x-5 flex-1">
                      <div className="relative">
                         <div className="w-16 h-16 rounded-2xl bg-white/5 text-white flex items-center justify-center font-bold text-2xl border border-white/10 overflow-hidden">
                            {editedContact.firstName ? editedContact.firstName.charAt(0) : (selectedContact.name?.charAt(0) || 'U')}
                         </div>
                         <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-slate-900 rounded-full flex items-center justify-center text-[10px] font-black">98%</div>
                      </div>
                      <div className="flex-1">
                          <h2 className="text-2xl font-bold tracking-tight">
                             {editedContact.firstName && editedContact.lastName ? `${editedContact.firstName} ${editedContact.lastName}` : (editedContact.name || 'Profile Identity')}
                          </h2>
                          <div className="flex items-center space-x-4 mt-1 opacity-60">
                             <span className="flex items-center text-[10px] font-bold uppercase tracking-widest"><Phone size={10} className="mr-1.5" /> {editedContact.phone}</span>
                             <span className="w-1.5 h-1.5 bg-white/20 rounded-full"></span>
                             <span className="text-[10px] font-bold uppercase tracking-widest flex items-center"><Target size={10} className="mr-1.5" /> Lead Score: {editedContact.score || 0}</span>
                          </div>
                      </div>
                  </div>

                  <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => updateContactDetail(selectedContact._id, editedContact)}
                        disabled={!showSaveFab || isUpdatingContact}
                        className={`flex items-center space-x-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl ${
                          showSaveFab 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95' 
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                         {isUpdatingContact ? <Clock size={16} className="animate-spin" /> : <Save size={16} />}
                         <span>Finalize Record</span>
                      </button>
                      <button onClick={() => setShowProfile(false)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition"><X size={20} /></button>
                  </div>
              </div>

              {/* ADVANCED PIPELINE STEPPER */}
              <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-white/5 shrink-0">
                  <div className="flex items-center flex-1 pr-10">
                      {PIPELINE_STAGES.map((stage, idx) => (
                         <React.Fragment key={stage}>
                            <button 
                              onClick={() => handleFieldChange('pipelineStage', stage)}
                              className={`flex flex-col items-center group relative ${idx < PIPELINE_STAGES.length - 1 ? 'flex-1' : ''}`}
                            >
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all border-2 ${
                                  editedContact.pipelineStage === stage 
                                  ? 'bg-blue-600 border-blue-400 text-white scale-110 shadow-glow' 
                                  : PIPELINE_STAGES.indexOf(editedContact.pipelineStage) >= idx 
                                    ? 'bg-green-500/20 border-green-500 text-green-500' 
                                    : 'bg-slate-700 border-slate-600 text-slate-500 hover:border-slate-400'
                               }`}>
                                  {PIPELINE_STAGES.indexOf(editedContact.pipelineStage) > idx ? <CheckCircle2 size={14} /> : idx + 1}
                               </div>
                               <span className={`mt-2 text-[9px] font-black uppercase tracking-widest transition-opacity ${editedContact.pipelineStage === stage ? 'opacity-100 text-blue-400' : 'opacity-40 group-hover:opacity-100'}`}>{stage}</span>
                            </button>
                            {idx < PIPELINE_STAGES.length - 1 && <div className={`flex-1 h-[2px] mb-6 transition-colors ${PIPELINE_STAGES.indexOf(editedContact.pipelineStage) > idx ? 'bg-green-500/30' : 'bg-slate-700'}`}></div>}
                         </React.Fragment>
                      ))}
                  </div>
              </div>

              <div className="flex-1 flex overflow-hidden bg-[#fafafa]">
                 <div className="w-[340px] bg-white border-r border-slate-100 overflow-y-auto custom-scrollbar p-6 space-y-8 shadow-sm">
                    {/* LEADS CORE INTEL */}
                    <section className="space-y-4">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                          <span>Lead Intelligence</span>
                          <TrendingUp size={12} className="text-blue-500" />
                       </h3>
                       <div className="grid grid-cols-1 gap-4">
                          <div className="p-4 bg-slate-900 rounded-2xl shadow-xl border border-white/5">
                             <label className="text-[9px] font-black text-white/40 uppercase block mb-2 tracking-widest">Est. Deal Value</label>
                             <div className="flex items-center space-x-3">
                                <span className="text-xl font-black text-blue-400">₹</span>
                                <input 
                                  type="number" 
                                  value={editedContact.estimatedValue || 0} 
                                  onChange={e=>handleFieldChange('estimatedValue', e.target.value)} 
                                  className="bg-transparent border-none text-2xl font-black text-white outline-none w-full" 
                                />
                             </div>
                          </div>
                       </div>
                       
                       <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-blue-400 focus-within:bg-white transition-all">
                          <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Acquisition Source</label>
                          <div className="flex items-center space-x-2">
                             <Globe size={13} className="text-slate-300" />
                             <select value={editedContact.leadSource || 'Manual Entry'} onChange={e=>handleFieldChange('leadSource', e.target.value)} className="w-full text-xs font-bold text-slate-700 bg-transparent outline-none">
                                {['Manual Entry', 'Meta Ads', 'Google Search', 'Referral', 'LinkedIn', 'Website Form'].map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-blue-400 focus-within:bg-white transition-all">
                             <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">First Name</label>
                             <input value={editedContact.firstName || ''} onChange={e=>handleFieldChange('firstName', e.target.value)} className="w-full text-xs font-bold text-slate-700 outline-none bg-transparent" />
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-blue-400 focus-within:bg-white transition-all">
                             <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Last Name</label>
                             <input value={editedContact.lastName || ''} onChange={e=>handleFieldChange('lastName', e.target.value)} className="w-full text-xs font-bold text-slate-700 outline-none bg-transparent" />
                          </div>
                       </div>

                       <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-blue-400 transition-all">
                          <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Alternative Contact</label>
                          <div className="flex items-center space-x-2">
                             <Smartphone size={13} className="text-slate-300" />
                             <input value={editedContact.secondaryPhone || ''} onChange={e=>handleFieldChange('secondaryPhone', e.target.value)} placeholder="Second phone..." className="w-full text-xs font-bold text-slate-700 outline-none bg-transparent" />
                          </div>
                       </div>
                    </section>

                    <section className="space-y-4">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discovery Records</h3>
                       <div className="space-y-3">
                          {[
                            { label: 'Official Email', icon: Mail, field: 'email', placeholder: 'Lead email...' },
                            { label: 'Postal Address', icon: MapPin, field: 'address', placeholder: 'Full address...' },
                            { label: 'Job Profile', icon: Briefcase, field: 'profession', placeholder: 'Title...' },
                            { label: 'Organization', icon: Building2, field: 'companyName', placeholder: 'Company...' },
                          ].map((item, idx) => (
                             <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-blue-400 focus-within:bg-white transition-all">
                                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">{item.label}</label>
                                <div className="flex items-center space-x-2">
                                   <item.icon size={13} className="text-slate-300" />
                                   <input value={editedContact[item.field] || ''} onChange={e=>handleFieldChange(item.field, e.target.value)} placeholder={item.placeholder} className="w-full text-xs font-bold text-slate-700 outline-none bg-transparent" />
                                </div>
                             </div>
                          ))}
                       </div>
                    </section>
                 </div>

                 <div className="flex-1 flex flex-col overflow-hidden relative">
                    <div className="px-6 flex space-x-8 border-b border-slate-100 bg-white shadow-sm z-10 shrink-0">
                       {['Timeline', 'Chat Log', 'Internal'].map(tab => (
                          <button key={tab} onClick={() => setActiveTab(tab.toLowerCase().replace(' ', ''))} className={`py-5 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all ${activeTab === tab.toLowerCase().replace(' ', '') ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                             {tab}
                             {activeTab === tab.toLowerCase().replace(' ', '') && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-glow"></div>}
                          </button>
                       ))}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#f8fafc] p-6 space-y-6">
                       {/* NEXT FOLLOW UP WIDGET */}
                       <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between mb-8">
                           <div className="flex items-center space-x-4">
                               <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Bell size={18} /></div>
                               <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Next Follow-up Task</p>
                                  <p className="text-xs font-bold text-slate-700">{editedContact.nextFollowUp ? formatDateTime(editedContact.nextFollowUp) : 'No task scheduled'}</p>
                               </div>
                           </div>
                           <input 
                             type="datetime-local" 
                             onChange={(e) => handleFieldChange('nextFollowUp', e.target.value)}
                             className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg outline-none cursor-pointer" 
                           />
                       </div>

                       {activeTab === 'timeline' && (
                          <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                              {(selectedContact.timeline || []).slice().reverse().map((event, idx) => (
                                 <div key={idx} className="relative pl-8 animate-slide-in" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <div className="absolute left-0 top-1 w-6 h-6 rounded-lg bg-white border-2 border-slate-100 flex items-center justify-center z-10 shadow-sm"><Activity size={10} className="text-blue-600" /></div>
                                    <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                       <p className="text-[12px] font-bold text-slate-700 leading-relaxed">{event.description}</p>
                                       <p className="text-[9px] font-black text-slate-300 uppercase mt-2 flex items-center tracking-widest"><Clock size={10} className="mr-1.5" /> {formatDateTime(event.timestamp)}</p>
                                    </div>
                                 </div>
                              ))}
                          </div>
                       )}

                       {activeTab === 'chatlog' && (
                          <div className="space-y-4">
                             {recentMessages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                                   <div className={`p-4 rounded-2xl text-[12px] font-semibold leading-relaxed max-w-[80%] shadow-sm ${msg.direction === 'OUTBOUND' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-600 rounded-tl-none border border-slate-100'}`}>{msg.content}</div>
                                </div>
                             ))}
                          </div>
                       )}

                       {activeTab === 'internal' && (
                          <div className="space-y-4">
                             <div className="group relative">
                                <textarea value={noteInput} onChange={e=>setNoteInput(e.target.value)} placeholder="Type a strategic team note..." className="w-full bg-white border border-slate-100 rounded-2xl p-5 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" rows={4} />
                                <button onClick={()=>addInternalNote(selectedContact._id)} disabled={isAddingNote || !noteInput.trim()} className="absolute bottom-4 right-4 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl hover:-translate-y-1 transition-all">
                                   {isAddingNote ? <Clock size={14} className="animate-spin" /> : 'Log Note'}
                                </button>
                             </div>
                             {(selectedContact.notes || []).slice().reverse().map((note, idx) => (
                                <div key={idx} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm border-l-4 border-l-blue-500">
                                   <p className="text-[12px] font-semibold text-slate-700 italic leading-relaxed">"{note.content}"</p>
                                   <div className="flex items-center justify-between mt-4 opacity-40">
                                      <span className="text-[9px] font-black uppercase tracking-widest">{note.createdBy}</span>
                                      <span className="text-[9px] font-black">{formatDateTime(note.createdAt)}</span>
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}

                       {/* ADVANCED RECAP FOOTER */}
                       <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 gap-4 pb-10">
                           <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                               <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-black text-xs">NEW</div>
                               <div>
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Creation Date</p>
                                  <p className="text-xs font-bold text-slate-700">{formatDateTime(selectedContact.createdAt)}</p>
                               </div>
                           </div>
                           <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                               <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">MOD</div>
                               <div>
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Modified</p>
                                  <p className="text-xs font-bold text-slate-700">{formatDateTime(selectedContact.updatedAt)}</p>
                               </div>
                           </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-[2px] animate-fade-in" onClick={() => setShowAddModal(false)}>
           <div className="bg-white p-10 rounded-[2rem] w-[450px] shadow-2xl animate-pop-in relative border border-slate-100" onClick={e=>e.stopPropagation()}>
              <button 
                 onClick={() => setShowAddModal(false)}
                 className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-colors"
              ><X size={24} /></button>
              
              <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-glow mb-6"><Plus size={28} /></div>
              <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Onboard New Lead</h2>
              <p className="text-sm font-bold text-slate-400 mb-8 lowercase tracking-wide">Enter the core details to initiate sales pipeline tracking.</p>

              <form onSubmit={handleAddContact} className="space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Identity Profile</label>
                    <input autoFocus type="text" value={newLeadName} onChange={e=>setNewLeadName(e.target.value)} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600/50 text-sm font-bold text-slate-800 transition-all" placeholder="Full name or Designation" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Communication Channel</label>
                    <input type="tel" value={newLeadPhone} onChange={e=>setNewLeadPhone(e.target.value)} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600/50 text-sm font-bold text-slate-800 transition-all" placeholder="+91 XXXX XXXX XXX" />
                 </div>
                 <button type="submit" className="w-full py-5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-premium hover:-translate-y-1 active:scale-95 transition-all">Submit Lead Details</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
