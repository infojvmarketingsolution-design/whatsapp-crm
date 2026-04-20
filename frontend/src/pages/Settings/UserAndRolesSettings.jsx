import React, { useState, useEffect } from 'react';
import { 
  UserCog, UserPlus, MoreVertical, Shield, ShieldCheck, Check, Save, ShieldAlert,
  LayoutDashboard, MessageSquare, Megaphone, Users, FileText, Bot, UserPlus as AgentIcon, 
  Globe, Code, Settings, KanbanSquare, CheckSquare, Building2, MessageCircle, CreditCard, 
  Link as LinkIcon, ShieldCheck as SecurityIcon, Bell, Palette
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UserAndRolesSettings() {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'roles'
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleSettings, setRoleSettings] = useState({});
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [saving, setSaving] = useState(false);

  const roles = [
    { id: 'ADMIN', name: 'Admin', icon: ShieldCheck },
    { id: 'TELECALLER', name: 'Telecaller', icon: Shield },
    { id: 'MANAGER_COUNSELLOUR', name: 'Manager/Counsellour', icon: Shield },
    { id: 'AGENT', name: 'Standard Agent', icon: Shield },
  ];

  const MODULE_PERMISSIONS = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', name: 'Tasks', icon: CheckSquare },
    { id: 'pipeline', name: 'Pipeline', icon: KanbanSquare },
    { id: 'chat', name: 'Chat', icon: MessageSquare },
    { id: 'contacts', name: 'Contacts', icon: Users },
    { id: 'campaigns', name: 'Campaigns', icon: Megaphone },
    { id: 'ai-chatbot', name: 'AI Chatbot', icon: Bot },
    { id: 'flows', name: 'Flows', icon: Bot },
    { id: 'templates', name: 'Templates', icon: FileText },
    { id: 'agents', name: 'Agents', icon: AgentIcon },
    { id: 'web-widgets', name: 'Web Widget', icon: Globe },
    { id: 'api', name: 'API', icon: Code },
    { id: 'settings', name: 'Settings (Parent)', icon: Settings },
  ];

  const SETTING_PERMISSIONS = [
    { id: 'workspace', name: 'Workspace', icon: Building2 },
    { id: 'whatsapp', name: 'WhatsApp API', icon: MessageCircle },
    { id: 'crm', name: 'CRM Settings', icon: Users },
    { id: 'users', name: 'User & Roles', icon: UserCog },
    { id: 'billing', name: 'Billing & Plan', icon: CreditCard },
    { id: 'integrations', name: 'Integrations', icon: LinkIcon },
    { id: 'automations', name: 'Automations', icon: Bot },
    { id: 'security', name: 'Data & Security', icon: SecurityIcon },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'customization', name: 'Customization', icon: Palette },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      
      const [usersRes, settingsRes] = await Promise.all([
        fetch(`/api/agents`, {
          headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
        }),
        fetch(`/api/settings`, {
          headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
        })
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.roleAccess) {
          setRoleSettings(settingsData.roleAccess);
        } else {
          // Fallback handled by Backend default
        }
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoles = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/settings/roleAccess`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'x-tenant-id': tenantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roleSettings)
      });
      if (res.ok) {
        toast.success('Role permissions updated successfully');
      } else {
        toast.error('Failed to save role permissions');
      }
    } catch (err) {
      console.error('Failed to save', err);
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleAllAccess = (roleId) => {
    const isNowAllAccess = !roleSettings[roleId]?.allAccess;
    let newPermissions = roleSettings[roleId]?.permissions || [];
    
    if (isNowAllAccess) {
      // Add all possible keys
      const allKeys = [
        ...MODULE_PERMISSIONS.map(p => p.id),
        ...SETTING_PERMISSIONS.map(p => p.id)
      ];
      newPermissions = Array.from(new Set([...newPermissions, ...allKeys]));
    }

    setRoleSettings(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        allAccess: isNowAllAccess,
        permissions: newPermissions
      }
    }));
  };

  const togglePermission = (roleId, permissionId) => {
    if (roleSettings[roleId]?.allAccess) return; // Cant toggle if allAccess is ON

    setRoleSettings(prev => {
      const currentRoleData = prev[roleId] || { allAccess: false, permissions: [] };
      const currentPermissions = currentRoleData.permissions || [];
      const isPresent = currentPermissions.includes(permissionId);
      
      const newPermissions = isPresent 
        ? currentPermissions.filter(p => p !== permissionId)
        : [...currentPermissions, permissionId];
      
      return {
        ...prev,
        [roleId]: {
          ...currentRoleData,
          permissions: newPermissions
        }
      };
    });
  };

  const isPermissionEnabled = (roleId, permissionId) => {
    if (roleSettings[roleId]?.allAccess) return true;
    return roleSettings[roleId]?.permissions?.includes(permissionId);
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-64 bg-gray-200 rounded-xl"></div></div>;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'users' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Team Members
        </button>
        <button 
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'roles' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Role Permissions
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden">
          {/* Existing Team Members Table... (remains the same) */}
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-bold text-gray-900 flex items-center">
               <UserCog className="mr-2 text-teal-600" size={20} />
               Team Members
             </h2>
             <button className="flex items-center px-4 py-2 bg-[var(--theme-bg)] text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition shadow-sm">
               <UserPlus size={16} className="mr-2" />
               Invite User
             </button>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user._id || user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                       <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'ADMIN' || user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'MANAGER_COUNSELLOUR' || user.role === 'Manager' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                       }`}>
                          {user.role}
                       </span>
                    </td>
                    <td className="px-4 py-3">
                       <span className={`flex items-center text-xs font-bold ${user.status === 'ACTIVE' || user.status === 'Active' ? 'text-green-600' : 'text-gray-500'}`}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${user.status === 'ACTIVE' || user.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}></span> {user.status || 'Active'}
                       </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors inline-block">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Role Access List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 h-fit">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 px-2">Role Access</h3>
            <div className="space-y-2">
              {roles.map(role => (
                <button 
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                    selectedRole === role.id 
                    ? 'bg-purple-50 text-purple-700 border border-purple-100 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <role.icon size={18} className={selectedRole === role.id ? 'text-purple-600' : 'text-gray-400'} />
                  <span>{role.name}</span>
                  {roleSettings[role.id]?.allAccess && (
                    <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Permissions Area */}
          <div className="md:col-span-3 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-50">
                 <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                      <ShieldCheck className="mr-2 text-teal-600" size={24} />
                      {roles.find(r => r.id === selectedRole)?.name} Permissions
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Configure what this designation can access.</p>
                 </div>
                 <button 
                  onClick={handleSaveRoles}
                  disabled={saving}
                  className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-glow disabled:opacity-50"
                 >
                   {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span> : <Save size={18} className="mr-2" />}
                   Save Changes
                 </button>
              </div>

              <div className="space-y-8">
                 {/* All Access Toggle */}
                 <div className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                   roleSettings[selectedRole]?.allAccess 
                   ? 'border-teal-500 bg-teal-50/30' 
                   : 'border-gray-100 bg-gray-50/50'
                 }`}>
                   <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${roleSettings[selectedRole]?.allAccess ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                         <ShieldCheck size={24} />
                      </div>
                      <div>
                         <h3 className="text-base font-bold text-gray-900 mb-0.5">Full Workspace Access</h3>
                         <p className="text-xs text-gray-500 font-medium">Grant all current and future permissions for this designation.</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => toggleAllAccess(selectedRole)}
                     disabled={selectedRole === 'ADMIN'}
                     className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${roleSettings[selectedRole]?.allAccess ? 'bg-teal-500' : 'bg-gray-300'}`}
                   >
                     <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${roleSettings[selectedRole]?.allAccess ? 'translate-x-5' : 'translate-x-0'}`} />
                   </button>
                 </div>

                 {selectedRole === 'ADMIN' && (
                    <div className="flex items-center space-x-3 p-4 bg-purple-50 text-purple-700 rounded-xl border border-purple-100 text-sm font-medium">
                       <ShieldAlert size={18} className="shrink-0" />
                       <p>Administrators always have full access by default.</p>
                    </div>
                 )}

                 {/* Granular Permissions */}
                 <div className="space-y-8 opacity-100 transition-opacity">
                    {/* Main Modules Group */}
                    <div>
                       <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                          <LayoutDashboard size={16} className="mr-2" />
                          Application Modules
                       </h3>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {MODULE_PERMISSIONS.map(p => (
                             <label 
                              key={p.id}
                              className={`flex items-center p-4 rounded-xl border transition-all cursor-pointer ${
                                isPermissionEnabled(selectedRole, p.id)
                                ? 'border-teal-200 bg-teal-50/50 text-teal-900 shadow-sm'
                                : 'border-gray-100 bg-white text-gray-500 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'
                              } ${roleSettings[selectedRole]?.allAccess ? 'cursor-default' : 'hover:border-teal-300'}`}
                             >
                                <input 
                                  type="checkbox"
                                  className="hidden"
                                  checked={isPermissionEnabled(selectedRole, p.id)}
                                  onChange={() => togglePermission(selectedRole, p.id)}
                                  disabled={roleSettings[selectedRole]?.allAccess}
                                />
                                <div className={`p-2 rounded-lg mr-3 ${isPermissionEnabled(selectedRole, p.id) ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                   <p.icon size={18} />
                                </div>
                                <span className="text-sm font-bold">{p.name}</span>
                                {isPermissionEnabled(selectedRole, p.id) && <Check size={16} className="ml-auto text-teal-600" />}
                             </label>
                          ))}
                       </div>
                    </div>

                    {/* Settings Group */}
                    <div>
                       <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                          <Settings size={16} className="mr-2" />
                          Settings Configuration
                       </h3>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {SETTING_PERMISSIONS.map(p => (
                             <label 
                              key={p.id}
                              className={`flex items-center p-4 rounded-xl border transition-all cursor-pointer ${
                                isPermissionEnabled(selectedRole, p.id)
                                ? 'border-blue-200 bg-blue-50/50 text-blue-900 shadow-sm'
                                : 'border-gray-100 bg-white text-gray-500 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'
                              } ${roleSettings[selectedRole]?.allAccess ? 'cursor-default' : 'hover:border-blue-300'}`}
                             >
                                <input 
                                  type="checkbox"
                                  className="hidden"
                                  checked={isPermissionEnabled(selectedRole, p.id)}
                                  onChange={() => togglePermission(selectedRole, p.id)}
                                  disabled={roleSettings[selectedRole]?.allAccess}
                                />
                                <div className={`p-2 rounded-lg mr-3 ${isPermissionEnabled(selectedRole, p.id) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                   <p.icon size={18} />
                                </div>
                                <span className="text-sm font-bold">{p.name}</span>
                                {isPermissionEnabled(selectedRole, p.id) && <Check size={16} className="ml-auto text-blue-600" />}
                             </label>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
