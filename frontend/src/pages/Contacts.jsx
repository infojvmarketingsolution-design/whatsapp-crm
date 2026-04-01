import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, X, Mail, MapPin, Phone, User, 
  Clock, Activity, Target, Tag, Save, Filter, 
  Briefcase, Building2, Download, MoreVertical, 
  Flame, Sun, Snowflake, ArrowUpRight, Send, ShieldCheck, History
} from 'lucide-react';

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  
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

  return (
    <div className="bg-crm-bg min-h-screen flex flex-col animate-fade-in font-sans">
      {/* Synchronization with Global Theme */}
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
          {/* Dashboard-Style Header */}
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
                 <button className="flex items-center space-x-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 transition"><Download size={14} /><span>Export</span></button>
              </div>
          </div>

          {/* Clean Table Sync */}
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
                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-400 group-hover:bg-[var(--theme-bg)] group-hover:text-white transition-colors">{c.name?.charAt(0) || 'U'}</div>
                                <div>
                                   <p className="text-sm font-bold text-gray-800 leading-none mb-1">{c.name}</p>
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

      {/* Redesigned Thematic Profile Slideover */}
      {showProfile && selectedContact && editedContact && (
        <div className="fixed inset-0 z-[150] flex justify-end bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={() => setShowProfile(false)}>
           <div 
             className="w-[700px] h-full bg-white shadow-2xl flex flex-col animate-slide-up relative"
             onClick={(e) => e.stopPropagation()}
           >
              {/* Thematic Header - WhatsApp Dark or Custom Theme */}
              <div className="bg-[var(--theme-bg)] p-8 text-white relative shadow-lg">
                  <div className="absolute top-6 right-6 flex items-center space-x-2">
                     <button onClick={() => setShowProfile(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-md text-white transition"><X size={18} /></button>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                      <div className="w-16 h-16 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-2xl border border-white/20">
                         {selectedContact.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                          <input 
                             value={editedContact.name} 
                             onChange={(e) => handleFieldChange('name', e.target.value)}
                             className="text-2xl font-bold bg-transparent outline-none border-b border-transparent focus:border-white/50 transition-all w-full truncate"
                          />
                          <div className="flex items-center space-x-3 mt-1.5 opacity-80">
                             <span className="flex items-center text-xs font-semibold"><Phone size={12} className="mr-1.5" /> {editedContact.phone}</span>
                             <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                             <span className="flex items-center text-xs font-semibold capitalize"><Briefcase size={12} className="mr-1.5" /> {editedContact.status?.toLowerCase().replace('_', ' ')}</span>
                          </div>
                      </div>
                      <div className="flex flex-col items-end space-y-3">
                          <select 
                            value={editedContact.status} 
                            onChange={(e) => handleFieldChange('status', e.target.value)}
                            className="bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-lg border border-white/20 outline-none cursor-pointer hover:bg-white/20 transition-all"
                          >
                             {['NEW LEAD', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'].map(s => (
                                <option key={s} value={s} className="text-gray-800">{s.replace('_', ' ')}</option>
                             ))}
                          </select>
                      </div>
                  </div>
              </div>

              {/* Main Content - Theme Aligned Column Split */}
              <div className="flex-1 flex overflow-hidden">
                 {/* Left Profile Info */}
                 <div className="w-[280px] border-r border-gray-100 bg-gray-50/30 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    <section className="space-y-4">
                       <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Info</h3>
                       <div className="space-y-3">
                          {[
                            { label: 'Email Address', icon: Mail, field: 'email', placeholder: 'Enter email...' },
                            { label: 'Postal Location', icon: MapPin, field: 'address', placeholder: 'Lead address...' },
                            { label: 'Job Designation', icon: Briefcase, field: 'profession', placeholder: 'Designation...' },
                            { label: 'Enterprise/Club', icon: Building2, field: 'companyName', placeholder: 'Company...' },
                          ].map((item, idx) => (
                             <div key={idx} className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm transition-focus focus-within:border-[var(--theme-border)]">
                                <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">{item.label}</label>
                                <div className="flex items-center space-x-2">
                                   <item.icon size={13} className="text-gray-300" />
                                   <input value={editedContact[item.field] || ''} onChange={e=>handleFieldChange(item.field, e.target.value)} placeholder={item.placeholder} className="w-full text-xs font-semibold text-gray-700 outline-none bg-transparent" />
                                </div>
                             </div>
                          ))}
                       </div>
                    </section>

                    <section className="space-y-4">
                       <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Discovery</h3>
                       <div className="space-y-3">
                          <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                             <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1.5">Lead Consider Date</label>
                             <input type="date" value={editedContact.leadConsiderDate ? new Date(editedContact.leadConsiderDate).toISOString().split('T')[0] : ''} onChange={e=>handleFieldChange('leadConsiderDate', e.target.value)} className="w-full text-xs font-semibold text-gray-700 outline-none bg-transparent cursor-pointer" />
                          </div>
                          <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                             <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1.5">Intents & Tags</label>
                             <div className="flex flex-wrap gap-1.5 mb-2">
                                {(editedContact.interests || []).slice(0, 3).map(tag => (
                                   <span key={tag} className="flex items-center bg-gray-50 text-[var(--theme-text)] px-2 py-0.5 rounded text-[9px] font-bold border border-gray-100">
                                      {tag}
                                      <button onClick={() => removeInterest(tag)} className="ml-1 opacity-50 hover:opacity-100"><X size={10} /></button>
                                   </span>
                                ))}
                             </div>
                             <input value={interestInput} onChange={e=>setInterestInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && addInterest()} placeholder="Enter intent..." className="w-full text-xs font-semibold text-gray-700 outline-none pt-1" />
                          </div>
                       </div>
                    </section>
                 </div>

                 {/* Right Activity Column */}
                 <div className="flex-1 flex flex-col">
                    <div className="px-6 flex space-x-6 border-b border-gray-100 bg-white">
                       {['Timeline', 'Inbox', 'Internal'].map(tab => (
                          <button key={tab} onClick={() => setActiveTab(tab.toLowerCase().replace(' ', ''))} className={`py-4 text-[10px] font-bold uppercase tracking-widest relative transition-all ${activeTab === tab.toLowerCase() ? 'text-[var(--theme-text)]' : 'text-gray-400 hover:text-gray-600'}`}>
                             {tab} Mode
                             {activeTab === tab.toLowerCase() && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--theme-bg)] rounded-t-full shadow-glow"></div>}
                          </button>
                       ))}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50/30">
                       {activeTab === 'timeline' && (
                          <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                              {(selectedContact.timeline || []).slice().reverse().map((event, idx) => (
                                 <div key={idx} className="relative pl-8">
                                    <div className="absolute left-0 top-1 w-6 h-6 rounded-lg bg-white border border-gray-100 flex items-center justify-center z-10"><Activity size={10} className="text-[var(--theme-text)]" /></div>
                                    <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-premium">
                                       <p className="text-xs font-semibold text-gray-700 leading-relaxed">{event.description}</p>
                                       <p className="text-[9px] font-bold text-gray-300 uppercase mt-1 flex items-center"><Clock size={10} className="mr-1.5" /> {new Date(event.timestamp).toLocaleString()}</p>
                                    </div>
                                 </div>
                              ))}
                          </div>
                       )}

                       {activeTab === 'inbox' && (
                          <div className="space-y-3">
                             {recentMessages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                                   <div className={`p-3 rounded-xl text-xs font-medium leading-relaxed max-w-[85%] ${msg.direction === 'OUTBOUND' ? 'bg-gray-800 text-white rounded-tr-none' : 'bg-white text-gray-600 rounded-tl-none shadow-premium border border-gray-100'}`}>{msg.content}</div>
                                </div>
                             ))}
                             <div className="pt-4 text-center">
                                <button onClick={()=>{ localStorage.setItem('activeChatId', selectedContact._id); navigate('/inbox'); }} className="text-[9px] font-bold text-[var(--theme-text)] uppercase tracking-widest hover:underline">Full Analytics Page &rarr;</button>
                             </div>
                          </div>
                       )}

                       {activeTab === 'internal' && (
                          <div className="space-y-4 pb-20">
                             <div className="relative">
                                <textarea value={noteInput} onChange={e=>setNoteInput(e.target.value)} placeholder="Type private team note..." className="w-full bg-white border border-gray-200 rounded-xl p-4 text-xs font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-[var(--theme-border)]/20 transition-all shadow-premium" rows={4} />
                                <button onClick={()=>addInternalNote(selectedContact._id)} disabled={isAddingNote || !noteInput.trim()} className="absolute bottom-4 right-4 p-2.5 bg-[var(--theme-bg)] text-white rounded-lg shadow-glow hover:-translate-y-0.5 transition-all text-[9px] font-bold uppercase tracking-widest">
                                   {isAddingNote ? <Clock size={14} className="animate-spin" /> : <Send size={14} />}
                                </button>
                             </div>
                             {(selectedContact.notes || []).slice().reverse().map((note, idx) => (
                                <div key={idx} className="p-4 bg-white border border-gray-100 rounded-xl shadow-premium">
                                   <p className="text-xs font-medium text-gray-600 italic">"{note.content}"</p>
                                   <div className="flex items-center justify-between mt-3 opacity-50">
                                      <span className="text-[9px] font-bold uppercase tracking-tighter">{note.createdBy}</span>
                                      <span className="text-[9px] font-bold">{new Date(note.createdAt).toLocaleDateString()}</span>
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}
                    </div>
                 </div>
              </div>

              {/* Theme-Synced Save Action */}
              <div className={`absolute bottom-6 left-0 right-0 flex justify-center z-50 transition-all duration-300 ${showSaveFab ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                 <button 
                   onClick={() => updateContactDetail(selectedContact._id, editedContact)}
                   disabled={isUpdatingContact}
                   className="bg-[var(--theme-bg)] text-white px-8 py-3 rounded-full shadow-glow hover:scale-105 active:scale-95 transition-all flex items-center space-x-3"
                 >
                    {isUpdatingContact ? <Clock size={18} className="animate-spin" /> : <Save size={18} />}
                    <span className="text-[10px] font-bold uppercase tracking-widest">Save Workspace Profile</span>
                 </button>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                 <div className="flex items-center"><ShieldCheck size={11} className="mr-2 text-[var(--theme-text)] opacity-40 " /> Data Vault Secured</div>
                 <div className="flex items-center"><History size={11} className="mr-1.5" /> Record Open: 1.2.0</div>
              </div>
           </div>
        </div>
      )}

      {/* Simplified Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-[1px] animate-fade-in" onClick={() => setShowAddModal(false)}>
           <div className="bg-white p-8 rounded-2xl w-[400px] shadow-2xl animate-pop-in border border-gray-100" onClick={e=>e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-800 mb-6">New Customer Lead</h2>
              <form onSubmit={handleAddContact} className="space-y-5">
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-1.5 block uppercase">Customer Hub Identity</label>
                    <input autoFocus type="text" value={newLeadName} onChange={e=>setNewLeadName(e.target.value)} required className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 outline-none focus:border-[var(--theme-border)] text-sm font-semibold text-gray-700" placeholder="e.g. John Doe" />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 mb-1.5 block uppercase">WhatsApp Phone ID</label>
                    <input type="tel" value={newLeadPhone} onChange={e=>setNewLeadPhone(e.target.value)} required className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 outline-none focus:border-[var(--theme-border)] text-sm font-semibold text-gray-700" placeholder="+91 98XXX XXXXX" />
                 </div>
                 <div className="flex pt-4 space-x-3">
                    <button type="button" onClick={()=>setShowAddModal(false)} className="flex-1 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:bg-gray-50 rounded-lg transition">Cancel</button>
                    <button type="submit" className="flex-1 py-3 text-[10px] font-bold text-white bg-[var(--theme-bg)] rounded-lg shadow-glow transition active:scale-95 uppercase tracking-widest">Ingest Lead</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
