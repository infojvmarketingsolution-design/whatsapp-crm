import React, { useState, useEffect } from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

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

        const res = await fetch('/api/chat/contacts', { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId } });
        
        // Handle explicit backend suspension (User.status === 'SUSPENDED')
        if (res.status === 403) {
            setCriticalSuspendAt(Date.now()); // Trigger lockout immediately
            return;
        }

        if(res.ok) {
           const contacts = await res.json();
           const tasks = [];
           contacts.forEach(c => {
             if (c.tasks && c.tasks.length > 0) {
               c.tasks.forEach(t => tasks.push(t));
             }
           });

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
              setCriticalSuspendAt(null); // Access restored!
           }
        }
      } catch(e) {
         console.error("Suspension check failed:", e);
      }
    };

    checkCriticalOverdue();
    const intervalId = setInterval(checkCriticalOverdue, 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  if(!criticalSuspendAt) return null;

  const now = Date.now();
  const isSuspended = criticalSuspendAt <= now;

  return (
    <>
      <div className="fixed top-6 right-6 z-[9999] bg-rose-600 border border-rose-400 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center shadow-rose-500/30 animate-pop-in cursor-default transition-all hover:scale-105">
         <AlertCircle className="animate-pulse mr-4" size={28} />
         <div>
           <div className="text-[11px] font-black uppercase tracking-widest opacity-80">Account Suspension In</div>
           <div className="text-2xl font-black font-mono tracking-widest leading-none mt-1">
              <CountdownTimer targetDate={criticalSuspendAt} />
           </div>
         </div>
      </div>

      {isSuspended && (
        <div className="fixed inset-0 z-[10000] bg-rose-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
           <div className="bg-white rounded-[40px] max-w-lg w-full p-12 text-center shadow-2xl border-4 border-rose-500/30 animate-pop-in">
              <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                 <ShieldCheck size={48} />
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight uppercase">Access Revoked</h2>
              <p className="text-slate-500 font-bold mb-10 leading-relaxed text-lg italic">
                Your account has been <span className="text-rose-600 underline">automatically suspended</span> because tasks were not completed within the 49-hour grace period.
              </p>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 mb-10 text-left">
                 <div className="flex items-center space-x-3 mb-2">
                    <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Enforcement Details</p>
                 </div>
                 <p className="text-[13px] font-bold text-slate-500 leading-relaxed">
                    Automated SLA enforcement has blocked access to all CRM modules. Please reach out to your **Administrator** to reactivate your workspace.
                 </p>
              </div>
              <button 
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="w-full py-5 bg-rose-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/30 active:scale-95"
              >
                Exit to Login
              </button>
           </div>
        </div>
      )}
    </>
  );
}
