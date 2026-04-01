import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, PlayCircle, Plus, ChevronDown, Download, Upload, Trash2, 
  MoreVertical, AlertCircle, Clock, Mail, MapPin, Phone, User, 
  MessageCircle, Calendar, CheckCircle2, X, ArrowUpRight, History,
  LayoutGrid, ClipboardList, Info, Star, Send, ExternalLink, ShieldCheck,
  Zap, Target, Activity, FileText, TrendingUp, Flame, Snowflake, Sun, Save,
  Briefcase, Building2, Linkedin, Globe
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
      <div className="mb-8 relative z-10 flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Active Contacts</h1>
            <p className="text-slate-400 mt-2 font-bold text-xs uppercase tracking-widest">Unified Lead database & relationship manager</p>
         </div>
         <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <div className="text-right pr-4 border-r border-slate-200">
               <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Total Database</p>
               <p className="text-xl font-black text-slate-800 tracking-tighter">{contacts.length}</p>
            </div>
            <div className="pl-4">
               <p className="text-[10px] font-black text-teal-600 tracking-widest uppercase">High Intent</p>
               <p className="text-xl font-black text-teal-700 tracking-tighter">{contacts.filter(c => c.score > 70).length}</p>
            </div>
         </div>
      </div>

      <div className="flex justify-between items-center mb-6 relative z-10 w-full max-w-5xl">
          <div className="relative w-80">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
             <input 
               type="text" 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Search name or mobile number" 
               className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-teal-100 transition-all font-bold text-slate-700 placeholder-slate-300"
             />
          </div>
          <div className="flex items-center space-x-3">
             <button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition shadow-lg shadow-slate-900/10 active:scale-95">
                <Plus size={16} />
                <span>Add Contact</span>
             </button>
             <button onClick={handleExport} className="flex items-center space-x-2 border border-slate-200 text-slate-500 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition active:scale-95">
                <Download size={14} />
                <span>Export</span>
             </button>
          </div>
      </div>

      {selectedIds.length > 0 && (
         <div className="flex items-center justify-between bg-slate-800 border border-slate-700 p-4 rounded-2xl mb-6 animate-fade-in-up w-full max-w-5xl shadow-xl">
             <div className="flex items-center space-x-3 text-sm font-black text-white px-2">
                <span className="bg-teal-500 text-white px-2 py-0.5 rounded-lg text-[10px]">{selectedIds.length}</span>
                <span className="uppercase tracking-widest text-[11px]">Contacts Selected</span>
             </div>
             <div className="flex items-center space-x-2">
                <button onClick={() => handleBulkAction('archive_leads')} className="px-4 py-2 bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-600 transition">Archive Selected</button>
                <button onClick={() => handleBulkAction('hard_delete_leads')} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition">Hard Delete</button>
             </div>
         </div>
      )}

      <div className="flex-1 w-full max-w-5xl overflow-y-auto custom-scrollbar">
        <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm mb-8 bg-white">
          <table className="w-full text-left border-collapse">
             <thead>
               <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="py-4 px-6 w-12">
                    <input type="checkbox" className="w-4 h-4 accent-teal-600 rounded-lg cursor-pointer" checked={selectedIds.length > 0 && selectedIds.length === filteredContacts.length} onChange={toggleSelectAll} />
                  </th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Identity</th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Profession / Org</th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Engagement IQ</th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-slate-400">Intent</th>
                  <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
               </tr>
             </thead>
             <tbody>
               {filteredContacts.map((c, i) => (
                 <tr key={c._id || i} onClick={() => handleRowClick(c)} className={`${i % 2 === 0 ? 'bg-[#fbfbfb]' : 'bg-white'} cursor-pointer hover:bg-slate-50 transition-all group relative border-b border-slate-50/50`}>
                    <td className="py-5 px-6" onClick={(e) => e.stopPropagation()}>
                       <input type="checkbox" className="w-4 h-4 accent-teal-600 rounded-lg cursor-pointer" checked={selectedIds.includes(c._id)} onChange={() => toggleSelect(c._id)} />
                    </td>
                    <td className="py-5 px-6">
                       <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-sm group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                             {c.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-800 leading-none mb-1">{c.name}</p>
                             <p className="text-[10px] font-bold text-slate-400">{c.phone}</p>
                          </div>
                       </div>
                    </td>
                    <td className="py-5 px-6">
                       {c.profession ? (
                          <div className="flex items-center space-x-1.5">
                             <Briefcase size={12} className="text-slate-300" />
                             <span className="text-xs font-bold text-slate-600">{c.profession}</span>
                          </div>
                       ) : <span className="text-[10px] font-bold text-slate-200">Not Discovered</span>}
                       {c.companyName && <p className="text-[10px] font-black text-teal-600 uppercase tracking-tighter mt-0.5">{c.companyName}</p>}
                    </td>
                    <td className="py-5 px-6">
                       <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-slate-100 h-1.5 w-16 rounded-full overflow-hidden">
                             <div className="bg-teal-500 h-full" style={{ width: `${c.score || 0}%` }}></div>
                          </div>
                          <span className="text-[10px] font-black text-slate-400">{c.score || 0}%</span>
                       </div>
                    </td>
                    <td className="py-5 px-6">
                       <div className={`inline-flex items-center px-2 py-1 rounded-lg ${
                          c.heatLevel === 'Hot' ? 'bg-rose-50 text-rose-500' : 
                          c.heatLevel === 'Warm' ? 'bg-amber-50 text-amber-500' : 
                          'bg-blue-50 text-blue-400'
                       }`}>
                          {c.heatLevel === 'Hot' ? <Flame size={12} className="mr-1" /> : 
                           c.heatLevel === 'Warm' ? <Sun size={12} className="mr-1" /> : 
                           <Snowflake size={12} className="mr-1" />}
                          <span className="text-[9px] font-black uppercase tracking-widest">{c.heatLevel || 'Cold'}</span>
                       </div>
                    </td>
                    <td className="py-5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                       <button onClick={() => setActiveDropdown(activeDropdown === c._id ? null : c._id)} className="p-2 text-slate-300 hover:text-slate-800 transition-colors">
                          <MoreVertical size={18} />
                       </button>
                    </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>
      </div>

      {/* Professional Redesigned Contact Profile Slideover */}
      {showProfile && selectedContact && editedContact && (
        <div className="fixed inset-0 z-[150] flex justify-end bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowProfile(false)}>
           <div 
             className="w-[580px] h-full bg-white shadow-2xl flex flex-col animate-slide-left relative overflow-hidden"
             onClick={(e) => e.stopPropagation()}
           >
              {/* Profile Header Hero - High Polish */}
              <div className="relative h-44 bg-slate-800 flex flex-col justify-end p-8 text-white">
                 <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Briefcase size={120} />
                 </div>
                 <div className="absolute top-6 right-6 z-20">
                    <button onClick={() => setShowProfile(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-white backdrop-blur-md">
                       <X size={20} />
                    </button>
                 </div>
                 
                 <div className="flex items-end space-x-6 relative z-10 translate-y-12">
                    <div className="w-28 h-28 rounded-3xl bg-white p-1 shadow-2xl overflow-hidden">
                       <div className="w-full h-full rounded-[20px] bg-slate-50 text-slate-800 flex items-center justify-center font-black text-5xl shadow-inner border border-slate-200/50">
                          {selectedContact.name?.charAt(0) || 'U'}
                       </div>
                    </div>
                    <div className="pb-3 flex-1">
                       <div className="flex flex-col space-y-1">
                          <input 
                             value={editedContact.name} 
                             onChange={(e) => handleFieldChange('name', e.target.value)}
                             className="text-2xl font-black text-slate-800 bg-transparent outline-none border-b-2 border-transparent focus:border-teal-500/30 transition-all font-sans tracking-tight"
                             placeholder="Contact Identity"
                          />
                          <div className="flex items-center space-x-3">
                             <span className="text-xs font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100/50">
                                {editedContact.profession || 'Lead Professional'}
                             </span>
                             <span className="text-[10px] font-bold text-slate-400 flex items-center">
                                <Phone size={10} className="mr-1" /> {editedContact.phone}
                             </span>
                          </div>
                       </div>
                    </div>
                    {editedContact.linkedinUrl && (
                       <a href={editedContact.linkedinUrl} target="_blank" rel="noreferrer" className="p-3 bg-white shadow-xl rounded-2xl text-[#0077B5] hover:scale-110 active:scale-95 transition-all self-center translate-y-6 flex items-center justify-center">
                          <Linkedin size={20} fill="#0077B5" strokeWidth={0} />
                       </a>
                    )}
                 </div>
              </div>

              {/* Engagement Status Bar */}
              <div className="mt-16 px-8 flex items-center space-x-6 pb-6 border-b border-slate-100">
                 <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center space-x-2">
                          <ShieldCheck size={14} className="text-teal-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Verified CRM Score</span>
                       </div>
                       <span className="text-[10px] font-black text-slate-400">{editedContact.score || 0}% Ready</span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 border border-slate-100 rounded-full overflow-hidden p-0.5">
                       <div className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all duration-1000" style={{ width: `${editedContact.score || 0}%` }}></div>
                    </div>
                 </div>
                 <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                    {['Cold', 'Warm', 'Hot'].map(lvl => (
                       <button key={lvl} onClick={() => handleFieldChange('heatLevel', lvl)} className={`p-2 rounded-xl transition-all ${editedContact.heatLevel === lvl ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-300 hover:text-slate-400'}`}>
                          {lvl === 'Hot' ? <Flame size={14} /> : lvl === 'Warm' ? <Sun size={14} /> : <Snowflake size={14} />}
                       </button>
                    ))}
                 </div>
              </div>

              {/* Professional Tabs */}
              <div className="px-8 flex space-x-8 bg-white border-b border-slate-50">
                 {[
                   { id: 'overview', label: 'Identity & Discovery', icon: LayoutGrid },
                   { id: 'activity', label: 'Timeline History', icon: History },
                   { id: 'chat', label: 'Communication Hub', icon: MessageCircle },
                   { id: 'notes', label: 'Agent Workspace', icon: ClipboardList }
                 ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pt-5 pb-4 flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                        activeTab === tab.id ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                       <tab.icon size={14} />
                       <span>{tab.label}</span>
                       {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500 rounded-t-full shadow-[0_-4px_10px_rgba(20,184,166,0.3)] animate-scale-in"></div>}
                    </button>
                 ))}
              </div>

              {/* Pro Content Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-50/20">
                 {activeTab === 'overview' && (
                    <div className="space-y-8 animate-fade-in">
                       {/* Professional Profile Section */}
                       <div className="space-y-4">
                          <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center">
                             <Briefcase size={14} className="mr-2 text-teal-600" /> Professional Persona
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 ring-teal-50 transition-all">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Job Designation</label>
                                 <input 
                                   value={editedContact.profession || ''}
                                   onChange={(e) => handleFieldChange('profession', e.target.value)}
                                   className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none"
                                   placeholder="Chief Executive Officer..."
                                 />
                              </div>
                              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 ring-teal-50 transition-all">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Company / Organization</label>
                                 <input 
                                   value={editedContact.companyName || ''}
                                   onChange={(e) => handleFieldChange('companyName', e.target.value)}
                                   className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none"
                                   placeholder="Apple Inc."
                                 />
                              </div>
                              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm col-span-2 group">
                                 <div className="flex items-center justify-between mb-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">LinkedIn Professional Profile</label>
                                    <Linkedin size={10} className="text-slate-300 group-focus-within:text-[#0077B5] transition-colors" />
                                 </div>
                                 <input 
                                   value={editedContact.linkedinUrl || ''}
                                   onChange={(e) => handleFieldChange('linkedinUrl', e.target.value)}
                                   className="w-full bg-transparent text-xs font-bold text-slate-600 outline-none"
                                   placeholder="https://linkedin.com/in/username"
                                 />
                              </div>
                          </div>
                       </div>

                       {/* Lead Discovery section */}
                       <div className="space-y-4">
                          <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center">
                             <TrendingUp size={14} className="mr-2 text-teal-600" /> Sales Intelligence
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                 <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Est. Budget Range</label>
                                 <select value={editedContact.budget || ''} onChange={(e) => handleFieldChange('budget', e.target.value)} className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer">
                                    <option value="">Undiscovered</option>
                                    <option value="Under 50k">Under 50k</option>
                                    <option value="50k - 1L">50k - 1L</option>
                                    <option value="1L - 5L">1L - 5L</option>
                                    <option value="Above 5L">Above 5L</option>
                                 </select>
                              </div>
                              <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                 <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Purchase Intent Velocity</label>
                                 <select value={editedContact.purchaseTimeline || ''} onChange={(e) => handleFieldChange('purchaseTimeline', e.target.value)} className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer">
                                    <option value="">Unknown</option>
                                    <option value="Immediate">Immediate Execution</option>
                                    <option value="Within 1 Month">Within 1 Month</option>
                                    <option value="1-3 Months">1-3 Months window</option>
                                    <option value="Long Term">Strategic Lead</option>
                                 </select>
                              </div>
                          </div>
                       </div>

                       {/* Contact Details */}
                       <div className="space-y-4 pb-12">
                          <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center">
                             <Globe size={14} className="mr-2 text-teal-600" /> Reachability
                          </h3>
                          <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
                             <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</span>
                                <input value={editedContact.email || ''} onChange={(e) => handleFieldChange('email', e.target.value)} placeholder="name@company.com" className="text-right text-xs font-black text-slate-700 outline-none w-1/2" />
                             </div>
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Office Location</span>
                                <input value={editedContact.address || ''} onChange={(e) => handleFieldChange('address', e.target.value)} placeholder="City, Country" className="text-right text-xs font-black text-slate-700 outline-none w-1/2" />
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {activeTab === 'activity' && (
                    <div className="space-y-6 animate-fade-in relative">
                       <div className="absolute left-[11px] top-4 bottom-4 w-px bg-slate-200"></div>
                       {(selectedContact.timeline || []).slice().reverse().map((event, idx) => (
                          <div key={idx} className="relative pl-10 animate-fade-in-up">
                             <div className="absolute left-0 top-1 w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center z-10"><div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div></div>
                             <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm"><p className="text-xs font-black text-slate-800 mb-1 leading-relaxed">{event.description}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{new Date(event.timestamp).toLocaleString()}</p></div>
                          </div>
                       ))}
                    </div>
                 )}

                 {activeTab === 'chat' && (
                    <div className="space-y-6 animate-fade-in">
                       <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/20">
                           <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
                              <h3 className="text-[9px] font-black text-slate-800 uppercase tracking-widest flex items-center"><MessageCircle size={14} className="mr-3 text-teal-600" /> Verified Inbox Log</h3>
                              <button onClick={() => fetchRecentMessages(selectedContact._id)} className={`p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition ${isRefreshingMessages ? 'animate-spin' : ''}`}><History size={16} className="text-slate-400" /></button>
                           </div>
                           <div className="space-y-4 mb-8">
                              {recentMessages.map((msg, idx) => (
                                 <div key={idx} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-3.5 rounded-2xl text-[11px] font-bold shadow-sm ${msg.direction === 'OUTBOUND' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-slate-50 text-slate-700 rounded-tl-none'}`}>{msg.content}</div>
                                 </div>
                              ))}
                           </div>
                           <button onClick={() => { localStorage.setItem('activeChatId', selectedContact._id); navigate('/inbox', { state: { selectedContact: selectedContact.phone } }); }} className="w-full py-4 border-2 border-slate-800 text-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all shadow-lg active:scale-95">Initiate Full Chat Session</button>
                       </div>
                    </div>
                 )}

                 {activeTab === 'notes' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="relative">
                           <textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder="Internal workspace notes..." className="w-full bg-white border border-slate-200 rounded-2xl p-6 text-sm font-bold text-slate-800 outline-none focus:ring-4 ring-teal-50 transition-all shadow-sm" rows={5} />
                           <button onClick={() => addInternalNote(selectedContact._id)} disabled={isAddingNote || !noteInput.trim()} className="absolute bottom-6 right-6 px-4 py-2.5 bg-slate-800 text-white rounded-xl shadow-xl hover:bg-black transition-all flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest">
                              {isAddingNote ? <Clock size={16} className="animate-spin" /> : <><Send size={16} /><span>Post Entry</span></>}
                           </button>
                        </div>
                        <div className="space-y-4 pb-12">
                           {(selectedContact.notes || []).slice().reverse().map((note, idx) => (
                              <div key={idx} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                 <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
                                    <div className="flex items-center space-x-2">
                                       <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-black text-xs uppercase">{note.createdBy?.charAt(0) || 'A'}</div>
                                       <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{note.createdBy || 'Active Agent'}</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-300 uppercase">{new Date(note.createdAt).toLocaleDateString()}</span>
                                 </div>
                                 <p className="text-sm font-bold text-slate-600 leading-relaxed italic">"{note.content}"</p>
                              </div>
                           ))}
                        </div>
                    </div>
                 )}
              </div>

              {/* Pro Fixed Profile Action Button */}
              <div className={`absolute bottom-8 left-0 right-0 flex justify-center z-50 transition-all duration-500 translate-y-0 ${showSaveFab ? 'opacity-100' : 'opacity-0 translate-y-20 pointer-events-none'}`}>
                 <button 
                   onClick={() => updateContactDetail(selectedContact._id, editedContact)}
                   disabled={isUpdatingContact}
                   className="bg-slate-800 text-white px-10 py-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:bg-black hover:scale-105 active:scale-95 transition-all flex items-center space-x-4 group border border-white/10"
                 >
                    {isUpdatingContact ? <Clock size={20} className="animate-spin" /> : <Save size={20} className="group-hover:rotate-12 transition-transform" />}
                    <span className="text-xs font-black uppercase tracking-widest">Save Professional Profile</span>
                 </button>
              </div>

              {/* Professional Branding Footer */}
              <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white">
                 <div className="flex items-center"><Target size={12} className="mr-2 text-teal-600" /> Pro Record ID: {selectedContact._id.toString().slice(-8)}</div>
                 <div className="flex items-center space-x-4">
                    <span className="text-[#0077B5] font-black">Connected via LinkedIn CRM API</span>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Add Contact Modal - Professional */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={() => setShowAddModal(false)}>
           <div className="bg-white p-10 rounded-[32px] w-[420px] shadow-2xl animate-pop-in border border-slate-100" onClick={e=>e.stopPropagation()}>
              <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Onboard New Contact</h2>
              <p className="text-[10px] font-black text-slate-400 mb-8 uppercase tracking-[0.2em] border-b border-slate-50 pb-4">Professional Data Entry</p>
              <form onSubmit={handleAddContact} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-800 mb-2 block uppercase tracking-widest">Full Name</label>
                    <input autoFocus type="text" value={newLeadName} onChange={e=>setNewLeadName(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 outline-none focus:border-teal-500 focus:bg-white transition-all text-sm font-bold text-slate-700" placeholder="e.g. Samuel L. Jackson" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-800 mb-2 block uppercase tracking-widest">Verified Mobile</label>
                    <input type="tel" value={newLeadPhone} onChange={e=>setNewLeadPhone(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 outline-none focus:border-teal-500 focus:bg-white transition-all text-sm font-bold text-slate-700" placeholder="+1 XXX XXX XXXX" />
                 </div>
                 <div className="flex pt-4 space-x-3">
                    <button type="button" onClick={()=>setShowAddModal(false)} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition">Cancel</button>
                    <button type="submit" className="flex-1 py-4 font-black text-[10px] text-white bg-slate-800 hover:bg-black uppercase tracking-widest rounded-2xl shadow-xl transition active:scale-95">Securely Add Contact</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
