import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, PlayCircle, Plus, ChevronDown, Download, Upload, Trash2, 
  MoreVertical, AlertCircle, Clock, Mail, MapPin, Phone, User, 
  MessageCircle, Calendar, CheckCircle2, X, ArrowUpRight, History,
  LayoutGrid, ClipboardList, Info, Star, Send, ExternalLink, ShieldCheck,
  Zap, Target, Activity, FileText, TrendingUp, Flame, Snowflake, Sun, Save,
  Briefcase, Building2, Linkedin, Globe, Hash, Tag, Filter
} from 'lucide-react';

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  
  // Profile Detail States
  const [selectedContact, setSelectedContact] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [recentMessages, setRecentMessages] = useState([]);
  const [isRefreshingMessages, setIsRefreshingMessages] = useState(false);
  const [isUpdatingContact, setIsUpdatingContact] = useState(false);

  // Design states
  const [activeTab, setActiveTab] = useState('overview');
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
     setActiveTab('overview');
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
    <div className="bg-[#f8fafc] min-h-screen flex flex-col relative animate-fade-in">
      {/* Top Professional Header Bar */}
      <div className="bg-white border-b border-slate-200 px-10 py-6 sticky top-0 z-40 flex items-center justify-between shadow-sm">
         <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center">
               <User className="mr-3 text-teal-600" size={24} /> Contacts Manager
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Unified Customer Relationship Database</p>
         </div>
         <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
               <div className="text-right pr-3 border-r border-slate-200">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Database Size</p>
                  <p className="text-sm font-black text-slate-800">{contacts.length}</p>
               </div>
               <div className="pl-1">
                  <p className="text-[8px] font-black text-teal-600 uppercase tracking-tighter">Ready Leads</p>
                  <p className="text-sm font-black text-teal-700">{contacts.filter(c => c.score > 70).length}</p>
               </div>
            </div>
            <button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition shadow-lg active:scale-95">
               <Plus size={16} />
               <span>New Contact</span>
            </button>
         </div>
      </div>

      <div className="p-10 flex-1 flex flex-col">
          {/* Filter & Search Bar */}
          <div className="flex justify-between items-center mb-8">
              <div className="relative w-[400px]">
                 <Search className="absolute left-4 top-3 text-slate-300" size={18} />
                 <input 
                   type="text" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   placeholder="Search by name, mobile, or company..." 
                   className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-700 placeholder-slate-300 shadow-sm focus:ring-4 ring-teal-50 transition-all outline-none"
                 />
              </div>
              <div className="flex items-center space-x-3">
                 <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-teal-600 hover:border-teal-100 transition shadow-sm"><Filter size={18} /></button>
                 <button onClick={() => {}} className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition shadow-sm"><Download size={14} /><span>Export CSV</span></button>
              </div>
          </div>

          {/* Contacts Table - High Density */}
          <div className="flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
             <div className="overflow-y-auto h-full custom-scrollbar">
                <table className="w-full text-left border-collapse">
                   <thead className="sticky top-0 bg-white z-10 border-b border-slate-100">
                     <tr>
                        <th className="py-5 px-8 w-12"><input type="checkbox" className="w-4 h-4 accent-teal-600 rounded-lg cursor-pointer" /></th>
                        <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Professional Identity</th>
                        <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Engagement Score</th>
                        <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Heat Level</th>
                        <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Lifecycle Status</th>
                        <th className="py-5 px-8 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {filteredContacts.map((c, i) => (
                       <tr key={c._id || i} onClick={() => handleRowClick(c)} className="cursor-pointer group hover:bg-slate-50 border-b border-slate-50/60 transition-all">
                          <td className="py-5 px-8" onClick={e=>e.stopPropagation()}><input type="checkbox" className="w-4 h-4 accent-teal-600 rounded-lg" /></td>
                          <td className="py-5 px-6">
                             <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 transition-colors group-hover:bg-teal-600 group-hover:text-white">{c.name?.charAt(0) || 'U'}</div>
                                <div>
                                   <p className="text-sm font-black text-slate-800 leading-none mb-1">{c.name}</p>
                                   <p className="text-[10px] font-bold text-slate-400">{c.phone}</p>
                                </div>
                             </div>
                          </td>
                          <td className="py-5 px-6">
                             <div className="flex items-center space-x-2">
                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-teal-500 transition-all" style={{ width: `${c.score || 0}%` }}></div>
                                </div>
                                <span className="text-[9px] font-black text-slate-400">{c.score || 0}%</span>
                             </div>
                          </td>
                          <td className="py-5 px-6">
                             <div className={`inline-flex items-center px-1.5 py-1 rounded-lg ${
                                c.heatLevel === 'Hot' ? 'bg-rose-50 text-rose-500' : 
                                c.heatLevel === 'Warm' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-400'
                             }`}>
                                {c.heatLevel === 'Hot' ? <Flame size={12} className="mr-1" /> : 
                                 c.heatLevel === 'Warm' ? <Sun size={12} className="mr-1" /> : <Snowflake size={12} className="mr-1" />}
                                <span className="text-[8px] font-black uppercase tracking-widest">{c.heatLevel || 'Cold'}</span>
                             </div>
                          </td>
                          <td className="py-5 px-6">
                             <div className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider inline-block ${
                                c.status === 'CLOSED_WON' ? 'bg-teal-100 text-teal-800' :
                                c.status === 'NEW LEAD' ? 'bg-blue-100 text-blue-800' :
                                'bg-slate-100 text-slate-500'
                             }`}>
                                {c.status?.replace('_', ' ')}
                             </div>
                          </td>
                          <td className="py-5 px-8 text-right">
                             <button className="p-2 text-slate-300 hover:text-slate-800 transition-colors"><MoreVertical size={16} /></button>
                          </td>
                       </tr>
                     ))}
                   </tbody>
                </table>
             </div>
          </div>
      </div>

      {/* Redesigned Twin-Column Contact Profile Slideover */}
      {showProfile && selectedContact && editedContact && (
        <div className="fixed inset-0 z-[150] flex justify-end bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowProfile(false)}>
           <div 
             className="w-[750px] h-full bg-white shadow-2xl flex flex-col animate-slide-left relative overflow-hidden"
             onClick={(e) => e.stopPropagation()}
           >
              {/* Profile Header Card */}
              <div className="bg-slate-800 p-8 text-white relative">
                  <div className="absolute top-6 right-6 flex items-center space-x-3">
                     <button onClick={() => setShowProfile(false)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition"><X size={20} /></button>
                  </div>
                  
                  <div className="flex items-center space-x-8">
                      <div className="w-24 h-24 rounded-[32px] bg-white p-1 shadow-2xl">
                         <div className="w-full h-full rounded-[28px] bg-slate-50 text-slate-800 flex items-center justify-center font-black text-4xl border border-slate-200">
                            {selectedContact.name?.charAt(0) || 'U'}
                         </div>
                      </div>
                      <div className="flex-1">
                          <input 
                             value={editedContact.name} 
                             onChange={(e) => handleFieldChange('name', e.target.value)}
                             className="text-3xl font-black bg-transparent outline-none border-b-2 border-transparent focus:border-teal-400 transition-all w-full tracking-tight"
                             placeholder="Contact Identity"
                          />
                          <div className="flex items-center space-x-4 mt-2">
                             <span className="flex items-center text-xs font-black text-teal-400 items-center"><Phone size={12} className="mr-1.5" /> {editedContact.phone}</span>
                             <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                             <span className="flex items-center text-xs font-black text-slate-400 items-center"><Briefcase size={12} className="mr-1.5" /> {editedContact.profession || 'Lead Contact'}</span>
                          </div>
                      </div>
                      <div className="flex flex-col items-end space-y-3">
                          <select 
                            value={editedContact.status} 
                            onChange={(e) => handleFieldChange('status', e.target.value)}
                            className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none border-2 transition-all ${
                               editedContact.status === 'CLOSED_WON' ? 'bg-teal-500 border-teal-400 text-white shadow-xl' :
                               editedContact.status === 'CLOSED_LOST' ? 'bg-rose-500 border-rose-400 text-white shadow-xl' :
                               'bg-white text-slate-800 border-slate-700'
                            }`}
                          >
                             {['NEW LEAD', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'].map(s => (
                                <option key={s} value={s} className="text-slate-800">{s.replace('_', ' ')}</option>
                             ))}
                          </select>
                          <div className="flex -space-x-1">
                             {['Cold', 'Warm', 'Hot'].map(lvl => (
                                <button key={lvl} onClick={() => handleFieldChange('heatLevel', lvl)} className={`p-1.5 rounded-full border-2 border-slate-800 transition-all ${editedContact.heatLevel === lvl ? (lvl === 'Hot' ? 'bg-rose-500 scale-110' : lvl === 'Warm' ? 'bg-amber-500 scale-110' : 'bg-blue-500 scale-110') : 'bg-slate-700 opacity-30 hover:opacity-100'}`}>
                                   {lvl === 'Hot' ? <Flame size={12} /> : lvl === 'Warm' ? <Sun size={12} /> : <Snowflake size={12} />}
                                </button>
                             ))}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Main Content Area - Split Column */}
              <div className="flex-1 flex overflow-hidden">
                 {/* Left Column: Context & Identity */}
                 <div className="w-[350px] border-r border-slate-100 bg-slate-50/30 overflow-y-auto custom-scrollbar p-8 space-y-8">
                    {/* Professional Info */}
                    <section className="space-y-4">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center"><Info size={14} className="mr-2" /> Primary Profile Details</h3>
                       <div className="space-y-3">
                          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group">
                             <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Professional Email</label>
                             <div className="flex items-center space-x-2">
                                <Mail size={14} className="text-slate-300 group-focus-within:text-teal-600" />
                                <input value={editedContact.email || ''} onChange={e=>handleFieldChange('email', e.target.value)} placeholder="Enter email..." className="w-full text-xs font-black text-slate-700 outline-none bg-transparent" />
                             </div>
                          </div>
                          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group">
                             <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Postal Address</label>
                             <div className="flex items-center space-x-2">
                                <MapPin size={14} className="text-slate-300 group-focus-within:text-teal-600" />
                                <input value={editedContact.address || ''} onChange={e=>handleFieldChange('address', e.target.value)} placeholder="Lead address..." className="w-full text-xs font-black text-slate-700 outline-none bg-transparent" />
                             </div>
                          </div>
                          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group">
                             <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Current Organization</label>
                             <div className="flex items-center space-x-2">
                                <Building2 size={14} className="text-slate-300 group-focus-within:text-teal-600" />
                                <input value={editedContact.companyName || ''} onChange={e=>handleFieldChange('companyName', e.target.value)} placeholder="Company name..." className="w-full text-xs font-black text-slate-700 outline-none bg-transparent" />
                             </div>
                          </div>
                       </div>
                    </section>

                    {/* Lead Discovery */}
                    <section className="space-y-4">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center"><Target size={14} className="mr-2" /> Sales Intelligence</h3>
                       <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                             <label className="text-[8px] font-black text-slate-400 uppercase block mb-2">Budget Intel</label>
                             <select value={editedContact.budget || ''} onChange={e=>handleFieldChange('budget', e.target.value)} className="w-full text-xs font-black text-slate-800 outline-none bg-transparent cursor-pointer">
                                <option value="">Unknown</option>
                                <option value="Under 50k">Under 50k</option>
                                <option value="50k-1L">50k-1L</option>
                                <option value="1L-5L">1L-5L</option>
                                <option value="Above 5L">Above 5L</option>
                             </select>
                          </div>
                          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                             <label className="text-[8px] font-black text-slate-400 uppercase block mb-2">Consideration Date</label>
                             <input type="date" value={editedContact.leadConsiderDate ? new Date(editedContact.leadConsiderDate).toISOString().split('T')[0] : ''} onChange={e=>handleFieldChange('leadConsiderDate', e.target.value)} className="w-full text-[10px] font-black text-slate-800 outline-none bg-transparent cursor-pointer" />
                          </div>
                       </div>
                    </section>

                    {/* Interests / Tags */}
                    <section className="space-y-4 pb-12">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center"><Tag size={14} className="mr-2" /> Interested Areas</h3>
                       <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                             {(editedContact.interests || []).map(tag => (
                                <span key={tag} className="flex items-center bg-teal-50 text-teal-700 px-3 py-1.5 rounded-xl text-[10px] font-black border border-teal-100">
                                   {tag}
                                   <button onClick={() => removeInterest(tag)} className="ml-2 hover:text-teal-900"><X size={10} /></button>
                                </span>
                             ))}
                             {(editedContact.interests || []).length === 0 && <p className="text-[10px] font-bold text-slate-300 italic">No interests logged yet</p>}
                          </div>
                          <div className="relative">
                             <input value={interestInput} onChange={e=>setInterestInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && addInterest()} placeholder="Add lead interest..." className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:ring-4 ring-teal-50 transition-all pl-10" />
                             <Plus className="absolute left-4 top-3.5 text-slate-300" size={14} />
                          </div>
                       </div>
                    </section>
                 </div>

                 {/* Right Column: unified Activity Feed */}
                 <div className="flex-1 flex flex-col bg-slate-50/20">
                    <div className="px-8 flex space-x-8 border-b border-slate-100 bg-white">
                       {['Timeline', 'Inbox Log', 'Internal Notes'].map(tab => (
                          <button key={tab} onClick={() => setActiveTab(tab.toLowerCase().replace(' ', ''))} className={`py-4 text-[10px] font-black uppercase tracking-widest relative transition-all ${activeTab === tab.toLowerCase().replace(' ', '') ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}>
                             {tab}
                             {activeTab === tab.toLowerCase().replace(' ', '') && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500 rounded-t-full shadow-[0_-2px_8px_rgba(20,184,166,0.2)]"></div>}
                          </button>
                       ))}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                       {activeTab === 'timeline' && (
                          <div className="space-y-6 relative before:absolute before:left-[13px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-100">
                              {(selectedContact.timeline || []).slice().reverse().map((event, idx) => (
                                 <div key={idx} className="relative pl-10 animate-fade-in-up">
                                    <div className="absolute left-0 top-1 w-7 h-7 rounded-xl bg-white border-2 border-slate-100 flex items-center justify-center z-10"><Activity size={12} className="text-teal-500" /></div>
                                    <div className="p-5 bg-white border border-slate-100 rounded-[24px] shadow-sm">
                                       <p className="text-sm font-black text-slate-800 mb-1 leading-snug">{event.description}</p>
                                       <p className="text-[10px] font-black text-slate-300 uppercase flex items-center"><Clock size={10} className="mr-1.5" /> {new Date(event.timestamp).toLocaleString()}</p>
                                    </div>
                                 </div>
                              ))}
                          </div>
                       )}

                       {activeTab === 'inboxlog' && (
                          <div className="space-y-4 animate-fade-in">
                             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-lg shadow-slate-200/20">
                                 <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Inbox Snippet</h3>
                                    <button onClick={()=>{ localStorage.setItem('activeChatId', selectedContact._id); navigate('/inbox'); }} className="text-[9px] font-black text-teal-600 uppercase tracking-widest flex items-center border border-teal-100 px-3 py-1.5 rounded-xl hover:bg-teal-50 transition">Open Full Conversation <ArrowUpRight size={12} className="ml-1" /></button>
                                 </div>
                                 <div className="space-y-4 mb-4">
                                    {recentMessages.map((msg, idx) => (
                                       <div key={idx} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                                          <div className={`p-4 rounded-2xl text-xs font-bold leading-relaxed max-w-[85%] ${msg.direction === 'OUTBOUND' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-slate-50 text-slate-600 rounded-tl-none shadow-sm border border-slate-100'}`}>{msg.content}</div>
                                       </div>
                                    ))}
                                    {recentMessages.length === 0 && <p className="text-center text-[10px] font-black text-slate-300 py-10 uppercase tracking-[0.2em]">No recent messages captured</p>}
                                 </div>
                             </div>
                          </div>
                       )}

                       {activeTab === 'internalnotes' && (
                          <div className="space-y-6 animate-fade-in pb-20">
                             <div className="relative">
                                <textarea value={noteInput} onChange={e=>setNoteInput(e.target.value)} placeholder="Internal agent notes & follow-up updates..." className="w-full bg-white border border-slate-200 rounded-[28px] p-6 text-sm font-bold text-slate-800 outline-none focus:ring-4 ring-teal-50 transition-all shadow-sm" rows={5} />
                                <button onClick={()=>addInternalNote(selectedContact._id)} disabled={isAddingNote || !noteInput.trim()} className="absolute bottom-6 right-6 p-3 bg-slate-800 text-white rounded-2xl shadow-xl hover:bg-black transition-all flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest">
                                   {isAddingNote ? <Clock size={16} className="animate-spin" /> : <><Send size={16} /><span>Post Entry</span></>}
                                </button>
                             </div>
                             <div className="space-y-4">
                                {(selectedContact.notes || []).slice().reverse().map((note, idx) => (
                                   <div key={idx} className="p-6 bg-white border border-slate-100 rounded-[28px] shadow-sm hover:shadow-md transition-all">
                                      <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                                         <div className="flex items-center space-x-2">
                                            <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-[10px] uppercase">{note.createdBy?.charAt(0) || 'A'}</div>
                                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{note.createdBy || 'Agent Workspace'}</span>
                                         </div>
                                         <span className="text-[9px] font-black text-slate-300 italic">{new Date(note.createdAt).toLocaleDateString()}</span>
                                      </div>
                                      <p className="text-sm font-bold text-slate-600 leading-relaxed italic">"{note.content}"</p>
                                   </div>
                                ))}
                             </div>
                          </div>
                       )}
                    </div>
                 </div>
              </div>

              {/* Fixed Save Floating Button */}
              <div className={`absolute bottom-8 left-0 right-0 flex justify-center z-50 transition-all duration-500 translate-y-0 ${showSaveFab ? 'opacity-100' : 'opacity-0 translate-y-20 pointer-events-none'}`}>
                 <button 
                   onClick={() => updateContactDetail(selectedContact._id, editedContact)}
                   disabled={isUpdatingContact}
                   className="bg-slate-800 text-white px-10 py-4 rounded-full shadow-[0_25px_60px_rgba(0,0,0,0.5)] hover:bg-black hover:scale-105 active:scale-95 transition-all flex items-center space-x-4 group border border-white/20"
                 >
                    {isUpdatingContact ? <Clock size={20} className="animate-spin" /> : <Save size={20} className="group-hover:rotate-12 transition-transform" />}
                    <span className="text-xs font-black uppercase tracking-widest">Confirm Profile Redesign Update</span>
                 </button>
              </div>

              {/* Branding Footer */}
              <div className="px-8 py-5 border-t border-slate-100 bg-white flex items-center justify-between text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] relative z-10">
                 <div className="flex items-center"><ShieldCheck size={12} className="mr-2 text-teal-500" /> Identity Protected CRM Core</div>
                 <div className="flex items-center space-x-4">
                    <History size={12} className="mr-1" /> Initial Record: {new Date(selectedContact.createdAt).toLocaleDateString()}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Manual Import Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-md animate-fade-in" onClick={() => setShowAddModal(false)}>
           <div className="bg-white p-12 rounded-[40px] w-[450px] shadow-2xl animate-pop-in border border-slate-100" onClick={e=>e.stopPropagation()}>
              <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Add Verified Lead</h2>
              <p className="text-[10px] font-black text-slate-400 mb-10 uppercase tracking-[0.3em] border-b border-slate-100 pb-5">Manual Data Ingestion Pipeline</p>
              <form onSubmit={handleAddContact} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-800 mb-2 block uppercase tracking-widest">Full Legal Name</label>
                    <input autoFocus type="text" value={newLeadName} onChange={e=>setNewLeadName(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4.5 outline-none focus:border-teal-500 focus:bg-white transition-all text-sm font-bold text-slate-700 shadow-inner" placeholder="e.g. Samuel L. Jackson" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-800 mb-2 block uppercase tracking-widest">WhatsApp Identity</label>
                    <input type="tel" value={newLeadPhone} onChange={e=>setNewLeadPhone(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4.5 outline-none focus:border-teal-500 focus:bg-white transition-all text-sm font-bold text-slate-700 shadow-inner" placeholder="+1 XXX XXX XXXX" />
                 </div>
                 <div className="flex pt-6 space-x-4">
                    <button type="button" onClick={()=>setShowAddModal(false)} className="flex-1 py-5 font-black text-[10px] text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition">Dismiss</button>
                    <button type="submit" className="flex-1 py-5 font-black text-[10px] text-white bg-slate-800 hover:bg-black uppercase tracking-widest rounded-2xl shadow-2xl transition active:scale-95">Authorize & Create</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
