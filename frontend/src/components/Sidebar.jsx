import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Megaphone, 
  Users, 
  FileText, 
  Bot, 
  UserPlus, 
  Globe, 
  Code, 
  Settings,
  LogOut,
  KanbanSquare,
  CheckSquare,
  Menu
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = React.useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { name: 'Pipeline', icon: KanbanSquare, path: '/pipeline' },
    { name: 'Chat', icon: MessageSquare, path: '/inbox' },
    { name: 'Campaigns', icon: Megaphone, path: '/campaigns' },
    { name: 'Flows', icon: Bot, path: '/flows' },
    { name: 'Agents', icon: UserPlus, path: '/agents' },
    { name: 'Web Widget', icon: Globe, path: '/widget' },
    { name: 'Contacts', icon: Users, path: '/contacts' },
    { name: 'Templates', icon: FileText, path: '/templates' },
    { name: 'API', icon: Code, path: '/api' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-64'} shrink-0 bg-[var(--theme-bg)] text-white min-h-screen flex flex-col shadow-2xl lg:shadow-lg
      `}>
        <div className={`p-5 border-b border-teal-800/50 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} relative h-[73px]`}>
          {!collapsed && <span className="text-xl font-bold tracking-wider truncate mr-10">WapiPulse</span>}
          <button 
            onClick={() => {
              if (window.innerWidth < 1024) {
                 onClose();
              } else {
                 setCollapsed(!collapsed);
              }
            }}
            className={`${collapsed ? '' : 'absolute right-5'} text-teal-200 hover:text-white transition-colors cursor-pointer p-1 hover:bg-teal-800/50 rounded-md`}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          {menuItems.map((item, i) => (
             <NavLink 
               key={item.name} 
               to={item.path}
               onClick={() => { if(window.innerWidth < 1024) onClose(); }}
               title={collapsed ? item.name : ''}
               className={({ isActive }) => 
                 `flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-md transition-all duration-200 outline-none ${
                   isActive 
                    ? 'bg-teal-700/50 text-white font-medium shadow-inner border-l-4 border-green-400' 
                    : 'text-teal-50 hover:bg-teal-800/80 hover:text-white border-l-4 border-transparent'
                 }`
               }
             >
               {({ isActive }) => (
                 <div className={`flex items-center ${collapsed ? 'justify-center min-w-[24px]' : 'space-x-3 w-full'}`}>
                   <item.icon size={22} className={`${isActive ? 'text-green-400' : 'text-teal-200'} shrink-0`} />
                   {!collapsed && <span className="text-sm tracking-wide truncate">{item.name}</span>}
                 </div>
               )}
             </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-teal-800/50">
          <button onClick={handleLogout} className={`flex w-full items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-7 py-5 text-sm text-teal-200 hover:text-white hover:bg-teal-800/80 transition-colors`}>
            <LogOut size={20} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}
