import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Search, Plus, X, Mail, MapPin, Phone, Users, 
  Clock, Activity, Target, Tag, Save, Filter, 
  Briefcase, Building2, Download, MoreVertical, 
  Flame, Sun, Snowflake, ArrowUpRight, Send, ShieldCheck, History, Calendar, CheckCircle2, TrendingUp, Globe, Smartphone, Bell, Landmark, Hash, Wallet
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
               setShowSaveFab(false); // Reset on refresh
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
        toast.success("Profile Updated Successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes");
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
      (c.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
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
    <div className="bg-crm-bg min-h-screen flex flex-col animate-fade-in font-sans tracking-normal text-slate-800">
      <div className="bg-white border-b border-gray-100 px-8 py-4 sticky top-0 z-40 flex items-center justify-between shadow-sm">
         <div>
            <h1 className="text-sm font-black text-gray-400 tracking-wider uppercase flex items-center">
               <Users className="mr-2 text-[var(--theme-text)]" size={16} /> Workspace Database
            </h1>
         </div>
         <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 text-xs">
               <div className="text-right">
                  <p className="text-gray-400 font-bold uppercase tracking-tighter text-[9px]">Total</p>
                  <p className="font-bold text-gray-800">{contacts.length}</p>
               </div>
               <div className="w-[1px] h-6 bg-gray-100 mx-2"></div>
               <div>
                  <p className="text-[var(--theme-text)] font-bold uppercase tracking-tighter text-[9px]">High Priority</p>
                  <p className="font-bold text-gray-800">{contacts.filter(c => c.score > 70).length}</p>
               </div>
            </div>
            <button 
              onClick={() => setShowAddModal(true)} 
              className="px-5 py-2.5 bg-[var(--theme-bg)] text-white text-xs font-black rounded-xl hover:shadow-glow transition transform hover:-translate-y-0.5 active:scale-95 uppercase tracking-widest"
            >
               <span>Add Profile</span>
            </button>
         </div>
      </div>

      <div className="p-8 flex-1 flex flex-col max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Contact Workspace</h2>
              <div className="flex items-center space-x-3">
                 <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-300" size={16} />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search identity or mobile..." 
                      className="bg-white border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-gray-700 placeholder-gray-300 focus:ring-4 focus:ring-[var(--theme-border)]/10 outline-none transition-all w-[320px]"
                    />
                 </div>
                 <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-[var(--theme-text)] hover:border-[var(--theme-border)]/50 transition shadow-sm"><Filter size={18} /></button>
              </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-premium overflow-hidden">
             <div className="overflow-x-auto h-full custom-scrollbar">
                <table className="w-full text-left border-collapse">
                   <thead className="bg-[#fcf8f8]/50 border-b border-gray-100">
                     <tr>
                        <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Profile Identity</th>
                        <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Current Phase</th>
                        <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Lead Health</th>
                        <th className="py-5 px-8 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {filteredContacts.map((c, i) => (
                       <tr key={c._id || i} onClick={() => handleRowClick(c)} className="cursor-pointer group hover:bg-[#fafafa] transition-colors relative after:absolute after:left-0 after:top-0 after:bottom-0 after:w-0 group-hover:after:w-1 after:bg-[var(--theme-bg)] after:transition-all">
                          <td className="py-5 px-6 border-b border-gray-50">
                             <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center font-black text-sm group-hover:bg-[var(--theme-bg)] group-hover:text-white transition-colors">
                                   {c.firstName ? c.firstName.charAt(0) : (c.name?.charAt(0) || 'U')}
                                </div>
                                <div>
                                   <p className="text-[13px] font-bold text-slate-800 leading-none mb-1.5">
                                      {c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : (c.name || 'Unknown User')}
                                   </p>
                                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{c.phone}</p>
                                </div>
                             </div>
                          </td>
                          <td className="py-5 px-6 border-b border-gray-50">
                             <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                c.pipelineStage === 'Closing' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                             }`}>{c.pipelineStage || 'Discovery'}</span>
                          </td>
                          <td className="py-5 px-6 border-b border-gray-50">
                             <div className="flex items-center space-x-3">
                                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                   <div className={`h-full transition-all ${c.score > 70 ? 'bg-green-500 shadow-glow' : 'bg-blue-500'}`} style={{ width: `${c.score || 0}%` }}></div>
                                </div>
                                <span className="text-[10px] font-black text-gray-400">{c.score || 0}%</span>
                             </div>
                          </td>
                          <td className="py-5 px-8 border-b border-gray-50 text-right">
                             <button className="p-2 text-gray-300 hover:text-slate-800 transition-colors"><MoreVertical size={18} /></button>
                          </td>
                       </tr>
                     ))}
                   </tbody>
                </table>
             </div>
          </div>
      </div>

      {showProfile && selectedContact && editedContact && (
        <div className="fixed inset-0 z-[150] flex justify-end bg-slate-900/40 backdrop-blur-[4px] animate-fade-in" onClick={() => setShowProfile(false)}>
           <div 
             className="w-[920px] h-full bg-white shadow-3xl flex flex-col animate-slide-up relative"
             onClick={(e) => e.stopPropagation()}
           >
              {/* THEME SYNCHRONIZED HEADER */}
              <div className="bg-[var(--theme-bg)] p-8 text-white relative shadow-2xl shrink-0 flex items-center justify-between z-10 border-b border-white/10">
                  <div className="flex items-center space-x-6 flex-1">
                      <div className="relative group">
                         <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center font-black text-2xl text-white transform group-hover:scale-105 transition-transform">
                            {editedContact.firstName ? editedContact.firstName.charAt(0) : (selectedContact.name?.charAt(0) || 'U')}
                         </div>
                         <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border-4 border-[var(--theme-bg)] rounded-full flex items-center justify-center text-[10px] font-black text-[var(--theme-text)] shadow-xl">{editedContact.score || 0}%</div>
                      </div>
                      <div className="flex-1">
                          <h2 className="text-2xl font-black tracking-tight mb-1">
                             {editedContact.firstName && editedContact.lastName ? `${editedContact.firstName} ${editedContact.lastName}` : (editedContact.name || 'Profile Identity')}
                          </h2>
                          <div className="flex items-center space-x-4 opacity-70">
                             <span className="flex items-center text-[10px] font-black uppercase tracking-[0.2em]"><Phone size={10} className="mr-2" /> {editedContact.phone}</span>
                             <span className="w-1.5 h-1.5 bg-white/40 rounded-full"></span>
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white underline underline-offset-4 decoration-white/30">{editedContact.status || 'Active Record'}</span>
                          </div>
                      </div>
                  </div>

                  <div className="flex items-center space-x-4">
                      {/* FIXED SAVE/FINALIZE BUTTON (NOW BRAND COLOR) */}
                      <button 
                        onClick={() => updateContactDetail(selectedContact._id, editedContact)}
                        disabled={!showSaveFab || isUpdatingContact}
                        className={`flex items-center space-x-3 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all shadow-xl border border-white/20 ${
                          showSaveFab 
                          ? 'bg-white text-[var(--theme-text)] hover:shadow-glow hover:-translate-y-0.5 active:scale-95' 
                          : 'bg-white/10 text-white/40 cursor-not-allowed'
                        }`}
                      >
                         {isUpdatingContact ? <Clock size={16} className="animate-spin" /> : <Save size={16} />}
                         <span>Finalize Record</span>
                      </button>
                      <button onClick={() => setShowProfile(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all"><X size={20} /></button>
                  </div>
              </div>

              {/* THEME SYNCHRONIZED PIPELINE + CLICK SAFETY */}
              <div className="bg-[var(--theme-bg)] relative z-[100] px-8 pb-8 pt-2 flex items-center justify-between shrink-0 shadow-inner overflow-x-auto no-scrollbar pointer-events-auto">
                  <div className="flex items-center flex-1 min-w-[700px] pointer-events-auto">
                      {PIPELINE_STAGES.map((stage, idx) => (
                         <React.Fragment key={stage}>
                            <button 
                              onClick={() => {
                                 console.log("Pipeline Stage Clicked:", stage);
                                 handleFieldChange('pipelineStage', stage);
                              }}
                              className={`flex flex-col items-center group relative z-[110] px-2 py-1 cursor-pointer pointer-events-auto ${idx < PIPELINE_STAGES.length - 1 ? 'flex-1' : ''}`}
                            >
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black transition-all border-4 shadow-xl ${
                                  editedContact.pipelineStage === stage 
                                  ? 'bg-white border-white/30 text-[var(--theme-text)] scale-110' 
                                  : PIPELINE_STAGES.indexOf(editedContact.pipelineStage) >= idx 
                                    ? 'bg-white/30 border-white/20 text-white' 
                                    : 'bg-white/5 border-white/5 text-white/30 hover:border-white/40'
                               }`}>
                                  {PIPELINE_STAGES.indexOf(editedContact.pipelineStage) > idx ? <CheckCircle2 size={18} /> : idx + 1}
                               </div>
                               <span className={`mt-3 text-[10px] font-black uppercase tracking-widest transition-all ${editedContact.pipelineStage === stage ? 'opacity-100 text-white' : 'opacity-40 group-hover:opacity-100 text-white'}`}>{stage}</span>
                            </button>
                            {idx < PIPELINE_STAGES.length - 1 && <div className={`flex-1 h-0.5 mb-8 transition-colors ${PIPELINE_STAGES.indexOf(editedContact.pipelineStage) > idx ? 'bg-white/40' : 'bg-white/10'}`}></div>}
                         </React.Fragment>
                      ))}
                  </div>
              </div>

              <div className="flex-1 flex overflow-hidden bg-[#fafafa]">
                 {/* REORGANIZED LEFT PANEL (GROUPED 1, 2, 3, 4) */}
                 <div className="w-[360px] bg-white border-r border-[#f1f1f1] overflow-y-auto custom-scrollbar p-7 space-y-9 shadow-inner">
                    {/* SECTION 1: BASIC INFORMATION */}
                    <section className="space-y-4">
                       <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center">
                          <Users size={12} className="mr-2" /> 1. Basic Information
                       </h3>
                       <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-[#f9fafb] rounded-xl border border-transparent focus-within:border-[var(--theme-border)] focus-within:bg-white transition-all">
                             <label className="text-[8px] font-black text-slate-400 uppercase block mb-1.5">First Name</label>
                             <input value={editedContact.firstName || ''} onChange={e=>handleFieldChange('firstName', e.target.value)} className="w-full text-xs font-bold text-slate-700 outline-none bg-transparent" />
                          </div>
                          <div className="p-3 bg-[#f9fafb] rounded-xl border border-transparent focus-within:border-[var(--theme-border)] focus-within:bg-white transition-all">
                             <label className="text-[8px] font-black text-slate-400 uppercase block mb-1.5">Last Name</label>
                             <input value={editedContact.lastName || ''} onChange={e=>handleFieldChange('lastName', e.target.value)} className="w-full text-xs font-bold text-slate-700 outline-none bg-transparent" />
                          </div>
                       </div>
                       <div className="p-3 bg-[#f9fafb] rounded-xl border border-transparent focus-within:border-[var(--theme-border)] focus-within:bg-white transition-all">
                          <label className="text-[8px] font-black text-slate-400 uppercase block mb-1.5 underline underline-offset-4 decoration-[var(--theme-bg)]/20">Mobile Number (Primary)</label>
                          <div className="flex items-center space-x-2 text-xs font-bold text-slate-500"><Phone size={12} /> <span>{editedContact.phone}</span></div>
                       </div>
                       <div className="p-3 bg-[#f9fafb] rounded-xl border border-transparent focus-within:border-[var(--theme-border)] focus-within:bg-white transition-all">
                          <label className="text-[8px] font-black text-slate-400 uppercase block mb-1.5">Mobile Number (Secondary)</label>
                          <div className="flex items-center space-x-2">
                             <Smartphone size={13} className="text-slate-300" />
                             <input value={editedContact.secondaryPhone || ''} onChange={e=>handleFieldChange('secondaryPhone', e.target.value)} placeholder="Add alt number..." className="w-full text-xs font-bold text-slate-700 outline-none bg-transparent" />
                          </div>
                       </div>
                       
                       <div className="bg-[#f9fafb] rounded-xl border border-transparent focus-within:border-[var(--theme-border)] focus-within:bg-white transition-all p-3 space-y-3">
                           <label className="text-[8px] font-black text-slate-400 uppercase block tracking-widest">Office / Resi. Address</label>
                           <textarea value={editedContact.address || ''} onChange={e=>handleFieldChange('address', e.target.value)} placeholder="Full street address..." className="w-full bg-transparent border-none text-[11px] font-semibold text-slate-700 outline-none resize-none" rows={2}/>
                           <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                               <div className="flex items-center space-x-2 bg-white px-2 py-1.5 rounded-lg border border-slate-50">
                                   <Landmark size={10} className="text-slate-300" />
                                   <input value={editedContact.state || ''} onChange={e=>handleFieldChange('state', e.target.value)} placeholder="State" className="w-full text-[10px] font-bold outline-none" />
                               </div>
                               <div className="flex items-center space-x-2 bg-white px-2 py-1.5 rounded-lg border border-slate-50">
                                   <Hash size={10} className="text-slate-300" />
                                   <input value={editedContact.pincode || ''} onChange={e=>handleFieldChange('pincode', e.target.value)} placeholder="Pincode" className="w-full text-[10px] font-bold outline-none" />
                               </div>
                           </div>
                       </div>

                       <div className="p-4 bg-[var(--theme-bg)]/5 rounded-2xl border border-[var(--theme-border)]/10">
                          <h3 className="text-[9px] font-black text-[var(--theme-text)] uppercase tracking-[0.2em] mb-3">Target Lead Status</h3>
                          <select 
                            value={editedContact.status} 
                            onChange={(e) => handleFieldChange('status', e.target.value)}
                            className="w-full bg-white border border-slate-100 text-xs font-black py-2.5 px-4 rounded-xl outline-none shadow-sm cursor-pointer"
                          >
                             {['NEW LEAD', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'].map(s => (
                                <option key={s} value={s}>{s.replace('_', ' ')}</option>
                             ))}
                          </select>
                       </div>
                    </section>

                    {/* SECTION 2: QUALIFICATION */}
                    <section className="space-y-4 pt-4 border-t border-slate-50">
                       <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center">
                          <CheckCircle2 size={12} className="mr-2" /> 2. Qualification
                       </h3>
                       <div className="bg-slate-50 p-4 rounded-2xl space-y-4">
                           <div className="flex items-center justify-between">
                               <span className="text-[8px] font-black text-slate-400 uppercase">Profiling Score</span>
                               <span className="text-xs font-black text-blue-600">{editedContact.score || 0}% Complete</span>
                           </div>
                           <div className="w-full h-1.5 bg-white rounded-full overflow-hidden border border-slate-100">
                               <div className="h-full bg-blue-500 shadow-glow" style={{ width: `${editedContact.score || 0}%` }}></div>
                           </div>
                           <textarea value={editedContact.qualification || ''} onChange={e=>handleFieldChange('qualification', e.target.value)} placeholder="Enter qualification details..." className="w-full bg-white border border-slate-100 rounded-xl p-3 text-[11px] font-semibold text-slate-600 outline-none" rows={3}/>
                           <div className="grid grid-cols-2 gap-3">
                               <div className="p-2.5 bg-white rounded-xl border border-slate-100 italic flex items-center space-x-2">
                                  <Flame size={12} className={editedContact.heatLevel === 'Hot' ? 'text-red-500' : 'text-slate-300'} />
                                  <select value={editedContact.heatLevel} onChange={e=>handleFieldChange('heatLevel', e.target.value)} className="bg-transparent outline-none text-[10px] font-black text-slate-700 w-full">
                                     {['Cold', 'Warm', 'Hot'].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                                  </select>
                               </div>
                               <div className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center space-x-2">
                                  <Wallet size={12} className="text-slate-300" />
                                  <input value={editedContact.budget || ''} onChange={e=>handleFieldChange('budget', e.target.value)} placeholder="Budget" className="w-full text-[10px] font-black bg-transparent outline-none" />
                               </div>
                           </div>
                       </div>
                    </section>

                    {/* SECTION 4: LEAD INTELLIGENCE (Grouped here for density) */}
                    <section className="space-y-4 pt-4 border-t border-slate-50">
                       <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center">
                          <Target size={12} className="mr-2" /> 3. Lead Intelligence
                       </h3>
                       <div className="grid grid-cols-1 gap-3">
                          <div className="p-4 bg-slate-900 rounded-2xl shadow-xl">
                             <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2">Est. Deal Value</label>
                             <div className="flex items-center space-x-3">
                                <span className="text-xl font-black text-white opacity-40">₹</span>
                                <input type="number" value={editedContact.estimatedValue || 0} onChange={e=>handleFieldChange('estimatedValue', e.target.value)} className="bg-transparent text-2xl font-black text-white outline-none w-full placeholder-white/10" />
                             </div>
                          </div>
                          <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center space-x-3">
                             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Globe size={14} /></div>
                             <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase block">Origination Source</label>
                                <select value={editedContact.leadSource || 'Manual Entry'} onChange={e=>handleFieldChange('leadSource', e.target.value)} className="text-[11px] font-black text-slate-700 outline-none cursor-pointer">
                                   {['Manual Entry', 'Meta Ads', 'Google Ads', 'Referral', 'Email Campaign', 'WhatsApp Blast'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                             </div>
                          </div>
                       </div>
                    </section>
                 </div>

                 {/* RIGHT PANEL: LOGS & TIMELINE */}
                 <div className="flex-1 flex flex-col overflow-hidden relative">
                    <div className="px-8 flex space-x-10 border-b border-[#f1f1f1] bg-white z-10 shrink-0">
                       {['Timeline', 'Chat log', 'Internal Notes'].map(tab => (
                          <button key={tab} onClick={() => setActiveTab(tab.toLowerCase().replace(' ', ''))} className={`py-6 text-[10px] font-black uppercase tracking-[0.25em] relative transition-all ${activeTab === tab.toLowerCase().replace(' ', '') ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
                             {tab}
                             {activeTab === tab.toLowerCase().replace(' ', '') && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--theme-bg)] rounded-t-full"></div>}
                          </button>
                       ))}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fcfcfc] p-8 space-y-8">
                       {/* NEXT FOLLOW UP REMINDER */}
                       <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between mb-2">
                           <div className="flex items-center space-x-5">
                               <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner"><Bell size={20} /></div>
                               <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Actionable Follow-up</p>
                                  <p className="text-[13px] font-bold text-slate-700">{editedContact.nextFollowUp ? formatDateTime(editedContact.nextFollowUp) : 'Operational Wait State'}</p>
                               </div>
                           </div>
                           <input type="datetime-local" value={editedContact.nextFollowUp ? String(editedContact.nextFollowUp).substring(0, 16) : ''} onChange={(e) => handleFieldChange('nextFollowUp', e.target.value)} className="text-[11px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl outline-none shadow-sm cursor-pointer" />
                       </div>

                       {activeTab === 'timeline' && (
                          <div className="space-y-5 relative before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-[3px] before:bg-slate-100">
                              {(selectedContact.timeline || []).slice().reverse().map((event, idx) => (
                                 <div key={idx} className="relative pl-10 animate-slide-in" style={{ animationDelay: `${idx * 40}ms` }}>
                                    <div className="absolute left-0 top-1 w-7 h-7 rounded-xl bg-white border-2 border-slate-100 flex items-center justify-center z-10 shadow-sm"><Activity size={12} className="text-[var(--theme-text)]" /></div>
                                    <div className="p-5 bg-white border border-[#f1f1f1] rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
                                       <p className="text-[13px] font-semibold text-slate-700 leading-relaxed">{event.description}</p>
                                       <div className="flex items-center justify-between mt-3">
                                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center"><Clock size={10} className="mr-2" /> {formatDateTime(event.timestamp)}</p>
                                       </div>
                                    </div>
                                 </div>
                              ))}
                          </div>
                       )}

                       {activeTab === 'chatlog' && (
                          <div className="space-y-4">
                             {recentMessages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                                   <div className={`p-4 rounded-3xl text-[12.5px] font-semibold leading-relaxed max-w-[82%] shadow-sm ${msg.direction === 'OUTBOUND' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-600 rounded-tl-none border border-slate-100'}`}>{msg.content}</div>
                                </div>
                             ))}
                          </div>
                       )}

                       {activeTab === 'internalnotes' && (
                          <div className="space-y-5">
                             <div className="relative group">
                                <textarea value={noteInput} onChange={e=>setNoteInput(e.target.value)} placeholder="Type a strategic team memo..." className="w-full bg-white border border-[#e5e7eb] rounded-3xl p-6 text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-[var(--theme-border)]/5 transition-all shadow-sm" rows={4} />
                                <button onClick={()=>addInternalNote(selectedContact._id)} disabled={isAddingNote || !noteInput.trim()} className="absolute bottom-5 right-5 px-6 py-2.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-2xl hover:-translate-y-1 active:scale-95 transition-all">Submit Note</button>
                             </div>
                             {(selectedContact.notes || []).slice().reverse().map((note, idx) => (
                                <div key={idx} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm border-l-[6px] border-l-[var(--theme-bg)]">
                                   <p className="text-[13px] font-semibold text-slate-600 italic leading-relaxed">"{note.content}"</p>
                                   <div className="flex items-center justify-between mt-5 opacity-40">
                                      <span className="text-[10px] font-black uppercase tracking-widest">{note.createdBy}</span>
                                      <span className="text-[10px] font-black">{formatDateTime(note.createdAt)}</span>
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}

                       {/* SECTION 3: LEAD RELATED DETAILS (TIMESTAMPS) */}
                       <div className="mt-16 pt-10 border-t border-slate-100 grid grid-cols-2 gap-5 pb-10">
                           <div className="p-6 bg-white rounded-[2rem] shadow-sm border border-slate-50 flex items-center space-x-5 group hover:border-[var(--theme-border)]/30 transition-colors">
                               <div className="w-12 h-12 rounded-2xl bg-[#f8fafc] text-green-600 flex items-center justify-center"><Calendar size={22} className="opacity-40" /></div>
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center">Creation Date & Time</p>
                                  <p className="text-sm font-bold text-slate-700">{formatDateTime(selectedContact.createdAt)}</p>
                               </div>
                           </div>
                           <div className="p-6 bg-white rounded-[2rem] shadow-sm border border-slate-50 flex items-center space-x-5 group hover:border-[var(--theme-border)]/30 transition-colors">
                               <div className="w-12 h-12 rounded-2xl bg-[#f8fafc] text-blue-600 flex items-center justify-center"><History size={22} className="opacity-40" /></div>
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center">Modification Records</p>
                                  <p className="text-sm font-bold text-slate-700">{formatDateTime(selectedContact.updatedAt)}</p>
                               </div>
                           </div>
                       </div>
                    </div>
                    <div className="px-8 py-5 bg-white border-t border-slate-50 flex items-center justify-between text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] shrink-0">
                       <div className="flex items-center"><ShieldCheck size={12} className="mr-3 text-green-600" /> Core Encryption Enabled</div>
                       <div className="flex items-center opacity-60">Session Ver: 1.2.7.0</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-[6px] animate-fade-in" onClick={() => setShowAddModal(false)}>
           <div className="bg-white p-12 rounded-[3.5rem] w-[480px] shadow-3xl animate-pop-in relative border border-white/50 overflow-hidden" onClick={e=>e.stopPropagation()}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--theme-bg)]/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 p-3 text-slate-300 hover:text-slate-900 transition-all hover:rotate-90"><X size={26} /></button>
              <div className="w-16 h-16 bg-[var(--theme-bg)] text-white rounded-3xl flex items-center justify-center shadow-glow mb-8 transform -rotate-6"><Plus size={32} /></div>
              <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Onboard Entity</h2>
              <p className="text-base font-bold text-slate-400 mb-10 lowercase tracking-tight">Initialize a new secure lead profile in the workspace.</p>
              <form onSubmit={handleAddContact} className="space-y-8">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Identity Signature</label>
                    <input autoFocus type="text" value={newLeadName} onChange={e=>setNewLeadName(e.target.value)} required className="w-full bg-[#f9fafb] border border-slate-100 rounded-[2rem] px-7 py-5 outline-none focus:ring-4 focus:ring-[var(--theme-border)]/10 focus:border-[var(--theme-border)]/50 text-base font-bold text-slate-800 transition-all shadow-sm" placeholder="Full name profile" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Communication Hub</label>
                    <input type="tel" value={newLeadPhone} onChange={e=>setNewLeadPhone(e.target.value)} required className="w-full bg-[#f9fafb] border border-slate-100 rounded-[2rem] px-7 py-5 outline-none focus:ring-4 focus:ring-[var(--theme-border)]/10 focus:border-[var(--theme-border)]/50 text-base font-bold text-slate-800 transition-all shadow-sm" placeholder="+91 XXX XXX XXXX" />
                 </div>
                 <button type="submit" className="w-full py-6 bg-slate-900 text-white text-[12px] font-black uppercase tracking-[0.4em] rounded-[2rem] shadow-3xl hover:-translate-y-2 active:scale-95 transition-all mt-4">Establish Profile</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
