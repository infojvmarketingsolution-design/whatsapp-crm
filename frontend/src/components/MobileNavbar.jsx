import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  KanbanSquare, 
  CheckSquare, 
  Menu 
} from 'lucide-react';

export default function MobileNavbar({ onMenuClick }) {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Chat', icon: MessageSquare, path: '/inbox' },
    { name: 'Pipeline', icon: KanbanSquare, path: '/pipeline' },
    { name: 'Tasks', icon: CheckSquare, path: '/tasks' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 z-[50] flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.05)] safe-bottom h-[calc(4.5rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) => 
            `flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-300 w-16 ${
              isActive 
                ? 'text-teal-600 bg-teal-50' 
                : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          <item.icon size={20} className="mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">{item.name}</span>
        </NavLink>
      ))}
      <button
        onClick={onMenuClick}
        className="flex flex-col items-center justify-center py-2 px-1 rounded-xl text-slate-400 hover:text-slate-600 transition-all duration-300 w-16"
      >
        <Menu size={20} className="mb-1" />
        <span className="text-[10px] font-bold uppercase tracking-tighter">More</span>
      </button>
    </nav>
  );
}
