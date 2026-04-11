import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

const CountdownTimer = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState(Math.max(0, targetDate - Date.now()));
    
    useEffect(() => {
        const timer = setInterval(() => {
           setTimeLeft(Math.max(0, targetDate - Date.now()));
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    const h = Math.floor(timeLeft / 1000 / 60 / 60);
    const m = Math.floor((timeLeft / 1000 / 60) % 60);
    const s = Math.floor((timeLeft / 1000) % 60);
    
    if (h > 0) {
      return <span>{h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}</span>;
    }
    return <span>{m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}</span>;
};

export default function GlobalSuspensionTimer() {
  const [criticalSuspendAt, setCriticalSuspendAt] = useState(null);

  useEffect(() => {
    const checkCriticalOverdue = async () => {
      try {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenantId');
        if(!token || !tenantId) return;

        const res = await fetch('/api/chat/tasks', { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId } });
        if(res.ok) {
           const tasks = await res.json();
           const now = new Date();
           const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
           const criticalTasks = tasks.filter(t => t.status === 'PENDING' && new Date(t.dueDate) < fortyEightHoursAgo);
           
           if (criticalTasks.length > 0) {
              const oldestTask = criticalTasks.reduce((oldest, task) => {
                 return new Date(task.dueDate) < new Date(oldest.dueDate) ? task : oldest;
              }, criticalTasks[0]);
              const suspendTime = new Date(oldestTask.dueDate).getTime() + 49 * 60 * 60 * 1000;
              setCriticalSuspendAt(suspendTime);
           } else {
              setCriticalSuspendAt(null);
           }
        }
      } catch(e) {}
    };

    checkCriticalOverdue();
    const intervalId = setInterval(checkCriticalOverdue, 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  if(!criticalSuspendAt) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] bg-rose-600 border border-rose-400 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center shadow-rose-500/30 animate-pop-in cursor-default transition-all hover:scale-105">
       <AlertCircle className="animate-pulse mr-4" size={28} />
       <div>
         <div className="text-[11px] font-black uppercase tracking-widest opacity-80">Account Suspension In</div>
         <div className="text-2xl font-black font-mono tracking-widest leading-none mt-1">
            <CountdownTimer targetDate={criticalSuspendAt} />
         </div>
       </div>
    </div>
  );
}
