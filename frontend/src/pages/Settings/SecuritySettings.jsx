import React, { useState, useEffect } from 'react';
import { Save, ShieldCheck, Database, Download, Trash2, Lock, Smartphone, Shield, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SecuritySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState({
    autoBackup: true,
    gdprConsentTracker: true,
    dataRetention: '365',
    firewallRules: []
  });

  const [newRule, setNewRule] = useState({
    action: 'Accept',
    protocol: 'All',
    port: '',
    source: 'IP',
    sourceDetail: ''
  });

  const [profileData, setProfileData] = useState({
    password: '',
    mpin: ''
  });
  const [profileUpdating, setProfileUpdating] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.security) {
          setSettings(data.security);
        }
      }
    } catch (err) {
      console.error('Failed to fetch security settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/settings/security`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'x-tenant-id': tenantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileData.password && !profileData.mpin) {
      toast.error('Please enter a new password or MPIN');
      return;
    }
    
    setProfileUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(`/api/agents/${user._id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(profileData)
      });
      
      if (res.ok) {
        toast.success('Security credentials updated!');
        setProfileData({ password: '', mpin: '' });
      } else {
        const err = await res.json();
        toast.error(err.message || 'Update failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update credentials');
    } finally {
      setProfileUpdating(false);
    }
  };

  const addRule = () => {
    setSettings({
      ...settings,
      firewallRules: [...(settings.firewallRules || []), newRule]
    });
    setNewRule({
      action: 'Accept',
      protocol: 'All',
      port: '',
      source: 'IP',
      sourceDetail: ''
    });
  };

  const removeRule = (index) => {
    const rules = [...(settings.firewallRules || [])];
    rules.splice(index, 1);
    setSettings({
      ...settings,
      firewallRules: rules
    });
  };

  const Toggle = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-teal-100 transition-colors">
      <div className="pr-4">
        <div className="text-sm font-bold text-gray-800">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</div>
      </div>
      <button 
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${checked ? 'bg-teal-500' : 'bg-gray-300'}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-gray-200 rounded w-3/4"></div><div className="space-y-2"><div className="h-4 bg-gray-200 rounded"></div></div></div></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <ShieldCheck className="mr-2 text-teal-600" size={20} />
          Data & Security
        </h2>

        <div className="space-y-4">
          <Toggle 
            label="Automatic Daily Backups" 
            description="Securely backup contacts, chats, and templates to cold storage every 24 hours."
            checked={settings.autoBackup}
            onChange={(val) => setSettings({...settings, autoBackup: val})}
          />
          
          <Toggle 
            label="GDPR Consent Tracker" 
            description="Automatically log opt-in timestamps for European numbers before sending campaigns."
            checked={settings.gdprConsentTracker}
            onChange={(val) => setSettings({...settings, gdprConsentTracker: val})}
          />
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6">
          <h3 className="text-md font-bold text-gray-900 mb-4">Firewall Rules</h3>
          
          <div className="bg-gray-50 p-4 border border-gray-100 rounded-xl mb-6">
            <h4 className="text-sm font-bold text-gray-800 mb-4">Add firewall rule</h4>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-bold text-gray-700 mb-1">Action</label>
                <select 
                  value={newRule.action} 
                  onChange={e => setNewRule({...newRule, action: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                >
                  <option value="Accept">Accept</option>
                  <option value="Drop">Drop</option>
                  <option value="Reject">Reject</option>
                </select>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-bold text-gray-700 mb-1">Protocol</label>
                <select 
                  value={newRule.protocol} 
                  onChange={e => setNewRule({...newRule, protocol: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                >
                  <option value="All">Select protocol</option>
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                  <option value="ICMP">ICMP</option>
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold text-gray-700 mb-1">Port (or range)</label>
                <input 
                  type="text" 
                  placeholder="Input port or r..."
                  value={newRule.port} 
                  onChange={e => setNewRule({...newRule, port: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-bold text-gray-700 mb-1">Source</label>
                <select 
                  value={newRule.source} 
                  onChange={e => setNewRule({...newRule, source: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                >
                  <option value="IP">Select source</option>
                  <option value="Subnet">Subnet</option>
                  <option value="Any">Any</option>
                </select>
              </div>
              <div className="flex-[1.5] min-w-[150px]">
                <label className="block text-xs font-bold text-gray-700 mb-1">Source detail</label>
                <input 
                  type="text" 
                  placeholder="Input source detail"
                  value={newRule.sourceDetail} 
                  onChange={e => setNewRule({...newRule, sourceDetail: e.target.value})}
                  className="w-full bg-gray-100 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50"
                  disabled={newRule.source === 'Any'}
                />
              </div>
              <div>
                <button 
                  onClick={addRule}
                  className="bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors h-[38px] flex items-center justify-center whitespace-nowrap"
                >
                  Add rule
                </button>
              </div>
            </div>
          </div>

          {settings.firewallRules && settings.firewallRules.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protocol</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Port</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {settings.firewallRules.map((rule, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rule.action === 'Accept' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {rule.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.protocol === 'All' ? 'Any Protocol' : rule.protocol}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.port || 'Any'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.source === 'IP' ? 'Select source' : rule.source}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.source === 'Any' ? '0.0.0.0/0' : rule.sourceDetail}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => removeRule(idx)} className="text-red-600 hover:text-red-900">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-gray-100 pt-6">
           <div className="bg-gray-50 p-4 border border-gray-100 rounded-xl">
             <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center">
                <Database className="w-4 h-4 mr-1.5 text-gray-400" /> Data Retention Policy
             </label>
             <p className="text-xs text-gray-500 mb-3">Time before old chat logs are automatically permanently deleted.</p>
             <select 
               value={settings.dataRetention}
               onChange={(e) => setSettings({...settings, dataRetention: e.target.value})}
               className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
             >
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="365">1 Year</option>
                <option value="forever">Keep Forever</option>
             </select>
           </div>
           
           <div className="bg-gray-50 p-4 border border-gray-100 rounded-xl flex flex-col justify-center items-start">
              <label className="block text-sm font-bold text-gray-700 mb-1">Export Workspace Data</label>
              <p className="text-xs text-gray-500 mb-3">Download a raw JSON snapshot of all CRM data.</p>
              <button 
                className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition shadow-sm w-full justify-center"
              >
                 <Download size={14} className="mr-2" />
                 Generate Export
              </button>
           </div>
        </div>

        <div className="mt-8 pt-5 border-t border-gray-100 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving || success}
            className={`flex items-center px-5 py-2.5 text-white rounded-lg text-sm font-bold transition shadow-sm disabled:opacity-50 ${success ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--theme-bg)] hover:bg-teal-700'}`}
          >
            {saving ? (
               <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
            ) : success ? (
               <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
               <Save size={16} className="mr-2" />
            )}
            {success ? 'Saved Successfully!' : 'Save Security Rules'}
          </button>
        </div>
      </div>

      {/* Personal Account Security Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center">
          <Lock className="mr-2 text-blue-600" size={20} />
          Personal Account Security
        </h2>
        <p className="text-xs text-gray-500 mb-6">Manage your private Master PIN and login credentials.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
             <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center">
               <Shield className="w-3 h-3 mr-1.5 text-blue-500" /> New 6-Digit Master PIN (MPIN)
             </label>
             <input 
               type="password" 
               maxLength={6}
               placeholder="••••••"
               value={profileData.mpin}
               onChange={e => setProfileData({...profileData, mpin: e.target.value.replace(/\D/g, '')})}
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
             />
             <p className="text-[10px] text-slate-400 font-medium italic">Used for fast & secure WhatsApp authentication.</p>
           </div>

           <div className="space-y-2">
             <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center">
               <Lock className="w-3 h-3 mr-1.5 text-teal-500" /> New Account Password
             </label>
             <input 
               type="password" 
               placeholder="Leave blank to keep current"
               value={profileData.password}
               onChange={e => setProfileData({...profileData, password: e.target.value})}
               className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
             />
             <p className="text-[10px] text-slate-400 font-medium italic">Update your primary dashboard password.</p>
           </div>
        </div>

        <div className="mt-8 pt-5 border-t border-gray-100 flex justify-end">
          <button 
            onClick={handleUpdateProfile}
            disabled={profileUpdating}
            className="flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {profileUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
            Update Credentials
          </button>
        </div>
      </div>
    </div>
  );
}
