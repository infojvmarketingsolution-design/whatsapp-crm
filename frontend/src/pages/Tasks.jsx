import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, PhoneCall, Calendar, Clock, AlertCircle, 
  Search, Filter, ChevronRight, User, Check, CalendarDays,
  MoreVertical, MoreHorizontal, ArrowUpRight, ExternalLink,
  X, Mail, MapPin, Phone, Users, Activity, Target, Tag, Save, Edit3,
  Briefcase, Building2, Download, Flame, Sun, Snowflake, Send, 
  ShieldCheck, History, TrendingUp, Globe, Smartphone, Bell, 
  Landmark, Hash, Wallet, Video, Home, School, Plus, Sparkles, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';



export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, CALL, MEETING, FOLLOW_UP
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState('PENDING'); // PENDING, COMPLETED, OVERDUE
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role') || 'AGENT';
  const [agents, setAgents] = useState([]);

  
  // Profile Navigation & Detail States
  const [selectedContact, setSelectedContact] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [recentMessages, setRecentMessages] = useState([]);
  const [isRefreshingMessages, setIsRefreshingMessages] = useState(false);
  const [isUpdatingContact, setIsUpdatingContact] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');
  const [noteInput, setNoteInput] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [strategicBrief, setStrategicBrief] = useState(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [editedContact, setEditedContact] = useState(null);
  const [showSaveFab, setShowSaveFab] = useState(false);

  // Task Completion Modal States
  const [completingTask, setCompletingTask] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isAddingFollowUp, setIsAddingFollowUp] = useState(false);
  const [nextFollowUpTitle, setNextFollowUpTitle] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [nextFollowUpDescription, setNextFollowUpDescription] = useState('');
  const [assignedCounsellorId, setAssignedCounsellorId] = useState('');
  const [meetingType, setMeetingType] = useState('Office Visit');
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);

  // Edit Task State
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDate, setEditTaskDate] = useState('');
  const [editTaskType, setEditTaskType] = useState('');
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [showCriticalOverduePopup, setShowCriticalOverduePopup] = useState(false);
  const [criticalSuspendAt, setCriticalSuspendAt] = useState(null);

  const PIPELINE_STAGES = ['NEW', 'OPEN', 'CLOSE', 'VISITED', 'PENDING VISIT', 'ADMISSION'];
  const STATUS_MAPPING = {
    'NEW LEAD': 'NEW',
    'NEW': 'NEW',
    'CONTACTED': 'OPEN',
    'INTERESTED': 'OPEN',
    'FOLLOW UP': 'OPEN',
    'FOLLOW_UP': 'OPEN',
    'OPEN': 'OPEN',
    'CLOSED_WON': 'ADMISSION',
    'ADMISSION': 'ADMISSION',
    'CLOSED_LOST': 'CLOSE',
    'CLOSED': 'CLOSE',
    'CLOSE': 'CLOSE',
    'VISITED': 'VISITED',
    'PENDING VISIT': 'PENDING VISIT',
    'PENDING_VISIT': 'PENDING VISIT'
  };

  useEffect(() => {
    fetchTasks();
    fetchAgents();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/chat/agents', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        setAgents(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {

    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      
      const res = await fetch('/api/chat/contacts', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      
      if (res.ok) {
        const contacts = await res.json();
        const allTasks = [];
        contacts.forEach(c => {
          if (c.tasks && c.tasks.length > 0) {
            c.tasks.forEach(t => {
               allTasks.push({ 
                  ...t, 
                  contactName: c.name || c.phone, 
                  contactId: c._id,
                  phone: c.phone,
                  assignedAgent: c.assignedAgent,
                  assignedCounsellor: c.assignedCounsellor,
                  contactStatus: c.status
               });
            });
          }
        });
        
        allTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        setTasks(allTasks);

        // Update selected contact if profile is open
        if (selectedContact) {
           const updated = contacts.find(c => c._id === selectedContact._id);
           if (updated) {
              setSelectedContact(updated);
              setEditedContact(updated);
              setShowSaveFab(false);
           }
        }
      }
    } catch (err) {
      console.error(err);
    }
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
        setNoteInput('');
        fetchTasks();
    fetchAgents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedContact(prev => ({ ...prev, [field]: value }));
    setShowSaveFab(true);
  };

  const updateContactDetail = async (contactId, updates) => {
    setIsUpdatingContact(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      
      const cleanPayload = { ...updates };
      delete cleanPayload._id;
      delete cleanPayload.__v;
      delete cleanPayload.createdAt;
      delete cleanPayload.updatedAt;

      const res = await fetch(`/api/chat/action`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, action: 'update_contact', payload: cleanPayload })
      });
       if (res.ok) {
        const data = await res.json();
        const freshContact = data.contact;
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
           qualification: freshContact.qualification || ''
        });
        setShowSaveFab(false);
        toast.success("Identity Records Updated");
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to Sync Records");
    } finally {
      setIsUpdatingContact(false);
    }
  };

  const openContactProfile = async (contactId) => {
     try {
       const token = localStorage.getItem('token');
       const tenantId = localStorage.getItem('tenantId');
       const res = await fetch('/api/chat/contacts', {
         headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
       });
       if (res.ok) {
         const data = await res.json();
         const contact = data.find(c => c._id === contactId);
         if (contact) {
            setSelectedContact(contact);
            setEditedContact({
               ...contact,
               secondaryPhone: contact.secondaryPhone || '',
               altMobile: contact.altMobile || '',
               houseNo: contact.houseNo || '',
               societyName: contact.societyName || '',
               streetAddress: contact.streetAddress || '',
               city: contact.city || '',
               state: contact.state || '',
               pincode: contact.pincode || '',
               qualification: contact.qualification || '',
               email: contact.email || '',
               address: contact.address || '',
               estimatedValue: contact.estimatedValue || 0,
               leadSource: contact.leadSource || ''
            });
            setShowProfile(true);
            fetchRecentMessages(contactId);
         }
       }
     } catch (err) {
       console.error(err);
     }
  };

  
   const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  const generateBrief = async (contactId) => {
    if (!contactId) return;
    setIsGeneratingBrief(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/chat/generate-brief/${contactId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        setStrategicBrief(data);
        toast.success("Strategic Intelligence Ready");
      }
    } catch (err) {
      console.error(err);
      toast.error("AI Analysis Failed");
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const saveEditedTask = async () => {
     if (!editingTask) return;
     setIsUpdatingTask(true);
     try {
       const token = localStorage.getItem('token');
       const tenantId = localStorage.getItem('tenantId');
       
       // Temporarily creating a simplified action or we might need an actual endpoint.
       // The instructions just said "Edit Task". I'll manually reschedule and re-title.
       // Wait, we don't have an explicit 'edit_task' action in the backend. 
       // If Edit Task requires changing title, I am adding a new 'edit_task' action to backend later.
       const res = await fetch(`/api/chat/contacts/${editingTask.contactId}/action`, {
         method: 'PUT',
         headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
         body: JSON.stringify({ action: 'edit_task', payload: { taskId: editingTask._id, title: editTaskTitle, dueDate: editTaskDate, type: editTaskType } })
       });
       if (res.ok) {
         toast.success("Task updated");
         setEditingTask(null);
         fetchTasks();
    fetchAgents();
       } else {
         toast.error("Failed to update task");
       }
     } catch (err) {
       console.error(err);
     } finally {
       setIsUpdatingTask(false);
     }
  };

  const completeTask = async (contactId, taskId) => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/chat/contacts/${contactId}/action`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete_task', payload: { taskId } })
      });
      if (res.ok) fetchTasks();
    fetchAgents();
    } catch (err) {
      console.error(err);
    }
  };

  const rescheduleToToday = async (contactId, taskId) => {
     try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const today = new Date();
      today.setHours(today.getHours() + 1); // 1 hour from now
      
      const res = await fetch(`/api/chat/contacts/${contactId}/action`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reschedule_task', payload: { taskId, newDueDate: today } })
      });
      if (res.ok) fetchTasks();
    fetchAgents();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (contactId, taskId) => {
     if (!window.confirm("Are you sure you want to delete this task?")) return;
     try {
       const token = localStorage.getItem('token');
       const tenantId = localStorage.getItem('tenantId');
       const res = await fetch(`/api/chat/contacts/${contactId}/action`, {
         method: 'PUT',
         headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
         body: JSON.stringify({ action: 'delete_task', payload: { taskId } })
       });
       if (res.ok) {
          fetchTasks();
    fetchAgents();
          setActiveDropdown(null);
       }
     } catch (err) {
       console.error(err);
     }
  };

  const updateTaskStatus = async (contactId, taskId, action) => {
     try {
       const token = localStorage.getItem('token');
       const tenantId = localStorage.getItem('tenantId');
       const res = await fetch(`/api/chat/contacts/${contactId}/action`, {
         method: 'PUT',
         headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
         body: JSON.stringify({ action, payload: { taskId } })
       });
       if (res.ok) {
          fetchTasks();
    fetchAgents();
          setActiveDropdown(null);
       }
     } catch (err) {
       console.error(err);
     }
  };

  const submitTaskCompletion = async () => {
     if (!completingTask) return;
     setIsSubmittingCompletion(true);
     try {
       const token = localStorage.getItem('token');
       const tenantId = localStorage.getItem('tenantId');
       
       // 1. Complete Current Task
       await fetch(`/api/chat/contacts/${completingTask.contactId}/action`, {
         method: 'PUT',
         headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
           action: 'complete_task', 
           payload: { 
              taskId: completingTask._id, 
              remark: completionNotes,
              assignedCounsellor: assignedCounsellorId,
              meetingType: completingTask.type === 'MEETING' ? meetingType : null
           } 
        })
       });

       // 2. Add Completion Notes
       if (completionNotes.trim()) {
         await fetch(`/api/chat/action`, {
           method: 'POST',
           headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
           body: JSON.stringify({ contactId: completingTask.contactId, action: 'add_note', payload: { note: `Task Completed (${completingTask.title}): ${completionNotes}` } })
         });
       }

       // 3. Add Next Follow Up
       if (isAddingFollowUp && nextFollowUpDate) {
         await fetch(`/api/chat/contacts/${completingTask.contactId}/action`, {
           method: 'PUT',
           headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
           body: JSON.stringify({ action: 'add_followup', payload: { title: nextFollowUpTitle || 'Next Follow-up', dateTime: nextFollowUpDate, description: nextFollowUpDescription || 'Created from task completion' } })
         });
       }

       toast.success("Task completed successfully");
       setCompletingTask(null);
       setCompletionNotes('');
       setIsAddingFollowUp(false);
       setNextFollowUpTitle('');
       setNextFollowUpDate('');
       setNextFollowUpDescription('');
       setAssignedCounsellorId('');
       setMeetingType('Office Visit');
       
       fetchTasks();
    fetchAgents();
     } catch (err) {
       console.error(err);
       toast.error("Failed to complete task");
     } finally {
       setIsSubmittingCompletion(false);
     }
  };

  const overdueCount = tasks.filter(t => t.status === 'PENDING' && new Date(t.dueDate) < new Date()).length;
  const todayCount = tasks.filter(t => {
    const d = new Date(t.dueDate);
    const today = new Date();
    return t.status === 'PENDING' && d.toDateString() === today.toDateString();
  }).length;
  const upcomingCount = tasks.filter(t => {
    const d = new Date(t.dueDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return t.status === 'PENDING' && d > today;
  }).length;

  const pendingCount = tasks.filter(t => t.status === 'PENDING').length;
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const cancelledCount = tasks.filter(t => t.status === 'CANCELLED').length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const totalCount = tasks.length;
  const efficiency = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 48-hour alert for overdue tasks
  useEffect(() => {
    const checkCriticalOverdue = () => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserId = currentUser._id;
      
      const now = new Date();
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const criticalTasks = tasks.filter(t => 
        t.status === 'PENDING' && 
        new Date(t.dueDate) < fortyEightHoursAgo && 
        t.assignedAgent === currentUserId
      );
      
      if (criticalTasks.length > 0) {
        setShowCriticalOverduePopup(true);
      } else {
        setShowCriticalOverduePopup(false);
      }
    };

    // Check every 1 minute
    checkCriticalOverdue();
    const intervalId = setInterval(checkCriticalOverdue, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [tasks]);

  const filteredTasks = tasks.filter(t => {
    const isPending = t.status === 'PENDING';
    const isCompleted = t.status === 'COMPLETED';
    const dueDate = new Date(t.dueDate);
    const now = new Date();
    const isOverdue = isPending && dueDate < now;
    const isDueToday = dueDate.toDateString() === now.toDateString();
    
    // Status View Filter
    if (view === 'PENDING') {
      if (!isPending || (isOverdue && !isDueToday)) return false;
    }
    if (view === 'COMPLETED' && !isCompleted) return false;
    if (view === 'OVERDUE' && (!isOverdue || isDueToday)) return false;
    if (view === 'UPCOMING' && (!isPending || !(!isOverdue && !isDueToday))) return false;

    // Type Filter
    if (filter !== 'ALL' && t.type !== filter) return false;

    // Search Filter
    if (searchQuery && 
        !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !t.contactName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(t.phone && t.phone.includes(searchQuery))
    ) return false;
    return true;
  });

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'UT';
  }



  return (
    <div className="flex-1 bg-[#f8fafc] flex flex-col h-full overflow-hidden">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pop-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-in-right { animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pop-in { animation: pop-in 0.2s ease-out forwards; }
        .shadow-3xl { box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.2); }
        .shadow-glow { box-shadow: 0 0 20px rgba(20, 184, 166, 0.3); }
      `}</style>
      
      {/* Header with Stats */}
      <div className="px-8 pt-8 pb-6 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Work Console</h1>
            <p className="text-slate-500 font-semibold text-sm">Manage your sales activities and follow-ups</p>
          </div>
          <div className="flex items-center space-x-6">
             <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Work Statistics</p>
                <div className="flex items-center space-x-4">
                   <div className="flex flex-col items-end border-r border-slate-100 pr-4">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Total Task</span>
                      <span className="text-sm font-black text-slate-700 leading-none">{totalCount}</span>
                   </div>
                   <div className="flex flex-col items-end border-r border-slate-100 pr-4">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Complete Task</span>
                      <span className="text-sm font-black text-teal-600 leading-none">{completedCount}</span>
                   </div>
                   <div className="flex flex-col items-end border-r border-slate-100 pr-4">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Pending Task</span>
                      <span className="text-sm font-black text-rose-500 leading-none">{pendingCount}</span>
                   </div>
                   <div className="flex flex-col items-end border-r border-slate-100 pr-4">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Task Changing</span>
                      <span className="text-sm font-black text-blue-500 leading-none">{inProgressCount}</span>
                   </div>
                   <div className="flex flex-col items-end">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Task Cancellation</span>
                      <span className="text-sm font-black text-slate-400 leading-none">{cancelledCount}</span>
                   </div>
                </div>
             </div>
             
             <div className="h-10 w-[1px] bg-slate-100 mx-2"></div>
             
             <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efficiency</p>
                <p className="text-lg font-black text-teal-600 leading-none mt-1">{efficiency}%</p>
             </div>
             <div className="flex -space-x-2 ml-4">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i+10}`} alt="avatar" />
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div onClick={() => setView('OVERDUE')} className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${view === 'OVERDUE' ? 'bg-rose-50 border-rose-200 shadow-md' : 'bg-white border-slate-100 hover:border-rose-100'}`}>
              <div className="flex justify-between items-start">
                 <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                    <AlertCircle size={20} />
                 </div>
                 <span className={`text-2xl font-black ${view === 'OVERDUE' ? 'text-rose-600' : 'text-slate-700'}`}>{overdueCount}</span>
              </div>
              <p className="mt-3 font-bold text-slate-500 text-sm">Overdue</p>
           </div>
           <div onClick={() => setView('PENDING')} className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${view === 'PENDING' ? 'bg-teal-50 border-teal-200 shadow-md' : 'bg-white border-slate-100 hover:border-teal-100'}`}>
              <div className="flex justify-between items-start">
                 <div className="p-2 bg-teal-100 text-teal-600 rounded-xl">
                    <Clock size={20} />
                 </div>
                 <span className={`text-2xl font-black ${view === 'PENDING' ? 'text-teal-600' : 'text-slate-700'}`}>{todayCount}</span>
              </div>
              <p className="mt-3 font-bold text-slate-500 text-sm">Due Today</p>
           </div>
           <div onClick={() => setView('UPCOMING')} className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${view === 'UPCOMING' ? 'bg-blue-50 border-blue-200 shadow-md' : 'bg-white border-slate-100 hover:border-blue-100'}`}>
              <div className="flex justify-between items-start">
                 <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                    <CalendarDays size={20} />
                 </div>
                 <span className={`text-2xl font-black ${view === 'UPCOMING' ? 'text-blue-600' : 'text-slate-700'}`}>{upcomingCount}</span>
              </div>
              <p className="mt-3 font-bold text-slate-500 text-sm">Upcoming</p>
           </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-8 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
         <div className="flex items-center space-x-6">
            <div className="flex bg-slate-100 p-1 rounded-xl">
               <button onClick={() => setView('PENDING')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'PENDING' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Pending</button>
               <button onClick={() => setView('COMPLETED')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'COMPLETED' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Completed</button>
            </div>
            
            <div className="flex items-center space-x-2">
               <Filter size={14} className="text-slate-400" />
               <select 
                 value={filter} 
                 onChange={e => setFilter(e.target.value)}
                 className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer"
               >
                 <option value="ALL">All Activities</option>
                 <option value="CALL">Calls Only</option>
                 <option value="MEETING">Meetings Only</option>
                 <option value="FOLLOW_UP">Follow-ups Only</option>
               </select>
            </div>
         </div>

         <div className="relative group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by contact or title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2 text-xs font-medium w-64 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all outline-none"
            />
         </div>
      </div>

      {/* Task List */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
         <div className="max-w-5xl mx-auto space-y-4 pb-20">
            {filteredTasks.length > 0 ? filteredTasks.map(t => {
               const isOverdue = t.status === 'PENDING' && new Date(t.dueDate) < new Date();
               const counsellor = t.metadata?.assignedCounsellor ? agents.find(a => a._id === t.metadata.assignedCounsellor) : null;
               
               return (
                  <div key={t._id} className="group bg-white rounded-2xl border border-slate-200 p-5 flex flex-col hover:border-teal-200 hover:shadow-xl hover:shadow-teal-900/5 transition-all animate-fade-in relative hover:z-10">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-5 text-left">
                           <button 
                             onClick={() => openContactProfile(t.contactId)}
                             className="relative group/avatar"
                           >
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all group-hover/avatar:scale-105 group-hover/avatar:shadow-lg ${
                                t.type === 'CALL' ? 'bg-blue-50 text-blue-600' : 
                                t.type === 'MEETING' ? 'bg-purple-50 text-purple-600' : 
                                'bg-orange-50 text-orange-600'
                              }`}>
                                {getInitials(t.contactName)}
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg border-2 border-white flex items-center justify-center shadow-sm ${
                                t.type === 'CALL' ? 'bg-blue-500 text-white' : 
                                t.type === 'MEETING' ? 'bg-purple-500 text-white' : 
                                'bg-orange-500 text-white'
                              }`}>
                                {t.type === 'CALL' && <PhoneCall size={10} />}
                                {t.type === 'MEETING' && <Calendar size={10} />}
                                {t.type === 'FOLLOW_UP' && <Clock size={10} />}
                              </div>
                           </button>

                           <div>
                              <div className="flex items-center space-x-3 mb-1">
                                 <div className="flex flex-col">
                                     <h3 className="text-sm font-black text-slate-800 tracking-tight">{t.title}</h3>
                                     {t.description && (
                                        <div className="mt-1 flex items-start">
                                           <div className="w-1 h-3 bg-teal-500/20 rounded-full mr-2 mt-0.5 shrink-0"></div>
                                           <p className="text-[11px] text-slate-500 font-bold leading-tight italic">{t.description}</p>
                                        </div>
                                     )}
                                  </div>
                                 {isOverdue && <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[9px] font-black uppercase rounded">Overdue</span>}
                                 {t.status === 'COMPLETED' && <span className="px-1.5 py-0.5 bg-teal-100 text-teal-600 text-[9px] font-black uppercase rounded">Completed</span>}
                                 {t.status === 'IN_PROGRESS' && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[9px] font-black uppercase rounded">Changing</span>}
                                 {t.status === 'CANCELLED' && <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-black uppercase rounded">Cancelled</span>}
                              </div>
                              <div className="flex items-center space-x-4">
                                  <button 
                                    onClick={() => openContactProfile(t.contactId)}
                                    className="flex items-center text-[11px] font-bold text-slate-400 hover:text-teal-600 transition-colors"
                                  >
                                     <User size={12} className="mr-1.5 opacity-60" />
                                     {t.contactName}
                                  </button>
                                 <div className={`flex items-center text-[11px] font-bold ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                                    <Calendar size={12} className="mr-1.5 opacity-60" />
                                    {new Date(t.dueDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                 </div>

                                 {/* Lead Owner Badge */}
                                 {(t.assignedAgent || t.assignedCounsellor) && (
                                    <div className="flex items-center px-2 py-0.5 bg-slate-50 text-[9px] font-bold text-slate-500 border border-slate-100 rounded-md">
                                       <Briefcase size={10} className="mr-1 opacity-60" />
                                       Owner: {agents.find(a => a._id === (t.assignedAgent || t.assignedCounsellor))?.name || 'Assigned'}
                                    </div>
                                 )}

                                 {/* Lead Status Badge */}
                                 <div className={`flex items-center px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${
                                    STATUS_MAPPING[t.contactStatus?.toUpperCase()] === 'NEW' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    STATUS_MAPPING[t.contactStatus?.toUpperCase()] === 'OPEN' ? 'bg-teal-50 text-teal-600 border-teal-100' :
                                    STATUS_MAPPING[t.contactStatus?.toUpperCase()] === 'ADMISSION' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    STATUS_MAPPING[t.contactStatus?.toUpperCase()] === 'CLOSE' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                    STATUS_MAPPING[t.contactStatus?.toUpperCase()] === 'VISITED' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                    STATUS_MAPPING[t.contactStatus?.toUpperCase()] === 'PENDING VISIT' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                    'bg-slate-50 text-slate-500 border-slate-100'
                                 }`}>
                                    {STATUS_MAPPING[t.contactStatus?.toUpperCase()] || t.contactStatus?.replace('_', ' ') || 'OPEN'}
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center space-x-2">
                           {(t.status === 'PENDING' || t.status === 'IN_PROGRESS') && (
                              <button 
                                onClick={() => { setCompletingTask(t); setActiveDropdown(null); }}
                                className="h-9 px-4 bg-teal-600 text-white text-xs font-black rounded-xl hover:bg-teal-700 transition-all flex items-center shadow-md shadow-teal-600/10 active:scale-95"
                              >
                                <Check size={14} className="mr-2" /> follow up update
                              </button>
                           )}
                           <div className="relative" ref={activeDropdown === t._id ? dropdownRef : null}>
                              <button 
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdown(activeDropdown === t._id ? null : t._id);
                                 }}
                                 className={`h-9 w-9 text-slate-400 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center ${activeDropdown === t._id ? 'bg-slate-100 text-slate-600' : ''}`}
                              >
                                 <MoreHorizontal size={18} />
                              </button>

                              {activeDropdown === t._id && (
                                 <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[100] animate-pop-in divide-y divide-slate-50">
                                    {(t.status === 'PENDING' || t.status === 'IN_PROGRESS') && (
                                       <div className="pb-2">
                                          <button 
                                             onClick={() => {
                                                setEditingTask(t);
                                                setEditTaskTitle(t.title);
                                                setEditTaskDate(new Date(t.dueDate).toISOString().slice(0, 16));
                                                setEditTaskType(t.type);
                                                setActiveDropdown(null);
                                             }}
                                             className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center transition-colors"
                                          >
                                             <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3">
                                                <Edit3 size={16} />
                                             </div>
                                             Edit Task
                                          </button>
                                          <button 
                                             onClick={() => { updateTaskStatus(t.contactId, t._id, 'in_progress_task'); }}
                                             className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center transition-colors"
                                          >
                                             <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
                                                <ArrowUpRight size={16} />
                                             </div>
                                             Reschedule
                                          </button>
                                          <button 
                                             onClick={() => { updateTaskStatus(t.contactId, t._id, 'cancel_task'); }}
                                             className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center transition-colors"
                                          >
                                             <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mr-3">
                                                <AlertCircle size={16} />
                                             </div>
                                             Cancel Task
                                          </button>
                                          <button 
                                             onClick={() => { rescheduleToToday(t.contactId, t._id); setActiveDropdown(null); }}
                                             className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center transition-colors"
                                          >
                                             <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
                                                <Clock size={16} />
                                             </div>
                                             Set to Today
                                          </button>
                                       </div>
                                    )}
                                    <div className="py-2">
                                       <button 
                                          onClick={() => {
                                             localStorage.setItem('activeChatId', t.contactId);
                                             navigate('/inbox', { state: { selectedContact: t.phone } });
                                          }}
                                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center transition-colors"
                                       >
                                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mr-3">
                                             <ArrowUpRight size={16} />
                                          </div>
                                          Go to Chat
                                       </button>
                                    </div>
                                    <div className="pt-2">
                                       <button 
                                          onClick={() => deleteTask(t.contactId, t._id)}
                                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center transition-colors"
                                       >
                                          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mr-3">
                                             <AlertCircle size={16} />
                                          </div>
                                          Delete Task
                                       </button>
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>

                     {/* RICH COMPLETED DETAILS (Redesigned) */}
                     {t.status === 'COMPLETED' && (
                        <div className="mt-4 pt-4 border-t border-slate-50 bg-slate-50/50 -mx-5 -mb-5 px-5 pb-5 rounded-b-2xl">
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                 <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Interaction Outcome</span>
                                 <p className="text-[11px] font-bold text-slate-700 italic leading-relaxed">"{t.remark || 'No remarks provided'}"</p>
                              </div>
                              
                              {counsellor && (
                                 <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 shrink-0 uppercase">
                                       {getInitials(counsellor.name)}
                                    </div>
                                    <div>
                                       <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block">Expert Assigned</span>
                                       <span className="text-[10px] font-bold text-slate-800">{counsellor.name}</span>
                                    </div>
                                 </div>
                              )}

                              {t.metadata?.meetingType && (
                                 <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                       {t.metadata.meetingType.includes('Online') ? <Video size={14}/> : t.metadata.meetingType.includes('Campus') ? <School size={14}/> : <Home size={14}/>}
                                    </div>
                                    <div>
                                       <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block">Visit Format</span>
                                       <span className="text-[10px] font-bold text-slate-800">{t.metadata.meetingType}</span>
                                    </div>
                                 </div>
                              )}
                           </div>
                           
                           {/* Quick indicators for potential follow-up links */}
                           <div className="mt-3 flex items-center space-x-4">
                              <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                 <Clock size={12} className="mr-1.5 opacity-60" />
                                 Completed {new Date(t.completedAt || Date.now()).toLocaleDateString()}
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               );
            }) : (
               <div className="text-center py-32">
                  <div className="w-20 h-20 bg-slate-100 rounded-3xl mx-auto mb-6 flex items-center justify-center text-slate-300">
                     <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-lg font-black text-slate-700 tracking-tight">List is clear</h3>
                  <p className="text-slate-400 text-sm font-bold mt-2">No tasks found matching your criteria</p>
                  <button onClick={() => { setFilter('ALL'); setView('PENDING'); setSearchQuery(''); }} className="mt-6 text-teal-600 text-xs font-black uppercase tracking-wider hover:underline">Reset Filters</button>
               </div>
            )}
         </div>
      </div>

      {/* FULL CONTACT PROFILE SLIDE-OVER (REPLICATED FROM CONTACTS) */}
      {showProfile && selectedContact && editedContact && (
          <div className="fixed inset-0 z-[1000] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowProfile(false)}>
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

                    <div className="flex items-center space-x-4">
                     <div className="flex flex-col items-end mr-2">
                        <label className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Lead Status</label>
                        <select 
                           value={editedContact.status || 'NEW LEAD'} 
                           onChange={e => handleFieldChange('status', e.target.value)}
                           className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded border transition-all outline-none ${
                              editedContact.status === 'CLOSED_WON' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                              editedContact.status === 'CLOSED_LOST' ? 'bg-red-50 border-red-200 text-red-600' :
                              'bg-slate-50 border-slate-200 text-slate-600 focus:border-slate-400'
                           }`}
                        >
                           <option value="NEW LEAD">New Lead</option>
                           <option value="CONTACTED">Contacted</option>
                           <option value="INTERESTED">Interested</option>
                           <option value="FOLLOW_UP">Follow Up</option>
                           <option value="CLOSED_WON">Admission follow up update</option>
                           <option value="CLOSED_LOST">Admission Cancelled</option>
                        </select>
                     </div>

                     <button 
                        onClick={() => {
                           updateContactDetail(selectedContact._id, editedContact);
                        }}
                        disabled={isUpdatingContact}
                        className={`px-8 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-sm transition-all flex items-center ${
                           showSaveFab 
                           ? 'bg-slate-800 text-white hover:bg-black ring-4 ring-slate-800/10' 
                           : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                     >
                        {isUpdatingContact ? (
                           <><RefreshCw size={12} className="mr-2 animate-spin" /> Syncing...</>
                        ) : (
                           <><Save size={12} className="mr-2" /> Save Changes</>
                        )}
                     </button>
                     <button onClick={() => setShowProfile(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                     </button>
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
                                 {(!editedContact.secondaryPhone || editedContact.secondaryPhone.trim() === '') && (
                                    <button 
                                       onClick={() => handleFieldChange('secondaryPhone', ' ')} 
                                       className="text-[9px] font-bold text-slate-800 flex items-center hover:bg-slate-100 px-2 py-1 rounded transition-all"
                                    >
                                       <Plus size={10} className="mr-1" /> Add WhatsApp
                                    </button>
                                 )}
                              </div>
                              
                              {/* Always show if it has content or was just added */}
                              {(editedContact.secondaryPhone && editedContact.secondaryPhone.trim() !== '') && (
                                 <div className="space-y-1.5 animate-fade-in">
                                    <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Secondary WhatsApp</label>
                                    <input 
                                       value={editedContact.secondaryPhone} 
                                       onChange={e=>handleFieldChange('secondaryPhone', e.target.value)} 
                                       placeholder="Secondary WhatsApp Number" 
                                       className="w-full bg-white border border-slate-200 py-2.5 px-3 text-sm font-medium text-slate-800 rounded outline-none focus:border-slate-400" 
                                    />
                                 </div>
                              )}

                              <div className="space-y-1.5">
                                 <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Alternative Mobile</label>
                                 <input 
                                    value={editedContact.altMobile || ''} 
                                    onChange={e=>handleFieldChange('altMobile', e.target.value)} 
                                    placeholder="Alternative Mobile Number" 
                                    className="w-full bg-white border border-slate-200 py-2.5 px-3 text-sm font-medium text-slate-800 rounded outline-none focus:border-slate-400" 
                                 />
                              </div>
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
                           {/* VISIT STATUS (FIRST) */}
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-slate-400 uppercase">Visit Conducted?</label>
                              <div className="grid grid-cols-2 gap-2">
                                 {['Not Done', 'Done'].map(v => (
                                    <button key={v} onClick={() => handleFieldChange('visitStatus', v)} className={`py-2.5 rounded text-[9px] font-bold uppercase border transition-all ${editedContact.visitStatus === v ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>{v === 'Done' ? 'follow up update' : v}</button>
                                 ))}
                              </div>
                           </div>

                           {/* VISIT TYPE (VISIBLE IF DONE) */}
                           {editedContact.visitStatus === 'Done' && (
                              <div className="space-y-1.5 animate-fade-in">
                                 <label className="text-[9px] font-bold text-slate-400 uppercase">Select Visit Type</label>
                                 <div className="grid grid-cols-2 gap-2">
                                    {['University Visit', 'Campus Visit'].map(v => (
                                       <button key={v} onClick={() => handleFieldChange('visitType', v)} className={`py-2.5 rounded text-[9px] font-bold uppercase border transition-all ${editedContact.visitType === v ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>{v}</button>
                                    ))}
                                 </div>
                              </div>
                           )}

                           {/* COUNSELLOR & ADMISSION (VISIBLE IF TYPE SELECTED) */}
                           {editedContact.visitStatus === 'Done' && editedContact.visitType && (
                              <div className="space-y-6 animate-fade-in pt-2">
                                 <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Transfer Lead to</label>
                                    <select value={editedContact.assignedCounsellor || ''} onChange={e=>handleFieldChange('assignedCounsellor', e.target.value)} className="w-full bg-white border border-slate-200 py-2.5 px-3 text-xs font-medium text-slate-700 rounded outline-none focus:border-slate-400">
                                       <option value="">Select Target...</option>
                                       {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                                    </select>
                                 </div>

                                 <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Admission Verdict</label>
                                    <div className="flex flex-col gap-2">
                                       {/* ADMISSION VERDICT */}
                                       <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                                          {[
                                             { id: 'CLOSED_WON', label: 'follow up update', color: 'green' },
                                             { id: 'PENDING', label: 'Pending', color: 'slate' },
                                             { id: 'CLOSED_LOST', label: 'Canceled', color: 'red' }
                                          ].map(s => (
                                             <button 
                                                key={s.id}
                                                onClick={() => handleFieldChange('status', s.id)}
                                                className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest rounded transition-all ${
                                                   editedContact.status === s.id 
                                                   ? `bg-${s.color === 'green' ? 'emerald-500' : s.color === 'red' ? 'red-500' : 'slate-800'} text-white shadow-sm` 
                                                   : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                             >
                                                {s.label}
                                             </button>
                                          ))}
                                       </div>

                                       {/* CLOSE REASON - SHOW ONLY IF CANCELED */}
                                       {editedContact.status === 'CLOSED_LOST' && (
                                          <div className="animate-fade-in space-y-2 mt-2">
                                             <label className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Why was this Admission Canceled?</label>
                                             <select 
                                                value={editedContact.closeReason || ''} 
                                                onChange={e => handleFieldChange('closeReason', e.target.value)}
                                                className="w-full bg-white border border-red-200 py-2.5 px-3 text-sm font-medium text-slate-800 rounded outline-none focus:border-red-400"
                                             >
                                                <option value="">-- Choose Reason --</option>
                                                <option value="Admission Done">Admission follow up update Elsewhere</option>
                                                <option value="Not Interested">Not Interested</option>
                                                <option value="Fees Too High">Fees Too High</option>
                                                <option value="Distance Issue">Distance Issue</option>
                                                <option value="Course Not Available">Course Not Available</option>
                                                <option value="Family Issues">Family Issues</option>
                                                <option value="Other">Other Reason</option>
                                             </select>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           )}
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
                                          <div className="flex flex-col">
                                           <p className="text-sm font-medium text-slate-700">{event.description.split(' - ')[0]}</p>
                                           {event.description?.includes(' - ') && (
                                              <p className="text-[11px] text-slate-500 font-bold mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100 italic leading-relaxed">
                                                 {event.description.split(' - ').slice(1).join(' - ')}
                                              </p>
                                           )}
                                        </div>
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
                                <div className="space-y-4 pt-4">
                                   {(selectedContact.notes || []).slice().reverse().map((note, idx) => (
                                      <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                         <p className="text-xs font-medium text-slate-700 leading-relaxed mb-2">{note.content}</p>
                                         <div className="flex justify-between items-center text-[8px] font-bold uppercase text-slate-400">
                                            <span>By {note.createdBy || 'System'}</span>
                                            <span>{formatDateTime(note.createdAt)}</span>
                                         </div>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
            </div>
          </div>
      )}

      {completingTask && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-3xl w-full max-w-xl overflow-hidden animate-pop-in border border-white/20">
             
             {/* Modal Dynamic Header */}
             <div className="p-8 bg-gradient-to-br from-teal-500 to-emerald-600 text-white relative">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="flex items-center justify-between relative z-10">
                   <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
                        <CheckCircle2 size={32} />
                      </div>
                      <div>
                         <h2 className="text-2xl font-black tracking-tight">Finalize Activity</h2>
                         <p className="text-teal-50 text-[11px] font-bold uppercase tracking-widest opacity-80">Recording Outcome for {completingTask.contactName}</p>
                      </div>
                   </div>
                   <button onClick={() => setCompletingTask(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X size={20} /></button>
                </div>
             </div>
             
             <div className="p-8 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar bg-slate-50/30">
                
                {/* Meeting Type Selector (If applicable) */}
                {completingTask.type === 'MEETING' && (
                   <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">Visit Format</label>
                      <div className="grid grid-cols-3 gap-3">
                         {[
                            { id: 'Online', label: 'Zoom/Call', icon: <Video size={18}/> },
                            { id: 'Office Visit', label: 'Office', icon: <Home size={18}/> },
                            { id: 'Campus Visit', label: 'Campus', icon: <School size={18}/> }
                         ].map(mode => (
                            <button 
                               key={mode.id}
                               onClick={() => setMeetingType(mode.id)}
                               className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${
                                  meetingType === mode.id 
                                  ? 'bg-white border-teal-500 shadow-xl shadow-teal-900/5 ring-4 ring-teal-50 scale-105' 
                                  : 'bg-white border-transparent hover:border-teal-200'
                               }`}
                            >
                               <div className={`mb-2 p-2 rounded-xl ${meetingType === mode.id ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  {mode.icon}
                               </div>
                               <span className={`text-[10px] font-black uppercase tracking-tighter ${meetingType === mode.id ? 'text-teal-900' : 'text-slate-400'}`}>{mode.label}</span>
                            </button>
                         ))}
                      </div>
                   </div>
                )}

                {/* Outcome Remarks */}
                <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Meeting / Interaction Remark</label>
                   <textarea 
                     value={completionNotes} 
                     onChange={(e) => setCompletionNotes(e.target.value)}
                     placeholder="Detail the outcome of this interaction... e.g. Student is interested in Engineering, requested campus tour."
                     className="w-full bg-white border-2 border-slate-100 focus:border-teal-500 rounded-3xl p-5 text-sm font-bold text-slate-700 outline-none transition-all min-h-[120px] resize-none shadow-inner"
                   />
                </div>

                {/* Counsellor Referral */}
                <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">Lead Handover (Counsellor)</label>
                   <div className="grid grid-cols-2 gap-3">
                      {agents.filter(a => a.role === 'MANAGER_COUNSELLOUR').length > 0 ? (
                        agents.filter(a => a.role === 'MANAGER_COUNSELLOUR').map(agent => (
                           <button 
                              key={agent._id}
                              onClick={() => setAssignedCounsellorId(assignedCounsellorId === agent._id ? '' : agent._id)}
                              className={`flex items-center space-x-3 p-3 rounded-2xl border-2 transition-all ${
                                 assignedCounsellorId === agent._id 
                                 ? 'bg-indigo-50 border-indigo-500 shadow-lg scale-[1.02]' 
                                 : 'bg-white border-slate-100 hover:border-indigo-200'
                              }`}
                           >
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${assignedCounsellorId === agent._id ? 'bg-indigo-500 text-white border-white' : 'bg-slate-100 text-slate-400 border-transparent'}`}>
                                 {getInitials(agent.name)}
                              </div>
                              <div className="text-left">
                                 <p className={`text-[11px] font-black ${assignedCounsellorId === agent._id ? 'text-indigo-900' : 'text-slate-700'}`}>{agent.name}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase">Expert Counselor</p>
                              </div>
                           </button>
                        ))
                      ) : (
                        <p className="col-span-2 py-4 px-6 bg-slate-100 rounded-2xl text-[10px] font-bold text-slate-500 italic text-center">No counsellors available for handover.</p>
                      )}
                   </div>
                   <p className="mt-3 text-[9px] font-bold text-indigo-400 leading-relaxed flex items-start animate-pulse">
                      <ShieldCheck size={12} className="mr-2 mt-0.5 shrink-0" />
                      <span>Shared Access: Assigning a counsellor ensures the lead is visible on both dashboards.</span>
                   </p>
                </div>

                {/* Follow-up Logic Overlay */}
                <div className={`p-6 rounded-[2rem] border transition-all duration-500 ${isAddingFollowUp ? 'bg-orange-50/50 border-orange-200 shadow-xl shadow-orange-900/5' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isAddingFollowUp ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                           <CalendarDays size={20} />
                         </div>
                         <div>
                            <p className={`text-base font-black ${isAddingFollowUp ? 'text-orange-900' : 'text-slate-600'}`}>Next Follow-up</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Lifecycle Management</p>
                         </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isAddingFollowUp} onChange={e => setIsAddingFollowUp(e.target.checked)} className="sr-only peer" />
                        <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 shadow-inner"></div>
                      </label>
                   </div>

                   {isAddingFollowUp && (
                     <div className="space-y-5 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="col-span-2">
                              <label className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-2 block">Interaction Subject</label>
                              <input 
                                type="text" 
                                value={nextFollowUpTitle} 
                                onChange={e => setNextFollowUpTitle(e.target.value)}
                                placeholder="e.g. Closing Call / Documents Submission"
                                className="w-full bg-white border-2 border-orange-100/50 focus:border-orange-500 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none transition-all shadow-sm" 
                              />
                           </div>
                           <div className="col-span-2">
                              <label className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-2 block">Scheduled Time</label>
                              <input 
                                type="datetime-local" 
                                value={nextFollowUpDate} 
                                onChange={e => setNextFollowUpDate(e.target.value)}
                                className="w-full bg-white border-2 border-orange-100/50 focus:border-orange-500 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none transition-all shadow-sm" 
                              />
                           </div>
                           <div className="col-span-2">
                              <label className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-2 block text-red-500">Follow-up Description (Required)</label>
                              <textarea 
                                value={nextFollowUpDescription} 
                                onChange={e => setNextFollowUpDescription(e.target.value)}
                                placeholder="What needs to be done next? e.g. Call to confirm documents."
                                className="w-full bg-white border-2 border-orange-100/50 focus:border-orange-500 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none transition-all shadow-sm h-20" 
                              />
                           </div>
                        </div>
                     </div>
                   )}
                </div>
             </div>

             <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-white">
                <button onClick={() => setCompletingTask(null)} className="px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">Discard</button>
                <div className="flex space-x-3">
                   <button 
                     onClick={submitTaskCompletion} 
                     disabled={isSubmittingCompletion || (isAddingFollowUp && !nextFollowUpDate)} 
                     className="px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white bg-[var(--theme-bg)] hover:bg-emerald-700 disabled:opacity-50 flex items-center shadow-xl shadow-teal-900/20 transition-all active:scale-95 group"
                   >
                      {isSubmittingCompletion ? <Clock size={18} className="animate-spin mr-3" /> : <Save size={18} className="mr-3 group-hover:scale-110 transition-transform" />}
                      Finalize Activity
                   </button>
                </div>
             </div>
           </div>
        </div>
      )}


      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setEditingTask(null)}>
          <div className="bg-white rounded-3xl w-[400px] p-6 shadow-2xl animate-pop-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center"><Edit3 size={20} className="mr-2 text-indigo-600"/> Edit Task</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Task Title</label>
                <input type="text" value={editTaskTitle} onChange={e=>setEditTaskTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Due Date & Time</label>
                <input type="datetime-local" value={editTaskDate} onChange={e=>setEditTaskDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none" />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button onClick={() => setEditingTask(null)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
                <button onClick={saveEditedTask} disabled={isUpdatingTask} className="px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 disabled:opacity-50">
                  {isUpdatingTask ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Critical Overdue Popup */}
      {showCriticalOverduePopup && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-rose-900/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl w-[450px] p-8 shadow-2xl border-4 border-rose-500 animate-pop-in text-center shadow-rose-500/20">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">URGENT: Overdue Tasks</h3>
            <p className="text-sm font-bold text-slate-500 mb-6">
              You have tasks that are more than 48 hours overdue. <br/><br/>
              <span className="text-rose-600">If these are not completed within the next 1 hour, your account will be suspended automatically.</span>
            </p>
            <button 
              onClick={() => {
                setShowCriticalOverduePopup(false);
                sessionStorage.setItem('dismissedOverduePopup', 'true');
                setView('OVERDUE');
              }}
              className="w-full py-3.5 rounded-xl text-sm font-black bg-rose-600 text-white hover:bg-rose-700 shadow-xl shadow-rose-600/20"
            >
              Take Action Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
