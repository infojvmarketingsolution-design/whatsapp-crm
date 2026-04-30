import React from 'react';
import { UserCircle, Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MobileHeader({ onOpenNotifications, onOpenSearch }) {
  const navigate = useNavigate();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-100 px-6 flex items-center justify-between z-[50] shadow-sm safe-top h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)]">
      <div className="flex flex-col" onClick={() => navigate('/dashboard')}>
        <span className="text-sm font-black text-slate-800 tracking-tight uppercase leading-none">WapiPulse</span>
        <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest mt-1">Enterprise CRM</span>
      </div>
      
      <div className="flex items-center space-x-3">
        <button 
          onClick={onOpenSearch}
          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Search size={20} />
        </button>
        <button 
          onClick={onOpenNotifications}
          className="p-2 text-slate-400 hover:text-slate-600 relative transition-colors"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
        <div 
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 cursor-pointer hover:bg-teal-50 hover:text-teal-600 transition-all"
        >
          <UserCircle size={20} />
        </div>
      </div>
    </header>
  );
}
