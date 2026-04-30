import React from 'react';
import { X, Bell, MessageSquare, CheckSquare, PlusCircle, AlertCircle, Trash2 } from 'lucide-react';

export default function NotificationCenter({ isOpen, onClose }) {
  const [notifications, setNotifications] = React.useState([
    { id: 1, type: 'CHAT', title: 'New Message', desc: 'John Doe sent you a message', time: 'Just now', icon: MessageSquare, color: 'text-teal-600 bg-teal-50' },
    { id: 2, type: 'TASK', title: 'Task Assigned', desc: 'Review the new lead from Instagram', time: '5 mins ago', icon: CheckSquare, color: 'text-blue-600 bg-blue-50' },
    { id: 3, type: 'SYSTEM', title: 'Template Approved', desc: 'Your "Welcome" template is ready', time: '1 hour ago', icon: PlusCircle, color: 'text-emerald-600 bg-emerald-50' },
    { id: 4, type: 'ALERT', title: 'Critical Overdue', desc: 'Lead "Sarah Smith" is overdue for 24h', time: '3 hours ago', icon: AlertCircle, color: 'text-rose-600 bg-rose-50' },
  ]);

  const clearAll = () => setNotifications([]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`
        fixed top-0 right-0 bottom-0 w-80 bg-white z-[210] shadow-2xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        flex flex-col
      `}>
        {/* Header */}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
               <Bell size={48} className="text-slate-300" />
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No New Notifications</p>
            </div>
          ) : (
            notifications.map((note) => (
              <div key={note.id} className="group p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all cursor-pointer relative overflow-hidden">
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
                {/* Visual Accent */}
                <div className={`absolute top-0 left-0 bottom-0 w-1 ${note.color.split(' ')[0].replace('text-', 'bg-')}`}></div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
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
