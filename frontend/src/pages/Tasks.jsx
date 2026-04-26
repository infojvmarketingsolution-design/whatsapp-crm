import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, PhoneCall, Calendar, Clock, AlertCircle, 
  Search, Filter, ChevronRight, User, Check, CalendarDays,
  MoreVertical, MoreHorizontal, ArrowUpRight, ExternalLink,
  X, Mail, MapPin, Phone, Users, Activity, Target, Tag, Save, Edit3,
  Briefcase, Building2, Download, Flame, Sun, Snowflake, Send, 
  ShieldCheck, History, TrendingUp, Globe, Smartphone, Bell, 
  Landmark, Hash, Wallet, Video, Home, School
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
        toast.success("Profile Updated Successfully");
        fetchTasks();
    fetchAgents();
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
            setEditedContact(contact);
            setShowProfile(true);
            fetchRecentMessages(contactId);
         }
       }
     } catch (err) {
       console.error(err);
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

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not Set';
    return new Date(dateString).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

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
                                 <h3 className="text-sm font-black text-slate-800 tracking-tight">{t.title}</h3>
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
                                <Check size={14} className="mr-2" /> Done
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
        <div 
          className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm transition-all animate-fade-in"
          onClick={() => {
              if (showSaveFab) {
                  if (window.confirm("You have unsaved changes. Discard them?")) {
                      setShowProfile(false);
                  }
              } else {
                  setShowProfile(false);
              }
          }}
        >
           <div 
             className="w-[920px] h-full bg-white shadow-3xl flex flex-col animate-slide-in-right relative"
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

              {/* THEME SYNCHRONIZED PIPELINE */}
              <div className="bg-[var(--theme-bg)] relative z-[100] px-8 pb-8 pt-2 flex items-center justify-between shrink-0 shadow-inner overflow-x-auto no-scrollbar pointer-events-auto">
                  <div className="flex items-center flex-1 min-w-[700px] pointer-events-auto">
                      {PIPELINE_STAGES.map((stage, idx) => (
                         <React.Fragment key={stage}>
                            <button 
                               onClick={() => handleFieldChange('pipelineStage', stage)}
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

              <div className="flex-1 overflow-y-auto p-10 bg-white grid grid-cols-12 gap-10 custom-scrollbar">
                 <div className="col-span-12 lg:col-span-7 space-y-10">
                    
                    {/* SECTION 1: BASIC INFORMATION */}
                    <div className="space-y-6">
                       <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center"><User size={18} /></div>
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">1. Basic Information</h3>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-6">
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">First Name</label>
                             <input type="text" value={editedContact.firstName || ''} onChange={e=>handleFieldChange('firstName', e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none" />
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Last Name</label>
                             <input type="text" value={editedContact.lastName || ''} onChange={e=>handleFieldChange('lastName', e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none" />
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Primary Phone</label>
                             <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Smartphone size={14} /></div>
                                <input type="text" value={editedContact.phone || ''} readOnly className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-500 cursor-not-allowed" />
                             </div>
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Secondary Phone</label>
                             <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Phone size={14} /></div>
                                <input type="text" value={editedContact.secondaryPhone || ''} onChange={e=>handleFieldChange('secondaryPhone', e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-xl pl-10 pr-4 py-3 text-sm font-bold transition-all outline-none" />
                             </div>
                          </div>
                          <div className="col-span-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Email Identity</label>
                             <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Mail size={14} /></div>
                                <input type="email" value={editedContact.email || ''} onChange={e=>handleFieldChange('email', e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-xl pl-10 pr-4 py-3 text-sm font-bold transition-all outline-none placeholder-slate-300" placeholder="lead@company.com" />
                             </div>
                          </div>
                          <div className="col-span-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Full Street Address</label>
                             <div className="relative group">
                                <div className="absolute left-4 top-4 text-slate-400"><MapPin size={14} /></div>
                                <textarea value={editedContact.address || ''} onChange={e=>handleFieldChange('address', e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-xl pl-10 pr-4 py-3 text-sm font-bold transition-all outline-none h-24" />
                             </div>
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">State / Region</label>
                             <input type="text" value={editedContact.state || ''} onChange={e=>handleFieldChange('state', e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none" />
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Pincode</label>
                             <input type="text" value={editedContact.pincode || ''} onChange={e=>handleFieldChange('pincode', e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none" />
                          </div>
                       </div>
                    </div>

                    {/* SECTION 2: QUALIFICATION & SCORING */}
                    <div className="space-y-6">
                       <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center"><Target size={18} /></div>
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">2. Qualification</h3>
                       </div>
                       <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
                          <div className="flex justify-between items-center mb-4">
                             <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Profiling Score</span>
                             <span className="text-xl font-black text-teal-600">{editedContact.score || 0}%</span>
                          </div>
                          <input type="range" value={editedContact.score || 0} onChange={e=>handleFieldChange('score', parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600" />
                       </div>
                       <div className="grid grid-cols-2 gap-6">
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Heat Level</label>
                             <div className="flex p-1 bg-slate-50 rounded-xl space-x-1">
                                {['COLD', 'WARM', 'HOT'].map(lvl => (
                                   <button 
                                     key={lvl} 
                                     onClick={()=>handleFieldChange('heatLevel', lvl)}
                                     className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${
                                       editedContact.heatLevel === lvl 
                                       ? lvl === 'HOT' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : lvl === 'WARM' ? 'bg-orange-400 text-white' : 'bg-blue-400 text-white'
                                       : 'text-slate-400 hover:text-slate-600'
                                     }`}
                                   >
                                      {lvl === 'HOT' && <Flame size={12} />}
                                      {lvl === 'WARM' && <Sun size={12} />}
                                      {lvl === 'COLD' && <Snowflake size={12} />}
                                      <span>{lvl}</span>
                                   </button>
                                ))}
                             </div>
                          </div>
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Lead Status</label>
                             <select value={editedContact.status || 'NEW'} onChange={e=>handleFieldChange('status', e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none">
                                <option value="NEW">NEW LEAD</option>
                                <option value="OPEN">OPEN RECORRD</option>
                                <option value="PROGRESS">IN-PROGRESS</option>
                                <option value="CLOSED">CLOSED WON</option>
                                <option value="LOST">CLOSED LOST</option>
                             </select>
                          </div>
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Qualification Detail</label>
                          <textarea value={editedContact.qualification || ''} onChange={e=>handleFieldChange('qualification', e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-teal-500 focus:bg-white rounded-xl px-4 py-3 text-sm font-bold transition-all outline-none h-32 placeholder-slate-300" placeholder="Detail the requirements and qualification highlights..." />
                       </div>
                    </div>
                 </div>

                 <div className="col-span-12 lg:col-span-5 space-y-10">
                    
                    {/* SECTION 3: LEAD INTELLIGENCE */}
                    <div className="space-y-6">
                       <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><TrendingUp size={18} /></div>
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">3. Lead Intelligence</h3>
                       </div>
                       <div className="grid gap-6">
                          <div className="p-4 bg-slate-900 rounded-2xl shadow-xl">
                             <label className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-2">Est. Deal Value</label>
                             <div className="flex items-center space-x-3">
                                <span className="text-xl font-black text-white opacity-40">â‚¹</span>
                                <input type="number" value={editedContact.estimatedValue || 0} onChange={e=>handleFieldChange('estimatedValue', e.target.value)} className="bg-transparent text-2xl font-black text-white outline-none w-full placeholder-white/10" />
                             </div>
                          </div>
                          <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center space-x-3">
                             <Globe size={16} className="text-slate-400" />
                             <div className="flex-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase block">Lead Source</label>
                                <input value={editedContact.leadSource || ''} onChange={e=>handleFieldChange('leadSource', e.target.value)} className="text-sm font-bold text-slate-700 w-full outline-none" placeholder="Web, Referral, Ads..." />
                             </div>
                          </div>
                          <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center space-x-3">
                              <ShieldCheck size={16} className={userRole === 'TELECALLER' ? 'text-slate-300' : 'text-blue-600'} />
                              <div className="flex-1">
                                 <label className="text-[8px] font-black text-slate-400 uppercase block">Assigned Advisor</label>
                                 <select 
                                   disabled={userRole === 'TELECALLER'}
                                   value={editedContact.assignedAgent || ''} 
                                   onChange={e=>handleFieldChange('assignedAgent', e.target.value)} 
                                   className={`text-sm font-bold text-slate-700 w-full bg-transparent outline-none ${userRole === 'TELECALLER' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                 >
                                    <option value="">Unassigned</option>
                                    {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.role})</option>)}
                                 </select>
                              </div>
                           </div>
                       </div>
                    </div>

                    {/* SECTION 4: RECORDS & METADATA */}
                    <div className="space-y-6">
                       <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center"><History size={18} /></div>
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">4. Metadata Records</h3>
                       </div>
                       <div className="bg-slate-50 rounded-2xl p-6 space-y-6 border border-slate-100">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center space-x-3">
                                <Activity size={14} className="text-teal-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Creation Identity</span>
                             </div>
                             <span className="text-[11px] font-black text-slate-700">{formatDateTime(selectedContact.createdAt)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                             <div className="flex items-center space-x-3">
                                <History size={14} className="text-blue-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Last Modification</span>
                             </div>
                             <span className="text-[11px] font-black text-slate-700">{formatDateTime(selectedContact.updatedAt)}</span>
                          </div>
                       </div>
                    </div>

                    {/* INTERACTION TABS: TIMELINE & MESSAGES */}
                    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                        <div className="flex border-b border-slate-50">
                           {['timeline', 'messages', 'notes'].map(tab => (
                              <button key={tab} onClick={()=>setActiveTab(tab)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-50 text-teal-600 border-b-2 border-teal-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                 {tab}
                              </button>
                           ))}
                        </div>
                        <div className="p-6 h-80 overflow-y-auto custom-scrollbar">
                           {activeTab === 'timeline' && (
                              <div className="space-y-6">
                                 {selectedContact.timeline?.slice().reverse().map((event, idx) => (
                                    <div key={idx} className="flex space-x-4">
                                       <div className="flex flex-col items-center">
                                          <div className={`w-2.5 h-2.5 rounded-full mt-1 ${idx === 0 ? 'bg-teal-500 ring-4 ring-teal-50' : 'bg-slate-200'}`}></div>
                                          {idx !== selectedContact.timeline.length - 1 && <div className="w-0.5 h-full bg-slate-50 my-1"></div>}
                                       </div>
                                       <div>
                                          <p className="text-[10px] font-black text-slate-800 leading-tight">{event.description}</p>
                                          <span className="text-[9px] font-bold text-slate-400 uppercase">{formatDateTime(event.timestamp)}</span>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           )}
                           {activeTab === 'messages' && (
                              <div className="space-y-4">
                                 {recentMessages.map((msg, idx) => (
                                    <div key={idx} className={`p-4 rounded-2xl text-xs font-bold leading-relaxed ${msg.fromMe ? 'bg-teal-50 text-teal-800 border-l-4 border-teal-500' : 'bg-slate-50 text-slate-700 border-l-4 border-slate-300'}`}>
                                       {msg.body}
                                       <div className="mt-2 text-[8px] font-black opacity-40 uppercase">{formatDateTime(msg.timestamp)}</div>
                                    </div>
                                 ))}
                              </div>
                           )}
                           {activeTab === 'notes' && (
                              <div className="space-y-6">
                                 <div className="flex space-x-3">
                                    <input value={noteInput} onChange={e=>setNoteInput(e.target.value)} placeholder="Add private note..." className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all" />
                                    <button onClick={()=>addInternalNote(selectedContact._id)} disabled={isAddingNote} className="w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center hover:bg-teal-700 transition-all shadow-lg active:scale-95">
                                       {isAddingNote ? <Clock size={16} className="animate-spin" /> : <Send size={16} />}
                                    </button>
                                 </div>
                                 <div className="space-y-4">
                                    {selectedContact.notes?.slice().reverse().map((note, idx) => (
                                       <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                          <p className="text-xs font-bold text-slate-700 leading-relaxed mb-2">{note.content}</p>
                                          <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-400">
                                             <span>By {note.createdBy || 'System'}</span>
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
