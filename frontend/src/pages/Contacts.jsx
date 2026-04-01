import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, PlayCircle, Plus, ChevronDown, Download, Upload, Trash2, 
  MoreVertical, AlertCircle, Clock, Mail, MapPin, Phone, User, 
  MessageCircle, Calendar, CheckCircle2, X, ArrowUpRight, History,
  LayoutGrid, ClipboardList, Info, Star, Send, ExternalLink, ShieldCheck,
  Zap, Target, Activity, FileText, TrendingUp, Flame, Snowflake, Sun, Save
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

  // Discovery Form State
  const [editedContact, setEditedContact] = useState(null);
  const [showSaveFab, setShowSaveFab] = useState(false);

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      if (!token) return;
      const res = await fetch('/api/chat/contacts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId
        }
      });
      if (res.ok) {
         const data = await res.json();
         setContacts(data);
         // Keep selected contact updated if it matches
         if (selectedContact) {
            const updated = data.find(c => c._id === selectedContact._id);
            if (updated) setSelectedContact(updated);
         }
      }
    } catch (err) {
      console.error("Backend API unavailable.", err);
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
        setRecentMessages(data.slice(-5)); // Last 5 messages
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

  const handleExport = () => {
    if (contacts.length === 0) return alert("No contacts available to export");
    const headers = ['Name', 'Mobile Number', 'Source', 'Tags'];
    const csvRows = [headers.join(',')];
    contacts.forEach(c => {
      const name = c.name ? `"${c.name.replace(/"/g, '""')}"` : '';
      const phone = c.phone || '';
      const source = c.source || 'CTWA Lead';
      const tags = (c.tags || ['AD']).join(';');
      csvRows.push([name, phone, source, tags].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `contacts_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const toggleSelectAll = () => {
    if (selectedIds.length > 0 && selectedIds.length === filteredContacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredContacts.map(c => c._id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    const confirmMsg = action === 'hard_delete_leads' ? `PERMANENTLY delete ${selectedIds.length} leads?` : `Archive ${selectedIds.length} leads?`;
    if (!window.confirm(confirmMsg)) return;
    setIsBulkLoading(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/chat/bulk-action', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: selectedIds, action })
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleAction = async (contactId, action) => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/chat/action', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, action, payload: {} })
      });
      if (res.ok) {
        setActiveDropdown(null);
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRowClick = (contact) => {
     setSelectedContact(contact);
     setEditedContact(contact);
     setShowProfile(true);
     fetchRecentMessages(contact._id);
     setShowSaveFab(false);
  };

  const handleFieldChange = (field, value) => {
     setEditedContact(prev => ({ ...prev, [field]: value }));
     setShowSaveFab(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-full flex flex-col pt-10 px-10 relative overflow-hidden animate-fade-in">
      {/* Table Header Section */}
      <div className="mb-8 relative z-10">
         <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Contacts</h1>
         <p className="text-gray-400 mt-2 font-medium">Import contact, create audience & launch campaign, all from one place!</p>
      </div>

      <div className="flex justify-between items-center mb-6 relative z-10 w-full max-w-5xl">
          <div className="relative w-80">
             <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
             <input 
               type="text" 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Search name or mobile number" 
               className="w-full bg-gray-50 hover:bg-gray-100 border-none rounded-lg py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-gray-200 transition-all font-medium text-gray-700 placeholder-gray-400"
             />
          </div>
          <div className="flex items-center space-x-3">
             <button onClick={() => navigate('/campaigns/create')} className="bg-[var(--theme-bg)] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-teal-900 transition shadow-[0_4px_10px_rgba(17,74,67,0.2)]">
                Broadcast
             </button>
             <button onClick={() => setShowAddModal(true)} className="flex items-center space-x-1 border border-brand-dark text-[var(--theme-text)] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-50 transition">
                <Plus size={16} className="text-[var(--theme-text)]" />
                <span>Add Contact</span>
             </button>
             <button onClick={handleExport} className="flex items-center space-x-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
                <Download size={14} />
                <span>Export</span>
             </button>
          </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
         <div className="flex items-center justify-between bg-teal-50 border border-teal-100 p-4 rounded-xl mb-6 animate-fade-in-up w-full max-w-5xl">
             <div className="flex items-center space-x-3 text-sm font-bold text-teal-900">
                <span className="bg-[var(--theme-bg)] text-white px-2 py-0.5 rounded-full text-[10px]">{selectedIds.length}</span>
                <span>Contacts Selected</span>
             </div>
             <div className="flex items-center space-x-2">
                <button onClick={() => handleBulkAction('archive_leads')} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition">Archive</button>
                <button onClick={() => handleBulkAction('hard_delete_leads')} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition">Delete Permanently</button>
             </div>
         </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 w-full max-w-5xl overflow-y-auto custom-scrollbar">
        <div className="rounded-xl border border-gray-100 overflow-hidden shadow-sm mb-8">
          <table className="w-full text-left border-collapse">
             <thead>
               <tr className="border-b border-gray-100 bg-white">
                  <th className="py-4 px-6">
                    <input type="checkbox" className="w-4 h-4 accent-brand-dark rounded cursor-pointer" checked={selectedIds.length > 0 && selectedIds.length === filteredContacts.length} onChange={toggleSelectAll} />
                  </th>
                  <th className="py-4 px-6 text-sm font-semibold text-[var(--theme-text)]">Name</th>
                  <th className="py-4 px-6 text-sm font-semibold text-[var(--theme-text)]">Mobile Number</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-400">Score</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-400">Heat</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-400 text-right">Actions</th>
               </tr>
             </thead>
             <tbody>
               {filteredContacts.map((c, i) => (
                 <tr key={c._id || i} onClick={() => handleRowClick(c)} className={`${i % 2 === 0 ? 'bg-[#fbfbfb]' : 'bg-white'} cursor-pointer hover:bg-teal-50/30 transition-colors group relative`}>
                    <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                       <input type="checkbox" className="w-4 h-4 accent-brand-dark rounded cursor-pointer" checked={selectedIds.includes(c._id)} onChange={() => toggleSelect(c._id)} />
                    </td>
                    <td className="py-4 px-6 text-sm font-bold text-gray-800">{c.name}</td>
                    <td className="py-4 px-6 text-sm font-semibold text-gray-600">{c.phone}</td>
                    <td className="py-4 px-6">
                       <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-100 h-1.5 w-12 rounded-full overflow-hidden">
                             <div className="bg-teal-500 h-full" style={{ width: `${c.score || 0}%` }}></div>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400">{c.score || 0}</span>
                       </div>
                    </td>
                    <td className="py-4 px-6">
                       {c.heatLevel === 'Hot' ? <Flame size={14} className="text-rose-500" /> : 
                        c.heatLevel === 'Warm' ? <Sun size={14} className="text-amber-500" /> : 
                        <Snowflake size={14} className="text-blue-400" />}
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                       <button onClick={() => setActiveDropdown(activeDropdown === c._id ? null : c._id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                          <MoreVertical size={16} />
                       </button>
                    </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>
      </div>

      {/* Premium Redesigned Contact Profile Slideover */}
      {showProfile && selectedContact && editedContact && (
        <div className="fixed inset-0 z-[150] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowProfile(false)}>
           <div 
             className="w-[550px] h-full bg-white shadow-2xl flex flex-col animate-slide-left relative overflow-hidden"
             onClick={(e) => e.stopPropagation()}
           >
              {/* Profile Header Hero */}
              <div className="relative h-44 bg-[var(--theme-bg)] flex flex-col justify-end p-8 text-white">
                 <div className="absolute top-6 right-6 z-20">
                    <button onClick={() => setShowProfile(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-white backdrop-blur-md">
                       <X size={20} />
                    </button>
                 </div>
                 
                 <div className="flex items-end space-x-6 relative z-10 translate-y-12">
                    <div className="w-28 h-28 rounded-3xl bg-white p-1.5 shadow-2xl group transition-transform hover:scale-105">
                       <div className="w-full h-full rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 text-[var(--theme-text)] flex items-center justify-center font-black text-4xl shadow-inner border border-teal-200/50">
                          {selectedContact.name?.charAt(0) || 'U'}
                       </div>
                    </div>
                    <div className="pb-3">
                       <div className="flex flex-col space-y-1">
                          <input 
                             value={editedContact.name} 
                             onChange={(e) => handleFieldChange('name', e.target.value)}
                             className="text-2xl font-black text-slate-800 bg-transparent outline-none focus:placeholder-transparent border-b-2 border-transparent focus:border-teal-400/50 transition-all max-w-[280px]"
                             placeholder="Contact Name"
                          />
                          <div className="flex items-center space-x-2">
                             <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                editedContact.status === 'CLOSED_WON' ? 'bg-teal-100 text-teal-600' :
                                editedContact.status === 'CLOSED_LOST' ? 'bg-rose-100 text-rose-600' :
                                'bg-blue-100 text-blue-600'
                             }`}>
                                {editedContact.status?.replace('_', ' ')}
                             </div>
                             <span className="text-[10px] font-bold text-slate-400 flex items-center">
                                <Phone size={10} className="mr-1" /> {editedContact.phone}
                             </span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Discovery & Maturity Metrics */}
              <div className="mt-16 px-8 flex items-center space-x-8 pb-4 border-b border-slate-50">
                 <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <span className="flex items-center"><TrendingUp size={10} className="mr-1" /> Lead Maturity</span>
                       <span className={editedContact.score > 70 ? 'text-teal-600' : 'text-slate-500'}>{editedContact.score || 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                       <div 
                         className="h-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-700 shadow-[0_0_8px_rgba(20,184,166,0.3)]" 
                         style={{ width: `${editedContact.score || 0}%` }}
                       ></div>
                    </div>
                 </div>
                 <div className="flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <div className="flex -space-x-1">
                       {['Cold', 'Warm', 'Hot'].map((lvl) => (
                          <button 
                            key={lvl}
                            onClick={() => handleFieldChange('heatLevel', lvl)}
                            className={`p-1.5 rounded-full transition-all ${
                               editedContact.heatLevel === lvl 
                               ? (lvl === 'Hot' ? 'bg-rose-500 text-white shadow-lg' : lvl === 'Warm' ? 'bg-amber-500 text-white shadow-lg' : 'bg-blue-500 text-white shadow-lg')
                               : 'bg-white text-slate-300 hover:text-slate-400 grayscale opacity-40'
                            }`}
                          >
                             {lvl === 'Hot' ? <Flame size={12} /> : lvl === 'Warm' ? <Sun size={12} /> : <Snowflake size={12} />}
                          </button>
                       ))}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tight text-slate-500">{editedContact.heatLevel || 'Cold'}</span>
                 </div>
              </div>

              {/* Tabs */}
              <div className="px-8 flex space-x-8 bg-white z-10">
                 {[
                   { id: 'overview', label: 'Discovery', icon: Compass },
                   { id: 'activity', label: 'Milestones', icon: History },
                   { id: 'chat', label: 'Inbox Snippet', icon: MessageCircle },
                   { id: 'notes', label: 'Team Collaboration', icon: ClipboardList }
                 ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pt-5 pb-4 flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                        activeTab === tab.id ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                       {/* Note: using a fallback if Compass isn't imported correctly */}
                       <LayoutGrid size={14} />
                       <span>{tab.label}</span>
                       {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500 rounded-t-full shadow-[0_-2px_6px_rgba(20,184,166,0.3)] animate-scale-in"></div>
                       )}
                    </button>
                 ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-50/30">
                 {activeTab === 'overview' && (
                    <div className="space-y-8 animate-fade-in">
                       {/* Sales discovery section */}
                       <div className="space-y-4">
                          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                             <Target size={14} className="mr-2" strokeWidth={3} /> Conversion DNA
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-teal-200 transition-all">
                                 <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-wider">Estimated Budget</label>
                                 <select 
                                   value={editedContact.budget || ''}
                                   onChange={(e) => handleFieldChange('budget', e.target.value)}
                                   className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                                 >
                                    <option value="">Select Budget Range</option>
                                    <option value="Under 50k">Under 50k</option>
                                    <option value="50k - 1L">50k - 1L</option>
                                    <option value="1L - 5L">1L - 5L</option>
                                    <option value="Above 5L">Above 5L</option>
                                 </select>
                              </div>
                              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-teal-200 transition-all">
                                 <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-wider">Purchase Timeline</label>
                                 <select 
                                   value={editedContact.purchaseTimeline || ''}
                                   onChange={(e) => handleFieldChange('purchaseTimeline', e.target.value)}
                                   className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                                 >
                                    <option value="">Select Timeline</option>
                                    <option value="Immediate">Immediate</option>
                                    <option value="Within 1 Month">Within 1 Month</option>
                                    <option value="1-3 Months">1-3 Months</option>
                                    <option value="Long Term">Long Term</option>
                                 </select>
                              </div>
                              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-teal-200 transition-all">
                                 <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-wider">Decision Maker</label>
                                 <select 
                                   value={editedContact.decisionMakerStatus || ''}
                                   onChange={(e) => handleFieldChange('decisionMakerStatus', e.target.value)}
                                   className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                                 >
                                    <option value="">Who decides?</option>
                                    <option value="Self">Self</option>
                                    <option value="Family">Family / Partner</option>
                                    <option value="Business Panel">Business Panel</option>
                                 </select>
                              </div>
                              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-teal-200 transition-all">
                                 <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-wider">Lead Maturity Score</label>
                                 <input 
                                   type="number"
                                   min="0" max="100"
                                   value={editedContact.score || 0}
                                   onChange={(e) => handleFieldChange('score', parseInt(e.target.value))}
                                   className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
                                 />
                              </div>
                          </div>
                       </div>

                       {/* Standard Info */}
                       <div className="space-y-4">
                          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                             <Info size={14} className="mr-2" strokeWidth={3} /> Primary Intel
                          </h3>
                          <div className="grid grid-cols-1 gap-4">
                             <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 group">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
                                   <Mail size={18} />
                                </div>
                                <div className="flex-1">
                                   <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Verified Email</label>
                                   <input 
                                      value={editedContact.email || ''} 
                                      onChange={(e) => handleFieldChange('email', e.target.value)}
                                      className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
                                      placeholder="Not added yet"
                                   />
                                </div>
                             </div>
                             <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 group">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
                                   <MapPin size={18} />
                                </div>
                                <div className="flex-1">
                                   <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Physical Address</label>
                                   <textarea 
                                      value={editedContact.address || ''} 
                                      onChange={(e) => handleFieldChange('address', e.target.value)}
                                      className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none resize-none"
                                      placeholder="No address provided"
                                      rows={2}
                                   />
                                </div>
                             </div>
                          </div>
                       </div>

                       {/* Status Pipeline */}
                       <div className="space-y-4 pb-12">
                          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                             <Activity size={14} className="mr-2" strokeWidth={3} /> Lifecycle Stage
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                             {['NEW LEAD', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleFieldChange('status', status)}
                                  className={`px-4 py-3 rounded-xl text-[10px] font-black transition-all text-left flex items-center border ${
                                    editedContact.status === status 
                                    ? 'bg-slate-800 text-white border-transparent shadow-xl ring-2 ring-slate-800/20' 
                                    : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                                  }`}
                                >
                                   <div className={`w-1.5 h-1.5 rounded-full mr-3 ${editedContact.status === status ? 'bg-teal-400' : 'bg-slate-200'}`}></div>
                                   {status.replace('_', ' ')}
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>
                 )}

                 {activeTab === 'activity' && (
                    <div className="space-y-6 animate-fade-in">
                       <div className="relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                          {(selectedContact.timeline || []).slice().reverse().map((event, idx) => (
                             <div key={idx} className="relative pl-10 pb-8 animate-fade-in-up">
                                <div className="absolute left-0 top-1 w-6 h-6 rounded-xl bg-white border-2 border-slate-100 flex items-center justify-center z-10"><div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div></div>
                                <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm"><p className="text-xs font-black text-slate-700 mb-1">{event.description}</p><p className="text-[9px] text-slate-300 font-bold uppercase">{new Date(event.timestamp).toLocaleString()}</p></div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {activeTab === 'chat' && (
                    <div className="space-y-6 animate-fade-in">
                       <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                           <div className="flex items-center justify-between mb-6">
                              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center"><MessageCircle size={14} className="mr-2" /> Recent Communication</h3>
                              <button onClick={() => fetchRecentMessages(selectedContact._id)} className={`p-1.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition ${isRefreshingMessages ? 'animate-spin' : ''}`}><History size={14} className="text-slate-400" /></button>
                           </div>
                           <div className="space-y-4 mb-6">
                              {recentMessages.map((msg, idx) => (
                                 <div key={idx} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-3 rounded-2xl text-[11px] font-bold shadow-sm ${msg.direction === 'OUTBOUND' ? 'bg-teal-500 text-white' : 'bg-slate-50 text-slate-600'}`}>{msg.content}</div>
                                 </div>
                              ))}
                           </div>
                           <button onClick={() => { localStorage.setItem('activeChatId', selectedContact._id); navigate('/inbox', { state: { selectedContact: selectedContact.phone } }); }} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 hover:text-teal-600 hover:border-teal-200 transition-all uppercase tracking-widest">Open Full Inbox Session</button>
                       </div>
                    </div>
                 )}

                 {activeTab === 'notes' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="relative">
                           <textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="Collaborate with your team..." className="w-full bg-white border border-slate-100 rounded-2xl p-5 text-sm font-bold text-slate-700 outline-none focus:ring-2 ring-teal-50 transition-all shadow-sm" rows={4} />
                           <button onClick={() => addInternalNote(selectedContact._id)} disabled={isAddingNote || !noteInput.trim()} className="absolute bottom-4 right-4 p-3 bg-slate-800 text-white rounded-xl shadow-lg hover:bg-black transition-all flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest">
                              {isAddingNote ? <Clock size={16} className="animate-spin" /> : <><Send size={16} /><span>Post</span></>}
                           </button>
                        </div>
                        <div className="space-y-4">
                           {(selectedContact.notes || []).slice().reverse().map((note, idx) => (
                              <div key={idx} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm"><div className="flex items-center justify-between mb-3"><div className="flex items-center space-x-2"><div className="w-6 h-6 rounded bg-teal-50 flex items-center justify-center text-teal-600"><User size={12} strokeWidth={3} /></div><span className="text-[10px] font-black text-slate-800 uppercase">{note.createdBy || 'Agent'}</span></div><span className="text-[9px] font-bold text-slate-300">{new Date(note.createdAt).toLocaleDateString()}</span></div><p className="text-sm font-bold text-slate-600 leading-relaxed">{note.content}</p></div>
                           ))}
                        </div>
                    </div>
                 )}
              </div>

              {/* Floating Profile Action Button (FAB) for Save */}
              <div className={`absolute bottom-8 left-0 right-0 flex justify-center z-50 transition-all duration-300 translate-y-0 ${showSaveFab ? 'opacity-100' : 'opacity-0 translate-y-20 pointer-events-none'}`}>
                 <button 
                   onClick={() => updateContactDetail(selectedContact._id, editedContact)}
                   disabled={isUpdatingContact}
                   className="bg-slate-800 text-white px-8 py-4 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] hover:bg-black hover:scale-105 active:scale-95 transition-all flex items-center space-x-3 group"
                 >
                    {isUpdatingContact ? <Clock size={18} className="animate-spin" /> : <Save size={18} className="group-hover:animate-bounce" />}
                    <span className="text-xs font-black uppercase tracking-widest">Update Profile Lead</span>
                 </button>
              </div>

              {/* Discovery Footer */}
              <div className="px-8 py-6 border-t border-slate-50 flex items-center justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest bg-white">
                 <div className="flex items-center"><ShieldCheck size={14} className="mr-2 text-teal-600 opacity-40" /> Lead IQ: Verified CRM Identity</div>
                 <div className="flex items-center space-x-4">
                    <span className="text-slate-200">|</span>
                    <div className="flex items-center text-slate-500"><Calendar size={12} className="mr-1" /> Added {new Date(selectedContact.createdAt).toLocaleDateString()}</div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={() => setShowAddModal(false)}>
           <div className="bg-white p-10 rounded-[40px] w-[400px] shadow-2xl animate-pop-in border border-white/20" onClick={e=>e.stopPropagation()}>
              <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Onboard New Lead</h2>
              <p className="text-xs font-bold text-slate-400 mb-8 uppercase tracking-widest">Manual ingestion to database</p>
              <form onSubmit={handleAddContact} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Lead Name</label>
                    <input autoFocus type="text" value={newLeadName} onChange={e=>setNewLeadName(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-teal-500 focus:bg-white transition-all text-sm font-bold text-slate-700" placeholder="e.g. Rahul Sharma" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">WhatsApp Number</label>
                    <input type="tel" value={newLeadPhone} onChange={e=>setNewLeadPhone(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-teal-500 focus:bg-white transition-all text-sm font-bold text-slate-700" placeholder="+91 XXXX XXXX XX" />
                 </div>
                 <div className="flex pt-4 space-x-3">
                    <button type="button" onClick={()=>setShowAddModal(false)} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition">Dismiss</button>
                    <button type="submit" className="flex-1 py-4 font-black text-[10px] text-white bg-slate-800 hover:bg-black uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95">Confirm Import</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

// Fallback for missing icon
function Compass(props) { return <LayoutGrid {...props} />; }
function SaveContact(props) { return <Save {...props} />; }
