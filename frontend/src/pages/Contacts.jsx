import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Search, Plus, X, Mail, MapPin, Phone, Users, User,
  Clock, Activity, Target, Tag, Save, Filter, 
  Briefcase, Building2, Download, MoreVertical, 
  Flame, Sun, Snowflake, ArrowUpRight, Send, Shield, ShieldCheck, History, Calendar, CheckCircle2, TrendingUp, Globe, Smartphone, Bell, Landmark, Hash, Wallet, Headphones, ChevronDown, UserCircle, RefreshCw, Sparkles, Edit3, Trash2, MoreHorizontal,
  Award, CheckCircle, Video, Home, School, Map, GraduationCap, Star
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
  const [showNoteModal, setShowNoteModal] = useState(false);
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
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [activeBulkMenu, setActiveBulkMenu] = useState(null); // 'assign', 'source', 'more'

  const fileInputRef = React.useRef(null);

  const PIPELINE_STAGES = ['NEW', 'OPEN', 'CLOSE', 'VISITED', 'PENDING VISIT', 'ADMISSION'];

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      if (!token) return;
      
      // Cache-busting: Added timestamp to ensure we always get fresh data
      const res = await fetch(`/api/chat/contacts?t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      
      if (res.ok) {
         const data = await res.json();
         setContacts(data);
         
         if (selectedContact) {
            const updated = data.find(c => c._id === selectedContact._id);
            if (updated) {
               setSelectedContact(updated);
               // Do NOT reset editedContact if the user is currently editing, 
               // but do it if we just finished a save.
               if (!showSaveFab) {
                  setEditedContact({
                     ...updated,
                     secondaryPhone: updated.secondaryPhone || '',
                     altMobile: updated.altMobile || '',
                     houseNo: updated.houseNo || '',
                     societyName: updated.societyName || '',
                     streetAddress: updated.streetAddress || '',
                     city: updated.city || '',
                     state: updated.state || '',
                     pincode: updated.pincode || '',
                     qualification: updated.qualification || '',
                     selectedProgram: updated.selectedProgram || '',
                     visitStatus: updated.visitStatus || 'Not Done',
                     visitType: updated.visitType || '',
                     assignedCounsellor: updated.assignedCounsellor || '',
                     closeReason: updated.closeReason || '',
                     leadSourceType: updated.leadSourceType || 'Manual Entry',
                     socialMediaSource: updated.socialMediaSource || '',
                     referenceName: updated.referenceName || '',
                     referencePhone: updated.referencePhone || '',
                     b2bOrgName: updated.b2bOrgName || '',
                     b2bPersonName: updated.b2bPersonName || '',
                     b2bPhone: updated.b2bPhone || ''
                  });
               }
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
      
      // Clean payload: Remove internal Mongo fields to prevent update errors
      const cleanPayload = { ...updates };
      delete cleanPayload._id;
      delete cleanPayload.__v;
      delete cleanPayload.createdAt;
      delete cleanPayload.updatedAt;
      delete cleanPayload.timeline;
      delete cleanPayload.notes;

      console.log("[Sync] Sending Payload to Server:", { contactId, action: 'update_contact', payload: cleanPayload });
      
      const res = await fetch(`/api/chat/action`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, action: 'update_contact', payload: cleanPayload })
      });
       if (res.ok) {
        const data = await res.json();
        const freshContact = data.contact;

        // 1. Instantly update the main list state to reflect changes without waiting for re-fetch
        setContacts(prev => prev.map(c => c._id === contactId ? freshContact : c));

        // 2. Sync the detailed view state
        setSelectedContact(freshContact);
        setEditedContact({
           ...freshContact,
           secondaryPhone: freshContact.secondaryPhone || '',
           altMobile: freshContact.altMobile || '',
           houseNo: freshContact.houseNo || '',
           societyName: freshContact.societyName || '',
           streetAddress: freshContact.streetAddress || '',
           city: freshContact.city || '',
           state: freshContact.state || '',
           pincode: freshContact.pincode || '',
           qualification: freshContact.qualification || '',
           email: freshContact.email || '',
           address: freshContact.address || '',
           estimatedValue: freshContact.estimatedValue || 0,
           leadSource: freshContact.leadSource || '',
           selectedProgram: freshContact.selectedProgram || '',
           visitStatus: freshContact.visitStatus || 'Not Done',
           visitType: freshContact.visitType || '',
           assignedCounsellor: freshContact.assignedCounsellor || '',
           closeReason: freshContact.closeReason || '',
           leadSourceType: freshContact.leadSourceType || 'Manual Entry',
           socialMediaSource: freshContact.socialMediaSource || '',
           referenceName: freshContact.referenceName || '',
           referencePhone: freshContact.referencePhone || '',
           b2bOrgName: freshContact.b2bOrgName || '',
           b2bPersonName: freshContact.b2bPersonName || '',
           b2bPhone: freshContact.b2bPhone || ''
        });
        
        setShowSaveFab(false);
        toast.success("Profile Synchronized Successfully");
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || "Server rejected the update");
      }
    } catch (err) {
      console.error("[Sync Error]:", err);
      toast.error("Network sync failed");
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
        setShowNoteModal(false);
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
         'pipelineStage': 'update_stage',
         'leadSource': 'update_lead_source',
         'status': 'update_status',
         'delete': 'hard_delete_leads'
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
     setEditedContact({ 
        ...contact, 
        secondaryPhone: contact.secondaryPhone || "", 
        altMobile: contact.altMobile || "", 
        houseNo: contact.houseNo || "", 
        societyName: contact.societyName || "", 
        streetAddress: contact.streetAddress || "", 
        city: contact.city || "", 
        state: contact.state || "", 
        pincode: contact.pincode || "", 
        qualification: contact.qualification || "", 
        selectedProgram: contact.selectedProgram || "", 
        visitStatus: contact.visitStatus || "Not Done", 
        visitType: contact.visitType || "", 
        assignedCounsellor: contact.assignedCounsellor || "",
        leadSourceType: contact.leadSourceType || "Manual Entry",
        socialMediaSource: contact.socialMediaSource || "",
        referenceName: contact.referenceName || "",
        referencePhone: contact.referencePhone || "",
        b2bOrgName: contact.b2bOrgName || "",
        b2bPersonName: contact.b2bPersonName || "",
        b2bPhone: contact.b2bPhone || ""
     });
     setShowProfile(true);
     fetchRecentMessages(contact._id);
     setShowSaveFab(false);
     setActiveTab('timeline');
  };

  const handleFieldChange = (field, value) => {
      setEditedContact(prev => {
         let updates = { ...prev, [field]: value };
         
         // AUTOMATIC STATUS & STAGE SYNC
         if (field === 'status') {
            if (value === 'ADMISSION' || value === 'CLOSED_WON') {
               updates.pipelineStage = 'ADMISSION';
               updates.isClosed = true;
            } else if (value === 'CLOSE' || value === 'CLOSED_LOST') {
               updates.pipelineStage = 'CLOSE';
               updates.isClosed = true;
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
    <div className="bg-crm-bg min-h-screen flex flex-col animate-fade-in font-sans text-slate-800">
      <div className="bg-white border-b border-slate-100 px-4 sm:px-8 py-3 sticky top-0 z-40 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4">
         <div className="w-full sm:w-auto flex items-center justify-between">
            <h1 className="text-[11px] sm:text-xs font-bold text-slate-400 flex items-center">
               <Users className="mr-2 text-blue-600" size={16} /> <span className="hidden sm:inline">Workspace</span> Database
            </h1>
            <div className="flex items-center space-x-3 sm:hidden">
                <div className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                   <p className="text-[10px] font-bold text-blue-600">{filteredContacts.length} Leads</p>
                </div>
            </div>
         </div>
         <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            <div className="hidden sm:flex items-center space-x-3 text-xs">
               <div className="text-right">
                  <p className="text-slate-400 font-bold text-[9px]">Filtered</p>
                  <p className="font-bold text-slate-800">{filteredContacts.length}</p>
               </div>
               <div className="w-[1px] h-6 bg-slate-100 mx-2"></div>
               <div>
                  <p className="text-blue-600 font-bold text-[9px]">Selected</p>
                  <p className="font-bold text-slate-800">{selectedIds.size}</p>
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
                 className="flex-1 sm:flex-none px-6 py-3 bg-slate-900 text-white text-xs font-bold rounded-2xl hover:shadow-glow transition transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center space-x-2"
               >
                  <Plus size={14} />
                  <span>Add Profile</span>
               </button>
            )}
         </div>
      </div>

      <div className="p-4 sm:p-8 flex-1 flex flex-col max-w-7xl mx-auto w-full">
          <div className="flex flex-col space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div className="flex flex-col">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Contact Workspace</h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                      <p className="text-[11px] font-semibold text-slate-400">{filteredContacts.length} Leads Active</p>
                    </div>
                  </div>
                  {canSearch && (
                        <div className="relative w-full sm:w-[360px]">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                           <input 
                             type="text" 
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                             placeholder="Search identity or mobile..." 
                             className="bg-white border border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold text-gray-700 placeholder-gray-300 focus:ring-4 focus:ring-[var(--theme-border)]/10 outline-none transition-all w-full shadow-sm"
                           />
                        </div>
                  )}
              </div>

              {canFilter && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex-1 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-2 overflow-x-auto no-scrollbar">
                          <div className="flex items-center px-4 border-r border-slate-100 space-x-3 mr-1 shrink-0">
                              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                              <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">Pulse Hunt:</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 shrink-0">
                             <select value={filters.status} onChange={e=>setFilters({...filters, status: e.target.value})} className="bg-slate-50 text-xs font-semibold py-2.5 px-4 rounded-xl border-none focus:ring-2 focus:ring-blue-100 cursor-pointer min-w-[110px] appearance-none">
                                <option value="ALL">All Status</option>
                                {['NEW', 'OPEN', 'CLOSE', 'VISITED', 'PENDING VISIT', 'ADMISSION'].map(s => <option key={s} value={s}>{s}</option>)}
                             </select>

                             <select value={filters.stage} onChange={e=>setFilters({...filters, stage: e.target.value})} className="bg-slate-50 text-xs font-semibold py-2.5 px-4 rounded-xl border-none focus:ring-2 focus:ring-blue-100 cursor-pointer min-w-[110px] appearance-none">
                                <option value="ALL">All Stages</option>
                                {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                          </div>
                      </div>

                      <button 
                        onClick={() => setShowFilters(true)}
                        className="flex items-center justify-center space-x-3 px-6 py-4 bg-white border border-slate-100 rounded-3xl shadow-sm text-slate-700 hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95 group"
                      >
                         <Filter size={18} className={activeFilterCount > 0 ? "text-blue-600" : "text-slate-400 group-hover:text-blue-600 transition-colors"} />
                         <span className="text-xs font-bold">More Filters</span>
                      </button>
                  </div>
               )}
          </div>

          {/* Mobile Leads View */}
           <div className="sm:hidden space-y-4">
              {filteredContacts.map((c, i) => (
                 <div key={c._id || i} onClick={() => handleRowClick(c)} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-premium active:scale-[0.98] transition-all relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shadow-sm border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                             {c.firstName?.charAt(0) || c.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{c.name || 'Unknown'}</p>
                             <div className="flex items-center space-x-2 mt-0.5">
                                <Smartphone size={10} className="text-slate-300" />
                                <p className="text-[10px] font-bold text-slate-400">{c.phone}</p>
                             </div>
                          </div>
                       </div>
                       <span className={`px-3 py-1 rounded-full text-[8px] font-bold border ${
                         c.pipelineStage === 'ADMISSION' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                         c.pipelineStage === 'CLOSE' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                         'bg-slate-50 text-slate-500 border-slate-100'
                       }`}>{c.pipelineStage || 'Discovery'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                       <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                             <UserCircle size={14} className="text-slate-400" />
                          </div>
                                                     <div className="flex flex-col space-y-0.5">
                              <span className="text-[9px] font-bold text-blue-500 flex items-center">
                                 <Users size={8} className="mr-1" /> {agents.find(a => a._id === c.assignedAgent)?.name || 'Unassigned'}
                              </span>
                              {c.assignedCounsellor && (
                                 <span className="text-[9px] font-bold text-indigo-500 flex items-center">
                                    <Shield size={8} className="mr-1" /> {agents.find(a => a._id === c.assignedCounsellor)?.name || 'No Expert'}
                                 </span>
                              )}
                           </div>
                       </div>
                    </div>
                 </div>
              ))}
              {filteredContacts.length === 0 && (
                 <div className="py-24 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                       <Users size={40} className="text-slate-200" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400">No matching leads discovered</p>
                 </div>
              )}
           </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 shadow-premium overflow-hidden">
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
                        <th className="py-5 px-6 text-xs font-semibold text-gray-400">Telecaller</th>
                        <th className="py-5 px-6 text-xs font-semibold text-gray-400">Counsellor</th>
                        <th className="py-5 px-6 text-xs font-semibold text-gray-400">Profile Identity</th>
                        <th className="py-5 px-8 text-right text-xs font-semibold text-gray-400">Actions</th>
                     </tr>
                   </thead>
                   <tbody>
                     {filteredContacts.map((c, i) => (
                       <tr key={c._id || i} onClick={() => handleRowClick(c)} className={`cursor-pointer group hover:bg-[#fafafa] transition-colors relative after:absolute after:left-0 after:top-0 after:bottom-0 after:w-0 group-hover:after:w-1 after:bg-[var(--theme-bg)] after:transition-all ${selectedIds.has(c._id) ? 'bg-blue-50/20 shadow-inner' : ''}`}>
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
                                 <Users size={12} className="mr-2 text-blue-400" />
                                 <select 
                                    value={c.assignedAgent || ''} 
                                    onChange={(e) => {
                                       handleBulkAction("transfer_leads", e.target.value, [c._id]);
                                    }}
                                    className="bg-transparent text-[11px] font-bold text-slate-600 outline-none cursor-pointer border-none p-0 focus:ring-0 max-w-[100px] overflow-hidden text-ellipsis"
                                 >
                                    <option value="">Unassigned</option>
                                    {agents.filter(a => ['TELECALLER', 'AGENT', 'ADMIN'].includes(a.role?.toUpperCase())).map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                                 </select>
                              </div>
                           </td>
                           <td className="py-5 px-6 border-b border-gray-50" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center">
                                 <Shield size={12} className="mr-2 text-indigo-400" />
                                 <select 
                                    value={c.assignedCounsellor || ''} 
                                    onChange={(e) => {
                                       updateContactDetail(c._id, { ...c, assignedCounsellor: e.target.value });
                                    }}
                                    className="bg-transparent text-[11px] font-bold text-slate-600 outline-none cursor-pointer border-none p-0 focus:ring-0 max-w-[100px] overflow-hidden text-ellipsis"
                                 >
                                    <option value="">No Expert</option>
                                    {agents.filter(a => ['MANAGER_COUNSELLOUR', 'MANAGER_COUNSELOR', 'COUNSELLOUR', 'COUNSELLOR', 'COUNSELOR', 'MANAGER COUNSELLOUR'].includes(a.role?.toUpperCase())).map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                                 </select>
                              </div>
                           </td>
                          <td className="py-5 px-6 border-b border-gray-50">
                             <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center font-bold text-sm group-hover:bg-[var(--theme-bg)] group-hover:text-white transition-colors">
                                   {c.firstName ? c.firstName.charAt(0) : (c.name?.charAt(0) || 'U')}
                                </div>
                                <div>
                                   <p className="text-[13px] font-bold text-slate-800 leading-none mb-1.5">
                                      {c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : (c.name || 'Unknown User')}
                                   </p>
                                   <p className="text-[10px] font-bold text-gray-400 capitalize">{c.phone}</p>
                                 </div>
                             </div>
                          </td>
                          <td className="py-5 px-8 border-b border-gray-50 text-right" onClick={(e) => e.stopPropagation()}>
                             <button onClick={() => handleRowClick(c)} className="p-2 text-gray-300 hover:text-slate-800 transition-colors"><MoreVertical size={18} /></button>
                          </td>
                       </tr>
                     ))}
                   </tbody>
                </table>
             </div>
          </div>
      </div>

      {showProfile && selectedContact && editedContact && createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-fade-in p-4 sm:p-6" onClick={() => setShowProfile(false)}>
            <div 
              className="w-full max-w-6xl h-full sm:h-[90vh] bg-white shadow-3xl rounded-[2.5rem] flex flex-col animate-pop-in relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
                {/* PROFESSIONAL PREMIUM HEADER */}
                <div className="bg-slate-50/50 backdrop-blur-xl border-b border-slate-100 px-4 sm:px-10 py-5 sm:py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 gap-4 sm:gap-0 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                     <div className="flex items-center space-x-4 sm:space-x-7 w-full sm:w-auto relative z-10">
                         <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-[1.5rem] bg-white shadow-premium border border-slate-100 flex items-center justify-center text-2xl sm:text-3xl font-bold text-slate-800 shrink-0 group hover:scale-105 transition-all">
                            <span className="opacity-40 group-hover:opacity-100 transition-opacity">{editedContact.firstName?.charAt(0) || selectedContact.name?.charAt(0) || 'U'}</span>
                         </div>
                         <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                               <h2 className="text-xl sm:text-3xl font-bold text-slate-800 tracking-tight truncate max-w-[180px] sm:max-w-none">
                                  {editedContact.firstName || editedContact.name || 'Lead'} {editedContact.lastName || ''}
                               </h2>
                               <div className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[9px] sm:text-[10px] font-bold capitalize border border-teal-100 shadow-sm">
                                  {editedContact.pipelineStage || 'Discovery'}
                               </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 mt-2 text-slate-400 text-[10px] sm:text-[11px] font-bold capitalize">
                               <span className="flex items-center truncate hover:text-slate-600 transition-colors cursor-default"><Phone size={14} className="mr-2 text-teal-500" /> {editedContact.phone}</span>
                               <span className="flex items-center hover:text-slate-600 transition-colors cursor-default"><Hash size={14} className="mr-2 text-indigo-400" /> ID: {selectedContact._id.slice(-6).toUpperCase()}</span>
                            </div>
                         </div>
                     </div>

                     <div className="flex items-center justify-between sm:justify-end space-x-3 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100 relative z-10">
                      <div className="flex flex-col items-start sm:items-end mr-0 sm:mr-3">
                         <label className="text-[9px] font-bold text-slate-400 capitalize mb-1.5 ml-1">Lead Status</label>
                         <div className="relative group">
                            <select 
                               value={editedContact.status || 'NEW LEAD'} 
                               onChange={e => handleFieldChange('status', e.target.value)}
                               className={`text-[10px] sm:text-[11px] font-bold capitalize px-4 sm:px-6 py-2.5 rounded-xl border-2 shadow-sm transition-all outline-none appearance-none pr-10 ${
                                  editedContact.status === 'CLOSED_WON' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                  editedContact.status === 'CLOSED_LOST' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                  'bg-white border-slate-100 text-slate-700 hover:border-slate-300'
                               }`}
                            >
                               <option value="NEW LEAD">New Lead</option>
                               <option value="CONTACTED">Contacted</option>
                               <option value="INTERESTED">Interested</option>
                               <option value="FOLLOW_UP">Follow Up</option>
                               <option value="CLOSED_WON">Admission follow up update</option>
                               <option value="CLOSED_LOST">Admission Cancelled</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" />
                         </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button 
                           onClick={() => {
                              console.log("[Sync] Triggering Save for:", selectedContact._id);
                              updateContactDetail(selectedContact._id, editedContact);
                           }}
                           disabled={isUpdatingContact}
                           className={`h-11 sm:h-12 px-5 sm:px-10 rounded-2xl text-[10px] sm:text-[12px] font-bold uppercase tracking-[0.1em] shadow-lg transition-all flex items-center justify-center active:scale-95 ${
                              showSaveFab 
                              ? 'bg-slate-900 text-white hover:bg-black shadow-slate-900/20 ring-4 ring-slate-900/5' 
                              : 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
                           }`}
                        >
                           {isUpdatingContact ? (
                              <RefreshCw size={14} className="animate-spin" />
                           ) : (
                              <><Save size={16} className="sm:mr-3" /> <span className="hidden sm:inline">Commit Changes</span></>
                           )}
                        </button>
                        <button onClick={() => setShowProfile(false)} className="w-11 h-11 sm:w-12 sm:h-12 bg-white hover:bg-rose-50 hover:text-rose-600 rounded-2xl text-slate-400 transition-all flex items-center justify-center border border-slate-100 shadow-sm active:scale-90">
                           <X size={22} />
                        </button>
                      </div>
                   </div>
               </div>

               <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                  {/* LEFT PANEL: STRUCTURED STEP-BY-STEP FLOW */}
                  <div className="flex-1 lg:w-[460px] bg-slate-50/80 border-b lg:border-b-0 lg:border-r border-slate-100 overflow-y-auto custom-scrollbar p-4 sm:p-8 space-y-10 lg:shrink-0">
                     
                     {/* STEP 0: BASIC INFORMATION */}
                     <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 sm:p-10 shadow-premium space-y-8 animate-fade-in">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white text-xs flex items-center justify-center font-bold shadow-lg shadow-slate-900/20">00</div>
                              <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-[0.2em]">Basic Information</h3>
                           </div>
                           <div className="h-[2px] flex-1 bg-slate-50 mx-6 rounded-full hidden sm:block"></div>
                           <User size={18} className="text-slate-200" />
                        </div>
                        
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Legal Full Name</label>
                              <div className="relative group">
                                 <input 
                                   value={editedContact.firstName || editedContact.name || ''} 
                                   onChange={e=>handleFieldChange('firstName', e.target.value)} 
                                   placeholder="Enter full name" 
                                   className="w-full bg-slate-50/50 border-2 border-slate-50 py-3.5 px-5 text-sm font-bold text-slate-800 rounded-2xl outline-none focus:bg-white focus:border-teal-500/20 focus:ring-4 focus:ring-teal-500/5 transition-all" 
                                 />
                                 <Edit3 size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within:text-teal-500 transition-colors" />
                              </div>
                           </div>

                           <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">WhatsApp Identity (Verified)</label>
                              <div className="w-full bg-slate-50 border-2 border-transparent py-3.5 px-5 text-sm font-bold text-slate-500 rounded-2xl flex items-center">
                                 <Phone size={14} className="mr-3 text-teal-500 opacity-60" /> {editedContact.phone}
                              </div>
                           </div>

                           <div className="space-y-4 pt-4 border-t border-slate-50">
                              <div className="flex items-center justify-between">
                                 <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Communication Channels</label>
                                 {(!editedContact.secondaryPhone || editedContact.secondaryPhone.trim() === '') && (
                                    <button 
                                       onClick={() => handleFieldChange('secondaryPhone', '+')} 
                                       className="text-[10px] font-bold text-teal-600 flex items-center hover:bg-teal-50 px-3 py-1.5 rounded-xl transition-all"
                                    >
                                       <Plus size={12} className="mr-1.5" /> Add WhatsApp
                                    </button>
                                 )}
                              </div>
                              
                              <div className="grid grid-cols-1 gap-4">
                                 {((editedContact.secondaryPhone && editedContact.secondaryPhone.length > 0) || (editedContact.altMobile && editedContact.altMobile.length > 0)) && (
                                    <div className="space-y-2 animate-fade-in">
                                       <input 
                                          value={editedContact.secondaryPhone} 
                                          onChange={e=>handleFieldChange('secondaryPhone', e.target.value)} 
                                          placeholder="Secondary WhatsApp Number" 
                                          className="w-full bg-slate-50/50 border-2 border-slate-50 py-3.5 px-5 text-sm font-bold text-slate-800 rounded-2xl outline-none focus:bg-white focus:border-teal-500/20 focus:ring-4 focus:ring-teal-500/5 transition-all" 
                                       />
                                    </div>
                                 )}

                                 <div className="space-y-2">
                                    <input 
                                       value={editedContact.altMobile || ''} 
                                       onChange={e=>handleFieldChange('altMobile', e.target.value)} 
                                       placeholder="Alternative Mobile Number" 
                                       className="w-full bg-slate-50/50 border-2 border-slate-50 py-3.5 px-5 text-sm font-bold text-slate-800 rounded-2xl outline-none focus:bg-white focus:border-teal-500/20 focus:ring-4 focus:ring-teal-500/5 transition-all" 
                                    />
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-5 pt-4 border-t border-slate-50">
                              <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Location Details</label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 <input value={editedContact.houseNo || ''} onChange={e=>handleFieldChange('houseNo', e.target.value)} placeholder="House No" className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-5 text-xs font-bold text-slate-800 rounded-2xl outline-none focus:bg-white focus:border-teal-500/20 transition-all" />
                                 <input value={editedContact.societyName || ''} onChange={e=>handleFieldChange('societyName', e.target.value)} placeholder="Society Name" className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-5 text-xs font-bold text-slate-800 rounded-2xl outline-none focus:bg-white focus:border-teal-500/20 transition-all" />
                              </div>
                              <input value={editedContact.streetAddress || ''} onChange={e=>handleFieldChange('streetAddress', e.target.value)} placeholder="Street Address" className="w-full bg-slate-50/50 border-2 border-slate-50 py-3.5 px-5 text-xs font-bold text-slate-800 rounded-2xl outline-none focus:bg-white focus:border-teal-500/20 transition-all" />
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 <div className="relative group">
                                    <select value={editedContact.city || ''} onChange={e=>handleFieldChange('city', e.target.value)} className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-5 text-xs font-bold text-slate-700 rounded-2xl outline-none focus:bg-white focus:border-teal-500/20 transition-all appearance-none pr-10">
                                       <option value="">Choose City</option>
                                       {['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Mumbai', 'Pune', 'Bangalore', 'Delhi'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                 </div>
                                 <div className="relative group">
                                    <select value={editedContact.state || ''} onChange={e=>handleFieldChange('state', e.target.value)} className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-5 text-xs font-bold text-slate-700 rounded-2xl outline-none focus:bg-white focus:border-teal-500/20 transition-all appearance-none pr-10">
                                       <option value="">Choose State</option>
                                       {['Gujarat', 'Maharashtra', 'Karnataka', 'Rajasthan', 'Madhya Pradesh', 'Delhi'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                 </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="w-full bg-slate-100/50 border-2 border-transparent py-3 px-5 text-[10px] font-bold text-slate-400 rounded-2xl flex items-center uppercase trackingest">India</div>
                                 <input value={editedContact.pincode || ''} onChange={e=>handleFieldChange('pincode', e.target.value)} placeholder="Pincode" className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-5 text-xs font-bold text-slate-800 rounded-2xl outline-none focus:bg-white focus:border-teal-500/20 transition-all" />
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* STEP 1: QUALIFICATION DETAILS */}
                     <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 sm:p-10 shadow-premium space-y-8 animate-fade-in delay-100">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-2xl bg-teal-500 text-white text-xs flex items-center justify-center font-bold shadow-lg shadow-teal-500/20">01</div>
                              <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-[0.2em]">Qualification Details</h3>
                           </div>
                           <GraduationCap size={18} className="text-slate-200" />
                        </div>

                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Last Qualification</label>
                              <div className="relative group">
                                 <input value={editedContact.qualification || ''} onChange={e=>handleFieldChange('qualification', e.target.value)} placeholder="e.g. Bachelor of Commerce" className="w-full bg-slate-50/50 border-2 border-slate-50 py-3.5 px-5 text-sm font-bold text-slate-800 rounded-2xl outline-none focus:bg-white focus:border-teal-500/20 transition-all" />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Selected Program</label>
                              <div className="relative group">
                                 <select value={editedContact.selectedProgram || ''} onChange={e=>handleFieldChange('selectedProgram', e.target.value)} className="w-full bg-slate-50/50 border-2 border-slate-50 py-3.5 px-5 text-sm font-bold text-slate-700 rounded-2xl outline-none focus:bg-white focus:border-teal-500/20 transition-all appearance-none pr-10">
                                    <option value="">Choose Program</option>
                                    {['MBA Professional', 'Executive PGDM', 'Digital Marketing', 'Data Science', 'UI/UX Design'].map(p => <option key={p} value={p}>{p}</option>)}
                                 </select>
                                 <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* STEP 2: LEAD SOURCE */}
                     <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 sm:p-10 shadow-premium space-y-8 animate-fade-in">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white text-xs flex items-center justify-center font-bold shadow-lg shadow-indigo-600/20">02</div>
                              <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-[0.2em]">Lead Source</h3>
                           </div>
                           <Globe size={18} className="text-slate-200" />
                        </div>
                        
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Primary Source</label>
                              <div className="relative group">
                                 <select 
                                   value={editedContact.leadSourceType || 'Manual Entry'} 
                                   onChange={e=>handleFieldChange('leadSourceType', e.target.value)}
                                   className="w-full bg-slate-50/50 border-2 border-slate-50 py-3.5 px-5 text-sm font-bold text-slate-700 rounded-2xl outline-none focus:bg-white focus:border-indigo-500/20 transition-all appearance-none pr-10"
                                 >
                                    <option value="Manual Entry">Manual Entry</option>
                                    <option value="Social media">Social media</option>
                                    <option value="Referese">Referese</option>
                                    <option value="B2B agents">B2B agents</option>
                                    <option value="Direct">Direct</option>
                                    <option value="Other">Other</option>
                                 </select>
                                 <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                              </div>
                           </div>

                           {editedContact.leadSourceType === 'Social media' && (
                              <div className="space-y-2 animate-fade-in">
                                 <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Platform</label>
                                 <div className="relative group">
                                    <select 
                                      value={editedContact.socialMediaSource || ''} 
                                      onChange={e=>handleFieldChange('socialMediaSource', e.target.value)}
                                      className="w-full bg-slate-50/50 border-2 border-slate-50 py-3.5 px-5 text-sm font-bold text-slate-700 rounded-2xl outline-none focus:bg-white focus:border-blue-500/20 transition-all appearance-none pr-10"
                                    >
                                       <option value="">Choose Platform</option>
                                       {['Instagram', 'Snapchat', 'YouTube', 'Jio Hotstar', 'Google Ads', 'Whatsapp Marketing'].map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                 </div>
                              </div>
                           )}

                           {editedContact.leadSourceType === 'Referese' && (
                              <div className="grid grid-cols-1 gap-4 animate-fade-in">
                                 <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Referese Name</label>
                                    <input 
                                       value={editedContact.referenceName || ''} 
                                       onChange={e=>handleFieldChange('referenceName', e.target.value)} 
                                       placeholder="Person who referred" 
                                       className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-5 text-xs font-bold text-slate-800 rounded-2xl outline-none focus:bg-white focus:border-indigo-500/20 transition-all" 
                                    />
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Mobile Number</label>
                                    <input 
                                       value={editedContact.referencePhone || ''} 
                                       onChange={e=>handleFieldChange('referencePhone', e.target.value)} 
                                       placeholder="Contact number" 
                                       className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-5 text-xs font-bold text-slate-800 rounded-2xl outline-none focus:bg-white focus:border-indigo-500/20 transition-all" 
                                    />
                                 </div>
                              </div>
                           )}

                           {editedContact.leadSourceType === 'B2B agents' && (
                              <div className="grid grid-cols-1 gap-4 animate-fade-in">
                                 <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Organization Name</label>
                                    <input 
                                       value={editedContact.b2bOrgName || ''} 
                                       onChange={e=>handleFieldChange('b2bOrgName', e.target.value)} 
                                       placeholder="Name of agency/company" 
                                       className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-5 text-xs font-bold text-slate-800 rounded-2xl outline-none focus:bg-white focus:border-indigo-500/20 transition-all" 
                                    />
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Person Name</label>
                                    <input 
                                       value={editedContact.b2bPersonName || ''} 
                                       onChange={e=>handleFieldChange('b2bPersonName', e.target.value)} 
                                       placeholder="Agent name" 
                                       className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-5 text-xs font-bold text-slate-800 rounded-2xl outline-none focus:bg-white focus:border-indigo-500/20 transition-all" 
                                    />
                                 </div>
                                 <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Mobile Number</label>
                                    <input 
                                       value={editedContact.b2bPhone || ''} 
                                       onChange={e=>handleFieldChange('b2bPhone', e.target.value)} 
                                       placeholder="Contact number" 
                                       className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-5 text-xs font-bold text-slate-800 rounded-2xl outline-none focus:bg-white focus:border-indigo-500/20 transition-all" 
                                    />
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>

                     {/* STEP 3: VISIT FORMAT */}
                     <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 sm:p-10 shadow-premium space-y-8 animate-fade-in delay-200">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white text-xs flex items-center justify-center font-bold shadow-lg shadow-indigo-500/20">03</div>
                              <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-[0.2em]">Visit Format</h3>
                           </div>
                           <Map size={18} className="text-slate-200" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <button 
                              onClick={() => handleFieldChange('visitStatus', editedContact.visitStatus === 'Done' ? 'Not Done' : 'Done')}
                              className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center justify-center space-y-3 ${
                                 editedContact.visitStatus === 'Done' 
                                 ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-lg shadow-emerald-500/10' 
                                 : 'bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200'
                              }`}
                           >
                              <CheckCircle size={20} />
                              <span className="text-[10px] font-bold capitalize">{editedContact.visitStatus === 'Done' ? 'Visit Done' : 'Mark Done'}</span>
                           </button>

                           <div className="relative group">
                              <select 
                                 value={editedContact.visitType || ''} 
                                 onChange={e=>handleFieldChange('visitType', e.target.value)} 
                                 className="w-full h-full bg-slate-50/50 border-2 border-slate-50 py-3 px-5 text-[10px] font-bold capitalize text-slate-700 rounded-3xl outline-none focus:bg-white focus:border-indigo-500/20 transition-all appearance-none text-center"
                              >
                                 <option value="">Format</option>
                                 <option value="Online">Online</option>
                                 <option value="Office Visit">Office</option>
                                 <option value="Campus Visit">Campus</option>
                              </select>
                           </div>
                        </div>
                     </div>

                     {/* STEP 4: COUNSELLING STATUS */}
                     <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 sm:p-10 shadow-premium space-y-8 animate-fade-in delay-300">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white text-xs flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">04</div>
                              <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-[0.2em]">Counselling Status</h3>
                           </div>
                           <Award size={18} className="text-slate-200" />
                        </div>

                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Assigned Counsellor</label>
                              <div className="relative group">
                                 <select 
                                    value={editedContact.assignedCounsellor || ''} 
                                    onChange={e=>handleFieldChange('assignedCounsellor', e.target.value)} 
                                    className="w-full bg-slate-50/50 border-2 border-slate-50 py-3.5 px-5 text-sm font-bold text-slate-700 rounded-2xl outline-none focus:bg-white focus:border-amber-500/20 transition-all appearance-none pr-10"
                                 >
                                    <option value="">Assign Expert...</option>
                                    {(agents.filter(a => ['MANAGER_COUNSELLOUR', 'MANAGER_COUNSELOR', 'COUNSELLOUR', 'COUNSELLOR', 'COUNSELOR', 'MANAGER COUNSELLOUR'].includes(a.role?.toUpperCase())).length > 0 
                                       ? agents.filter(a => ['MANAGER_COUNSELLOUR', 'MANAGER_COUNSELOR', 'COUNSELLOUR', 'COUNSELLOR', 'COUNSELOR', 'MANAGER COUNSELLOUR'].includes(a.role?.toUpperCase())) 
                                       : agents).map(a => (
                                       <option key={a._id} value={a._id}>{a.name} ({a.role})</option>
                                    ))}
                                 </select>
                                 <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                              </div>
                           </div>
                        </div>
                     </div>

                  </div>

                  {/* RIGHT PANEL: INTERACTION HUB */}
                  <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                       <div className="flex items-center space-x-1 p-2 shrink-0 bg-slate-50/50 border-b border-slate-100">
                          {['timeline', 'chat history', 'strategic notes'].map((tab) => (
                             <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold capitalize transition-all relative ${
                                   activeTab === tab 
                                   ? 'bg-white text-slate-900 shadow-premium scale-[1.02] z-10' 
                                   : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                                }`}
                             >
                                {tab}
                             </button>
                          ))}
                       </div>

                     <div className="flex-1 overflow-y-auto custom-scrollbar p-resp">
                        {activeTab === 'timeline' && (
                           <div className="space-y-6 relative">
                               {(!selectedContact.timeline || selectedContact.timeline.length === 0) ? (
                                 <div className="py-20 text-center flex flex-col items-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                       <Activity size={24} className="text-slate-200" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-300 capitalize">No activity recorded yet</p>
                                 </div>
                               ) : (
                                 <div className="relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
                                    {(selectedContact.timeline || []).filter(e => !e.description?.includes('Contact details updated')).slice().reverse().map((event, idx) => (
                                       <div key={idx} className="relative pl-10 mb-8 last:mb-0">
                                          <div className="absolute left-0 top-1 w-[22px] h-[22px] rounded-full bg-white border-2 border-slate-100 flex items-center justify-center z-10 shadow-sm">
                                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                          </div>
                                          <div className="flex flex-col">
                                             <div className="flex justify-between items-start gap-4">
                                                <p className="text-sm font-bold text-slate-700 leading-tight">{event.description?.split(' - ')[0]}</p>
                                                <span className="shrink-0 text-[8px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                                   {event.eventType?.replace('_', ' ')}
                                                </span>
                                             </div>
                                             {event.description?.includes(' - ') && (
                                                <p className="text-[11px] text-slate-500 font-medium mt-1.5 bg-slate-50/50 p-2 rounded-xl border border-slate-100/50 italic">
                                                   {event.description.split(' - ').slice(1).join(' - ')}
                                                </p>
                                             )}
                                             <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center">
                                                <Clock size={10} className="mr-1.5 opacity-50" /> {formatDateTime(event.timestamp)}
                                             </p>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                               )}
                           </div>
                        )}

                        {activeTab === 'chat history' && (
                           <div className="space-y-6">
                              {recentMessages.length === 0 ? (
                                 <div className="py-20 text-center text-slate-300 text-xs capitalize">No communication history</div>
                              ) : recentMessages.map((msg, idx) => (
                                 <div key={idx} className={`flex ${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-5 rounded-[2rem] shadow-premium relative group transition-all hover:shadow-lg ${
                                       msg.direction === 'OUTBOUND' 
                                       ? 'bg-slate-900 text-white ml-auto rounded-tr-none border border-slate-800' 
                                       : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'
                                    }`}>
                                       <div className={`text-sm font-medium leading-relaxed mb-3 ${msg.direction === 'OUTBOUND' ? 'text-slate-100' : 'text-slate-700'}`}>
                                          {msg.content}
                                       </div>
                                       <div className={`flex items-center justify-between text-[9px] font-bold capitalize opacity-40 group-hover:opacity-100 transition-opacity ${msg.direction === 'OUTBOUND' ? 'text-white' : 'text-slate-400'}`}>
                                          <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                       </div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}

                        {activeTab === 'strategic notes' && (
                           <div className="space-y-8 animate-fade-in">
                              <div className="flex items-center justify-between px-2 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:bg-white hover:shadow-premium transition-all">
                                 <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/20 transform group-hover:rotate-6 transition-transform">
                                       <Plus size={22} />
                                    </div>
                                    <div>
                                       <h4 className="text-xs font-bold text-slate-800 capitalize">Internal Remarks</h4>
                                       <p className="text-[10px] font-bold text-slate-400 capitalize mt-0.5">Follow-up notes & insights</p>
                                    </div>
                                 </div>
                                 <button 
                                    onClick={() => setShowNoteModal(true)}
                                    className="px-8 py-3.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-900/10 active:scale-95 hover:-translate-y-0.5 transition-all flex items-center space-x-3"
                                 >
                                    <Plus size={14} />
                                    <span>Add New Note</span>
                                 </button>
                              </div>

                              <div className="space-y-4">
                                 {(selectedContact.notes || []).slice().reverse().map((note, idx) => (
                                    <div key={idx} className="p-6 bg-white rounded-[2rem] border border-slate-100 shadow-premium transition-all hover:scale-[1.01]">
                                       <p className="text-sm font-medium text-slate-700 leading-relaxed">{note.content}</p>
                                       <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 capitalize mt-4 pt-4 border-t border-slate-50">
                                          <span className="flex items-center"><UserCircle size={10} className="mr-1" /> {note.createdBy}</span>
                                          <span className="flex items-center"><Clock size={10} className="mr-1" /> {formatDateTime(note.createdAt)}</span>
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
         </div>,
         document.body
      )}


      {showFilters && (
         <div className="fixed inset-0 z-[200] flex justify-end items-stretch bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowFilters(false)}>
            <div className="w-[500px] bg-white shadow-2xl flex flex-col animate-slide-left h-full" onClick={e=>e.stopPropagation()}>
               <div className="p-resp border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                  <div>
                     <h2 className="text-xl font-bold text-slate-800 tracking-tight">Intelligence Filter</h2>
                     <p className="text-[10px] font-bold text-slate-300 capitalize mt-1">Granular Lead Data Mining</p>
                  </div>
                  <button onClick={() => setShowFilters(false)} className="p-2 text-slate-400 hover:text-slate-800 transition-all"><X size={24} /></button>
               </div>

               <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-[#fcfcfd]">
                  
                  {/* SECTION 1: LEAD OWNERSHIP */}
                  <div className="space-y-6">
                     <h3 className="text-[11px] font-bold text-teal-600 capitalize border-b border-teal-50 pb-3 flex items-center">
                        <Users size={14} className="mr-2" /> Team Ownership
                     </h3>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 capitalize">Lead Owner / Transferred to</label>
                        <select value={filters.agent} onChange={e=>setFilters({...filters, agent: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all">
                           <option value="ALL">All Team Members</option>
                           {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.role})</option>)}
                        </select>
                     </div>
                  </div>

                  {/* SECTION 2: ACADEMIC PROFILE */}
                  <div className="space-y-6">
                     <h3 className="text-[11px] font-bold text-slate-400 capitalize border-b border-slate-100 pb-3 flex items-center">
                        <Target size={14} className="mr-2" /> Academic Profile
                     </h3>
                     <div className="grid grid-cols-1 gap-5">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 capitalize">Interested Program</label>
                           <input 
                              type="text" 
                              value={filters.program === 'ALL' ? '' : filters.program} 
                              onChange={e=>setFilters({...filters, program: e.target.value || 'ALL'})}
                              placeholder="Search Course..."
                              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 capitalize">Last Qualification</label>
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
                     <h3 className="text-[11px] font-bold text-slate-400 capitalize border-b border-slate-100 pb-3 flex items-center">
                        <Clock size={14} className="mr-2" /> Timeline Engine
                     </h3>
                     
                     <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 capitalize">Filter by Month</label>
                           <select value={filters.month} onChange={e=>setFilters({...filters, month: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all">
                              <option value="ALL">Any Month</option>
                              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                                 <option key={m} value={i}>{m}</option>
                              ))}
                           </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 capitalize">Start Date</label>
                              <input type="date" value={filters.startDate} onChange={e=>setFilters({...filters, startDate: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 capitalize">End Date</label>
                              <input type="date" value={filters.endDate} onChange={e=>setFilters({...filters, endDate: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50" />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 capitalize">From Time</label>
                              <input type="time" value={filters.startTime} onChange={e=>setFilters({...filters, startTime: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 capitalize">To Time</label>
                              <input type="time" value={filters.endTime} onChange={e=>setFilters({...filters, endTime: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50" />
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* SECTION 4: OPERATIONAL STATUS */}
                  <div className="space-y-6">
                     <h3 className="text-[11px] font-bold text-slate-400 capitalize border-b border-slate-100 pb-3 flex items-center">
                        <Activity size={14} className="mr-2" /> Operational Status
                     </h3>
                     <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 capitalize">Lifecycle Status</label>
                           <select value={filters.status} onChange={e=>setFilters({...filters, status: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all">
                              <option value="ALL">All Lifecycle Statuses</option>
                              {['NEW LEAD', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'].map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 capitalize">Pipeline Stage</label>
                           <select value={filters.stage} onChange={e=>setFilters({...filters, stage: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-400 transition-all">
                              <option value="ALL">All Pipeline Stages</option>
                              {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                     </div>
                  </div>

               </div>

               <div className="p-resp border-t border-slate-100 bg-white grid grid-cols-2 gap-4 shrink-0">
                  <button 
                     onClick={() => {
                        setFilters({ status: 'ALL', heat: 'ALL', stage: 'ALL', agent: 'ALL', source: 'ALL', program: 'ALL', qualification: 'ALL', minScore: 0, maxScore: 100, dateRange: 'ALL', startDate: '', endDate: '', startTime: '00:00', endTime: '23:59', month: 'ALL' });
                        toast.success("Filters Reset");
                     }}
                     className="py-4 border border-slate-200 rounded-2xl text-[11px] font-bold capitalize text-slate-400 hover:bg-slate-50 transition-all"
                  >
                     Reset All
                  </button>
                  <button onClick={() => setShowFilters(false)} className="py-4 bg-teal-600 text-white rounded-2xl text-[11px] font-bold capitalize shadow-lg shadow-teal-500/20 hover:bg-teal-700 transition-all">Apply Filter</button>
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
              <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Onboard Entity</h2>
              <p className="text-base font-bold text-slate-400 mb-10 lowercase tracking-tight">Initialize a new secure lead profile in the workspace.</p>
               <form onSubmit={handleAddContact} className="space-y-8">
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-2">Identity Signature</label>
                     <input autoFocus type="text" value={newLeadName} onChange={e=>setNewLeadName(e.target.value)} required className="w-full bg-[#f9fafb] border border-slate-100 rounded-[2rem] px-7 py-5 outline-none focus:ring-4 focus:ring-[var(--theme-border)]/10 focus:border-[var(--theme-border)]/50 text-base font-bold text-slate-800 transition-all shadow-sm" placeholder="Full name profile" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-2">Communication Hub</label>
                     <input type="tel" value={newLeadPhone} onChange={e=>setNewLeadPhone(e.target.value)} required className="w-full bg-[#f9fafb] border border-slate-100 rounded-[2rem] px-7 py-5 outline-none focus:ring-4 focus:ring-[var(--theme-border)]/10 focus:border-[var(--theme-border)]/50 text-base font-bold text-slate-800 transition-all shadow-sm" placeholder="+91 XXX XXX XXXX" />
                  </div>
                  <button 
                      type="submit" 
                      disabled={isSavingLead}
                      className="w-full py-6 bg-slate-900 text-white text-[12px] font-bold uppercase tracking-[0.4em] rounded-[2rem] shadow-3xl hover:-translate-y-2 active:scale-95 transition-all mt-4 disabled:opacity-50"
                   >
                      {isSavingLead ? "Initializing Profile..." : "Establish Profile"}
                   </button>
               </form>
            </div>
         </div>
       )}

      {showNoteModal && createPortal(
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/60 backdrop-blur-[6px] animate-fade-in" onClick={() => setShowNoteModal(false)}>
           <div className="bg-white p-10 rounded-[3rem] w-[540px] shadow-3xl animate-pop-in relative border border-white/50 overflow-hidden" onClick={e=>e.stopPropagation()}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <button onClick={() => setShowNoteModal(false)} className="absolute top-8 right-8 p-3 text-slate-300 hover:text-slate-900 transition-all hover:rotate-90"><X size={26} /></button>
              <div className="w-16 h-16 bg-teal-500 text-white rounded-3xl flex items-center justify-center shadow-glow mb-8 transform -rotate-6"><Plus size={28} /></div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Add Remark</h2>
              <p className="text-sm font-bold text-slate-400 mb-8 lowercase tracking-tight">Type your internal follow-up note below.</p>
               <div className="space-y-6">
                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-inner">
                     <textarea 
                        autoFocus
                        value={noteInput} 
                        onChange={e=>setNoteInput(e.target.value)} 
                        placeholder="Write your note here..." 
                        className="w-full h-40 bg-transparent text-sm font-medium text-slate-700 placeholder-slate-300 outline-none resize-none leading-relaxed"
                     />
                  </div>
                  <button 
                      onClick={() => addInternalNote(selectedContact._id)}
                      disabled={isAddingNote || !noteInput.trim()}
                      className="w-full py-5 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-[0.3em] rounded-2xl shadow-3xl hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50"
                   >
                      {isAddingNote ? "Saving..." : "Save Note Now"}
                   </button>
               </div>
            </div>
         </div>,
         document.body
       )}

       {/* STICKY BULK COMMAND BAR (INTEGRATED) */}
       {selectedIds.size > 0 && (
          <div className="sticky top-[100px] z-[90] animate-fade-in mb-6">
             <div className="bg-slate-900 border border-white/10 rounded-3xl px-8 py-4 shadow-2xl flex items-center justify-between text-white overflow-visible">
                <div className="flex items-center space-x-8">
                   {/* Counter & Status */}
                   <div className="flex items-center space-x-4 pr-8 border-r border-white/10">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                         <span className="text-sm font-black tracking-tighter">{selectedIds.size}</span>
                      </div>
                      <div className="flex flex-col">
                         <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Selected</p>
                         <p className="text-xs font-bold text-slate-300">Workspace Ready</p>
                      </div>
                   </div>

                   {/* Primary Actions Grid */}
                   <div className="flex items-center space-x-6">
                      {/* Assign Dropdown */}
                      <div className="relative">
                         <button 
                            onClick={() => setActiveBulkMenu(activeBulkMenu === 'assign' ? null : 'assign')}
                            className={`flex items-center space-x-3 px-5 py-2.5 rounded-xl transition-all ${activeBulkMenu === 'assign' ? 'bg-white text-slate-900' : 'hover:bg-white/5 text-slate-300'}`}
                         >
                            <Users size={16} className={activeBulkMenu === 'assign' ? 'text-blue-600' : 'text-slate-400'} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Assign Agent</span>
                            <ChevronDown size={14} className={`transform transition-transform ${activeBulkMenu === 'assign' ? 'rotate-180' : ''}`} />
                         </button>

                         {activeBulkMenu === 'assign' && (
                            <div className="absolute top-full mt-3 left-0 w-64 bg-slate-900 border border-white/10 rounded-3xl shadow-3xl overflow-hidden animate-pop-in z-[100]">
                               <div className="p-4 bg-white/5 border-b border-white/5">
                                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Select Target Expert</p>
                               </div>
                               <div className="max-h-64 overflow-y-auto custom-scrollbar p-2">
                                  {agents.map(a => (
                                     <button 
                                        key={a._id}
                                        onClick={() => { handleBulkAction('transfer_leads', a._id); setActiveBulkMenu(null); }}
                                        className="w-full text-left px-4 py-3 rounded-2xl hover:bg-white/5 text-slate-300 hover:text-white transition-all flex items-center space-x-3"
                                     >
                                        <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">{a.name.charAt(0)}</div>
                                        <span className="text-xs font-bold">{a.name}</span>
                                     </button>
                                  ))}
                               </div>
                            </div>
                         )}
                      </div>

                      {/* Source Dropdown */}
                      <div className="relative">
                         <button 
                            onClick={() => setActiveBulkMenu(activeBulkMenu === 'source' ? null : 'source')}
                            className={`flex items-center space-x-3 px-5 py-2.5 rounded-xl transition-all ${activeBulkMenu === 'source' ? 'bg-white text-slate-900' : 'hover:bg-white/5 text-slate-300'}`}
                         >
                            <Globe size={16} className={activeBulkMenu === 'source' ? 'text-indigo-600' : 'text-slate-400'} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Update Source</span>
                            <ChevronDown size={14} className={`transform transition-transform ${activeBulkMenu === 'source' ? 'rotate-180' : ''}`} />
                         </button>

                         {activeBulkMenu === 'source' && (
                            <div className="absolute top-full mt-3 left-0 w-56 bg-slate-900 border border-white/10 rounded-3xl shadow-3xl overflow-hidden animate-pop-in z-[100]">
                               <div className="p-4 bg-white/5 border-b border-white/5">
                                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Select New Source</p>
                               </div>
                               <div className="p-2 space-y-1">
                                  {['Manual Entry', 'Social media', 'Reference', 'B2B agents', 'Direct', 'Other'].map(s => (
                                     <button 
                                        key={s}
                                        onClick={() => { handleBulkAction('leadSource', s); setActiveBulkMenu(null); }}
                                        className="w-full text-left px-4 py-3 rounded-2xl hover:bg-white/5 text-slate-300 hover:text-white transition-all text-xs font-bold"
                                     >
                                        {s}
                                     </button>
                                  ))}
                               </div>
                            </div>
                         )}
                      </div>

                      {/* Export */}
                      <button 
                         onClick={handleExportCSV}
                         className="flex items-center space-x-3 px-5 py-2.5 rounded-xl hover:bg-white/5 transition-all group"
                      >
                         <Download size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors">Export</span>
                      </button>

                      {/* More */}
                      <div className="relative">
                        <button 
                            onClick={() => setActiveBulkMenu(activeBulkMenu === 'more' ? null : 'more')}
                            className={`p-2.5 rounded-xl transition-all ${activeBulkMenu === 'more' ? 'bg-white text-slate-900' : 'hover:bg-white/5 text-slate-400'}`}
                        >
                            <MoreHorizontal size={18} />
                        </button>
                        {activeBulkMenu === 'more' && (
                            <div className="absolute top-full mt-3 right-0 w-64 bg-slate-900 border border-white/10 rounded-3xl shadow-3xl overflow-hidden animate-pop-in z-[100]">
                                <div className="p-3 space-y-1">
                                    <button onClick={() => handleBulkAction('archive', '')} className="w-full p-3 rounded-xl hover:bg-white/5 text-xs font-bold text-slate-300 transition-all flex items-center space-x-3">
                                        <Clock size={14} className="text-slate-500" />
                                        <span>Archive Selected</span>
                                    </button>
                                    <button 
                                        onClick={() => { if(window.confirm('Delete selected leads permanently?')) handleBulkAction('delete', ''); }}
                                        className="w-full p-3 rounded-xl hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all flex items-center space-x-3"
                                    >
                                        <Trash2 size={14} />
                                        <span>Delete Permanently</span>
                                    </button>
                                </div>
                            </div>
                        )}
                      </div>
                   </div>
                </div>

                {/* Close Bar */}
                <button 
                   onClick={() => { setSelectedIds(new Set()); setActiveBulkMenu(null); }}
                   className="p-2 text-slate-500 hover:text-white transition-colors ml-4 border-l border-white/10 pl-8"
                >
                   <X size={24} />
                </button>
             </div>
          </div>
       )}
    </div>
  );
}
