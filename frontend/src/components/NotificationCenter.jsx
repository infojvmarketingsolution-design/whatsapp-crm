import React, { useEffect, useState } from 'react';
import { X, Bell, MessageSquare, CheckSquare, PlusCircle, AlertCircle, Trash2, Smartphone, Clock, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

export default function NotificationCenter({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenantId');
        if (!token) return;

        // 1. Fetch Task Stats
        const taskRes = await fetch('/api/chat/stats/pending-tasks', {
          headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
        });
        
        // 2. Fetch API Config
        const configRes = await fetch('/api/whatsapp/config', {
          headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
        });

        let newNotes = [];

        if (taskRes.ok) {
          const taskData = await taskRes.json();
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          const allTasks = [...(taskData.telecallerTasks || []), ...(taskData.counsellorTasks || [])];
          
          const pending = allTasks.filter(t => t.status === 'PENDING').length;
          const overdue = allTasks.filter(t => t.status === 'PENDING' && new Date(t.dueDate) < now).length;
          const dueToday = allTasks.filter(t => {
            const d = new Date(t.dueDate);
            return t.status === 'PENDING' && d >= today && d < new Date(today.getTime() + 86400000);
          }).length;

          if (overdue > 0) {
            newNotes.push({
              id: 'overdue',
              type: 'ALERT',
              title: 'Critical Overdue',
              desc: `You have ${overdue} tasks that require immediate attention!`,
              time: 'Priority',
              icon: ShieldAlert,
              color: 'text-rose-600 bg-rose-50'
            });
          }

          if (dueToday > 0) {
            newNotes.push({
              id: 'due-today',
              type: 'TASK',
              title: 'Due Today',
              desc: `${dueToday} tasks are scheduled for completion today.`,
              time: 'Action Required',
              icon: Clock,
              color: 'text-orange-600 bg-orange-50'
            });
          }

          if (pending > 0 && overdue === 0 && dueToday === 0) {
            newNotes.push({
              id: 'pending',
              type: 'TASK',
              title: 'Pending Tasks',
              desc: `Total ${pending} tasks are waiting in your queue.`,
              time: 'Upcoming',
              icon: CheckSquare,
              color: 'text-blue-600 bg-blue-50'
            });
          }
        }

        if (configRes.ok) {
          const config = await configRes.json();
          if (!config.accessToken || config.accessToken === 'DUMMY') {
            newNotes.push({
              id: 'api-status',
              type: 'SYSTEM',
              title: 'API Disconnected',
              desc: 'Your WhatsApp Business API is not configured or disconnected.',
              time: 'System',
              icon: Smartphone,
              color: 'text-rose-600 bg-rose-50'
            });
          }
        }

        setNotifications(newNotes);
      } catch (err) {
        console.error('Failed to load notifications', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) fetchNotifications();

    const tenantId = localStorage.getItem('tenantId');
    const socket = io('', { query: { tenantId } });

    socket.on('new_message', (data) => {
      if (data.content === 'New Lead Established' || data.type === 'new_lead') {
        const newLeadNote = {
          id: `new-lead-${Date.now()}`,
          type: 'CHAT',
          title: 'New Lead Assigned',
          desc: `A new lead "${data.contact?.name || 'Unknown'}" has entered the pipeline.`,
          time: 'Just now',
          icon: MessageSquare,
          color: 'text-emerald-600 bg-emerald-50'
        };
        setNotifications(prev => [newLeadNote, ...prev]);
      }
    });

    socket.on('handoff_request', (data) => {
      const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
      const loggedInUserId = loggedInUser._id || loggedInUser.id;
      const assignedAgentId = data.contact?.assignedAgent;
      const assignedCounsellorId = data.contact?.assignedCounsellor;
      
      const isAssigned = (assignedAgentId && String(assignedAgentId) === String(loggedInUserId)) ||
                         (assignedCounsellorId && String(assignedCounsellorId) === String(loggedInUserId));
      
      const isUnassigned = !assignedAgentId && !assignedCounsellorId;
      
      if (isAssigned || isUnassigned) {
        const handoffNote = {
          id: `handoff-${Date.now()}`,
          type: 'CHAT',
          title: 'Handoff Requested 🙋‍♂️',
          desc: `A new lead "${data.contact?.name || data.contact?.phone || 'Unknown'}" is waiting for your response.`,
          time: 'Just now',
          icon: MessageSquare,
          color: 'text-amber-600 bg-amber-50'
        };
        setNotifications(prev => [handoffNote, ...prev]);
      }
    });

    return () => socket.disconnect();
  }, [isOpen]);

  const handleNoteClick = (note) => {
    if (note.id === 'overdue' || note.id === 'due-today' || note.id === 'pending') {
      navigate('/tasks');
    } else if (note.id === 'api-status') {
      navigate('/settings');
    } else if (note.type === 'CHAT' || note.id.toString().startsWith('new-lead') || note.id.toString().startsWith('handoff')) {
      navigate('/inbox');
    }
    onClose();
  };

  const clearAll = () => setNotifications([]);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] animate-fade-in"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed top-0 right-0 bottom-0 w-80 sm:w-96 bg-white z-[210] shadow-2xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        flex flex-col
      `}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-teal-600 text-white rounded-xl shadow-lg shadow-teal-600/20">
                <Bell size={18} />
             </div>
             <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Notifications</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          {loading ? (
             <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 border-4 border-teal-500/20 border-t-teal-600 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Alerts...</p>
             </div>
          ) : notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
               <Bell size={48} className="text-slate-300" />
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No New Notifications</p>
            </div>
          ) : (
            notifications.map((note) => (
              <div 
                key={note.id} 
                onClick={() => handleNoteClick(note)}
                className="group p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-start space-x-4 relative z-10">
                  <div className={`p-3 rounded-xl ${note.color} shrink-0`}>
                    <note.icon size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xs font-black text-slate-800">{note.title}</h3>
                      <span className="text-[9px] font-bold text-slate-300 uppercase">{note.time}</span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed">{note.desc}</p>
                  </div>
                </div>
                <div className={`absolute top-0 left-0 bottom-0 w-1 ${note.color.split(' ')[0].replace('text-', 'bg-')}`}></div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-6 border-t border-slate-100">
            <button 
              onClick={clearAll}
              className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center space-x-2"
            >
              <Trash2 size={14} />
              <span>Clear All Notifications</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
