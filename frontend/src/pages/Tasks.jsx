import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckSquare, CheckCircle2, PhoneCall, Calendar, Clock, AlertCircle, 
  Search, Filter, ChevronRight, User, Check, CalendarDays,
  MoreVertical, MoreHorizontal, ArrowUpRight, ExternalLink,
  X, Mail, MapPin, Phone, Users, Activity, Target, Tag, Save, Edit3,
  Briefcase, Building2, Download, Flame, Sun, Snowflake, Send, 
  ShieldCheck, History, TrendingUp, Globe, Smartphone, Bell, 
  Landmark, Hash, Wallet, Video, Home, School, Plus, Sparkles, RefreshCw,
  ChevronDown, Award, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';



// Version: 1.0.2 - Force Build for Icon Fix
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
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskDate, setEditTaskDate] = useState('');
  const [editTaskType, setEditTaskType] = useState('');
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [reschedulingTask, setReschedulingTask] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [showCriticalOverduePopup, setShowCriticalOverduePopup] = useState(false);
  const [criticalSuspendAt, setCriticalSuspendAt] = useState(null);
  const [cancellingTaskConfirm, setCancellingTaskConfirm] = useState(null);
  const [settingToTodayTask, setSettingToTodayTask] = useState(null);
  const [todayTime, setTodayTime] = useState("09:00");

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
           qualification: freshContact.qualification || '',
           email: freshContact.email || '',
           address: freshContact.address || '',
           estimatedValue: freshContact.estimatedValue || 0,
           leadSource: freshContact.leadSource || ''
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
    if (!editingTask || !editTaskTitle) return;
    setIsUpdatingTask(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/chat/contacts/${editingTask.contactId}/action`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit_task', payload: { taskId: editingTask._id, title: editTaskTitle, description: editTaskDescription, dueDate: editTaskDate, type: editTaskType } })
      });
      if (res.ok) {
        toast.success("Task updated");
        setEditingTask(null);
        fetchTasks();
        fetchAgents();
      } else {
        toast.error("Failed to update task");
      }
    } catch (error) {
       toast.error("An error occurred");
    } finally {
       setIsUpdatingTask(false);
    }
  };

  const handleRescheduleSubmit = async () => {
      if (!reschedulingTask || !rescheduleDate) return;
      
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');

      setIsRescheduling(true);
      try {
        const res = await fetch(`/api/chat/action`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
             contactId: reschedulingTask.contactId, 
             action: 'reschedule_task', 
             payload: { taskId: reschedulingTask._id, newDueDate: rescheduleDate } 
          })
        });

        if (res.ok) {
          toast.success("Task rescheduled successfully");
          setReschedulingTask(null);
          fetchTasks();
        } else {
          const errData = await res.json();
          toast.error(errData.message || "Failed to reschedule task");
        }
      } catch (err) {
        console.error(err);
        toast.error("Network error while rescheduling");
      } finally {
        setIsRescheduling(false);
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
      if (res.ok) {
         fetchTasks();
         toast.success("Task moved to Today");
      }
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

  const overdueCount = tasks.filter(t => {
    const d = new Date(t.dueDate);
    const now = new Date();
    const isDueToday = d.toDateString() === now.toDateString();
    return t.status === 'PENDING' && d < now && !isDueToday;
  }).length;
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
  const rawEfficiency = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const penalty = cancelledCount * 5;
  const efficiency = Math.max(0, Math.round(rawEfficiency - penalty));

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
      if (!isPending || !isDueToday) return false;
    }
    if (view === 'COMPLETED' && !isCompleted) return false;
    if (view === 'OVERDUE' && (!isPending || !isOverdue || isDueToday)) return false;
    if (view === 'UPCOMING' && (!isPending || isOverdue || isDueToday)) return false;

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
      <div className="px-4 sm:px-8 py-2 sm:py-6 bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto">
           {/* Mobile Unified Row */}
           <div className="flex sm:hidden items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                 <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100">
                    <CheckSquare size={16} className="text-teal-600" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[7px] font-black text-slate-400 uppercase leading-none">Pulse</span>
                    <span className="text-[10px] font-black text-teal-600 leading-none">{efficiency}%</span>
                 </div>
              </div>
              
              <div className="flex items-center space-x-1 flex-1 justify-end">
                 <div onClick={() => setView('OVERDUE')} className={`px-2 py-1.5 rounded-lg border flex flex-col items-center min-w-[50px] ${view === 'OVERDUE' ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100'}`}>
                    <span className={`text-[10px] font-black ${view === 'OVERDUE' ? 'text-rose-600' : 'text-slate-400'}`}>{overdueCount}</span>
                    <span className="text-[6px] font-black uppercase text-slate-400 tracking-tighter">Overdue</span>
                 </div>
                 <div onClick={() => setView('PENDING')} className={`px-2 py-1.5 rounded-lg border flex flex-col items-center min-w-[50px] ${view === 'PENDING' ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-100'}`}>
                    <span className={`text-[10px] font-black ${view === 'PENDING' ? 'text-teal-600' : 'text-slate-400'}`}>{todayCount}</span>
                    <span className="text-[6px] font-black uppercase text-slate-400 tracking-tighter">Today</span>
                 </div>
                 <div onClick={() => setView('UPCOMING')} className={`px-2 py-1.5 rounded-lg border flex flex-col items-center min-w-[50px] ${view === 'UPCOMING' ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'}`}>
                    <span className={`text-[10px] font-black ${view === 'UPCOMING' ? 'text-blue-600' : 'text-slate-400'}`}>{upcomingCount}</span>
                    <span className="text-[6px] font-black uppercase text-slate-400 tracking-tighter">Next</span>
                 </div>
              </div>
           </div>

           {/* Desktop Row */}
           <div className="hidden sm:flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-premium">
              <div className="flex items-center space-x-4 shrink-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-teal-50 rounded-2xl flex items-center justify-center border border-teal-100">
                   <CheckSquare size={24} className="text-teal-600" />
                </div>
                <div>
                   <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Work Console</h1>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Manage your sales activities and follow-ups</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 sm:space-x-8 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                 <div className="flex items-center space-x-4 shrink-0">
                    <div className="flex flex-col items-end border-r border-slate-100 pr-4">
                       <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Efficiency</span>
                       <span className="text-sm font-black text-teal-600 leading-none">{efficiency}%</span>
                    </div>
                    <div className="flex flex-col items-end border-r border-slate-100 pr-4">
                       <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Progress</span>
                       <span className="text-sm font-black text-blue-500 leading-none">{inProgressCount}</span>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Cancelled</span>
                       <span className="text-sm font-black text-slate-300 leading-none">{cancelledCount}</span>
                    </div>
                 </div>
                 
                 <div className="flex -space-x-2 shrink-0">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?u=${i+10}`} alt="avatar" />
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="hidden sm:grid grid-cols-3 gap-2 sm:gap-4 mt-4">
              <div onClick={() => setView('OVERDUE')} className={`cursor-pointer p-2 sm:p-4 rounded-xl border transition-all ${view === 'OVERDUE' ? 'bg-rose-50 border-rose-200 shadow-sm' : 'bg-white border-slate-100'}`}>
                 <div className="flex flex-col items-center text-center">
                    <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg mb-1">
                       <AlertCircle size={14} />
                    </div>
                    <span className={`text-base sm:text-2xl font-black ${view === 'OVERDUE' ? 'text-rose-600' : 'text-slate-700'}`}>{overdueCount}</span>
                    <p className="font-bold text-slate-400 text-[8px] sm:text-xs uppercase tracking-tighter">Overdue</p>
                 </div>
              </div>
              <div onClick={() => setView('PENDING')} className={`cursor-pointer p-2 sm:p-4 rounded-xl border transition-all ${view === 'PENDING' ? 'bg-teal-50 border-teal-200 shadow-sm' : 'bg-white border-slate-100'}`}>
                 <div className="flex flex-col items-center text-center">
                    <div className="p-1.5 bg-teal-100 text-teal-600 rounded-lg mb-1">
                       <Clock size={14} />
                    </div>
                    <span className={`text-base sm:text-2xl font-black ${view === 'PENDING' ? 'text-teal-600' : 'text-slate-700'}`}>{todayCount}</span>
                    <p className="font-bold text-slate-400 text-[8px] sm:text-xs uppercase tracking-tighter">Today</p>
                 </div>
              </div>
              <div onClick={() => setView('UPCOMING')} className={`cursor-pointer p-2 sm:p-4 rounded-xl border transition-all ${view === 'UPCOMING' ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-100'}`}>
                 <div className="flex flex-col items-center text-center">
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg mb-1">
                       <Calendar size={14} />
                    </div>
                    <span className={`text-base sm:text-2xl font-black ${view === 'UPCOMING' ? 'text-blue-600' : 'text-slate-700'}`}>{upcomingCount}</span>
                    <p className="font-bold text-slate-400 text-[8px] sm:text-xs uppercase tracking-tighter">Upcoming</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-4 sm:px-8 py-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

         <div className="relative group w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by contact or title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2 text-xs font-medium w-full focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all outline-none"
            />
         </div>
      </div>

      {/* Task List */}
      <div className="flex-1 p-4 sm:p-8 overflow-y-auto custom-scrollbar">
         <div className="max-w-5xl mx-auto space-y-4 pb-20">
            {filteredTasks.length > 0 ? filteredTasks.map(t => {
               const isOverdue = t.status === 'PENDING' && new Date(t.dueDate) < new Date();
               const counsellor = t.metadata?.assignedCounsellor ? agents.find(a => a._id === t.metadata.assignedCounsellor) : null;
               
               return (
                   <div key={t._id} className={`group bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col hover:border-teal-200 hover:shadow-xl transition-all animate-fade-in relative ${activeDropdown === t._id ? 'z-[50] ring-2 ring-teal-500/20 shadow-2xl' : 'z-0'}`}>
                      {/* Top Content Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                         <div className="flex items-start sm:items-center space-x-3 sm:space-x-5 text-left">
                            <button 
                              onClick={() => openContactProfile(t.contactId)}
                              className="relative shrink-0"
                            >
                               <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-xs sm:text-sm font-black transition-all ${
                                 t.type === 'CALL' ? 'bg-blue-50 text-blue-600' : 
                                 t.type === 'MEETING' ? 'bg-purple-50 text-purple-600' : 
                                 'bg-orange-50 text-orange-600'
                               }`}>
                                 {getInitials(t.contactName)}
                               </div>
                               <div className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-lg border-2 border-white flex items-center justify-center shadow-sm ${
                                 t.type === 'CALL' ? 'bg-blue-500 text-white' : 
                                 t.type === 'MEETING' ? 'bg-purple-500 text-white' : 
                                 'bg-orange-500 text-white'
                               }`}>
                                 {t.type === 'CALL' && <PhoneCall size={8} />}
                                 {t.type === 'MEETING' && <Calendar size={8} />}
                                 {t.type === 'FOLLOW_UP' && <Clock size={8} />}
                               </div>
                            </button>

                            <div className="min-w-0 flex-1">
                               <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h3 className="text-sm font-black text-slate-800 tracking-tight truncate max-w-[200px] sm:max-w-none">{t.title}</h3>
                                  <div className="flex gap-1">
                                     {isOverdue && <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[8px] font-black uppercase rounded">Overdue</span>}
                                     {t.status === 'COMPLETED' && <span className="px-1.5 py-0.5 bg-teal-100 text-teal-600 text-[8px] font-black uppercase rounded">Done</span>}
                                  </div>
                               </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                                     <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                         <button 
                                           onClick={() => openContactProfile(t.contactId)}
                                           className="flex items-center text-[10px] sm:text-[11px] font-bold text-slate-400 hover:text-teal-600 transition-colors"
                                         >
                                            <User size={12} className="mr-1 opacity-60" />
                                            <span className="truncate max-w-[100px]">{t.contactName}</span>
                                         </button>
                                         
                                         {/* Lead Owner Badge */}
                                         {(t.assignedAgent || t.assignedCounsellor) && (
                                            <div className="flex items-center text-[10px] sm:text-[11px] font-bold text-indigo-500/80">
                                               <Briefcase size={12} className="mr-1 opacity-60" />
                                               <span className="truncate max-w-[80px]">
                                                  {agents.find(a => a._id === (t.assignedAgent || t.assignedCounsellor))?.name.split(' ')[0] || 'Agent'}
                                               </span>
                                            </div>
                                         )}
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                         <div className={`flex items-center text-[10px] sm:text-[11px] font-bold ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                                            <Calendar size={12} className="mr-1 opacity-60" />
                                            {new Date(t.dueDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                         </div>
                                         <div className={`inline-flex items-center px-1.5 py-0.5 text-[8px] font-black uppercase rounded-md border w-fit ${
                                            STATUS_MAPPING[t.contactStatus?.toUpperCase()] === 'NEW' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            STATUS_MAPPING[t.contactStatus?.toUpperCase()] === 'OPEN' ? 'bg-teal-50 text-teal-600 border-teal-100' :
                                            'bg-slate-50 text-slate-500 border-slate-100'
                                         }`}>
                                            {STATUS_MAPPING[t.contactStatus?.toUpperCase()] || 'OPEN'}
                                         </div>
                                      </div>
                                   </div>
                                </div>
                             </div>
                           </div>

                             {/* Action Buttons Row */}
                             <div className="flex items-center justify-between sm:justify-end gap-2 mt-4 sm:mt-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                                {(t.status === 'PENDING' || t.status === 'IN_PROGRESS') && (
                                   <button 
                                     onClick={() => { setCompletingTask(t); setActiveDropdown(null); }}
                                     className="flex-1 sm:flex-initial h-9 px-6 bg-teal-600 text-white text-[10px] font-black rounded-lg hover:bg-teal-700 transition-all flex items-center justify-center shadow-lg shadow-teal-600/20 active:scale-95 uppercase tracking-widest"
                                   >
                                     <Check size={14} className="mr-2" /> Update Outcome
                                   </button>
                                )}
                             </div>

                             {/* 3-DOT MENU (Top Right) */}
                             <div className="absolute top-4 right-4 sm:top-5 sm:right-5" ref={activeDropdown === t._id ? dropdownRef : null}>
                                <button 
                                   onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdown(activeDropdown === t._id ? null : t._id);
                                   }}
                                   className={`h-8 w-8 sm:h-10 sm:w-10 text-slate-400 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center border border-slate-100 sm:border-none ${activeDropdown === t._id ? 'bg-slate-100 text-slate-600' : ''}`}
                                >
                                   <MoreVertical size={20} />
                                </button>

                                {activeDropdown === t._id && (
                                   <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-3xl border border-slate-100 py-2 z-[100] animate-pop-in divide-y divide-slate-50">
                                    {(t.status === 'PENDING' || t.status === 'IN_PROGRESS') && (
                                       <div className="pb-2">
                                          <button 
                                             onClick={() => {
                                                setEditingTask(t);
                                                 setEditTaskTitle(t.title);
                                                 setEditTaskDescription(t.description || '');
                                                setEditTaskDate(new Date(t.dueDate).toISOString().slice(0, 16));
                                                setEditTaskType(t.type);
                                                setActiveDropdown(null);
                                             }}
                                             className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center transition-colors"
                                          >
                                             <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3">
                                                <Edit3 size={16} />
                                             </div>
                                             Edit Follow-Up
                                          </button>
                                          <button 
                                             onClick={() => { 
                                                setReschedulingTask(t);
                                                setRescheduleDate(new Date(t.dueDate).toISOString().slice(0, 16));
                                                setActiveDropdown(null);
                                             }}
                                             className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center transition-colors"
                                          >
                                             <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mr-3">
                                                <ArrowUpRight size={16} />
                                             </div>
                                             Reschedule
                                          </button>
                                          <button 
                                              onClick={() => { setCancellingTaskConfirm(t); setActiveDropdown(null); }}
                                              className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center transition-colors"
                                           >
                                              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mr-3">
                                                 <AlertCircle size={16} />
                                              </div>
                                              Cancel Task
                                           </button>
                                          <button 
                                             onClick={() => { 
                                                 setSettingToTodayTask(t);
                                                 const now = new Date();
                                                 setTodayTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
                                                 setActiveDropdown(null); 
                                              }}
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

                           {/* COMPLETED DETAILS */}
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
          <div className="fixed inset-0 z-[1000] flex justify-end bg-slate-900/60 backdrop-blur-md animate-fade-in" onClick={() => setShowProfile(false)}>
            <div 
              className="w-drawer h-full bg-white shadow-3xl flex flex-col animate-slide-left relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
                {/* PROFESSIONAL PREMIUM HEADER */}
                <div className="bg-slate-50/50 backdrop-blur-xl border-b border-slate-100 px-4 sm:px-10 py-5 sm:py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 gap-4 sm:gap-0 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                     <div className="flex items-center space-x-4 sm:space-x-7 w-full sm:w-auto relative z-10">
                         <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-[1.5rem] bg-white shadow-premium border border-slate-100 flex items-center justify-center text-2xl sm:text-3xl font-black text-slate-800 shrink-0 group hover:scale-105 transition-all">
                            <span className="opacity-40 group-hover:opacity-100 transition-opacity">{editedContact.firstName?.charAt(0) || selectedContact.name?.charAt(0) || 'U'}</span>
                         </div>
                         <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                               <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight truncate max-w-[180px] sm:max-w-none">
                                  {editedContact.firstName || editedContact.name || 'Lead'} {editedContact.lastName || ''}
                               </h2>
                               <div className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-teal-100 shadow-sm">
                                  {editedContact.pipelineStage || 'Discovery'}
                               </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 mt-2 text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
                               <span className="flex items-center truncate hover:text-slate-600 transition-colors cursor-default"><Phone size={14} className="mr-2 text-teal-500" /> {editedContact.phone}</span>
                               <span className="flex items-center hover:text-slate-600 transition-colors cursor-default"><Hash size={14} className="mr-2 text-indigo-400" /> ID: {selectedContact._id.slice(-6).toUpperCase()}</span>
                            </div>
                         </div>
                     </div>

                     <div className="flex items-center justify-between sm:justify-end space-x-3 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100 relative z-10">
                      <div className="flex flex-col items-start sm:items-end mr-0 sm:mr-3">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Lead Status</label>
                         <div className="relative group">
                            <select 
                               value={editedContact.status || 'NEW LEAD'} 
                               onChange={e => handleFieldChange('status', e.target.value)}
                               className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-4 sm:px-6 py-2.5 rounded-xl border-2 shadow-sm transition-all outline-none appearance-none pr-10 ${
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
                           className={`h-11 sm:h-12 px-5 sm:px-10 rounded-2xl text-[10px] sm:text-[12px] font-black uppercase tracking-[0.1em] shadow-lg transition-all flex items-center justify-center active:scale-95 ${
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
                     
                     {/* STEP 1: BASIC INFORMATION */}
                     <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 sm:p-10 shadow-premium space-y-8 animate-fade-in">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white text-xs flex items-center justify-center font-black shadow-lg shadow-slate-900/20">01</div>
                              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Basic Information</h3>
                           </div>
                           <div className="h-[2px] flex-1 bg-slate-50 mx-6 rounded-full hidden sm:block"></div>
                           <User size={18} className="text-slate-200" />
                        </div>
                        
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Full Name</label>
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
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Identity (Verified)</label>
                              <div className="w-full bg-slate-50 border-2 border-transparent py-3.5 px-5 text-sm font-bold text-slate-500 rounded-2xl flex items-center">
                                 <Phone size={14} className="mr-3 text-teal-500 opacity-60" /> {editedContact.phone}
                              </div>
                           </div>

                           <div className="space-y-4 pt-4 border-t border-slate-50">
                              <div className="flex items-center justify-between">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Communication Channels</label>
                                 {(!editedContact.secondaryPhone || editedContact.secondaryPhone.trim() === '') && (
                                    <button 
                                       onClick={() => handleFieldChange('secondaryPhone', '+')} 
                                       className="text-[10px] font-black text-teal-600 flex items-center hover:bg-teal-50 px-3 py-1.5 rounded-xl transition-all"
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
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Location Details</label>
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
                                 <div className="w-full bg-slate-100/50 border-2 border-transparent py-3 px-5 text-[10px] font-black text-slate-400 rounded-2xl flex items-center uppercase tracking-widest">India</div>
                                 <input value={editedContact.pincode || ''} onChange={e=>handleFieldChange('pincode', e.target.value)} placeholder="Pincode" className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-5 text-xs font-bold text-slate-800 rounded-2xl outline-none focus:bg-white focus:border-teal-500/20 transition-all" />
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* STEP 2: QUALIFICATION & PROFILE */}
                      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 sm:p-10 shadow-premium space-y-8 animate-fade-in">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                               <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white text-xs flex items-center justify-center font-black shadow-lg shadow-slate-900/20">02</div>
                               <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Academic Qualification</h3>
                            </div>
                            <div className="h-[2px] flex-1 bg-slate-50 mx-6 rounded-full hidden sm:block"></div>
                            <Award size={18} className="text-slate-200" />
                         </div>
                         
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Highest Degree</label>
                               <input value={editedContact.lastQualification || ''} onChange={e=>handleFieldChange('lastQualification', e.target.value)} placeholder="e.g. 12th Commerce, B.Tech" className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-5 text-xs font-bold text-slate-800 rounded-2xl outline-none focus:bg-white focus:border-teal-500/20 transition-all" />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Aggregate Score (%)</label>
                               <input value={editedContact.lastPercentage || ''} onChange={e=>handleFieldChange('lastPercentage', e.target.value)} placeholder="e.g. 85%" className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-5 text-xs font-bold text-slate-800 rounded-2xl outline-none focus:bg-white focus:border-teal-500/20 transition-all" />
                            </div>
                         </div>

                         <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Dream Program / Course</label>
                            <input value={editedContact.courseName || ''} onChange={e=>handleFieldChange('courseName', e.target.value)} placeholder="e.g. MBA (Finance), B.Arch" className="w-full bg-slate-50/50 border-2 border-slate-50 py-3.5 px-5 text-sm font-bold text-slate-800 rounded-2xl outline-none focus:bg-white focus:border-teal-500/20 transition-all" />
                         </div>

                         <div className="pt-4 border-t border-slate-50">
                            <div className="flex items-center space-x-2 mb-4">
                               <Sparkles size={12} className="text-teal-500" />
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Counselor Insights</span>
                            </div>
                            <textarea 
                              value={editedContact.qualificationRemarks || ''} 
                              onChange={e=>handleFieldChange('qualificationRemarks', e.target.value)} 
                              placeholder="Add specific qualification notes..." 
                              className="w-full h-32 bg-slate-50/30 border-2 border-slate-50 rounded-[1.5rem] p-5 text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-teal-500/20 transition-all resize-none"
                            />
                         </div>
                      </div>

                      {/* STEP 3: VISIT & ADMISSION */}
                      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 sm:p-10 shadow-premium space-y-8 animate-fade-in">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                               <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white text-xs flex items-center justify-center font-black shadow-lg shadow-teal-600/20">03</div>
                               <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Visit & Admission</h3>
                            </div>
                            <div className="h-[2px] flex-1 bg-slate-50 mx-6 rounded-full hidden sm:block"></div>
                            <CheckCircle size={18} className="text-teal-200" />
                         </div>

                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Interaction Type</label>
                               <div className="relative group">
                                  <select value={editedContact.leadType || ''} onChange={e=>handleFieldChange('leadType', e.target.value)} className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-5 text-xs font-bold text-slate-700 rounded-2xl outline-none focus:bg-white focus:border-teal-500/20 transition-all appearance-none pr-10">
                                     <option value="">Choose Mode</option>
                                     <option value="Online">Online Consultation</option>
                                     <option value="Office">Office Visit</option>
                                     <option value="Campus">Campus Tour</option>
                                  </select>
                                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Consultation Date</label>
                               <input type="date" value={editedContact.visitDate ? editedContact.visitDate.split('T')[0] : ''} onChange={e=>handleFieldChange('visitDate', e.target.value)} className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-5 text-xs font-bold text-slate-800 rounded-2xl outline-none focus:bg-white focus:border-teal-500/20 transition-all" />
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
                             className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${
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

                       {activeTab === 'chat history' && (
                          <div className="space-y-6">
                             {(!selectedContact.chatLog || selectedContact.chatLog.length === 0) ? (
                                <div className="py-20 text-center text-slate-300 text-xs uppercase tracking-widest">No communication history</div>
                             ) : selectedContact.chatLog.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                                   <div className={`max-w-[85%] p-5 rounded-[2rem] shadow-premium relative group transition-all hover:shadow-lg ${
                                      msg.fromMe 
                                      ? 'bg-slate-900 text-white ml-auto rounded-tr-none border border-slate-800' 
                                      : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'
                                   }`}>
                                      <div className={`text-sm font-medium leading-relaxed mb-3 ${msg.fromMe ? 'text-slate-100' : 'text-slate-700'}`}>
                                         {msg.body}
                                      </div>
                                      <div className={`flex items-center justify-between text-[9px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity ${msg.fromMe ? 'text-white' : 'text-slate-400'}`}>
                                         <span>{new Date(msg.timestamp * 1000).toLocaleDateString()}</span>
                                         <span>{new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}

                       {activeTab === 'strategic notes' && (
                          <div className="space-y-8 animate-fade-in">
                             <div className="space-y-8">
                                <div className="flex items-center justify-between px-2">
                                   <div className="flex items-center space-x-3">
                                      <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                                         <Edit3 size={18} />
                                      </div>
                                      <div>
                                         <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Activity Journal</h4>
                                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Strategic Notes & Observations</p>
                                      </div>
                                   </div>
                                   <button 
                                      onClick={() => updateContactDetail(selectedContact._id, editedContact)}
                                      className="px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-slate-900/10 active:scale-95 transition-all"
                                   >
                                      Save Entry
                                   </button>
                                </div>

                                <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 shadow-inner group focus-within:bg-white focus-within:shadow-premium transition-all">
                                   <textarea
                                      value={editedContact.strategicNotes || ''}
                                      onChange={e => handleFieldChange('strategicNotes', e.target.value)}
                                      placeholder="Document interaction insights, follow-up strategies, and key lead observations..."
                                      className="w-full h-80 bg-transparent text-sm font-medium text-slate-700 placeholder-slate-300 outline-none resize-none leading-loose"
                                   />
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-3xl w-full max-w-xl overflow-hidden animate-pop-in border border-white/20 flex flex-col max-h-[95vh]">
             
             {/* Modal Dynamic Header */}
             <div className="p-4 sm:p-8 bg-gradient-to-br from-teal-500 to-emerald-600 text-white relative shrink-0">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="flex items-center justify-between relative z-10">
                   <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
                        <CheckCircle2 size={24} className="sm:size-32" />
                      </div>
                      <div>
                         <h2 className="text-lg sm:text-2xl font-black tracking-tight leading-tight">Finalize Activity</h2>
                         <p className="text-teal-50 text-[9px] sm:text-[11px] font-bold uppercase tracking-widest opacity-80 truncate max-w-[200px] sm:max-w-none">Outcome for {completingTask.contactName}</p>
                      </div>
                   </div>
                   <button onClick={() => setCompletingTask(null)} className="p-2 sm:p-3 bg-white/10 hover:bg-white/20 rounded-xl sm:rounded-2xl transition-all"><X size={18} /></button>
                </div>
             </div>
             
             <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto custom-scrollbar bg-slate-50/30 flex-1">
                
                {/* Meeting Type Selector */}
                {completingTask.type === 'MEETING' && (
                   <div className="animate-fade-in">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 sm:mb-4">Visit Format</label>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                         {[
                            { id: 'Online', label: 'Online', icon: <Video size={16}/> },
                            { id: 'Office Visit', label: 'Office', icon: <Home size={16}/> },
                            { id: 'Campus Visit', label: 'Campus', icon: <School size={16}/> }
                         ].map(mode => (
                            <button 
                               key={mode.id}
                               onClick={() => setMeetingType(mode.id)}
                               className={`flex flex-col items-center justify-center p-2 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 ${
                                  meetingType === mode.id 
                                  ? 'bg-white border-teal-500 shadow-lg scale-[1.02]' 
                                  : 'bg-white border-transparent'
                               }`}
                            >
                               <div className={`mb-1 sm:mb-2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${meetingType === mode.id ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  {mode.icon}
                                </div>
                               <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-tighter ${meetingType === mode.id ? 'text-teal-900' : 'text-slate-400'}`}>{mode.label}</span>
                            </button>
                         ))}
                      </div>
                   </div>
                )}

                {/* Outcome Remarks */}
                <div className="animate-fade-in">
                   <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 sm:mb-3">Meeting / Interaction Remark</label>
                   <textarea 
                     value={completionNotes} 
                     onChange={(e) => setCompletionNotes(e.target.value)}
                     placeholder="Detail the outcome of this interaction..."
                     className="w-full bg-white border-2 border-slate-100 focus:border-teal-500 rounded-2xl sm:rounded-3xl p-3 sm:p-5 text-xs sm:text-sm font-bold text-slate-700 outline-none transition-all min-h-[100px] sm:min-h-[120px] resize-none"
                   />
                </div>

                {/* Counsellor Referral */}
                <div className="animate-fade-in">
                   <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 sm:mb-4">Lead Handover (Counsellor)</label>
                   <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {agents.filter(a => ['MANAGER_COUNSELLOUR', 'MANAGER_COUNSELOR', 'COUNSELLOUR', 'COUNSELLOR', 'COUNSELOR', 'MANAGER COUNSELLOUR'].includes(a.role?.toUpperCase())).length > 0 ? (
                        agents.filter(a => ['MANAGER_COUNSELLOUR', 'MANAGER_COUNSELOR', 'COUNSELLOUR', 'COUNSELLOR', 'COUNSELOR', 'MANAGER COUNSELLOUR'].includes(a.role?.toUpperCase())).map(agent => (
                           <button 
                              key={agent._id}
                              onClick={() => setAssignedCounsellorId(assignedCounsellorId === agent._id ? '' : agent._id)}
                              className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 transition-all ${
                                 assignedCounsellorId === agent._id 
                                 ? 'bg-indigo-50 border-indigo-500 shadow-md' 
                                 : 'bg-white border-slate-100'
                              }`}
                           >
                              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black border-2 ${assignedCounsellorId === agent._id ? 'bg-indigo-500 text-white border-white' : 'bg-slate-100 text-slate-400 border-transparent'}`}>
                                 {getInitials(agent.name)}
                              </div>
                              <div className="text-left min-w-0">
                                 <p className={`text-[10px] sm:text-[11px] font-black truncate ${assignedCounsellorId === agent._id ? 'text-indigo-900' : 'text-slate-700'}`}>{agent.name}</p>
                                 <p className="text-[8px] font-bold text-slate-400 uppercase">Counselor</p>
                              </div>
                           </button>
                        ))
                      ) : (
                        <p className="col-span-2 py-3 px-4 bg-slate-100 rounded-xl text-[9px] font-bold text-slate-500 italic text-center">No counsellors available.</p>
                      )}
                   </div>
                </div>

                {/* Follow-up Logic Overlay */}
                <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border transition-all duration-500 ${isAddingFollowUp ? 'bg-orange-50/50 border-orange-200' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                   <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                         <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-colors ${isAddingFollowUp ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                           <CalendarDays size={18} />
                         </div>
                         <div>
                            <p className={`text-sm sm:text-base font-black ${isAddingFollowUp ? 'text-orange-900' : 'text-slate-600'}`}>Next Follow-up</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Lifecycle</p>
                         </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isAddingFollowUp} onChange={e => setIsAddingFollowUp(e.target.checked)} className="sr-only peer" />
                        <div className="w-12 h-6 sm:w-14 sm:h-7 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                   </div>

                   {isAddingFollowUp && (
                     <div className="space-y-4 animate-fade-in">
                        <div className="space-y-3">
                           <div>
                              <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1 block">Subject</label>
                              <input 
                                type="text" 
                                value={nextFollowUpTitle} 
                                onChange={e => setNextFollowUpTitle(e.target.value)}
                                placeholder="e.g. Closing Call"
                                className="w-full bg-white border-2 border-orange-100/50 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 outline-none transition-all" 
                              />
                           </div>
                           <div>
                              <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1 block">Scheduled Time</label>
                              <input 
                                type="datetime-local" 
                                value={nextFollowUpDate} 
                                onChange={e => setNextFollowUpDate(e.target.value)}
                                className="w-full bg-white border-2 border-orange-100/50 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 outline-none transition-all" 
                              />
                           </div>
                           <div>
                              <label className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1 block">Description</label>
                              <textarea 
                                value={nextFollowUpDescription} 
                                onChange={e => setNextFollowUpDescription(e.target.value)}
                                placeholder="What needs to be done next?"
                                className="w-full bg-white border-2 border-orange-100/50 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 outline-none transition-all h-20" 
                              />
                           </div>
                        </div>
                     </div>
                   )}
                </div>
             </div>

             <div className="p-4 sm:p-8 border-t border-slate-100 flex items-center justify-between bg-white gap-3 shrink-0">
                <button onClick={() => setCompletingTask(null)} className="px-4 sm:px-8 py-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Discard</button>
                <button 
                  onClick={submitTaskCompletion} 
                  disabled={isSubmittingCompletion || (isAddingFollowUp && !nextFollowUpDate)} 
                  className="flex-1 sm:flex-initial px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center shadow-lg transition-all active:scale-95 group"
                >
                   {isSubmittingCompletion ? <Clock size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                   Finalize
                </button>
             </div>
           </div>
        </div>
      )}


      {/* Cancel Confirmation Modal */}
      {cancellingTaskConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in" onClick={() => setCancellingTaskConfirm(null)}>
          <div className="bg-white rounded-[2rem] w-full max-w-[450px] overflow-hidden shadow-3xl animate-pop-in" onClick={e => e.stopPropagation()}>
            <div className="p-resp text-center">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight uppercase">Efficiency Warning!</h3>
              <p className="text-slate-500 font-bold text-sm leading-relaxed px-4">
                Are you absolutely sure you want to cancel this task? 
                <br/><br/>
                <span className="text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 inline-block mt-2">
                  ⚠️ Your efficiency will drop by <span className="font-black underline">5%</span> if you cancel.
                </span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-0 border-t border-slate-100">
              <button 
                onClick={() => setCancellingTaskConfirm(null)}
                className="py-6 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all border-r border-slate-100"
              >
                No, Keep Task
              </button>
              <button 
                onClick={() => {
                  updateTaskStatus(cancellingTaskConfirm.contactId, cancellingTaskConfirm._id, 'cancel_task');
                  setCancellingTaskConfirm(null);
                }}
                className="py-6 text-xs font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 transition-all"
              >
                Yes, Cancel Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set to Today Confirmation Modal */}
      {settingToTodayTask && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSettingToTodayTask(null)}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-[400px] p-resp shadow-3xl animate-pop-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800">Move to Today</h3>
              <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">
                Original: {new Date(settingToTodayTask.dueDate).toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Scheduled Date</label>
                <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500">
                  {new Date().toLocaleDateString()} (Today)
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Select Time</label>
                <input 
                  type="time" 
                  value={todayTime} 
                  onChange={e => setTodayTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none"
                />
              </div>

              <div className="pt-4 grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setSettingToTodayTask(null)}
                  className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    const [hours, minutes] = todayTime.split(':');
                    const targetDate = new Date();
                    targetDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    
                    const token = localStorage.getItem('token');
                    const tenantId = localStorage.getItem('tenantId');
                    try {
                      const res = await fetch(`/api/chat/contacts/${settingToTodayTask.contactId}/action`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'reschedule_task', payload: { taskId: settingToTodayTask._id, newDueDate: targetDate } })
                      });
                      if (res.ok) {
                         toast.success("Task moved to Today");
                         fetchTasks();
                         setSettingToTodayTask(null);
                      }
                    } catch (e) {
                      toast.error("Failed to move task");
                    }
                  }}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
                >
                  Move Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Follow-Up Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setEditingTask(null)}>
          <div className="bg-white rounded-3xl w-[400px] p-6 shadow-2xl animate-pop-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center"><Edit3 size={20} className="mr-2 text-indigo-600"/> Edit Follow-Up</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Subject</label>
                <input type="text" value={editTaskTitle} onChange={e=>setEditTaskTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Follow-up Type</label>
                <select 
                  value={editTaskType} 
                  onChange={e=>setEditTaskType(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none"
                >
                  <option value="CALL">Call</option>
                  <option value="MEETING">Meeting</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Date (Read Only)</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500">
                    {new Date(editTaskDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Time (Read Only)</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500">
                    {new Date(editTaskDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Task Description</label>
                <textarea 
                  rows={4}
                  value={editTaskDescription} 
                  onChange={e=>setEditTaskDescription(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none resize-none"
                  placeholder="Enter task details..."
                />
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
      {/* Reschedule Task Modal */}
      {reschedulingTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setReschedulingTask(null)}>
          <div className="bg-white rounded-3xl w-full max-w-[400px] p-resp shadow-2xl animate-pop-in" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <CalendarDays size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Reschedule Task</h3>
            <p className="text-sm font-bold text-slate-500 mb-6">Select a new date and time for this follow-up.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">New Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={rescheduleDate} 
                  onChange={e=>setRescheduleDate(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all" 
                />
              </div>
              
              <div className="pt-4 flex flex-col space-y-3">
                <button 
                  onClick={handleRescheduleSubmit} 
                  disabled={isRescheduling || !rescheduleDate} 
                  className="w-full py-4 rounded-2xl text-sm font-black bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/20 disabled:opacity-50 transition-all flex items-center justify-center"
                >
                  {isRescheduling ? <RefreshCw size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                  {isRescheduling ? 'Updating...' : 'Confirm Reschedule'}
                </button>
                <button onClick={() => setReschedulingTask(null)} className="w-full py-4 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Critical Overdue Popup */}
      {showCriticalOverduePopup && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-rose-900/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-[450px] p-resp shadow-2xl border-4 border-rose-500 animate-pop-in text-center shadow-rose-500/20">
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
