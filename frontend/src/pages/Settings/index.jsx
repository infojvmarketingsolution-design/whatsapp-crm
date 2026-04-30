import React, { useState } from 'react';
import { 
  Building2, 
  MessageCircle, 
  Users, 
  UserCog, 
  CreditCard, 
  Link as LinkIcon, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Bell, 
  Palette, 
  Search,
  CheckCircle2,
  AlertCircle,
  History,
  ArrowLeft
} from 'lucide-react';
import WorkspaceSettings from './WorkspaceSettings';
import AutomationSettings from './AutomationSettings';
import CRMSettings from './CRMSettings';
import NotificationSettings from './NotificationSettings';
import CustomizationSettings from './CustomizationSettings';
import IntegrationsSettings from './IntegrationsSettings';
import SecuritySettings from './SecuritySettings';
import BillingSettings from './BillingSettings';
import UserAndRolesSettings from './UserAndRolesSettings';
import AccessLogSettings from './AccessLogSettings';
import ApiSetup from '../ApiSetup';

const PlaceholderSettings = ({ title, icon: Icon, description }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-8 text-center max-w-2xl mx-auto mt-8 shadow-sm">
    <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
      <Icon size={32} />
    </div>
    <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
    <p className="text-gray-500 mb-6">{description}</p>
    <div className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium border border-gray-200">
      <AlertCircle size={16} className="mr-2" />
      This module is being configured
    </div>
  </div>
);

export default function Settings({ roleAccess }) {
  const [activeTab, setActiveTab] = useState('workspace');
  const [searchQuery, setSearchQuery] = useState('');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user.role || 'AGENT').toUpperCase();

  const menuItems = [
    { id: 'workspace', name: 'Workspace', icon: Building2, desc: 'Company details, timezone, language' },
    { id: 'whatsapp', name: 'WhatsApp API', icon: MessageCircle, desc: 'Numbers, webhooks, templates' },
    { id: 'crm', name: 'CRM Settings', icon: Users, desc: 'Pipelines, tags, lead fields' },
    { id: 'users', name: 'User & Roles', icon: UserCog, desc: 'Team members and permissions' },
    { id: 'billing', name: 'Billing & Plan', icon: CreditCard, desc: 'Invoices, upgrade plan' },
    { id: 'integrations', name: 'Integrations', icon: LinkIcon, desc: 'Zapier, Facebook, Shopify' },
    { id: 'automations', name: 'Automations', icon: Bot, desc: 'Bot settings, default loops' },
    { id: 'security', name: 'Data & Security', icon: ShieldCheck, desc: 'Backups, GDPR, exports' },
    { id: 'notifications', name: 'Notifications', icon: Bell, desc: 'Email and WhatsApp alerts' },
    { id: 'customization', name: 'Customization', icon: Palette, desc: 'Branding, colors, login page' },
    { id: 'activity_logs', name: 'Access Logs', icon: History, desc: 'User login activity and sessions' },
  ];

  const allowedMenuItems = menuItems.filter(item => {
    if (roleAccess && roleAccess[userRole]) {
       const roleData = roleAccess[userRole];
       if (roleData.allAccess) return true;
       if (roleData.permissions) {
          return roleData.permissions.includes(item.id);
       }
    }
    return true; // Default show
  });

  const filteredItems = allowedMenuItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCategory = menuItems.find(m => m.id === activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'workspace':
        return <WorkspaceSettings roleAccess={roleAccess} />;
      case 'whatsapp':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-0 overflow-hidden h-full">
            <h2 className="p-6 border-b border-gray-100 text-lg font-bold text-gray-900 bg-gray-50 flex items-center">
              <MessageCircle className="mr-2 text-[var(--theme-text)]" size={20} />
              WhatsApp API Settings
            </h2>
            <div className="p-6">
               <ApiSetup />
            </div>
          </div>
        );
      case 'crm':
        return <CRMSettings roleAccess={roleAccess} />;
      case 'users':
        return <UserAndRolesSettings roleAccess={roleAccess} />;
      case 'billing':
        return <BillingSettings roleAccess={roleAccess} />;
      case 'integrations':
        return <IntegrationsSettings roleAccess={roleAccess} />;
      case 'automations':
        return <AutomationSettings roleAccess={roleAccess} />;
      case 'security':
        return <SecuritySettings roleAccess={roleAccess} />;
      case 'notifications':
        return <NotificationSettings roleAccess={roleAccess} />;
      case 'customization':
        return <CustomizationSettings roleAccess={roleAccess} />;
      case 'activity_logs':
        return <AccessLogSettings />;
      default:
        return <PlaceholderSettings title={activeCategory.name} icon={activeCategory.icon} description={activeCategory.desc} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-5 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center">
               <SettingsIcon className="mr-3 text-blue-600" size={24} /> Settings
            </h1>
            <p className="text-[10px] sm:text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest leading-relaxed">Manage your workspace configuration and preferences</p>
          </div>
          <div className="relative w-full sm:w-64 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all bg-slate-50 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Settings Layout */}
      <div className="flex-1 overflow-hidden flex flex-col sm:flex-row max-w-7xl mx-auto w-full">
        {/* Sidebar Nav - Desktop: Side, Mobile: List (if no active tab on small screens) */}
        <div className={`${activeTab && !window.innerWidth < 640 ? 'hidden sm:block' : 'block'} w-full sm:w-72 bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar flex-shrink-0 relative z-10`}>
          <nav className="p-4 space-y-1">
            {filteredItems.length === 0 ? (
              <div className="px-4 py-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                No results for "{searchQuery}"
              </div>
            ) : (
              filteredItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-start space-x-4 px-5 py-4 rounded-2xl transition-all duration-200 text-left active:scale-95 ${
                      isActive 
                        ? 'bg-blue-50 text-blue-900 shadow-sm border border-blue-100/50' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    <item.icon 
                      size={20} 
                      className={`mt-0.5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} 
                    />
                    <div>
                      <div className={`text-xs font-black uppercase tracking-widest ${isActive ? 'text-blue-900' : 'text-slate-700'}`}>
                        {item.name}
                      </div>
                      <div className={`text-[10px] mt-1 font-bold line-clamp-1 ${isActive ? 'text-blue-600/80' : 'text-slate-400'}`}>
                        {item.desc}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className={`${!activeTab ? 'hidden sm:block' : 'block'} flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar relative bg-white/50`}>
          <div className="max-w-4xl mx-auto pb-20">
             {activeTab && (
               <button 
                 onClick={() => setActiveTab(null)} 
                 className="sm:hidden mb-6 flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
               >
                 <ArrowLeft size={14} className="mr-2" /> Back to Settings
               </button>
             )}
             {activeTab ? renderContent() : (
               <div className="hidden sm:flex flex-col items-center justify-center h-[60vh] text-center opacity-40">
                  <SettingsIcon size={64} className="text-slate-300 mb-4" />
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Select a category to configure</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
