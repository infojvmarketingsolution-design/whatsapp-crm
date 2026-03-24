import React, { useState, useEffect } from 'react';
import API_URL from '../../apiConfig';
import { 
  ShieldCheck, 
  ToggleLeft, 
  ToggleRight, 
  Settings2, 
  Cpu, 
  Globe, 
  Save,
  CheckCircle2,
  RefreshCcw
} from 'lucide-react';

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSettings(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setMessage('Settings updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to update settings', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading platform settings...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Global System Settings</h1>
          <p className="text-slate-500">Configure platform-wide modules and limits</p>
        </div>
        {message && (
          <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-100 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 size={16} />
            <span className="text-sm font-medium">{message}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleUpdate} className="space-y-8 max-w-4xl">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
            <Globe size={20} className="text-slate-500" />
            <h2 className="font-bold text-slate-800 tracking-tight">General Configuration</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Platform Branding Name</label>
              <input 
                value={settings?.platformName || ''}
                onChange={(e) => setSettings({...settings, platformName: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center space-x-4 mt-6">
              <label className="text-sm font-medium text-slate-700">Maintenance Mode</label>
              <button 
                type="button"
                onClick={() => setSettings({...settings, maintenanceMode: !settings.maintenanceMode})}
                className={`transition-colors duration-200 ${settings?.maintenanceMode ? 'text-red-500' : 'text-slate-300'}`}
              >
                {settings?.maintenanceMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
            <ShieldCheck size={20} className="text-slate-500" />
            <h2 className="font-bold text-slate-800 tracking-tight">Active Modules (Global)</h2>
          </div>
          <div className="p-6 grid grid-cols-3 gap-6">
            {settings?.allowedModules && Object.entries(settings.allowedModules).map(([mod, status]) => (
                <div key={mod} className="flex flex-col space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-700 capitalize">{mod}</span>
                        <button 
                            type="button"
                            onClick={() => setSettings({
                                ...settings, 
                                allowedModules: { ...settings.allowedModules, [mod]: !status } 
                            })}
                            className={`transition-colors duration-200 ${status ? 'text-blue-600' : 'text-slate-300'}`}
                        >
                            {status ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        </button>
                    </div>
                </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
            <Cpu size={20} className="text-slate-500" />
            <h2 className="font-bold text-slate-800 tracking-tight">System & API Limits</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-8">
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Limits</h3>
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Messages per day / tenant</label>
                    <input 
                        type="number"
                        value={settings?.apiLimits?.defaultMessagesPerDay || 0}
                        onChange={(e) => setSettings({
                            ...settings, 
                            apiLimits: { ...settings.apiLimits, defaultMessagesPerDay: e.target.value } 
                        })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Meta API Config</h3>
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Graph API Version</label>
                    <input 
                        value={settings?.systemConfigs?.metaApiVersion || ''}
                        onChange={(e) => setSettings({
                            ...settings, 
                            systemConfigs: { ...settings.systemConfigs, metaApiVersion: e.target.value } 
                        })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-70"
          >
            {saving ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />}
            <span>Save Platform Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
