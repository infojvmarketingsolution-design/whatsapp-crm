import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Search, Plus, X, Mail, MapPin, Phone, Users, 
  Clock, Activity, Target, Tag, Save, Filter, 
  Briefcase, Building2, Download, MoreVertical, 
  Flame, Sun, Snowflake, ArrowUpRight, Send, ShieldCheck, History, Calendar, CheckCircle2, TrendingUp, Globe, Smartphone, Bell, Landmark, Hash, Wallet, Headphones
} from 'lucide-react';

export default function Contacts({ roleAccess }) {
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

  // Role Permissions Logic
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user.role || localStorage.getItem('role') || 'AGENT').toUpperCase();
  const roleData = roleAccess?.[userRole];
  const isSuper = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  const rolePermissions = roleData?.permissions || [];
  const canImport = isSuper || roleData?.allAccess || rolePermissions.includes('contacts_import');
  const canExport = isSuper || roleData?.allAccess || rolePermissions.includes('contacts_export');
  const canAdd = isSuper || roleData?.allAccess || rolePermissions.includes('contacts_add');
  const canFilter = isSuper || roleData?.allAccess || rolePermissions.includes('contacts_filter');
  const canSearch = isSuper || roleData?.allAccess || rolePermissions.includes('contacts_search');


  // Design states
  const [activeTab, setActiveTab] = useState('timeline');
  const [noteInput, setNoteInput] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Form State
  const [editedContact, setEditedContact] = useState(null);
  const [showSaveFab, setShowSaveFab] = useState(false);

  // Selection & Filtering States
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [agents, setAgents] = useState([]);
  
  // Advanced Filter States
  const [filters, setFilters] = useState({
    status: 'ALL',
    heat: 'ALL',
    stage: 'ALL',
    agent: 'ALL',
    source: 'ALL',
    minScore: 0,
    maxScore: 100,
    minValue: 0,
    hasUnread: false,
    hasTasks: false,
    dateRange: 'ALL' // ALL, TODAY, WEEK, MONTH
  });

  const [isImporting, setIsImporting] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [showBulkTransfer, setShowBulkTransfer] = useState(false);
  const [bulkTargetAgent, setBulkTargetAgent] = useState('');
  const [bulkTargetCounsellor, setBulkTargetCounsellor] = useState('');

  const fileInputRef = React.useRef(null);

  const PIPELINE_STAGES = ['Discovery', 'Qualified', 'Proposal', 'Negotiation', 'Closing', 'Won', 'Lost'];

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
               setShowSaveFab(false); 
            }
         }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/chat/agents', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchAgents();
  }, []);

  // Filter Engine
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = !searchTerm || (
      (c.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.phone || '').includes(searchTerm)
    );
    
    const matchesStatus = filters.status === 'ALL' || c.status === filters.status;
    const matchesHeat = filters.heat === 'ALL' || c.heatLevel === filters.heat;
    const matchesStage = filters.stage === 'ALL' || c.pipelineStage === filters.stage;
    const matchesAgent = filters.agent === 'ALL' || c.assignedAgent === filters.agent;
    const matchesSource = filters.source === 'ALL' || c.leadSource === filters.source;
    const matchesScore = (c.score || 0) >= filters.minScore && (c.score || 0) <= filters.maxScore;
    const matchesValue = (c.estimatedValue || 0) >= filters.minValue;
    const matchesUnread = !filters.hasUnread || (c.lastMessageAt && new Date(c.lastMessageAt) > new Date(c.lastReadAt || 0));
    const matchesTasks = !filters.hasTasks || (c.tasks && c.tasks.some(t => t.status === 'PENDING'));
    
    // Date Range logic
    let matchesDate = true;
    if (filters.dateRange !== 'ALL') {
       const now = new Date();
       const createdAt = new Date(c.createdAt);
       if (filters.dateRange === 'TODAY') {
          matchesDate = createdAt.toDateString() === now.toDateString();
       } else if (filters.dateRange === 'WEEK') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = createdAt >= weekAgo;
       } else if (filters.dateRange === 'MONTH') {
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          matchesDate = createdAt >= monthAgo;
       }
    }

    return !c.isArchived && matchesSearch && matchesStatus && matchesHeat && matchesStage && matchesAgent && matchesSource && matchesScore && matchesValue && matchesUnread && matchesTasks && matchesDate;
  });

  const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
     if (key === 'minScore' && val === 0) return false;
     if (key === 'maxScore' && val === 100) return false;
     if (key === 'minValue' && val === 0) return false;
     if (val === 'ALL' || val === false) return false;
     return true;
  }).length;

  // Selection Handlers
  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContacts.map(c => c._id)));
    }
  };

  // CSV EXPORT
  const handleExportCSV = () => {
    const toExport = selectedIds.size > 0 
      ? contacts.filter(c => selectedIds.has(c._id))
      : filteredContacts;
    
    if (toExport.length === 0) return toast.error("No contacts to export");

    const headers = ["First Name", "Last Name", "Phone", "Status", "Heat Level", "Pipeline Stage", "Estimated Value", "Source"];
    const rows = toExport.map(c => [
      c.firstName || c.name || '',
      c.lastName || '',
      c.phone || '',
      c.status || 'NEW LEAD',
      c.heatLevel || 'Cold',
      c.pipelineStage || 'Discovery',
      c.estimatedValue || 0,
      c.leadSource || 'Manual Entry'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `WapiPulse_Leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${toExport.length} contacts successfully`);
  };

  // CSV IMPORT
  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        setIsImporting(false);
        return toast.error("CSV file is empty or invalid format");
      }

      const contactsToImport = lines.slice(1).map(line => {
        const parts = line.split(',');
        return {
          firstName: parts[0]?.trim(),
          lastName: parts[1]?.trim(),
          phone: parts[2]?.trim(),
          status: parts[3]?.trim() || 'NEW LEAD',
          heatLevel: parts[4]?.trim() || 'Cold',
          pipelineStage: parts[5]?.trim() || 'Discovery',
          estimatedValue: parts[6]?.trim() || 0,
          leadSource: parts[7]?.trim() || 'Manual Entry'
        };
      });

      toast.loading(`Importing ${contactsToImport.length} contacts...`, { id: 'import' });
      
      try {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenantId');
        
        let successCount = 0;
        for (const c of contactsToImport) {
          if (!c.phone) continue;
          const res = await fetch('/api/chat/contacts', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...c, name: `${c.firstName} ${c.lastName}`.trim(), source: 'CSV Import' })
          });
          if (res.ok) successCount++;
        }
        
        toast.success(`Successfully imported ${successCount} leads!`, { id: 'import' });
        fetchContacts();
      } catch (err) {
        toast.error("Import failed due to connectivity errors", { id: 'import' });
      } finally {
        setIsImporting(false);
        e.target.value = null;
      }
    };
    reader.readAsText(file);
  };

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

  const handleBulkAction = async (action, value, specificIds = null) => {
    const idsToProcess = specificIds || Array.from(selectedIds);
    if (idsToProcess.length === 0) return;
    setIsBulkUpdating(true);
    toast.loading(`Processing ${selectedIds.size} contacts...`, { id: 'bulk' });
    
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const ids = idsToProcess;
      
      // Intelligent action mapping for batch backend
      const actionMap = {
         'transfer': 'transfer_leads',
         'archive': 'archive_leads',
         'stage': 'update_stage',
         'assignedAgent': 'transfer_leads',
         'pipelineStage': 'update_stage'
      };

      const res = await fetch(`/api/chat/bulk-action`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           contactIds: ids, 
           action: actionMap[action] || action, 
           payload: (action === 'transfer' || action === 'assignedAgent' || action === 'transfer_leads') ? { agentId: value } : 
                    (action === 'transfer_counsellor') ? { counsellorId: value } :
                    (action === 'stage' || action === 'pipelineStage' || action === 'update_stage') ? { stage: value } : value 
        })
      });

      if (res.ok) {
         toast.success(`Successfully processed ${selectedIds.size} leads!`, { id: 'bulk' });
         setSelectedIds(new Set());
         fetchContacts();
         setShowBulkTransfer(false);
      } else {
         throw new Error("Bulk update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Bulk update failed", { id: 'bulk' });
    } finally {
      setIsBulkUpdating(false);
    }
  };

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
                  <p className="text-gray-400 font-bold uppercase tracking-tighter text-[9px]">Filtered</p>
                  <p className="font-bold text-gray-800">{filteredContacts.length}</p>
               </div>
               <div className="w-[1px] h-6 bg-gray-100 mx-2"></div>
               <div>
                  <p className="text-[var(--theme-text)] font-bold uppercase tracking-tighter text-[9px]">Selected</p>
                  <p className="font-bold text-gray-800">{selectedIds.size}</p>
               </div>
            </div>
            
            {canImport && (
               <>
                 <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
                 <button 
                    onClick={() => fileInputRef.current.click()}
                    className="p-2.5 bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 rounded-xl transition shadow-sm"
                    title="Import CSV"
                 >
                    <TrendingUp size={18} />
                 </button>
               </>
             )}
             
             {canExport && (
               <button 
                  onClick={handleExportCSV}
                  className="p-2.5 bg-white border border-gray-200 text-gray-400 hover:text-green-600 hover:border-green-200 rounded-xl transition shadow-sm"
                  title="Export Selected/Filtered"
               >
                  <Download size={18} />
               </button>
             )}

            {canAdd && (
               <button 
                 onClick={() => setShowAddModal(true)} 
                 className="px-5 py-2.5 bg-[var(--theme-bg)] text-white text-xs font-black rounded-xl hover:shadow-glow transition transform hover:-translate-y-0.5 active:scale-95 uppercase tracking-widest"
               >
                  <span>Add Profile</span>
               </button>
            )}
         </div>
      </div>

      <div className="p-8 flex-1 flex flex-col max-w-7xl mx-auto w-full">
          <div className="flex flex-col space-y-6 mb-8">
              <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Contact Workspace</h2>
                  {canSearch && (
                     <div className="flex items-center space-x-3">
                        <div className="relative">
                           <Search className="absolute left-4 top-3.5 text-gray-300" size={16} />
                           <input 
                             type="text" 
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                             placeholder="Search identity or mobile..." 
                             className="bg-white border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-gray-700 placeholder-gray-300 focus:ring-4 focus:ring-[var(--theme-border)]/10 outline-none transition-all w-[360px] shadow-sm"
                           />
                        </div>
                     </div>
                  )}
              </div>

              {canFilter && (
                  <div className="flex items-center justify-between">
                      <div className="bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3 overflow-x-auto no-scrollbar max-w-[80%]">
                          <div className="flex items-center px-4 border-r border-gray-100 space-x-2 mr-1">
                              <Activity size={14} className="text-teal-500" />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Pulse Hunt:</span>
                          </div>
                          
                          <select value={filters.status} onChange={e=>setFilters({...filters, status: e.target.value})} className="bg-slate-50 text-[10px] font-black uppercase py-2 px-3 rounded-xl border-none focus:ring-2 focus:ring-teal-100 cursor-pointer">
                             <option value="ALL">Status ALL</option>
                             {['NEW LEAD', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>

                          <select value={filters.stage} onChange={e=>setFilters({...filters, stage: e.target.value})} className="bg-slate-50 text-[10px] font-black uppercase py-2 px-3 rounded-xl border-none focus:ring-2 focus:ring-teal-100 cursor-pointer">
                             <option value="ALL">Stage ALL</option>
                             {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>

                          <select value={filters.agent} onChange={e=>setFilters({...filters, agent: e.target.value})} className="bg-slate-50 text-[10px] font-black uppercase py-2 px-3 rounded-xl border-none focus:ring-2 focus:ring-teal-100 cursor-pointer">
                             <option value="ALL">Agent ALL</option>
                             {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                          </select>

                          {activeFilterCount > 0 && (
                             <div className="flex items-center space-x-2 pl-3">
                                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-ping"></span>
                                <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{activeFilterCount} Active Filters</span>
                             </div>
                          )}
                      </div>

                      <button 
                        onClick={() => setShowFilters(true)}
                        className="flex items-center space-x-3 px-6 py-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm text-slate-700 hover:border-teal-200 hover:text-teal-600 transition-all font-black group"
                      >
                         <Filter size={18} className={activeFilterCount > 0 ? "text-teal-600 animate-pulse" : "text-gray-400"} />
                         <span className="text-xs uppercase tracking-widest">Advance Filters</span>
                      </button>
                  </div>
               )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-premium overflow-hidden">
             <div className="overflow-x-auto h-full custom-scrollbar">
                <table className="w-full text-left border-collapse">
                   <thead className="bg-[#fcf8f8]/50 border-b border-gray-100">
                     <tr>
                        <th className="py-5 px-6 w-10">
                           <input 
                             type="checkbox" 
                             checked={selectedIds.size > 0 && selectedIds.size === filteredContacts.length}
                             onChange={toggleSelectAll}
                             className="rounded border-gray-300 text-[var(--theme-bg)] focus:ring-[var(--theme-bg)] cursor-pointer"
                           />
                        </th>
                        <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Owner</th>
                        <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Profile Identity</th>
                        <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Current Phase</th>
                        <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Lead Health</th>
                        <th className="py-5 px-8 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {filteredContacts.map((c, i) => (
                       <tr key={c._id || i} className={`cursor-pointer group hover:bg-[#fafafa] transition-colors relative after:absolute after:left-0 after:top-0 after:bottom-0 after:w-0 group-hover:after:w-1 after:bg-[var(--theme-bg)] after:transition-all ${selectedIds.has(c._id) ? 'bg-blue-50/20 shadow-inner' : ''}`}>
                          <td className="py-5 px-6 border-b border-gray-50" onClick={(e) => e.stopPropagation()}>
                             <input 
                               type="checkbox" 
                               checked={selectedIds.has(c._id)}
                               onChange={() => toggleSelect(c._id)}
                               className="rounded border-gray-300 text-[var(--theme-bg)] focus:ring-[var(--theme-bg)] cursor-pointer"
                             />
                          </td>
                          <td className="py-5 px-6 border-b border-gray-50" onClick={(e) => e.stopPropagation()}>
                             <div className="flex items-center">
                                <Users size={12} className="mr-2 text-gray-400" />
                                <select 
                                   value={c.assignedAgent || ''} 
                                   onChange={(e) => {
                                      handleBulkAction("transfer_leads", e.target.value, [c._id]);
                                   }}
                                   className="bg-transparent text-[11px] font-bold text-slate-600 outline-none cursor-pointer border-none p-0 focus:ring-0 max-w-[120px] overflow-hidden text-ellipsis"
                                >
                                   <option value="">Unassigned</option>
                                   {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                                </select>
                             </div>
                          </td>
                          <td className="py-5 px-6 border-b border-gray-50" onClick={() => handleRowClick(c)}>
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
              {/* CLEAN HEADER */}
              <div className="bg-white p-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-5 flex-1">
                      <div className="relative group">
                         <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center font-bold text-2xl text-[var(--theme-text)]">
                            {editedContact.firstName ? editedContact.firstName.charAt(0) : (selectedContact.name?.charAt(0) || 'U')}
                         </div>
                         <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-[10px] font-bold text-gray-600 shadow-sm">{editedContact.score || 0}%</div>
                      </div>
                      <div className="flex-1">
                          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">
                             {editedContact.firstName && editedContact.lastName ? `${editedContact.firstName} ${editedContact.lastName}` : (editedContact.name || 'Profile Identity')}
                          </h2>
                          <div className="flex items-center space-x-4 text-gray-500">
                             <span className="flex items-center text-xs font-medium"><Phone size={14} className="mr-2" /> {editedContact.phone}</span>
                             <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                             <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text)]">{editedContact.status || 'Active Record'}</span>
                          </div>
                      </div>
                  </div>

                  <div className="flex items-center space-x-4">
                      {/* FIXED SAVE/FINALIZE BUTTON (NOW BRAND COLOR) */}
                      <button 
                        onClick={() => updateContactDetail(selectedContact._id, editedContact)}
                        disabled={!showSaveFab || isUpdatingContact}
                        className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                          showSaveFab 
                          ? 'bg-[var(--theme-bg)] text-white hover:shadow-lg hover:-translate-y-0.5' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                        }`}
                      >
                         {isUpdatingContact ? <Clock size={16} className="animate-spin" /> : <Save size={16} />}
                         <span>Finalize Record</span>
                      </button>
                      <button onClick={() => setShowProfile(false)} className="p-2.5 text-gray-400 hover:bg-gray-100 rounded-xl transition-all border border-transparent hover:border-gray-200"><X size={20} /></button>
                  </div>
              </div>

              {/* PIPELINE UI */}
              <div className="bg-slate-50 relative z-[100] px-8 py-5 flex items-center justify-between shrink-0 border-b border-gray-200 overflow-x-auto no-scrollbar pointer-events-auto">
                  <div className="flex items-center flex-1 min-w-[700px] pointer-events-auto">
                      {PIPELINE_STAGES.map((stage, idx) => (
                         <React.Fragment key={stage}>
                            <button 
                              onClick={() => {
                                 handleFieldChange('pipelineStage', stage);
                              }}
                              className={`flex flex-col items-center group relative z-[110] cursor-pointer pointer-events-auto ${idx < PIPELINE_STAGES.length - 1 ? 'flex-1' : ''}`}
                            >
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 border-white ${
                                  editedContact.pipelineStage === stage 
                                  ? 'bg-[var(--theme-bg)] text-white ring-4 ring-teal-50 shadow-sm scale-110' 
                                  : PIPELINE_STAGES.indexOf(editedContact.pipelineStage) >= idx 
                                    ? 'bg-teal-100 text-teal-600' 
                                    : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                               }`}>
                                  {PIPELINE_STAGES.indexOf(editedContact.pipelineStage) > idx ? <CheckCircle2 size={16} /> : idx + 1}
                               </div>
                               <span className={`mt-2 text-[10px] font-bold uppercase tracking-wider transition-all ${editedContact.pipelineStage === stage ? 'text-[var(--theme-text)]' : 'text-gray-400 group-hover:text-gray-600'}`}>{stage}</span>
                            </button>
                            {idx < PIPELINE_STAGES.length - 1 && <div className={`flex-1 h-1 mb-6 rounded-full transition-colors ${PIPELINE_STAGES.indexOf(editedContact.pipelineStage) > idx ? 'bg-teal-100' : 'bg-gray-200'}`}></div>}
                         </React.Fragment>
                      ))}
                  </div>
              </div>

              <div className="flex-1 flex overflow-hidden bg-white">
                 <div className="w-[380px] bg-slate-50/50 border-r border-gray-100 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    {/* SECTION 1: AI CHATBOT DATA (Moved to top based on user request) */}
                    <section className="space-y-4">
                       <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center">
                          <CheckCircle2 size={14} className="mr-2 text-gray-400" /> AI Chatbot Captures
                       </h3>
                       <div className="bg-white p-5 rounded-xl border border-teal-100 shadow-md space-y-4 relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-2 opacity-5">
                              <Target size={100} />
                           </div>
                           <div className="relative">
                              <div className="flex justify-between items-center mb-2">
                                 <label className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block mb-1">AI Extracted Overview</label>
                              </div>
                              <textarea value={editedContact.qualification || ''} onChange={e=>handleFieldChange('qualification', e.target.value)} placeholder="Overview..." className="w-full bg-teal-50/30 border border-teal-100 rounded-lg px-3 py-2 text-sm font-semibold text-teal-900 outline-none focus:ring-2 focus:ring-teal-200 transition-all shadow-inner" rows={2}/>
                           </div>
                           <div className="grid grid-cols-2 gap-3 relative">
                               <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Target Program</label>
                                  <div className="relative">
                                     <Target size={14} className="absolute left-3 top-2.5 text-gray-400" />
                                     <input value={editedContact.selectedProgram || ''} onChange={e=>handleFieldChange('selectedProgram', e.target.value)} placeholder="Program Selection" className="w-full bg-gray-50 border border-gray-100 text-sm font-bold text-gray-800 rounded-lg pl-9 pr-3 py-2 outline-none focus:border-teal-300 transition-all" />
                                  </div>
                               </div>
                               <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Pref. Call Time</label>
                                  <div className="relative">
                                     <Clock size={14} className="absolute left-3 top-2.5 text-gray-400" />
                                     <input value={editedContact.preferredCallTime || ''} onChange={e=>handleFieldChange('preferredCallTime', e.target.value)} placeholder="Call Time" className="w-full bg-gray-50 border border-gray-100 text-sm font-bold text-gray-800 rounded-lg pl-9 pr-3 py-2 outline-none focus:border-teal-300 transition-all" />
                                  </div>
                               </div>
                           </div>
                           <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50 mt-2 relative">
                               <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1 mt-2">Heat Level</label>
                                  <div className="relative">
                                     <Flame size={14} className={`absolute left-3 top-2.5 ${editedContact.heatLevel === 'Hot' ? 'text-red-500' : 'text-gray-400'}`} />
                                     <select value={editedContact.heatLevel} onChange={e=>handleFieldChange('heatLevel', e.target.value)} className="w-full bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-800 rounded-lg pl-9 pr-3 py-2 outline-none cursor-pointer">
                                        {['Cold', 'Warm', 'Hot'].map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                                     </select>
                                  </div>
                               </div>
                               <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1 mt-2">Budget</label>
                                  <div className="relative">
                                     <Wallet size={14} className="absolute left-3 top-2.5 text-gray-400" />
                                     <input value={editedContact.budget || ''} onChange={e=>handleFieldChange('budget', e.target.value)} placeholder="Budget" className="w-full bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-800 rounded-lg pl-9 pr-3 py-2 outline-none" />
                                  </div>
                               </div>
                           </div>
                       </div>
                    </section>
                    
                    {/* SECTION 2: BASIC INFORMATION */}
                    <section className="space-y-4 pt-2">
                       <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center">
                          <Users size={14} className="mr-2 text-gray-400" /> Basic Information
                       </h3>
                       <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">First Name</label>
                                 <input value={editedContact.firstName || editedContact.name || ''} onChange={e=>handleFieldChange('firstName', e.target.value)} className="w-full text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-teal-100 transition-all" />
                              </div>
                              <div>
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Last Name</label>
                                 <input value={editedContact.lastName || ''} onChange={e=>handleFieldChange('lastName', e.target.value)} className="w-full text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-teal-100 transition-all" />
                              </div>
                           </div>
                           
                           <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Primary Phone</label>
                              <div className="w-full text-sm font-semibold text-gray-600 bg-gray-100 border border-gray-100 rounded-lg px-3 py-2 flex items-center"><Phone size={14} className="mr-2 opacity-50" /> {editedContact.phone}</div>
                           </div>
                           
                           <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Secondary Phone</label>
                              <div className="relative">
                                 <Smartphone size={14} className="absolute left-3 top-2.5 text-gray-400" />
                                 <input value={editedContact.secondaryPhone || ''} onChange={e=>handleFieldChange('secondaryPhone', e.target.value)} placeholder="Add alt number..." className="w-full text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-100 rounded-lg pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-teal-100 transition-all" />
                              </div>
                           </div>

                           <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Address & Location</label>
                              <textarea value={editedContact.address || ''} onChange={e=>handleFieldChange('address', e.target.value)} placeholder="Full street address..." className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 outline-none resize-none mb-2" rows={2}/>
                              <div className="grid grid-cols-2 gap-3">
                                  <input value={editedContact.state || ''} onChange={e=>handleFieldChange('state', e.target.value)} placeholder="State" className="w-full text-sm font-semibold bg-gray-50 border border-gray-100 px-3 py-2 outline-none rounded-lg focus:ring-2 focus:ring-teal-100" />
                                  <input value={editedContact.pincode || ''} onChange={e=>handleFieldChange('pincode', e.target.value)} placeholder="Pincode" className="w-full text-sm font-semibold bg-gray-50 border border-gray-100 px-3 py-2 outline-none rounded-lg focus:ring-2 focus:ring-teal-100" />
                              </div>
                           </div>

                           <div className="pt-2 border-t border-gray-50 mt-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2 mt-2">Record Status</label>
                              <select 
                                value={editedContact.status} 
                                onChange={(e) => handleFieldChange('status', e.target.value)}
                                className="w-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold py-2.5 px-3 rounded-lg outline-none cursor-pointer"
                              >
                                 {['NEW LEAD', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'].map(s => (
                                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                 ))}
                              </select>
                           </div>
                       </div>
                    </section>

                    {/* SECTION 3: LEAD INTELLIGENCE */}
                    <section className="space-y-4">
                       <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center">
                          <Target size={14} className="mr-2 text-gray-400" /> Lead Intelligence
                       </h3>
                       <div className="space-y-3">
                          <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-md border border-slate-700">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Est. Deal Value</label>
                             <div className="flex items-center space-x-2">
                                <span className="text-lg font-bold text-slate-500">₹</span>
                                <input type="number" value={editedContact.estimatedValue || 0} onChange={e=>handleFieldChange('estimatedValue', e.target.value)} className="bg-transparent text-2xl font-black text-white outline-none w-full placeholder-slate-700" />
                             </div>
                          </div>
                                                    <div className="bg-white p-4 border border-gray-100 rounded-xl shadow-sm">
                             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Origination Source</label>
                             <div className="relative">
                                 <Globe size={14} className="absolute left-3 top-2.5 text-blue-500" />
                                 <select value={editedContact.leadSource || 'Manual Entry'} onChange={e=>handleFieldChange('leadSource', e.target.value)} className="w-full bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-800 rounded-lg pl-9 pr-3 py-2 outline-none cursor-pointer">
                                    {['Manual Entry', 'Meta Ads', 'Google Ads', 'Referral', 'Email Campaign', 'WhatsApp Blast'].map(s => <option key={s} value={s}>{s}</option>)}
                                 </select>
                             </div>
                          </div>

                          {/* SECTION 4: ASSIGNMENT & OWNERSHIP */}
                           <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                                 <ShieldCheck size={14} className="mr-2 text-blue-600" /> Assignment & Ownership
                              </h3>
                              
                              <div>
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Manual Lead Assign</label>
                                 <div className="relative">
                                     <Users size={14} className="absolute left-3 top-2.5 text-gray-400" />
                                     <select 
                                       disabled={userRole === 'TELECALLER'}
                                       value={editedContact.assignedAgent || ''} 
                                       onChange={e=>handleFieldChange('assignedAgent', e.target.value)} 
                                       className={`w-full bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-800 rounded-lg pl-9 pr-3 py-2 outline-none ${userRole === 'TELECALLER' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-blue-300'}`}
                                     >
                                        <option value="">Unassigned</option>
                                        {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.role})</option>)}
                                     </select>
                                 </div>
                              </div>

                              <div>

                                 <div className="relative">

                                     <select 
                                       value={editedContact.assignedCounsellor || ''} 
                                       onChange={e=>handleFieldChange('assignedCounsellor', e.target.value)} 
                                       className="w-full bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-800 rounded-lg pl-9 pr-3 py-2 outline-none cursor-pointer hover:border-blue-300"
                                     >
                                        <option value="">No Counsellor Assigned</option>
                                        {agents.filter(a => a.role === 'MANAGER_COUNSELLOUR' || a.role === 'ADMIN').map(a => (
                                           <option key={a._id} value={a._id}>{a.name}</option>
                                        ))}
                                     </select>
                                 </div>
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
                       <div className="pt-6 border-t border-gray-100 grid grid-cols-2 gap-5 pb-8">
                           <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                               <div className="w-10 h-10 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center"><Calendar size={18} /></div>
                               <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 mt-1">Created At</p>
                                  <p className="text-xs font-bold text-gray-700">{formatDateTime(selectedContact.createdAt)}</p>
                               </div>
                           </div>
                           <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                               <div className="w-10 h-10 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center"><History size={18} /></div>
                               <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 mt-1">Last Modified</p>
                                  <p className="text-xs font-bold text-gray-700">{formatDateTime(selectedContact.updatedAt)}</p>
                               </div>
                           </div>
                       </div>
                    </div>
                    <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">
                       <div className="flex items-center"><ShieldCheck size={14} className="mr-2 text-teal-600" /> Secure Encryption Active</div>
                       <div className="flex items-center text-gray-300">WapiPulse CRM v1.2</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ADVANCED FILTER PRO CONSOLE (SIDEBAR) */}
      {showFilters && (
        <div className="fixed inset-0 z-[200] flex justify-end bg-slate-900/40 backdrop-blur-[4px] animate-fade-in" onClick={() => setShowFilters(false)}>
            <div 
              className="w-[480px] h-full bg-white shadow-3xl flex flex-col animate-slide-up relative"
              onClick={(e) => e.stopPropagation()}
            >
               <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center space-x-4">
                     <div className="p-3 bg-teal-500 text-white rounded-2xl shadow-glow">
                        <Filter size={20} />
                     </div>
                     <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Filter Console</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Data Mining & Precision Hunting</p>
                     </div>
                  </div>
                  <button onClick={() => setShowFilters(false)} className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 transition-all"><X size={24} /></button>
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
                  {/* DATA PULSE SECTION */}
                  <div className="space-y-6">
                     <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.25em] flex items-center">
                        <Activity size={14} className="mr-2" /> Data Pulsing
                     </h3>
                     <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setFilters({...filters, hasUnread: !filters.hasUnread})}
                          className={`p-5 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center space-y-3 ${filters.hasUnread ? 'bg-teal-50 border-teal-500 shadow-inner' : 'bg-white border-gray-50'}`}
                        >
                           <Mail className={filters.hasUnread ? 'text-teal-600' : 'text-gray-300'} />
                           <span className={`text-[10px] font-black uppercase tracking-widest ${filters.hasUnread ? 'text-teal-700' : 'text-slate-400'}`}>Unread Only</span>
                        </button>
                        <button 
                          onClick={() => setFilters({...filters, hasTasks: !filters.hasTasks})}
                          className={`p-5 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center space-y-3 ${filters.hasTasks ? 'bg-orange-50 border-orange-500 shadow-inner' : 'bg-white border-gray-50'}`}
                        >
                           <Bell className={filters.hasTasks ? 'text-orange-600' : 'text-gray-300'} />
                           <span className={`text-[10px] font-black uppercase tracking-widest ${filters.hasTasks ? 'text-orange-700' : 'text-slate-400'}`}>With Tasks</span>
                        </button>
                     </div>
                  </div>

                  {/* ATTRIBUTE FILTERS */}
                  <div className="space-y-6">
                     <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.25em] flex items-center">
                        <Target size={14} className="mr-2" /> Lead Attributes
                     </h3>
                     
                     <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-3xl border border-gray-50">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">origination Source</label>
                           <select value={filters.source} onChange={e=>setFilters({...filters, source: e.target.value})} className="w-full bg-white border-none text-[11px] font-black text-slate-700 py-3 px-4 rounded-2xl outline-none shadow-sm capitalize">
                              <option value="ALL">ANY SOURCE</option>
                              {['Manual Entry', 'Meta Ads', 'Google Ads', 'Referral', 'Email Campaign', 'WhatsApp Blast'].map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-3xl border border-gray-50">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Registration Period</label>
                           <select value={filters.dateRange} onChange={e=>setFilters({...filters, dateRange: e.target.value})} className="w-full bg-white border-none text-[11px] font-black text-slate-700 py-3 px-4 rounded-2xl outline-none shadow-sm">
                              <option value="ALL">COMPREHENSIVE HISTORY</option>
                              <option value="TODAY">INITIALIZED TODAY</option>
                              <option value="WEEK">PAST 7 DAYS</option>
                              <option value="MONTH">PAST 30 DAYS</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  {/* VALUE & QUALITY RANGES */}
                  <div className="space-y-6">
                     <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.25em] flex items-center">
                        <TrendingUp size={14} className="mr-2" /> Value & Quality
                     </h3>
                     
                     <div className="space-y-8 p-6 bg-slate-900 rounded-[2.5rem] shadow-xl text-white">
                        <div>
                           <div className="flex justify-between items-center mb-4">
                              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">MIN Lead Score</label>
                              <span className="text-xl font-black text-teal-400">{filters.minScore}%</span>
                           </div>
                           <input 
                             type="range" min="0" max="100" 
                             value={filters.minScore} 
                             onChange={e=>setFilters({...filters, minScore: parseInt(e.target.value)})}
                             className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-teal-500"
                           />
                        </div>

                        <div>
                           <div className="flex justify-between items-center mb-4">
                              <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">MIN Deal Value</label>
                              <span className="text-xl font-black text-teal-400">₹ {(filters.minValue / 1000).toFixed(0)}K +</span>
                           </div>
                           <input 
                             type="range" min="0" max="200000" step="5000" 
                             value={filters.minValue} 
                             onChange={e=>setFilters({...filters, minValue: parseInt(e.target.value)})}
                             className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-teal-500"
                           />
                        </div>
                     </div>
                  </div>
               </div>

               <div className="p-8 border-t border-gray-100 bg-slate-50/50 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                     <span className="font-bold text-slate-400 uppercase tracking-tighter">Matches Found:</span>
                     <span className="font-black text-slate-800 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm">{filteredContacts.length} Profiles</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <button 
                       onClick={() => {
                          setFilters({ status: 'ALL', heat: 'ALL', stage: 'ALL', agent: 'ALL', source: 'ALL', minScore: 0, maxScore: 100, minValue: 0, hasUnread: false, hasTasks: false, dateRange: 'ALL' });
                          toast.success("Filters Cleared");
                       }}
                       className="py-4 bg-white border border-gray-200 text-slate-600 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all"
                     >
                        Reset All
                     </button>
                     <button 
                       onClick={() => setShowFilters(false)}
                       className="py-4 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl hover:-translate-y-1 transition-all"
                     >
                        Apply Profile
                     </button>
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

      {/* UNIFIED BULK ACTIONS BAR */}
      {selectedIds.size > 0 && (
         <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[999] bg-slate-900/95 text-white rounded-[2.5rem] px-8 py-5 shadow-3xl flex items-center space-x-10 animate-slide-up border border-white/10 backdrop-blur-md">
            <div className="flex items-center space-x-4 pr-10 border-r border-white/10">
               <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-white shadow-glow animate-pulse">
                  <Target size={24} />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400 mb-1">{selectedIds.size} Leads Selected</p>
                  <p className="text-sm font-black uppercase tracking-widest">{isBulkUpdating ? "Executing Command..." : "Workspace Batch"}</p>
               </div>
            </div>

            <div className="flex items-center space-x-6">
               {/* TRANSFER AGENT */}
               <div className="flex flex-col space-y-1">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Manual Lead Assign</label>
                  <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/10">
                     <select value={bulkTargetAgent} onChange={(e) => setBulkTargetAgent(e.target.value)} className="bg-transparent text-[11px] font-bold px-4 py-2 outline-none cursor-pointer text-white min-w-[160px]">
                        <option value="" className="text-slate-900">Choose Agent...</option>
                        {agents.map(a => <option key={a._id} value={a._id} className="text-slate-900">{a.name}</option>)}
                     </select>
                     <button disabled={!bulkTargetAgent || isBulkUpdating} onClick={() => handleBulkAction("transfer_leads", bulkTargetAgent)} className="bg-teal-500 hover:bg-teal-600 disabled:bg-slate-700 p-2.5 rounded-xl transition-all shadow-lg active:scale-95 text-white">
                        <ArrowUpRight size={18} />
                     </button>
                  </div>
               </div>

               {/* STAGE COMMAND */}
               <div className="flex flex-col space-y-1">
                  <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">Move Stage</label>
                  <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/10">
                     <select onChange={(e) => handleBulkAction("update_stage", e.target.value)} className="bg-transparent text-[11px] font-bold px-4 py-2 outline-none cursor-pointer text-white min-w-[130px]" defaultValue="">
                        <option value="" disabled className="text-slate-900">Pipeline Stage...</option>
                        {PIPELINE_STAGES.map(s => <option key={s} value={s} className="text-slate-900">{s}</option>)}
                     </select>
                  </div>
               </div>

               <div className="w-[1px] h-10 bg-white/10 mx-2"></div>

               <div className="flex items-center space-x-3">
                  <button onClick={handleExportCSV} className="p-4 hover:bg-white/10 rounded-2xl transition-all text-white/60 hover:text-white" title="Export Set"><Download size={20} /></button>
                  <button onClick={() => handleBulkAction("archive_leads", true)} className="p-4 hover:bg-orange-500/20 text-orange-400 rounded-2xl transition-all" title="Archive Leads"><ShieldCheck size={20}/></button>
                  <button onClick={() => { if(window.confirm(`Delete ${selectedIds.size} leads permanently?`)) handleBulkAction("hard_delete_leads", {}); }} className="p-4 hover:bg-red-500/20 text-red-400 rounded-2xl transition-all font-bold text-lg"><MoreVertical size={20} /></button>
               </div>
            </div>
            
            <button onClick={() => setSelectedIds(new Set())} className="ml-6 p-4 hover:bg-white/10 text-white/20 hover:text-white rounded-2xl transition-all border border-transparent hover:border-white/10">
               <X size={24} />
            </button>
         </div>
      )}
    </div>
  );
}