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
  Shield,
  Menu
} from 'lucide-react';

export default function Sidebar({ whatsappConfig, roleAccess }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = React.useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user.role || localStorage.getItem('role') || 'AGENT').toUpperCase().replace(' ', '_');
  const [isAvailable, setIsAvailable] = React.useState(localStorage.getItem('isAvailable') !== 'false');

  const toggleAvailability = async () => {
    const newValue = !isAvailable;
    setIsAvailable(newValue);
    localStorage.setItem('isAvailable', newValue);
    try {
      await fetch('/api/auth/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isAvailable: newValue })
      });
    } catch (error) {
      console.error('Failed to update availability', error);
    }
  };


  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const allMenuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'tasks', name: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { id: 'pipeline', name: 'Pipeline', icon: KanbanSquare, path: '/pipeline' },
    { id: 'chat', name: 'Chat', icon: MessageSquare, path: '/inbox' },
    { id: 'contacts', name: 'Contacts', icon: Users, path: '/contacts' },
    { id: 'team-performance', name: 'Team Performance', icon: Shield, path: '/team-performance' },
    { id: 'campaigns', name: 'Campaigns', icon: Megaphone, path: '/campaigns' },
    { id: 'ai-chatbot', name: 'AI Chatbot', icon: Bot, path: '/ai-chatbot' },
    { id: 'flows', name: 'Flows', icon: Bot, path: '/flows' },
    { id: 'templates', name: 'Templates', icon: FileText, path: '/templates' },
    { id: 'agents', name: 'Agents', icon: UserPlus, path: '/agents' },
    { id: 'web-widgets', name: 'Web Widget', icon: Globe, path: '/widget' },
    { id: 'api', name: 'API', icon: Code, path: '/api' },
    { id: 'settings', name: 'Settings', icon: Settings, path: '/settings' },
  ];

  const menuItems = allMenuItems.filter(item => {
    // FORCE: Always show Team Performance to Business Head
    if (userRole === 'BUSINESS_HEAD' && item.id === 'team-performance') return true;

    // Check granular permissions from settings
    if (roleAccess && roleAccess[userRole]) {
       const roleData = roleAccess[userRole];
       if (roleData.allAccess) return true;
       if (roleData.permissions) {
          return roleData.permissions.includes(item.id);
       }
       return false;
    }

    // Fallback if settings not yet loaded or role not found
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'BUSINESS_HEAD') return true;
    return false;
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
        
        <div className={`px-6 py-4 border-b border-teal-800/30 bg-teal-900/10 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
             <div className="flex flex-col">
                <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider">Status</span>
                <span className="text-[9px] text-teal-400/80">{isAvailable ? 'Receiving Leads' : 'Auto-Assign Paused'}</span>
             </div>
          )}
          <button 
             onClick={toggleAvailability}
             title={isAvailable ? "Active (Receiving Leads)" : "Non-Active (Auto-Assign Paused)"}
             className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none transition-colors ${isAvailable ? 'bg-green-500' : 'bg-slate-500'}`}
          >
             <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAvailable ? 'translate-x-1.5' : '-translate-x-1.5'}`} />
          </button>
        </div>

        <button onClick={handleLogout} className={`flex w-full items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-7 py-5 text-sm text-teal-200 hover:text-white hover:bg-teal-800/80 transition-colors`}>
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
// FORCE REBUILD 2026-03-29 01:27
