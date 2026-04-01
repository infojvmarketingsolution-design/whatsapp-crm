import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, PlayCircle, Plus, ChevronDown, Download, Upload, Trash2, 
  MoreVertical, AlertCircle, Clock, Mail, MapPin, Phone, User, 
  MessageCircle, Calendar, CheckCircle2, X, ArrowUpRight, History,
  LayoutGrid, ClipboardList, Info, Star, Send, ExternalLink, ShieldCheck,
  Zap, Target, Activity, FileText
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
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    
    const confirmMsg = action === 'hard_delete_leads' 
      ? `PERMANENTLY delete ${selectedIds.length} leads from database? This cannot be undone.`
      : `Archive ${selectedIds.length} leads? They will be hidden from the fronthead.`;
      
    if (!window.confirm(confirmMsg)) return;

    setIsBulkLoading(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/chat/bulk-action', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'x-tenant-id': tenantId, 
          'Content-Type': 'application/json' 
        },
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
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'x-tenant-id': tenantId, 
          'Content-Type': 'application/json' 
        },
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
     setShowProfile(true);
     fetchRecentMessages(contact._id);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-full flex flex-col pt-10 px-10 relative overflow-hidden animate-fade-in">
      <div className="mb-8 relative z-10">
         <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Contacts</h1>
         <p className="text-gray-400 mt-2 font-medium">Import contact, create audience & launch campaign, all from one place!</p>
         
         <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500 font-medium">
            <div className="flex items-center space-x-2">
               <span className="w-4 h-4 rounded bg-[var(--theme-bg)] block"></span>
               <span>Import upto 2 lakh contacts in one go</span>
            </div>
            <button className="flex items-center space-x-2 hover:text-[var(--theme-text)] transition">
               <PlayCircle size={16} />
               <span>Watch Tutorial</span>
            </button>
         </div>
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
             <button onClick={() => alert('CSV Tooling connecting natively mapping payload in upcoming iterations!')} className="flex items-center space-x-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition hover:border-brand-dark hover:text-[var(--theme-text)]">
                <Upload size={14} />
                <span>Import</span>
             </button>
             <button onClick={handleExport} className="flex items-center space-x-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition hover:border-brand-dark hover:text-[var(--theme-text)]">
                <Download size={14} />
                <span>Export</span>
             </button>
          </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-teal-50 border border-teal-100 p-4 rounded-xl mb-6 animate-fade-in-up w-full max-w-5xl">
          <div className="flex items-center space-x-3">
             <span className="flex items-center justify-center w-6 h-6 bg-[var(--theme-bg)] text-white text-[10px] font-bold rounded-full">
               {selectedIds.length}
             </span>
             <span className="text-sm font-bold text-teal-900">Contacts Selected</span>
          </div>
          <div className="flex items-center space-x-3">
             <button 
               onClick={() => handleBulkAction('archive_leads')}
               disabled={isBulkLoading}
               className="flex items-center space-x-2 px-4 py-2 bg-white border border-orange-200 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-50 transition-colors disabled:opacity-50"
             >
               <Clock size={14} />
               <span>Bulk Archive (Hide)</span>
             </button>
             <button 
               onClick={() => handleBulkAction('hard_delete_leads')}
               disabled={isBulkLoading}
               className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
             >
               <AlertCircle size={14} />
               <span>Bulk Delete (Database)</span>
             </button>
             <button 
               onClick={() => setSelectedIds([])}
               className="text-gray-400 hover:text-gray-600 p-1"
             >
               <Plus size={18} className="rotate-45" />
             </button>
          </div>
        </div>
      )}

      <div className="flex-1 w-full max-w-5xl overflow-y-auto custom-scrollbar">
        <div className="rounded-xl border border-gray-100 overflow-hidden shadow-[0_2px_15px_rgba(0,0,0,0.02)] mb-8">
          <table className="w-full text-left border-collapse">
             <thead>
               <tr className="border-b border-gray-100 bg-white">
                  <th className="py-4 px-6">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 accent-brand-dark rounded cursor-pointer" 
                      checked={selectedIds.length > 0 && selectedIds.length === filteredContacts.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="py-4 px-6 text-sm font-semibold text-[var(--theme-text)]">Name</th>
                  <th className="py-4 px-6 text-sm font-semibold text-[var(--theme-text)]">Mobile Number</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-400">Tags</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-400">Source</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-400 text-right">Actions</th>
               </tr>
             </thead>
             <tbody>
               {filteredContacts.length === 0 && (
                 <tr>
                   <td colSpan="6" className="py-8 text-center text-gray-400 font-medium">
                     No contacts matched your search criteria.
                   </td>
                 </tr>
               )}
               {filteredContacts.map((c, i) => (
                 <tr 
                    key={c._id || i} 
                    onClick={() => handleRowClick(c)}
                    className={`${i % 2 === 0 ? 'bg-[#fbfbfb]' : 'bg-white'} ${selectedIds.includes(c._id) ? 'bg-teal-50/50' : ''} cursor-pointer hover:bg-teal-50/30 transition-colors group relative`}
                  >
                   <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                       <input 
                         type="checkbox" 
                         className="w-4 h-4 accent-brand-dark rounded cursor-pointer" 
                         checked={selectedIds.includes(c._id)}
                         onChange={() => toggleSelect(c._id)}
                       />
                   </td>
                   <td className="py-4 px-6 text-sm font-bold text-gray-800">{c.name}</td>
                   <td className="py-4 px-6 text-sm font-semibold text-gray-600">{c.phone}</td>
                   <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-[#fff6d6] text-[#bda030] rounded border border-[#faebad] text-xs font-bold tracking-wide">
                        {c.source || 'CTWA Lead'}
                      </span>
                   </td>
                   <td className="py-4 px-6 text-[13px] font-bold text-gray-600">{c.tags?.[0] || 'AD'}</td>
                   <td className="py-4 px-6 text-right relative" onClick={(e) => e.stopPropagation()}>
                       <button 
                         onClick={() => setActiveDropdown(activeDropdown === c._id ? null : c._id)}
                         className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                       >
                         <MoreVertical size={16} />
                       </button>
                       
                       {activeDropdown === c._id && (
                         <div className="absolute right-6 top-10 w-56 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-50 animate-pop-in">
                            <button 
                              onClick={() => {
                                if (window.confirm("Archive this lead? It will be hidden from fronthead view.")) {
                                  handleAction(c._id, 'archive_lead');
                                }
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs font-bold text-orange-600 hover:bg-orange-50 flex items-center space-x-2"
                            >
                              <Clock size={14} />
                              <span>Delete lead only fronthead</span>
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm("PERMANENTLY delete this lead and all history from the database? This cannot be undone.")) {
                                  handleAction(c._id, 'hard_delete_lead');
                                }
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center space-x-2 border-t border-gray-50"
                            >
                              <AlertCircle size={14} />
                              <span>Delete this lead from database also</span>
                            </button>
                         </div>
                       )}
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white p-7 rounded-3xl w-96 shadow-2xl animate-fade-in-up border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Add New Contact</h2>
              <form onSubmit={handleAddContact}>
                 <div className="space-y-4 mb-8">
                    <div>
                       <label className="text-[11px] font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">Full Name</label>
                       <input type="text" value={newLeadName} onChange={e=>setNewLeadName(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--theme-border)] focus:ring-2 ring-brand-dark/20 text-sm font-medium text-gray-800 transition-all" placeholder="John Doe" />
                    </div>
                    <div>
                       <label className="text-[11px] font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">Mobile Number</label>
                       <input type="tel" value={newLeadPhone} onChange={e=>setNewLeadPhone(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--theme-border)] focus:ring-2 ring-brand-dark/20 text-sm font-medium text-gray-800 transition-all" placeholder="+91 9876543210" />
                    </div>
                 </div>
                 <div className="flex justify-end space-x-3">
                    <button type="button" onClick={()=>setShowAddModal(false)} className="px-5 py-2.5 font-bold text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 font-bold text-sm text-white bg-[var(--theme-bg)] hover:bg-teal-900 rounded-xl transition-transform hover:scale-105 active:scale-95 shadow-[0_4px_10px_rgba(17,74,67,0.2)]">Create Lead</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Premium Redesigned Contact Profile Slideover */}
      {showProfile && selectedContact && (
        <div className="fixed inset-0 z-[150] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowProfile(false)}>
           <div 
             className="w-[500px] h-full bg-white shadow-2xl flex flex-col animate-slide-left relative"
             onClick={(e) => e.stopPropagation()}
           >
              {/* Premium Header/Hero */}
              <div className="relative h-48 bg-[var(--theme-bg)] flex flex-col justify-end p-8 text-white">
                 <div className="absolute top-6 right-6 flex space-x-2">
                    <button onClick={() => setShowProfile(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-white backdrop-blur-md">
                       <X size={20} />
                    </button>
                 </div>
                 
                 <div className="flex items-end space-x-6 relative z-10 translate-y-12">
                    <div className="w-24 h-24 rounded-3xl bg-white p-1.5 shadow-2xl">
                       <div className="w-full h-full rounded-2xl bg-teal-50 text-[var(--theme-text)] flex items-center justify-center font-black text-3xl shadow-inner border border-teal-100/50">
                          {selectedContact.name?.charAt(0) || 'U'}
                       </div>
                    </div>
                    <div className="pb-2">
                       <div className="flex items-center space-x-3 mb-1">
                          <h2 className="text-2xl font-black text-slate-800 tracking-tight drop-shadow-sm leading-tight">{selectedContact.name}</h2>
                          <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            selectedContact.status === 'CLOSED_WON' ? 'bg-teal-100 text-teal-600' :
                            selectedContact.status === 'CLOSED_LOST' ? 'bg-rose-100 text-rose-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                             {selectedContact.status?.replace('_', ' ')}
                          </div>
                       </div>
                       <p className="text-xs font-bold text-slate-400 flex items-center">
                          <Phone size={12} className="mr-1.5 opacity-60" /> {selectedContact.phone}
                       </p>
                    </div>
                 </div>
              </div>

              {/* Tab Navigation */}
              <div className="mt-16 px-8 border-b border-slate-100 flex space-x-8">
                 {[
                   { id: 'overview', label: 'Overview', icon: LayoutGrid },
                   { id: 'activity', label: 'Activity', icon: History },
                   { id: 'chat', label: 'Chat Log', icon: MessageCircle },
                   { id: 'notes', label: 'Team Notes', icon: ClipboardList }
                 ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-4 flex items-center space-x-2 text-[11px] font-black uppercase tracking-widest transition-all relative ${
                        activeTab === tab.id ? 'text-[var(--theme-text)]' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                       <tab.icon size={14} />
                       <span>{tab.label}</span>
                       {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--theme-bg)] rounded-t-full shadow-[0_-2px_6px_rgba(0,0,0,0.1)] animate-scale-in"></div>
                       )}
                    </button>
                 ))}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                 {/* Overview Tab */}
                 {activeTab === 'overview' && (
                    <div className="space-y-8 animate-fade-in">
                       {/* Contact Info Cards */}
                       <div className="grid grid-cols-1 gap-6">
                          <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all group">
                             <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2 text-slate-400 group-hover:text-slate-600">
                                   <Mail size={14} strokeWidth={3} />
                                   <span className="text-[10px] font-black uppercase tracking-widest">Email Address</span>
                                </div>
                                <div className="w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                                   <Zap size={12} />
                                </div>
                             </div>
                             <input 
                               type="email" 
                               defaultValue={selectedContact.email} 
                               onBlur={(e) => updateContactDetail(selectedContact._id, { email: e.target.value })}
                               className="w-full bg-transparent text-sm font-black text-slate-700 outline-none placeholder:text-slate-200"
                               placeholder="Not provided"
                             />
                          </div>

                          <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all group">
                             <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2 text-slate-400 group-hover:text-slate-600">
                                   <MapPin size={14} strokeWidth={3} />
                                   <span className="text-[10px] font-black uppercase tracking-widest">Primary Location</span>
                                </div>
                                <div className="w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                                   <Target size={12} />
                                </div>
                             </div>
                             <textarea 
                               defaultValue={selectedContact.address} 
                               onBlur={(e) => updateContactDetail(selectedContact._id, { address: e.target.value })}
                               className="w-full bg-transparent text-sm font-black text-slate-700 outline-none placeholder:text-slate-200 resize-none"
                               placeholder="Not provided"
                               rows={2}
                             />
                          </div>
                       </div>

                       {/* Status Selection */}
                       <div className="space-y-4">
                          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                             <Activity size={14} className="mr-2" /> Pipeline Status
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                             {['NEW LEAD', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => updateContactDetail(selectedContact._id, { status })}
                                  className={`px-4 py-3 rounded-xl text-[10px] font-black transition-all text-left flex items-center border ${
                                    selectedContact.status === status 
                                    ? 'bg-[var(--theme-bg)] text-white border-transparent shadow-lg shadow-teal-900/20 scale-[1.02]' 
                                    : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                                  }`}
                                >
                                   <div className={`w-2 h-2 rounded-full mr-3 ${
                                      selectedContact.status === status ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-slate-200'
                                   }`}></div>
                                   {status.replace('_', ' ')}
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>
                 )}

                 {/* Activity Tab */}
                 {activeTab === 'activity' && (
                    <div className="space-y-6 animate-fade-in">
                       <div className="relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                          {(selectedContact.timeline || []).slice(-10).reverse().map((event, idx) => (
                             <div key={idx} className="relative pl-10 pb-8 last:pb-0 animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                                <div className="absolute left-0 top-1 w-6 h-6 rounded-xl bg-white border-2 border-slate-100 flex items-center justify-center z-10 shadow-sm">
                                   <div className="w-2 h-2 rounded-full bg-[var(--theme-border)]"></div>
                                </div>
                                <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                   <p className="text-xs font-black text-slate-700 leading-relaxed mb-1">{event.description}</p>
                                   <p className="text-[10px] text-slate-400 font-bold flex items-center uppercase tracking-tighter">
                                      <Clock size={10} className="mr-1" /> {new Date(event.timestamp).toLocaleString()}
                                   </p>
                                </div>
                             </div>
                          ))}
                          {(!selectedContact.timeline || selectedContact.timeline.length === 0) && (
                             <div className="ml-10 p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs font-bold text-slate-400">
                                <Info size={24} className="mx-auto mb-2 opacity-30" />
                                No activity milestones found.
                             </div>
                          )}
                       </div>
                    </div>
                 )}

                 {/* Chat Tab */}
                 {activeTab === 'chat' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 backdrop-blur-sm">
                           <div className="flex items-center justify-between mb-6">
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                 <MessageCircle size={14} className="mr-2" /> Recent Conversation
                              </h3>
                              <button onClick={() => fetchRecentMessages(selectedContact._id)} className={`p-1.5 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition shadow-sm ${isRefreshingMessages ? 'animate-spin' : ''}`}>
                                 <History size={14} className="text-slate-400" />
                              </button>
                           </div>
                           
                           <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                              {recentMessages.length > 0 ? recentMessages.map((msg, idx) => (
                                 <div key={idx} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-bold shadow-sm ${
                                      msg.direction === 'OUTBOUND' 
                                      ? 'bg-[var(--theme-bg)] text-white rounded-tr-none' 
                                      : 'bg-white text-slate-600 border border-slate-100 rounded-tl-none'
                                    }`}>
                                       {msg.content}
                                       <div className={`text-[8px] mt-1 opacity-60 ${msg.direction === 'OUTBOUND' ? 'text-white text-right' : 'text-slate-400 text-left'}`}>
                                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                       </div>
                                    </div>
                                 </div>
                              )) : (
                                 <div className="text-center py-10">
                                    <MessageCircle size={32} className="mx-auto mb-3 opacity-10 text-slate-900" />
                                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No chat logs found</p>
                                 </div>
                              )}
                           </div>

                           <button 
                             onClick={() => {
                               localStorage.setItem('activeChatId', selectedContact._id);
                               navigate('/inbox', { state: { selectedContact: selectedContact.phone } });
                             }}
                             className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-500 hover:text-[var(--theme-text)] hover:border-[var(--theme-border)] transition-all uppercase tracking-widest flex items-center justify-center shadow-sm active:scale-95"
                           >
                              Jump to Inbox <ExternalLink size={14} className="ml-2" />
                           </button>
                        </div>
                    </div>
                 )}

                 {/* Notes Tab */}
                 {activeTab === 'notes' && (
                    <div className="space-y-6 animate-fade-in">
                       <div className="relative">
                          <textarea 
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            placeholder="Type a team note here..."
                            rows={4}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-[var(--theme-border)] transition-all"
                          />
                          <button 
                            onClick={() => addInternalNote(selectedContact._id)}
                            disabled={isAddingNote || !noteInput.trim()}
                            className="absolute bottom-4 right-4 p-3 bg-[var(--theme-bg)] text-white rounded-xl shadow-lg shadow-teal-900/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 font-bold"
                          >
                             {isAddingNote ? <Clock size={18} className="animate-spin" /> : <Send size={18} />}
                          </button>
                       </div>

                       <div className="space-y-4 pb-10">
                          {(selectedContact.notes || []).slice().reverse().map((note, idx) => (
                             <div key={idx} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--theme-border)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center justify-between mb-3">
                                   <div className="flex items-center space-x-2">
                                      <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                                         <User size={12} strokeWidth={3} />
                                      </div>
                                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{note.createdBy || 'Agent'}</span>
                                   </div>
                                   <span className="text-[9px] font-bold text-slate-300 uppercase">{new Date(note.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm font-bold text-slate-600 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                             </div>
                          ))}
                          {(!selectedContact.notes || selectedContact.notes.length === 0) && (
                             <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <FileText size={32} className="mx-auto mb-3 opacity-10 text-slate-900" />
                                <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No team notes yet</p>
                             </div>
                          )}
                       </div>
                    </div>
                 )}
              </div>

              {/* Bottom Info Bar */}
              <div className="px-8 py-6 border-t border-slate-50 flex items-center justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50/30">
                 <div className="flex items-center">
                    <ShieldCheck size={14} className="mr-2 text-teal-600 opacity-40" /> 
                    Lead Score: <span className="text-slate-600 ml-1">{selectedContact.score || 0}</span>
                 </div>
                 <div className="flex items-center bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                    <Star size={12} className="mr-1.5 text-amber-500" />
                    Heat: <span className="text-slate-600 ml-1">{selectedContact.heatLevel || 'Cold'}</span>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
