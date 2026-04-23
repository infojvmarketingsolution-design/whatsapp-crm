import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Search, Plus, X, Mail, MapPin, Phone, Users, 
  Clock, Activity, Target, Tag, Save, Filter, 
  Briefcase, Building2, Download, MoreVertical, 
  Flame, Sun, Snowflake, ArrowUpRight, Send, ShieldCheck, History, Calendar, CheckCircle2, TrendingUp, Globe, Smartphone, Bell, Landmark, Hash, Wallet, Headphones, ChevronDown
} from 'lucide-react';

export default function Contacts({ roleAccess }) {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [isSavingLead, setIsSavingLead] = useState(false);
  
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
  const isSuper = ['ADMIN', 'SUPER_ADMIN', 'BUSINESS_HEAD'].includes(userRole);

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

    // Check if we are auditing a specific teammate
    const auditId = sessionStorage.getItem('audit_target_agent');
    if (auditId) {
      setFilters(prev => ({ ...prev, agent: auditId }));
      sessionStorage.removeItem('audit_target_agent');
      toast.success("Monitoring Teammate Leads", { icon: '🔍' });
    }
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
    const matchesAgent = filters.agent === 'ALL' || c.assignedAgent === filters.agent || c.assignedCounsellor === filters.agent;
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
     if (!newLeadName.trim() || !newLeadPhone.trim()) {
        return toast.error("Name and Phone are required");
     }

     setIsSavingLead(true);
     try {
       const token = localStorage.getItem('token');
       const tenantId = localStorage.getItem('tenantId');
       
       if (!user._id) {
         toast.error("User session expired. Please re-login.");
         return;
       }

       // Prepare Payload - Auto-assign based on role
       const payload = { 
         name: newLeadName, 
         phone: newLeadPhone, 
         source: 'Manual Entry'
       };

       if (userRole === 'MANAGER_COUNSELLOUR') {
         payload.assignedCounsellor = user._id;
       } else {
         payload.assignedAgent = user._id;
       }

       const res = await fetch('/api/chat/contacts', {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
       });

       const data = await res.json();

       if (res.ok) {
         toast.success('Lead established successfully');
         setShowAddModal(false);
         setNewLeadName('');
         setNewLeadPhone('');
         fetchContacts();
       } else {
         toast.error(data.message || 'Failed to establish profile');
       }
     } catch (err) {
       console.error("Create Lead Error:", err);
       toast.error("Network error. Please check your connection.");
     } finally {
       setIsSavingLead(false);
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
        <div className="fixed inset-0 z-[150] flex justify-end bg-slate-900/60 backdrop-blur-[8px] animate-fade-in" onClick={() => setShowProfile(false)}>
            <div 
              className="w-[1100px] h-full bg-white shadow-2xl flex flex-col animate-slide-left relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
               {/* BESPOKE HEADER: LUXURY FEEL */}
               <div className="bg-white p-12 pb-8 flex items-end justify-between shrink-0 relative z-20">
                   <div className="flex items-center space-x-10">
                       <div className="relative group">
                           <div className="w-24 h-24 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-4xl font-light text-white shadow-2xl group-hover:scale-105 transition-transform duration-500">
                              {editedContact.firstName ? editedContact.firstName.charAt(0) : (selectedContact.name?.charAt(0) || 'U')}
                           </div>
                           <div className="absolute -top-3 -right-3 w-12 h-12 bg-emerald-500 rounded-full border-8 border-white flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                              {editedContact.score || 0}%
                           </div>
                       </div>
                       <div className="space-y-2">
                           <div className="flex items-center space-x-4">
                              <h2 className="text-5xl font-black tracking-tight text-slate-900">
                                 {editedContact.firstName || editedContact.name || 'Lead'} {editedContact.lastName || ''}
                              </h2>
                              <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{editedContact.status || 'ACTIVE'}</span>
                           </div>
                           <div className="flex items-center space-x-8 text-slate-400">
                              <span className="flex items-center text-xs font-bold uppercase tracking-widest"><Phone size={14} className="mr-3 text-emerald-500" /> {editedContact.phone}</span>
                              <span className="flex items-center text-xs font-bold uppercase tracking-widest"><Briefcase size={14} className="mr-3" /> {editedContact.profession || 'NO PROFESSION'}</span>
                           </div>
                       </div>
                   </div>

                   <div className="flex items-center space-x-4 mb-2">
                       <button 
                         onClick={() => updateContactDetail(selectedContact._id, editedContact)}
                         disabled={!showSaveFab || isUpdatingContact}
                         className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all duration-300 disabled:opacity-30"
                       >
                          {isUpdatingContact ? 'Syncing...' : 'Finalize Record'}
                       </button>
                       <button onClick={() => setShowProfile(false)} className="p-4 text-slate-300 hover:text-slate-900 transition-colors"><X size={32} strokeWidth={1} /></button>
                   </div>
               </div>

               <div className="flex-1 flex overflow-hidden">
                  {/* LEFT PANEL: DATA FACT SHEET */}
                  <div className="w-[450px] bg-slate-50/50 border-r border-slate-100 overflow-y-auto custom-scrollbar p-12 pt-4 space-y-16">
                     
                     {/* INQUIRY FACT SHEET */}
                     <div className="space-y-10">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                           <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">AI Inquiry Intel</h3>
                           <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></div> Live Capture</span>
                        </div>

                        <div className="space-y-10">
                           {/* OVERVIEW: CLEAN TYPOGRAPHY */}
                           <div className="space-y-4">
                              <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Lead Qualification Overview</label>
                              <textarea 
                                value={editedContact.qualification || ''} 
                                onChange={e=>handleFieldChange('qualification', e.target.value)} 
                                placeholder="Waiting for intelligence..." 
                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-600 leading-relaxed outline-none resize-none placeholder:text-slate-200" 
                                rows={4}
                              />
                           </div>

                           <div className="grid grid-cols-1 gap-10">
                              {[
                                { label: 'Target Program', value: editedContact.selectedProgram, field: 'selectedProgram', icon: <Target size={16}/> },
                                { label: 'Career Ambition', value: editedContact.flowVariables?.careerGoal, field: 'flowVariables.careerGoal', icon: <Activity size={16}/> },
                                { label: 'Investment Budget', value: editedContact.budget, field: 'budget', icon: <Wallet size={16}/> },
                                { label: 'Contact Window', value: editedContact.preferredCallTime, field: 'preferredCallTime', icon: <Clock size={16}/> }
                              ].map((item, idx) => (
                                <div key={idx} className="space-y-3 group">
                                   <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center">
                                      <span className="mr-3 opacity-30 group-hover:opacity-100 transition-opacity">{item.icon}</span>
                                      {item.label}
                                   </label>
                                   <input 
                                      value={item.value || ''} 
                                      onChange={e=>handleFieldChange(item.field, e.target.value)} 
                                      placeholder="Not Disclosed" 
                                      className="w-full bg-transparent border-b border-slate-100 pb-2 text-[13px] font-black text-slate-800 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-200"
                                   />
                                </div>
                              ))}

                              <div className="space-y-3">
                                 <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center">
                                    <Flame size={16} className="mr-3 opacity-30" />
                                    AI Engagement Heat
                                 </label>
                                 <div className="flex space-x-3">
                                    {['Cold', 'Warm', 'Hot'].map(lvl => (
                                       <button 
                                          key={lvl}
                                          onClick={() => handleFieldChange('heatLevel', lvl)}
                                          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                             editedContact.heatLevel === lvl 
                                             ? 'bg-slate-900 text-white shadow-lg' 
                                             : 'bg-white border border-slate-100 text-slate-300 hover:border-slate-300'
                                          }`}
                                       >
                                          {lvl}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* TAGS */}
                     <div className="space-y-6">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] border-b border-slate-200 pb-4">Internal Markers</h3>
                        <div className="flex flex-wrap gap-3">
                           {(editedContact.tags || []).map(tag => (
                              <span key={tag} className="px-4 py-2 bg-white border border-slate-100 rounded-2xl text-[9px] font-black text-slate-500 uppercase tracking-[0.1em] shadow-sm">{tag}</span>
                           ))}
                           <button className="px-4 py-2 border border-dashed border-slate-200 rounded-2xl text-[9px] font-black text-slate-300 uppercase tracking-[0.1em] hover:text-emerald-500 hover:border-emerald-500 transition-all">+ Add Marker</button>
                        </div>
                     </div>
                  </div>

                  {/* RIGHT PANEL: INTERACTION HUB */}
                  <div className="flex-1 flex flex-col bg-white overflow-hidden">
                     <div className="px-16 flex space-x-16 border-b border-slate-100 bg-white z-10 shrink-0">
                        {['Timeline', 'Chat history', 'Strategic Notes'].map(tab => {
                           const tabId = tab.toLowerCase().split(' ')[0];
                           const isActive = activeTab === (tabId === 'chat' ? 'chatlog' : tabId === 'strategic' ? 'internalnotes' : tabId);
                           return (
                              <button 
                                key={tab} 
                                onClick={() => setActiveTab(tabId === 'chat' ? 'chatlog' : tabId === 'strategic' ? 'internalnotes' : tabId)} 
                                className={`py-8 text-[11px] font-black uppercase tracking-[0.25em] relative transition-all ${isActive ? 'text-slate-900' : 'text-slate-300 hover:text-slate-500'}`}
                              >
                                 {tab}
                                 {isActive && <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900"></div>}
                              </button>
                           );
                        })}
                     </div>

                     <div className="flex-1 overflow-y-auto custom-scrollbar p-16 space-y-16">
                        {activeTab === 'timeline' && (
                           <div className="space-y-12 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
                               {(selectedContact.timeline || []).filter(e => !e.description.includes('Contact details updated')).slice().reverse().map((event, idx) => (
                                  <div key={idx} className="relative pl-14 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                                     <div className="absolute left-0 top-1.5 w-[40px] h-[40px] rounded-full bg-white border border-slate-100 flex items-center justify-center z-10 shadow-sm"><Activity size={14} className="text-slate-400" /></div>
                                     <div className="space-y-2">
                                        <div className="flex justify-between items-start">
                                           <p className="text-[15px] font-bold text-slate-800 leading-relaxed">{event.description}</p>
                                           <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">{event.eventType}</span>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center"><Clock size={12} className="mr-2" /> {formatDateTime(event.timestamp)}</p>
                                     </div>
                                  </div>
                               ))}
                           </div>
                        )}

                        {activeTab === 'chatlog' && (
                           <div className="space-y-8">
                              {recentMessages.length === 0 ? (
                                 <div className="p-20 text-center space-y-6">
                                    <MessageSquare size={48} strokeWidth={1} className="text-slate-200 mx-auto" />
                                    <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">History is quiet.</p>
                                 </div>
                              ) : recentMessages.map((msg, idx) => (
                                 <div key={idx} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-6 px-8 rounded-3xl text-[14px] font-bold leading-relaxed max-w-[75%] ${msg.direction === 'OUTBOUND' ? 'bg-slate-900 text-white rounded-br-none' : 'bg-slate-50 text-slate-600 rounded-bl-none'}`}>
                                       {msg.content}
                                       <div className={`mt-3 text-[9px] font-black uppercase tracking-widest ${msg.direction === 'OUTBOUND' ? 'text-white/40' : 'text-slate-300'}`}>{formatDateTime(msg.createdAt)}</div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}

                        {activeTab === 'internalnotes' && (
                           <div className="space-y-12">
                              <div className="space-y-6">
                                 <textarea 
                                   value={noteInput} 
                                   onChange={e=>setNoteInput(e.target.value)} 
                                   placeholder="Add a high-level strategic note..." 
                                   className="w-full bg-slate-50 border-none rounded-3xl p-8 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-200" 
                                   rows={5} 
                                 />
                                 <div className="flex justify-end">
                                    <button 
                                      onClick={()=>addInternalNote(selectedContact._id)} 
                                      disabled={isAddingNote || !noteInput.trim()} 
                                      className="px-12 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-600 transition-all disabled:opacity-30"
                                    >
                                       Save Strategic Note
                                    </button>
                                 </div>
                              </div>
                              <div className="space-y-8">
                                 {(selectedContact.notes || []).slice().reverse().map((note, idx) => (
                                    <div key={idx} className="p-10 border border-slate-100 rounded-[3rem] space-y-6 group hover:border-emerald-100 transition-colors">
                                       <p className="text-[16px] font-bold text-slate-700 leading-relaxed italic">"{note.content}"</p>
                                       <div className="flex items-center justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                          <div className="flex items-center space-x-3">
                                             <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">{note.createdBy?.charAt(0).toUpperCase()}</div>
                                             <span>{note.createdBy}</span>
                                          </div>
                                          <span>{formatDateTime(note.createdAt)}</span>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               <div className="px-12 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
                  <div className="flex items-center"><ShieldCheck size={14} className="mr-3 text-emerald-500" /> Enterprise Data Isolation Active</div>
                  <div className="flex items-center space-x-8">
                     <span>Ref: {selectedContact._id.toUpperCase()}</span>
                     <span>v2.5 Professional</span>
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
                  <button 
                      type="submit" 
                      disabled={isSavingLead}
                      className="w-full py-6 bg-slate-900 text-white text-[12px] font-black uppercase tracking-[0.4em] rounded-[2rem] shadow-3xl hover:-translate-y-2 active:scale-95 transition-all mt-4 disabled:opacity-50"
                   >
                      {isSavingLead ? "Initializing Profile..." : "Establish Profile"}
                   </button>
               </form>
            </div>
         </div>
       )}

      {/* CENTERED BULK ACTION CONSOLE */}
      {selectedIds.size > 0 && (
         <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={() => setSelectedIds(new Set())}>
            <div className="bg-white p-10 rounded-[3rem] shadow-3xl flex flex-col items-center space-y-8 animate-pop-in border border-white/50 w-[440px] relative overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
               
               <div className="w-20 h-20 bg-teal-500 text-white rounded-[2rem] flex items-center justify-center shadow-glow mb-2 transform -rotate-6">
                  <Users size={40} />
               </div>
               
               <div className="text-center">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-teal-600 mb-2">{selectedIds.size} Profiles Selected</p>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Bulk Command</h2>
               </div>
               
               <div className="w-full space-y-6">
                  <div className="space-y-3">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Lead Assignment Control</label>
                     <div className="relative group">
                        <Users size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                        <select 
                           value={bulkTargetAgent} 
                           onChange={(e) => setBulkTargetAgent(e.target.value)} 
                           className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-10 py-4 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500/50 text-sm font-bold text-slate-800 appearance-none cursor-pointer transition-all shadow-inner"
                        >
                           <option value="">Select Target Agent...</option>
                           <optgroup label="Core Team">
                              {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.role})</option>)}
                           </optgroup>
                        </select>
                        <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                     <button 
                        disabled={!bulkTargetAgent || isBulkUpdating} 
                        onClick={() => handleBulkAction("transfer_leads", bulkTargetAgent)} 
                        className="w-full py-5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-xl hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 disabled:translate-y-0"
                     >
                        {isBulkUpdating ? "Executing..." : "Manual Assign"}
                     </button>
                     
                     <div className="flex items-center space-x-4">
                        <button 
                           disabled={isBulkUpdating}
                           onClick={() => handleBulkAction("transfer_leads", "")}
                           className="flex-1 py-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-red-100 transition-all active:scale-95"
                        >
                           Bulk Unassign
                        </button>
                        <button 
                           onClick={() => setSelectedIds(new Set())} 
                           className="flex-1 py-4 bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
                        >
                           Dismiss
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}