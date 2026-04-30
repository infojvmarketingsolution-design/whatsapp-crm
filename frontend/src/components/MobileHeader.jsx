import React from 'react';
import { UserCircle } from 'lucide-react';

export default function MobileHeader() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.name || 'Agent';

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-100 px-6 flex items-center justify-between z-[50] shadow-sm safe-top h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)]">
      <div className="flex flex-col">
        <span className="text-sm font-black text-slate-800 tracking-tight uppercase leading-none">WapiPulse</span>
        <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest mt-1">Enterprise CRM</span>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-800 leading-none">{userName}</p>
          <div className="flex items-center justify-end space-x-1 mt-0.5">
            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Online</span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
          <UserCircle size={20} />
        </div>
      </div>
    </header>
  );
}
