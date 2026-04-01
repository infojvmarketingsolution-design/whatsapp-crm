import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, PhoneCall, Calendar, Clock, AlertCircle, 
  Search, Filter, ChevronRight, User, Check, CalendarDays,
  MoreVertical, MoreHorizontal, ArrowUpRight, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, CALL, MEETING, FOLLOW_UP
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState('PENDING'); // PENDING, COMPLETED, OVERDUE
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
                 phone: c.phone
              });
            });
          }
        });
        
        allTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        setTasks(allTasks);
      }
    } catch (err) {
      console.error(err);
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
          setActiveDropdown(null);
       }
     } catch (err) {
       console.error(err);
     }
  };

  const overdueCount = tasks.filter(t => t.status === 'PENDING' && new Date(t.dueDate) < new Date()).length;
  const todayCount = tasks.filter(t => {
    const d = new Date(t.dueDate);
    const today = new Date();
    return t.status === 'PENDING' && d.toDateString() === today.toDateString() && d >= today;
  }).length;
  const upcomingCount = tasks.filter(t => {
    const d = new Date(t.dueDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return t.status === 'PENDING' && d > today;
  }).length;

  const filteredTasks = tasks.filter(t => {
    const isPending = t.status === 'PENDING';
    const isCompleted = t.status === 'COMPLETED';
    const isOverdue = isPending && new Date(t.dueDate) < new Date();
    
    // Status View Filter
    if (view === 'PENDING' && (!isPending || isOverdue)) return false;
    if (view === 'COMPLETED' && !isCompleted) return false;
    if (view === 'OVERDUE' && !isOverdue) return false;

    // Type Filter
    if (filter !== 'ALL' && t.type !== filter) return false;

    // Search Filter
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.contactName.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    return true;
  });

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  return (
    <div className="flex-1 bg-[#f8fafc] flex flex-col h-full overflow-hidden">
      
      {/* Header with Stats */}
      <div className="px-8 pt-8 pb-6 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Work Console</h1>
            <p className="text-slate-500 font-semibold text-sm">Manage your sales activities and follow-ups</p>
          </div>
          <div className="flex space-x-3">
             <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efficiency</p>
                <p className="text-lg font-black text-teal-600">84%</p>
             </div>
             <div className="h-10 w-[1px] bg-slate-100 mx-2"></div>
             <div className="flex -space-x-2">
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
           <div className="cursor-pointer p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-100 transition-all">
              <div className="flex justify-between items-start">
                 <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                    <CalendarDays size={20} />
                 </div>
                 <span className="text-2xl font-black text-slate-700">{upcomingCount}</span>
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
               return (
                  <div key={t._id} className="group bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between hover:border-teal-200 hover:shadow-lg hover:shadow-teal-900/5 transition-all animate-fade-in">
                     <div className="flex items-center space-x-5">
                        <div className="relative">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-transform group-hover:scale-105 ${
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
                        </div>

                        <div>
                           <div className="flex items-center space-x-3 mb-1">
                              <h3 className="text-sm font-black text-slate-800 tracking-tight">{t.title}</h3>
                              {isOverdue && <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[9px] font-black uppercase rounded">Overdue</span>}
                              {t.status === 'COMPLETED' && <span className="px-1.5 py-0.5 bg-teal-100 text-teal-600 text-[9px] font-black uppercase rounded">Completed</span>}
                           </div>
                           <div className="flex items-center space-x-4">
                              <div className="flex items-center text-[11px] font-bold text-slate-400">
                                 <User size={12} className="mr-1.5 opacity-60" />
                                 {t.contactName}
                              </div>
                              <div className={`flex items-center text-[11px] font-bold ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                                 <Calendar size={12} className="mr-1.5 opacity-60" />
                                 {new Date(t.dueDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                              </div>
                           </div>
                        </div>
                     </div>

                      <div className="flex items-center space-x-2 relative">
                        {t.status === 'PENDING' && (
                           <>
                              <button 
                                onClick={() => completeTask(t.contactId, t._id)}
                                className="h-9 px-4 bg-teal-600 text-white text-xs font-black rounded-xl hover:bg-teal-700 transition-all flex items-center shadow-md shadow-teal-600/10 active:scale-95"
                              >
                                <Check size={14} className="mr-2" /> Done
                              </button>
                              <button 
                                onClick={() => rescheduleToToday(t.contactId, t._id)}
                                className="h-9 w-9 bg-slate-50 text-slate-400 rounded-xl hover:bg-white hover:text-blue-600 hover:border-blue-100 border border-transparent transition-all flex items-center justify-center active:scale-95"
                                title="Set to Today"
                              >
                                <Clock size={16} />
                              </button>
                           </>
                        )}
                        <button 
                          onClick={() => navigate('/inbox', { state: { selectedContact: t.phone } })}
                          className="h-9 px-4 bg-slate-50 text-slate-600 text-xs font-black rounded-xl hover:bg-white hover:text-slate-800 hover:border-slate-200 border border-transparent transition-all flex items-center active:scale-95"
                        >
                          Chat <ArrowUpRight size={14} className="ml-2 opacity-60" />
                        </button>
                        
                        <div className="relative">
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
                              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-pop-in">
                                 {t.status === 'PENDING' && (
                                    <>
                                       <button 
                                          onClick={() => { completeTask(t.contactId, t._id); setActiveDropdown(null); }}
                                          className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center"
                                       >
                                          <Check size={14} className="mr-3 text-teal-500" /> Mark as Done
                                       </button>
                                       <button 
                                          onClick={() => { rescheduleToToday(t.contactId, t._id); setActiveDropdown(null); }}
                                          className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center"
                                       >
                                          <Clock size={14} className="mr-3 text-blue-500" /> Reschedule for Today
                                       </button>
                                    </>
                                 )}
                                 <button 
                                    onClick={() => navigate('/inbox', { state: { selectedContact: t.phone } })}
                                    className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center"
                                 >
                                    <ArrowUpRight size={14} className="mr-3 text-slate-400" /> Go to Chat
                                 </button>
                                 <div className="h-[1px] bg-slate-50 my-1"></div>
                                 <button 
                                    onClick={() => deleteTask(t.contactId, t._id)}
                                    className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center"
                                 >
                                    <AlertCircle size={14} className="mr-3 text-rose-500" /> Delete Task
                                 </button>
                              </div>
                           )}
                        </div>
                     </div>
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

      {/* Professional Footer Bar */}
      <div className="px-8 py-3 bg-white border-t border-slate-200 flex justify-between items-center">
         <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Online · {new Date().toLocaleDateString()}</span>
         </div>
         <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">WapiPulse Task Engine v2.0</p>
      </div>

    </div>
  );
}

