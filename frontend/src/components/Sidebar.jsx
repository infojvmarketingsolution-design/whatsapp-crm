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

export default function Sidebar({ whatsappConfig, roleAccess }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = React.useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user.role || localStorage.getItem('role') || 'AGENT').toUpperCase();


  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const allMenuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['ADMIN', 'SUPER_ADMIN', 'MANAGER_COUNSELLOUR', 'TELECALLER', 'AGENT'] },
    { id: 'tasks', name: 'Tasks', icon: CheckSquare, path: '/tasks', roles: ['ADMIN', 'SUPER_ADMIN', 'MANAGER_COUNSELLOUR', 'TELECALLER', 'AGENT'] },
    { id: 'pipeline', name: 'Pipeline', icon: KanbanSquare, path: '/pipeline', roles: ['ADMIN', 'SUPER_ADMIN', 'MANAGER_COUNSELLOUR', 'TELECALLER'] },
    { id: 'chat', name: 'Chat', icon: MessageSquare, path: '/inbox', roles: ['ADMIN', 'SUPER_ADMIN', 'MANAGER_COUNSELLOUR', 'TELECALLER', 'AGENT'] },
    { id: 'contacts', name: 'Contacts', icon: Users, path: '/contacts', roles: ['ADMIN', 'SUPER_ADMIN', 'MANAGER_COUNSELLOUR', 'TELECALLER', 'AGENT'] },
    { id: 'campaigns', name: 'Campaigns', icon: Megaphone, path: '/campaigns', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { id: 'ai-chatbot', name: 'AI Chatbot', icon: Bot, path: '/ai-chatbot', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { id: 'flows', name: 'Flows', icon: Bot, path: '/flows', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { id: 'templates', name: 'Templates', icon: FileText, path: '/templates', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { id: 'agents', name: 'Agents', icon: UserPlus, path: '/agents', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { id: 'web-widgets', name: 'Web Widget', icon: Globe, path: '/widget', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { id: 'api', name: 'API', icon: Code, path: '/api', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { id: 'settings', name: 'Settings', icon: Settings, path: '/settings', roles: ['ADMIN', 'SUPER_ADMIN'] },
  ];

  const menuItems = allMenuItems.filter(item => {
    // 1. Check hardcoded roles first
    const hasBaseRole = item.roles.includes(userRole);
    if (!hasBaseRole) return false;

    // 2. Check granular permissions from settings if available
    if (roleAccess && roleAccess[userRole]) {
       const roleData = roleAccess[userRole];
       if (roleData.allAccess) return true;
       if (roleData.permissions) {
          return roleData.permissions.includes(item.id);
       }
    }

    return true; // Default to showing if no specific restriction found in settings
  });


  return (
    <div className={`${collapsed ? 'w-20' : 'w-64'} shrink-0 bg-[var(--theme-bg)] text-white min-h-screen flex flex-col shadow-lg z-20 transition-all duration-300`}>
      <div className={`p-5 border-b border-teal-800/50 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} relative h-[73px]`}>
        {!collapsed && <span className="text-xl font-bold tracking-wider truncate mr-10">WapiPulse CRM</span>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
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
        {!collapsed && whatsappConfig && (
          <div className="px-6 py-4 border-b border-teal-800/30 bg-teal-900/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">Meta Status</span>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${whatsappConfig.accessToken ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-red-400'}`}></div>
                <span className="text-[10px] font-bold text-white uppercase">{whatsappConfig.accessToken ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            {whatsappConfig.wabaName && (
               <div className="text-[11px] font-bold text-white truncate mb-1">{whatsappConfig.wabaName}</div>
            )}
            <div className="flex flex-col space-y-0.5">
              <div className="flex items-center justify-between text-[9px] text-teal-300/80">
                <span>Phone ID:</span>
                <span className="font-mono text-white">{whatsappConfig.phoneNumberId ? `...${whatsappConfig.phoneNumberId.slice(-4)}` : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-[9px] text-teal-300/80">
                <span>WABA ID:</span>
                <span className="font-mono text-white">{whatsappConfig.wabaId ? `...${whatsappConfig.wabaId.slice(-4)}` : 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
        <button onClick={handleLogout} className={`flex w-full items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-7 py-5 text-sm text-teal-200 hover:text-white hover:bg-teal-800/80 transition-colors`}>
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
// FORCE REBUILD 2026-03-29 01:27
