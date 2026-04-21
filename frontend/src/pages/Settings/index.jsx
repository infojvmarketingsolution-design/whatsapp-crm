import React, { useState } from 'react';
import { 
  Building2, 
  MessageCircle, 
  Users, 
  UserCog, 
  CreditCard, 
  Link as LinkIcon, 
  Bot, 
  ShieldCheck, 
  Bell, 
  Palette, 
  Search,
  CheckCircle2,
  AlertCircle,
  History
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

// ... Placeholder component ...

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

  // ... [allowedMenuItems, filteredItems, activeCategory logic] ...

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
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Settings Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex-shrink-0">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your workspace configuration and preferences</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-gray-50 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Settings Layout */}
      <div className="flex-1 overflow-hidden flex max-w-7xl mx-auto w-full">
        {/* Sidebar Nav */}
        <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto custom-scrollbar flex-shrink-0 relative z-10">
          <nav className="p-4 space-y-1">
            {filteredItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No settings found matching "{searchQuery}"
              </div>
            ) : (
              filteredItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-start space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                      isActive 
                        ? 'bg-teal-50 text-teal-900 shadow-sm border border-teal-100/50' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                    }`}
                  >
                    <item.icon 
                      size={20} 
                      className={`mt-0.5 flex-shrink-0 ${isActive ? 'text-teal-600' : 'text-gray-400'}`} 
                    />
                    <div>
                      <div className={`text-sm font-semibold ${isActive ? 'text-teal-900' : 'text-gray-700'}`}>
                        {item.name}
                      </div>
                      <div className={`text-xs mt-0.5 line-clamp-1 ${isActive ? 'text-teal-600/80' : 'text-gray-400'}`}>
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
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          <div className="max-w-4xl mx-auto">
             {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
