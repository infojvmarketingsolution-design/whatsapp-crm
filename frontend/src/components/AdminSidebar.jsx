import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings, 
  LogOut,
  Building2,
  History,
  X
} from 'lucide-react';

const AdminSidebar = ({ onLogout, isMobileOpen, onClose, isMobile }) => {
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: <Building2 size={20} />, label: 'Clients', path: '/admin/clients' },
    { icon: <History size={20} />, label: 'Access Logs', path: '/admin/user-sessions' },
    { icon: <CreditCard size={20} />, label: 'Plans', path: '/admin/plans' },
    { icon: <BarChart3 size={20} />, label: 'Analytics', path: '/admin/analytics' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <div className={`
        ${isMobile ? 'fixed' : 'lg:relative fixed'} inset-y-0 left-0 z-[60]
        w-72 lg:w-64
        transform transition-transform duration-300 ease-in-out
        ${isMobile ? (isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full') : 'translate-x-0'}
        flex flex-col h-screen bg-slate-900 text-white border-r border-slate-800 shrink-0
      `}>
        <div className="p-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Super Admin Panel
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              SaaS Control Center
            </p>
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-slate-800 rounded-md text-slate-400"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout Admin</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
