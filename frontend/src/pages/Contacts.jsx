import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Search, Plus, X, Mail, MapPin, Phone, Users, 
  Clock, Activity, Target, Tag, Save, Filter, 
  Briefcase, Building2, Download, MoreVertical, 
  Flame, Sun, Snowflake, ArrowUpRight, Send, ShieldCheck, History, Calendar, CheckCircle2, TrendingUp, Globe, Smartphone, Bell, Landmark, Hash, Wallet, Headphones, ChevronDown, UserCircle, RefreshCw, Sparkles, Edit3
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
  const userRole = (user?.role || localStorage.getItem('role') || 'AGENT').toUpperCase().replace(/\s/g, '_');
  const roleData = roleAccess?.[userRole];
  const isSuper = ['ADMIN', 'SUPER_ADMIN', 'BUSINESS_HEAD', 'OWNER', 'MANAGER_COUNSELLOUR'].includes(userRole);


  const rolePermissions = roleData?.permissions || [];
  const canImport = isSuper || roleData?.allAccess || rolePermissions.includes('contacts_import');
  const canExport = isSuper || roleData?.allAccess || rolePermissions.includes('contacts_export');
  const canAdd = isSuper || roleData?.allAccess || rolePermissions.includes('contacts_add');
  const canFilter = isSuper || roleData?.allAccess || rolePermissions.includes('contacts_filter');
  const canSearch = isSuper || roleData?.allAccess || rolePermissions.includes('contacts_search');


  // Design states
  const [activeTab, setActiveTab] = useState('chatlog');
  const [noteInput, setNoteInput] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [strategicBrief, setStrategicBrief] = useState(null);

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
    program: 'ALL',
    qualification: 'ALL',
    minScore: 0,
    maxScore: 100,
    dateRange: 'ALL',
    startDate: '',
    endDate: '',
    startTime: '00:00',
    endTime: '23:59',
    month: 'ALL'
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
         console.log('[Diagnostics] fetchContacts | Count:', data.length, '| Sample:', data[0]);
         setContacts(data);
         if (data.length === 0) {
            toast.success("Connection Active: No leads found for current view", { icon: 'ℹ️' });
         }
         
         if (selectedContact) {
            const updated = data.find(c => c._id === selectedContact._id);
            if (updated) {
               setSelectedContact(updated);
               setEditedContact(updated);
               setShowSaveFab(false); 
            }
         }
      } else {
         const errData = await res.json().catch(() => ({}));
         toast.error(errData.message || "Failed to fetch leads from server");
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

  // Intelligence Filter Engine (V2)
  // Intelligence Filter Engine (V3) - Simplified for Maximum Visibility
  const filteredContacts = contacts.filter(contact => {
    // 1. Search Term (Phone or Name)
    if (searchTerm && searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      const matchName = contact.name?.toLowerCase().includes(q);
      const matchPhone = contact.phone?.toLowerCase().includes(q);
      if (!matchName && !matchPhone) return false;
    }

    // 2. Only filter if NOT "ALL"
    if (filters.status && filters.status !== 'ALL' && contact.status !== filters.status) return false;
    if (filters.stage && filters.stage !== 'ALL' && contact.pipelineStage !== filters.stage) return false;
    if (filters.agent && filters.agent !== 'ALL') {
      const contactAgent = String(contact.assignedAgent || '').toLowerCase();
      const filterAgent = String(filters.agent || '').toLowerCase();
      if (contactAgent !== filterAgent) return false;
    }

    if (filters.heat && filters.heat !== 'ALL' && contact.heatLevel !== filters.heat) return false;

    // 3. Score Range (Only if non-default)
    if (filters.minScore > 0 && (contact.score || 0) < filters.minScore) return false;
    if (filters.maxScore < 100 && (contact.score || 0) > filters.maxScore) return false;

    return true;
  });



     const activeFilterCount = Object.entries(filters).filter(([key, val]) => {
      // Exclude default values from the "Active Filter" count
      if (val === 'ALL' || val === false || val === '') return false;
      if (key === 'minScore' && val === 0) return false;
      if (key === 'maxScore' && val === 100) return false;
      if (key === 'startTime' && val === '00:00') return false;
      if (key === 'endTime' && val === '23:59') return false;
      if (key === 'startDate' && val === '') return false;
      if (key === 'endDate' && val === '') return false;
      if (key === 'minValue' && val === 0) return false;
      if (key === 'heat' && val === 'ALL') return false;
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

  const generateBrief = async (contactId) => {
    setIsGeneratingBrief(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/chat/action`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, action: 'generate_brief' })
      });
      if (res.ok) {
        const data = await res.json();
        setStrategicBrief(data.brief);
        toast.success("Intelligence Brief Generated!");
      }
    } catch (err) {
      console.error(err);
      toast.error("AI Brief generation failed");
    } finally {
      setIsGeneratingBrief(false);
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
     setEditedContact(prev => {
        let updates = { ...prev, [field]: value };
        
        // AUTOMATIC PIPELINE MAPPING
        if (field === 'admissionStatus') {
           if (value === 'Admitted') {
              updates.pipelineStage = 'Won';
              updates.status = 'CLOSED_WON';
           } else if (value === 'Cancelled') {
              updates.pipelineStage = 'Lost';
              updates.status = 'CLOSED_LOST';
           }
        }
        
        return updates;
     });
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
                  <div className="flex flex-col"><h2 className="text-2xl font-black text-slate-800 tracking-tight">Contact Workspace</h2><div className="flex items-center space-x-2 mt-1"><div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Server: {contacts.length} Leads | Filtered: {filteredContacts.length} Visible</p></div></div>
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
          <div className="fixed inset-0 z-[150] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowProfile(false)}>
            <div 
              className="w-[1050px] h-full bg-white shadow-2xl flex flex-col animate-slide-left relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
               {/* PROFESSIONAL MINIMALIST HEADER */}
               <div className="bg-white border-b border-slate-100 px-10 py-7 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-6">
                        <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl font-bold text-slate-400">
                           {editedContact.firstName?.charAt(0) || selectedContact.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                           <div className="flex items-center space-x-3">
                              <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">
                                 {editedContact.firstName || editedContact.name || 'Lead'} {editedContact.lastName || ''}
                              </h2>
                              <div className="px-2.5 py-1 bg-slate-50 text-slate-500 rounded text-[9px] font-bold uppercase tracking-widest border border-slate-200">
                                 {editedContact.pipelineStage || 'Discovery'}
                              </div>
                           </div>
                           <div className="flex items-center space-x-6 mt-1.5 text-slate-400 text-xs font-medium">
                              <span className="flex items-center"><Phone size={13} className="mr-2 opacity-60" /> {editedContact.phone}</span>
                              <span className="flex items-center"><Hash size={13} className="mr-2 opacity-60" /> ID: {selectedContact._id.slice(-6).toUpperCase()}</span>
                           </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => updateContactDetail(selectedContact._id, editedContact)}
                          disabled={!showSaveFab || isUpdatingContact}
                          className="px-8 py-3 bg-slate-800 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-sm hover:bg-slate-900 transition-all disabled:opacity-30"
                        >
                           {isUpdatingContact ? 'Syncing...' : 'Save Changes'}
                        </button>
                        <button onClick={() => setShowProfile(false)} className="p-2.5 text-slate-300 hover:text-slate-800 transition-all"><X size={20} /></button>
                    </div>
               </div>

               <div className="flex-1 flex overflow-hidden">
                  {/* LEFT PANEL: STRUCTURED STEP-BY-STEP FLOW */}
                  <div className="w-[420px] bg-slate-50/50 border-r border-slate-100 overflow-y-auto custom-scrollbar p-8 space-y-12">
                     
                     {/* STEP 1: BASIC INFORMATION */}
                     <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                           <div className="w-6 h-6 rounded-full bg-slate-800 text-white text-[10px] flex items-center justify-center font-bold">1</div>
                           <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Basic Information</h3>
                        </div>
                        
                        <div className="space-y-4 pl-9">
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Full Name</label>
                              <input value={editedContact.firstName || editedContact.name || ''} onChange={e=>handleFieldChange('firstName', e.target.value)} placeholder="Full Name" className="w-full bg-white border border-slate-200 py-2.5 px-3 text-sm font-medium text-slate-800 rounded outline-none focus:border-slate-400 transition-all" />
                           </div>

                           <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">WhatsApp Profile (Locked)</label>
                              <div className="w-full bg-slate-100/50 border border-slate-100 py-2.5 px-3 text-sm font-medium text-slate-400 rounded flex items-center">
                                 <Phone size={12} className="mr-2 opacity-40" /> {editedContact.phone}
                              </div>
                           </div>

                           <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                 <label className="text-[9px] font-bold text-slate-400 uppercase">Alternative Numbers</label>
                                 {!editedContact.secondaryPhone && (
                                    <button onClick={() => handleFieldChange('secondaryPhone', ' ')} className="text-[9px] font-bold text-slate-800 flex items-center hover:bg-slate-100 px-2 py-1 rounded transition-all">
                                       <Plus size={10} className="mr-1" /> Add
                                    </button>
                                 )}
                              </div>
                              {editedContact.secondaryPhone !== undefined && (
                                 <input value={editedContact.secondaryPhone || ''} onChange={e=>handleFieldChange('secondaryPhone', e.target.value)} placeholder="Secondary WhatsApp" className="w-full bg-white border border-slate-200 py-2.5 px-3 text-sm font-medium text-slate-800 rounded outline-none focus:border-slate-400 animate-fade-in" />
                              )}
                              <input value={editedContact.altMobile || ''} onChange={e=>handleFieldChange('altMobile', e.target.value)} placeholder="Alternative Mobile Number" className="w-full bg-white border border-slate-200 py-2.5 px-3 text-sm font-medium text-slate-800 rounded outline-none focus:border-slate-400" />
                           </div>

                           <div className="space-y-4 pt-2">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Detailed Address</label>
                              <div className="grid grid-cols-2 gap-3">
                                 <input value={editedContact.houseNo || ''} onChange={e=>handleFieldChange('houseNo', e.target.value)} placeholder="House No" className="w-full bg-white border border-slate-200 py-2 px-3 text-xs font-medium text-slate-800 rounded outline-none" />
                                 <input value={editedContact.societyName || ''} onChange={e=>handleFieldChange('societyName', e.target.value)} placeholder="Society Name" className="w-full bg-white border border-slate-200 py-2 px-3 text-xs font-medium text-slate-800 rounded outline-none" />
                              </div>
                              <input value={editedContact.streetAddress || ''} onChange={e=>handleFieldChange('streetAddress', e.target.value)} placeholder="Street Address" className="w-full bg-white border border-slate-200 py-2.5 px-3 text-xs font-medium text-slate-800 rounded outline-none" />
                              <div className="grid grid-cols-2 gap-3">
                                 <select value={editedContact.city || ''} onChange={e=>handleFieldChange('city', e.target.value)} className="w-full bg-white border border-slate-200 py-2 px-3 text-xs font-medium text-slate-700 rounded outline-none">
                                    <option value="">Choose City</option>
                                    {['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Mumbai', 'Pune', 'Bangalore', 'Delhi'].map(c => <option key={c} value={c}>{c}</option>)}
                                 </select>
                                 <select value={editedContact.state || ''} onChange={e=>handleFieldChange('state', e.target.value)} className="w-full bg-white border border-slate-200 py-2 px-3 text-xs font-medium text-slate-700 rounded outline-none">
                                    <option value="">Choose State</option>
                                    {['Gujarat', 'Maharashtra', 'Karnataka', 'Rajasthan', 'Madhya Pradesh', 'Delhi'].map(s => <option key={s} value={s}>{s}</option>)}
                                 </select>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                 <div className="w-full bg-slate-50 border border-slate-100 py-2 px-3 text-xs font-bold text-slate-400 rounded">India</div>
                                 <input value={editedContact.pincode || ''} onChange={e=>handleFieldChange('pincode', e.target.value)} placeholder="Pincode" className="w-full bg-white border border-slate-200 py-2 px-3 text-xs font-medium text-slate-800 rounded outline-none" />
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* STEP 2: QUALIFICATION */}
                     <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                           <div className="w-6 h-6 rounded-full bg-slate-800 text-white text-[10px] flex items-center justify-center font-bold">2</div>
                           <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Qualification</h3>
                        </div>
                        
                        <div className="space-y-4 pl-9">
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Last Qualification</label>
                              <input value={editedContact.qualification || ''} onChange={e=>handleFieldChange('qualification', e.target.value)} placeholder="e.g. 12th, Graduate" className="w-full bg-white border border-slate-200 py-2.5 px-3 text-sm font-medium text-slate-800 rounded outline-none focus:border-slate-400 transition-all" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Interested Program</label>
                              <input value={editedContact.selectedProgram || ''} onChange={e=>handleFieldChange('selectedProgram', e.target.value)} placeholder="Target Course" className="w-full bg-white border border-slate-200 py-2.5 px-3 text-sm font-medium text-slate-800 rounded outline-none focus:border-slate-400 transition-all" />
                           </div>
                        </div>
                     </div>

                     {/* STEP 3: VISIT & ADMISSION */}
                     <div className="space-y-6 pb-10">
                        <div className="flex items-center space-x-3">
                           <div className="w-6 h-6 rounded-full bg-slate-800 text-white text-[10px] flex items-center justify-center font-bold">3</div>
                           <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest text-red-600">Visit & Admission</h3>
                        </div>
                        
                        <div className="space-y-6 pl-9">
                           {/* VISIT TYPE */}
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Visit Type</label>
                              <div className="grid grid-cols-2 gap-2">
                                 {['University Visit', 'Office Visit'].map(v => (
                                    <button key={v} onClick={() => handleFieldChange('visitType', v)} className={`py-2 rounded text-[9px] font-bold uppercase border transition-all ${editedContact.visitType === v ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-100'}`}>{v}</button>
                                 ))}
                              </div>
                           </div>

                           {/* VISIT STATUS */}
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Visit Status</label>
                              <div className="grid grid-cols-2 gap-2">
                                 {['Not Done', 'Done'].map(v => (
                                    <button key={v} onClick={() => handleFieldChange('visitStatus', v)} className={`py-2 rounded text-[9px] font-bold uppercase border transition-all ${editedContact.visitStatus === v ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-100'}`}>{v}</button>
                                 ))}
                              </div>
                           </div>

                           {/* COUNSELLOR */}
                           {editedContact.visitStatus === 'Done' && (
                              <div className="space-y-1.5 animate-fade-in">
                                 <label className="text-[9px] font-bold text-slate-400 uppercase">Handled By Counsellor</label>
                                 <select value={editedContact.assignedCounsellor || ''} onChange={e=>handleFieldChange('assignedCounsellor', e.target.value)} className="w-full bg-white border border-slate-200 py-2 px-3 text-xs font-medium text-slate-700 rounded outline-none">
                                    <option value="">Select Counsellor...</option>
                                    {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                                 </select>
                              </div>
                           )}

                           {/* ADMISSION STATUS */}
                           <div className="space-y-1.5 pt-4">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Final Admission Verdict</label>
                              <div className="grid grid-cols-3 gap-2">
                                 {[
                                    { id: 'PENDING', label: 'Pending', color: 'slate' },
                                    { id: 'CLOSED_WON', label: 'Done', color: 'green' },
                                    { id: 'CLOSED_LOST', label: 'Cancell', color: 'red' }
                                 ].map(s => (
                                    <button key={s.id} onClick={() => handleFieldChange('status', s.id)} className={`py-3 rounded text-[8px] font-bold uppercase transition-all border ${editedContact.status === s.id ? `bg-${s.color}-600 text-white border-${s.color}-600` : `bg-white text-${s.color}-600 border-${s.color}-100 hover:bg-${s.color}-50`}`}>{s.label}</button>
                                 ))}
                              </div>
                        </div>
                     </div>
                  </div>

                 {/* RIGHT PANEL: INTERACTION HUB */}
                 <div className="flex-1 flex flex-col bg-white overflow-hidden">
                    <div className="px-8 flex space-x-8 border-b border-slate-100 bg-white shrink-0">
                       {['Timeline', 'Chat history', 'Strategic Notes'].map(tab => {
                          const tabId = tab.toLowerCase().split(' ')[0];
                          const isActive = activeTab === (tabId === 'chat' ? 'chatlog' : tabId === 'strategic' ? 'internalnotes' : tabId);
                          return (
                             <button 
                               key={tab} 
                               onClick={() => setActiveTab(tabId === 'chat' ? 'chatlog' : tabId === 'strategic' ? 'internalnotes' : tabId)} 
                               className={`py-4 text-[10px] font-bold uppercase tracking-wider relative transition-all ${isActive ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                             >
                                {tab}
                                {isActive && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-800"></div>}
                             </button>
                          );
                       })}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                       {activeTab === 'timeline' && (
                          <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
                              {(selectedContact.timeline || []).filter(e => !e.description.includes('Contact details updated')).slice().reverse().map((event, idx) => (
                                 <div key={idx} className="relative pl-8">
                                    <div className="absolute left-0 top-1 w-[22px] h-[22px] rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center z-10 text-slate-400">
                                       <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                    </div>
                                    <div className="pb-4">
                                       <div className="flex justify-between items-center">
                                          <p className="text-sm font-medium text-slate-700">{event.description}</p>
                                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">{event.eventType}</span>
                                       </div>
                                       <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(event.timestamp)}</p>
                                    </div>
                                 </div>
                              ))}
                          </div>
                       )}

                       {activeTab === 'chatlog' && (
                          <div className="space-y-4">
                             {recentMessages.length === 0 ? (
                                <div className="py-20 text-center text-slate-300 text-xs uppercase tracking-widest">No communication history</div>
                             ) : recentMessages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                                   <div className={`p-3.5 px-4 rounded-lg text-sm max-w-[85%] ${msg.direction === 'OUTBOUND' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                      {msg.content}
                                      <div className={`mt-2 text-[9px] font-medium uppercase opacity-50`}>{formatDateTime(msg.createdAt)}</div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}

                       {activeTab === 'internalnotes' && (
                          <div className="space-y-8 animate-fade-in">
                             {/* AI STRATEGIC BRIEF SECTION */}
                             <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                   <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                      <Activity size={12} className="mr-2" /> Strategic Insight
                                   </h3>
                                   {!strategicBrief && (
                                      <button 
                                        onClick={() => generateBrief(selectedContact._id)}
                                        disabled={isGeneratingBrief}
                                        className="px-4 py-2 bg-slate-800 text-white rounded text-[9px] font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center disabled:opacity-50"
                                      >
                                         {isGeneratingBrief ? <RefreshCw size={10} className="mr-2 animate-spin" /> : <Sparkles size={10} className="mr-2 text-teal-400" />}
                                         Run AI Analysis
                                      </button>
                                   )}
                                </div>

                                {strategicBrief && (
                                   <div className="border border-slate-200 rounded-lg overflow-hidden">
                                      <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                                         <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">AI Profile Scan</span>
                                      </div>
                                      <div className="p-6 space-y-6">
                                         <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                               <p className="text-[9px] font-bold text-slate-400 uppercase">Response Velocity</p>
                                               <p className="text-xs font-bold text-slate-700">{strategicBrief.responseVelocity}</p>
                                            </div>
                                            <div className="space-y-1">
                                               <p className="text-[9px] font-bold text-slate-400 uppercase">Inferred Qualification</p>
                                               <p className="text-xs font-bold text-slate-700">{strategicBrief.qualification || 'N/A'}</p>
                                            </div>
                                         </div>
                                         <div className="p-4 bg-slate-50 rounded border border-slate-100">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Executive Summary</p>
                                            <p className="text-xs text-slate-600 leading-relaxed italic">{strategicBrief.summary}</p>
                                         </div>
                                      </div>
                                   </div>
                                )}
                             </div>

                             <div className="space-y-4">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                                   <Edit3 size={12} className="mr-2" /> Activity Journal
                                </h3>
                                <textarea 
                                  value={noteInput} 
                                  onChange={e=>setNoteInput(e.target.value)} 
                                  placeholder="Document interaction..." 
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 outline-none focus:border-slate-400" 
                                  rows={3} 
                                />
                                <div className="flex justify-end">
                                   <button 
                                     onClick={()=>addInternalNote(selectedContact._id)} 
                                     disabled={isAddingNote || !noteInput.trim()} 
                                     className="px-6 py-2 bg-slate-800 text-white text-[9px] font-bold uppercase tracking-widest rounded hover:bg-slate-900 transition-all"
                                   >
                                      Save Entry
                                   </button>
                                </div>
                             </div>
                             <div className="space-y-4">
                                {(selectedContact.notes || []).slice().reverse().map((note, idx) => (
                                   <div key={idx} className="p-4 border border-slate-100 rounded-lg bg-slate-50/50">
                                      <p className="text-xs text-slate-700 leading-relaxed">{note.content}</p>
                                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3">
                                         <span>{note.createdBy}</span>
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
            </div>
         </div>
      )}


      {showFilters && (
         <div className="fixed inset-0 z-[200] flex justify-end items-stretch bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowFilters(false)}>
            <div className="w-[500px] bg-white shadow-2xl flex flex-col animate-slide-left h-full" onClick={e=>e.stopPropagation()}>
               <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                  <div>
                     <h2 className="text-xl font-black text-slate-800 tracking-tight">Intelligence Filter</h2>
                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Granular Lead Data Mining</p>
                  </div>
                  <button onClick={() => setShowFilters(false)} className="p-2 text-slate-400 hover:text-slate-800 transition-all"><X size={24} /></button>
               </div>

               <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-[#fcfcfd]">
                  
                  {/* SECTION 1: LEAD OWNERSHIP */}
                  <div className="space-y-6">
                     <h3 className="text-[11px] font-black text-teal-600 uppercase tracking-widest border-b border-teal-50 pb-3 flex items-center">
                        <Users size={14} className="mr-2" /> Team Ownership
                     </h3>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Agent / Counsellor</label>
                        <select value={filters.agent} onChange={e=>setFilters({...filters, agent: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all">
                           <option value="ALL">All Team Members</option>
                           {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.role})</option>)}
                        </select>
                     </div>
                  </div>

                  {/* SECTION 2: ACADEMIC PROFILE */}
                  <div className="space-y-6">
                     <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center">
                        <Target size={14} className="mr-2" /> Academic Profile
                     </h3>
                     <div className="grid grid-cols-1 gap-5">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interested Program</label>
                           <input 
                              type="text" 
                              value={filters.program === 'ALL' ? '' : filters.program} 
                              onChange={e=>setFilters({...filters, program: e.target.value || 'ALL'})}
                              placeholder="Search Course..."
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Qualification</label>
                           <input 
                              type="text" 
                              value={filters.qualification === 'ALL' ? '' : filters.qualification} 
                              onChange={e=>setFilters({...filters, qualification: e.target.value || 'ALL'})}
                              placeholder="Search Degree..."
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400"
                           />
                        </div>
                     </div>
                  </div>

                  {/* SECTION 3: TIMELINE ENGINE */}
                  <div className="space-y-8">
                     <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center">
                        <Clock size={14} className="mr-2" /> Timeline Engine
                     </h3>
                     
                     <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter by Month</label>
                           <select value={filters.month} onChange={e=>setFilters({...filters, month: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all">
                              <option value="ALL">Any Month</option>
                              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                                 <option key={m} value={i}>{m}</option>
                              ))}
                           </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</label>
                              <input type="date" value={filters.startDate} onChange={e=>setFilters({...filters, startDate: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Date</label>
                              <input type="date" value={filters.endDate} onChange={e=>setFilters({...filters, endDate: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50" />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">From Time</label>
                              <input type="time" value={filters.startTime} onChange={e=>setFilters({...filters, startTime: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To Time</label>
                              <input type="time" value={filters.endTime} onChange={e=>setFilters({...filters, endTime: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50" />
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* SECTION 4: OPERATIONAL STATUS */}
                  <div className="space-y-6">
                     <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center">
                        <Activity size={14} className="mr-2" /> Operational Status
                     </h3>
                     <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lifecycle Status</label>
                           <select value={filters.status} onChange={e=>setFilters({...filters, status: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all">
                              <option value="ALL">All Lifecycle Statuses</option>
                              {['NEW LEAD', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'].map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pipeline Stage</label>
                           <select value={filters.stage} onChange={e=>setFilters({...filters, stage: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all">
                              <option value="ALL">All Pipeline Stages</option>
                              {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                     </div>
                  </div>

               </div>

               <div className="p-8 border-t border-slate-100 bg-white grid grid-cols-2 gap-4 shrink-0">
                  <button 
                     onClick={() => {
                        setFilters({ status: 'ALL', heat: 'ALL', stage: 'ALL', agent: 'ALL', source: 'ALL', program: 'ALL', qualification: 'ALL', minScore: 0, maxScore: 100, dateRange: 'ALL', startDate: '', endDate: '', startTime: '00:00', endTime: '23:59', month: 'ALL' });
                        toast.success("Filters Reset");
                     }}
                     className="py-4 border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                  >
                     Reset All
                  </button>
                  <button onClick={() => setShowFilters(false)} className="py-4 bg-teal-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 hover:bg-teal-700 transition-all">Apply Filter</button>
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