import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, X, Mail, MapPin, Phone, Users, 
  Clock, Activity, Target, Tag, Save, Filter, 
  Briefcase, Building2, Download, MoreVertical, 
  Flame, Sun, Snowflake, ArrowUpRight, Send, ShieldCheck, History, Calendar, CheckCircle2
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

  const addInterest = () => {
     if (!interestInput.trim()) return;
     const currentInterests = editedContact.interests || [];
     if (!currentInterests.includes(interestInput.trim())) {
        handleFieldChange('interests', [...currentInterests, interestInput.trim()]);
     }
     setInterestInput('');
  };

  const removeInterest = (tag) => {
     handleFieldChange('interests', (editedContact.interests || []).filter(t => t !== tag));
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
                        <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">Engagement</th>
                        <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">Persona</th>
                        <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-gray-400">Lifecycle</th>
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
                             <div className="flex items-center space-x-2">
                                <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-[var(--theme-bg)] transition-all" style={{ width: `${c.score || 0}%` }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">{c.score || 0}%</span>
                             </div>
                          </td>
                          <td className="py-4 px-6">
                             <div className={`inline-flex items-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                c.heatLevel === 'Hot' ? 'bg-rose-50 text-rose-500' : 
                                c.heatLevel === 'Warm' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                             }`}>
                                {c.heatLevel === 'Hot' ? <Flame size={10} className="mr-1" /> : 
                                 c.heatLevel === 'Warm' ? <Sun size={10} className="mr-1" /> : <Snowflake size={10} className="mr-1" />}
                                {c.heatLevel || 'Cold'}
                             </div>
                          </td>
                          <td className="py-4 px-6">
                             <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase">{c.status?.replace('_', ' ')}</span>
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
             className="w-[850px] h-full bg-white shadow-2xl flex flex-col animate-slide-up relative"
             onClick={(e) => e.stopPropagation()}
           >
              {/* STICKY HEADER WITH ALWAYS VISIBLE SAVE */}
              <div className="bg-[var(--theme-bg)] p-6 text-white relative shadow-lg shrink-0 flex items-center justify-between z-10">
                  <div className="flex items-center space-x-5 flex-1">
                      <div className="w-14 h-14 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-xl border border-white/20">
                         {editedContact.firstName ? editedContact.firstName.charAt(0) : (selectedContact.name?.charAt(0) || 'U')}
                      </div>
                      <div className="flex-1">
                          <h2 className="text-xl font-bold truncate">
                             {editedContact.firstName && editedContact.lastName ? `${editedContact.firstName} ${editedContact.lastName}` : (editedContact.name || 'Profile Detail')}
                          </h2>
                          <div className="flex items-center space-x-3 opacity-70">
                             <span className="flex items-center text-[10px] font-bold"><Phone size={10} className="mr-1" /> {editedContact.phone}</span>
                             <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                             <span className="text-[10px] font-bold uppercase tracking-wider">{editedContact.status?.replace('_', ' ')}</span>
                          </div>
                      </div>
                  </div>

                  <div className="flex items-center space-x-4">
                      {/* FIX: Relocated and Sticky Save Button */}
                      <button 
                        onClick={() => updateContactDetail(selectedContact._id, editedContact)}
                        disabled={!showSaveFab || isUpdatingContact}
                        className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                          showSaveFab 
                          ? 'bg-white text-[var(--theme-text)] shadow-glow hover:scale-105 active:scale-95' 
                          : 'bg-white/10 text-white/40 cursor-not-allowed grayscale'
                        }`}
                      >
                         {isUpdatingContact ? <Clock size={16} className="animate-spin" /> : <Save size={16} />}
                         <span>Save Changes</span>
                      </button>
                      <button onClick={() => setShowProfile(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-md text-white transition"><X size={18} /></button>
                  </div>
              </div>

              {/* Main Workspace Split */}
              <div className="flex-1 flex overflow-hidden bg-crm-bg">
                 <div className="w-[320px] bg-white border-r border-gray-100 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    <section className="space-y-4">
                       <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lead Identity</h3>
                          <ShieldCheck size={14} className="text-green-500 opacity-50" />
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-1 p-3 bg-gray-50/50 rounded-lg border border-gray-100 focus-within:border-[var(--theme-border)] transition-colors">
                             <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">First Name</label>
                             <input value={editedContact.firstName || ''} onChange={e=>handleFieldChange('firstName', e.target.value)} placeholder="First..." className="w-full text-xs font-semibold text-gray-700 outline-none bg-transparent" />
                          </div>
                          <div className="col-span-1 p-3 bg-gray-50/50 rounded-lg border border-gray-100 focus-within:border-[var(--theme-border)] transition-colors">
                             <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Last Name</label>
                             <input value={editedContact.lastName || ''} onChange={e=>handleFieldChange('lastName', e.target.value)} placeholder="Last..." className="w-full text-xs font-semibold text-gray-700 outline-none bg-transparent" />
                          </div>
                       </div>
                       <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 focus-within:border-[var(--theme-border)] transition-colors">
                          <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Main Mobile (Read-Only)</label>
                          <div className="flex items-center space-x-2">
                             <Phone size={12} className="text-gray-400" />
                             <span className="text-xs font-bold text-gray-500">{editedContact.phone}</span>
                          </div>
                       </div>
                       <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 focus-within:border-[var(--theme-border)] transition-colors">
                          <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">Secondary Mobile</label>
                          <div className="flex items-center space-x-2">
                             <Smartphone size={12} className="text-gray-400" />
                             <input value={editedContact.secondaryPhone || ''} onChange={e=>handleFieldChange('secondaryPhone', e.target.value)} placeholder="Alt mobile..." className="w-full text-xs font-semibold text-gray-700 outline-none bg-transparent" />
                          </div>
                       </div>
                    </section>

                    <section className="space-y-4">
                       <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Discovery Intel</h3>
                       <div className="space-y-3">
                          {[
                            { label: 'Official Email', icon: Mail, field: 'email', placeholder: 'Enter email...' },
                            { label: 'Lead Address', icon: MapPin, field: 'address', placeholder: 'Address...' },
                            { label: 'Role/Profession', icon: Briefcase, field: 'profession', placeholder: 'Designation...' },
                            { label: 'Organization', icon: Building2, field: 'companyName', placeholder: 'Company...' },
                          ].map((item, idx) => (
                             <div key={idx} className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 focus-within:border-[var(--theme-border)] transition-colors">
                                <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">{item.label}</label>
                                <div className="flex items-center space-x-2">
                                   <item.icon size={13} className="text-gray-300" />
                                   <input value={editedContact[item.field] || ''} onChange={e=>handleFieldChange(item.field, e.target.value)} placeholder={item.placeholder} className="w-full text-xs font-semibold text-gray-700 outline-none bg-transparent" />
                                </div>
                             </div>
                          ))}
                       </div>
                    </section>

                    <section className="space-y-4 pt-4 border-t border-gray-100">
                       <div className="p-4 bg-[var(--theme-bg)]/5 rounded-xl border border-[var(--theme-border)]/10">
                          <h3 className="text-[9px] font-bold text-[var(--theme-text)] uppercase tracking-wider mb-2">Lead Intent Status</h3>
                          <select 
                            value={editedContact.status} 
                            onChange={(e) => handleFieldChange('status', e.target.value)}
                            className="w-full bg-white border border-gray-200 text-xs font-bold py-2 px-3 rounded-lg outline-none cursor-pointer"
                          >
                             {['NEW LEAD', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'].map(s => (
                                <option key={s} value={s}>{s.replace('_', ' ')}</option>
                             ))}
                          </select>
                       </div>
                    </section>
                 </div>

                 <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 flex space-x-8 border-b border-gray-200 bg-white shrink-0">
                       {['Timeline', 'Inbox', 'Internal'].map(tab => (
                          <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} className={`py-4 text-[10px] font-bold uppercase tracking-widest relative transition-all ${activeTab === tab.toLowerCase() ? 'text-[var(--theme-text)]' : 'text-gray-400 hover:text-gray-600'}`}>
                             {tab} Mode
                             {activeTab === tab.toLowerCase() && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--theme-bg)] rounded-t-full shadow-glow"></div>}
                          </button>
                       ))}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                       {activeTab === 'timeline' && (
                          <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                              {(selectedContact.timeline || []).slice().reverse().map((event, idx) => (
                                 <div key={idx} className="relative pl-8">
                                    <div className="absolute left-0 top-1 w-6 h-6 rounded-lg bg-white border border-gray-100 flex items-center justify-center z-10"><Activity size={10} className="text-[var(--theme-text)]" /></div>
                                    <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-soft">
                                       <p className="text-xs font-semibold text-gray-700 leading-relaxed">{event.description}</p>
                                       <p className="text-[9px] font-bold text-gray-300 uppercase mt-1 flex items-center"><Clock size={10} className="mr-1.5" /> {formatDateTime(event.timestamp)}</p>
                                    </div>
                                 </div>
                              ))}
                          </div>
                       )}

                       {activeTab === 'inbox' && (
                          <div className="space-y-3">
                             {recentMessages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                                   <div className={`p-3 rounded-xl text-xs font-medium leading-relaxed max-w-[85%] ${msg.direction === 'OUTBOUND' ? 'bg-gray-800 text-white rounded-tr-none shadow-premium' : 'bg-white text-gray-600 rounded-tl-none shadow-soft border border-gray-100'}`}>{msg.content}</div>
                                </div>
                             ))}
                             <div className="pt-4 text-center">
                                <button onClick={()=>{ localStorage.setItem('activeChatId', selectedContact._id); navigate('/inbox'); }} className="text-[9px] font-bold text-[var(--theme-text)] uppercase tracking-widest hover:underline">View Deep Analytics &rarr;</button>
                             </div>
                          </div>
                       )}

                       {activeTab === 'internal' && (
                          <div className="space-y-4">
                             <div className="relative">
                                <textarea value={noteInput} onChange={e=>setNoteInput(e.target.value)} placeholder="Type private team note..." className="w-full bg-white border border-gray-200 rounded-xl p-4 text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-[var(--theme-border)]/20 transition-all shadow-soft" rows={3} />
                                <button onClick={()=>addInternalNote(selectedContact._id)} disabled={isAddingNote || !noteInput.trim()} className="absolute bottom-4 right-4 p-2 bg-[var(--theme-bg)] text-white rounded-lg shadow-glow hover:-translate-y-0.5 transition-all">
                                   {isAddingNote ? <Clock size={14} className="animate-spin" /> : <Send size={14} />}
                                </button>
                             </div>
                             {(selectedContact.notes || []).slice().reverse().map((note, idx) => (
                                <div key={idx} className="p-4 bg-white border border-gray-100 rounded-xl shadow-soft">
                                   <p className="text-xs font-medium text-gray-600 italic">"{note.content}"</p>
                                   <div className="flex items-center justify-between mt-3 opacity-50">
                                      <span className="text-[9px] font-bold uppercase tracking-tighter">{note.createdBy}</span>
                                      <span className="text-[9px] font-bold">{formatDateTime(note.createdAt)}</span>
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}

                       {/* SYSTEM INTELLIGENCE SECTION (NON-EDITABLE) */}
                       <div className="mt-12 pt-8 border-t border-gray-200 grid grid-cols-2 gap-4">
                           <div className="p-4 bg-gray-100/50 rounded-xl border border-gray-100">
                               <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center"><Calendar size={10} className="mr-1.5" /> Initial Record Date</p>
                               <p className="text-xs font-bold text-gray-700">{formatDateTime(selectedContact.createdAt)}</p>
                           </div>
                           <div className="p-4 bg-gray-100/50 rounded-xl border border-gray-100">
                               <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center"><Target size={10} className="mr-1.5" /> Lead Consider Date</p>
                               <p className="text-xs font-bold text-gray-700">{formatDateTime(selectedContact.leadConsiderDate)}</p>
                           </div>
                           <div className="p-4 bg-gray-100/50 rounded-xl border border-gray-100">
                               <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center"><CheckCircle2 size={10} className="mr-1.5" /> Status Updated</p>
                               <p className="text-xs font-bold text-gray-700">{formatDateTime(selectedContact.statusUpdatedAt || selectedContact.updatedAt)}</p>
                           </div>
                           <div className="p-4 bg-crm-bg rounded-xl border border-gray-100">
                               <p className="text-[8px] font-bold text-[var(--theme-text)] opacity-50 uppercase tracking-widest mb-2 flex items-center"><History size={10} className="mr-1.5" /> Last Modification</p>
                               <p className="text-xs font-bold text-[var(--theme-text)]">{formatDateTime(selectedContact.updatedAt)}</p>
                           </div>
                       </div>
                    </div>
                    <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between text-[9px] font-bold text-gray-300 uppercase tracking-widest shrink-0">
                       <div className="flex items-center"><ShieldCheck size={11} className="mr-2 text-green-500 opacity-40" /> Record Verified & Encrypted</div>
                       <div>v1.2.5 - Stable</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-[1px] animate-fade-in" onClick={() => setShowAddModal(false)}>
           <div className="bg-white p-8 rounded-2xl w-[400px] shadow-2xl animate-pop-in border border-gray-100" onClick={e=>e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-800 mb-6">New Lead Entry</h2>
              <form onSubmit={handleAddContact} className="space-y-5">
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-1.5 block uppercase tracking-wide">Display Identity</label>
                    <input autoFocus type="text" value={newLeadName} onChange={e=>setNewLeadName(e.target.value)} required className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 outline-none focus:border-[var(--theme-border)] text-sm font-semibold text-gray-700" placeholder="e.g. John Doe" />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-1.5 block uppercase tracking-wide">WhatsApp Phone</label>
                    <input type="tel" value={newLeadPhone} onChange={e=>setNewLeadPhone(e.target.value)} required className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 outline-none focus:border-[var(--theme-border)] text-sm font-semibold text-gray-700" placeholder="+91 98XXX XXXXX" />
                 </div>
                 <div className="flex pt-4 space-x-3">
                    <button type="button" onClick={()=>setShowAddModal(false)} className="flex-1 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:bg-gray-50 rounded-lg transition">Discard</button>
                    <button type="submit" className="flex-1 py-3 text-[10px] font-bold text-white bg-[var(--theme-bg)] rounded-lg shadow-glow transition active:scale-95 uppercase tracking-widest">Create Lead</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

// Helper icons needed but might be missing from previous imports
function Smartphone({ size, className }) {
   return (
     <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
       <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
       <path d="M12 18h.01"/>
     </svg>
   );
}
