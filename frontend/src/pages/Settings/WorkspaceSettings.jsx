import React, { useState, useEffect } from 'react';
import { Save, Building2, Globe, Clock, Briefcase, Link as LinkIcon } from 'lucide-react';
import API_URL from '../../apiConfig';

export default function WorkspaceSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    name: '',
    timezone: 'UTC',
    language: 'en',
    industry: 'Other',
    customDomain: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`${API_URL}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.workspace) {
          setSettings(data.workspace);
        }
      }
    } catch (err) {
      console.error('Failed to fetch workspace settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`${API_URL}/api/settings/workspace`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'x-tenant-id': tenantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        // Show success toast or indicator here
      }
    } catch (err) {
      console.error('Failed to save', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-gray-200 rounded w-3/4"></div><div className="space-y-2"><div className="h-4 bg-gray-200 rounded"></div></div></div></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <Building2 className="mr-2 text-teal-600" size={20} />
          Workspace Configuration
        </h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Workspace Name</label>
            <input 
              type="text" 
              value={settings.name || ''}
              onChange={(e) => setSettings({...settings, name: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-gray-400" /> Timezone
              </label>
              <select 
                value={settings.timezone || 'UTC'}
                onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                <option value="UTC">UTC (Universal Time)</option>
                <option value="Asia/Kolkata">IST (Asia/Kolkata)</option>
                <option value="America/New_York">EST (America/New_York)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center">
                <Globe className="w-4 h-4 mr-1.5 text-gray-400" /> Default Language
              </label>
              <select 
                value={settings.language || 'en'}
                onChange={(e) => setSettings({...settings, language: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                <option value="en">English (US)</option>
                <option value="es">Spanish</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center">
                <Briefcase className="w-4 h-4 mr-1.5 text-gray-400" /> Industry/Vertical
              </label>
              <select 
                value={settings.industry || 'Other'}
                onChange={(e) => setSettings({...settings, industry: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                <option value="Real Estate">Real Estate</option>
                <option value="Education">Education</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Other">Other / General</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Changes default templates and pipelines.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center">
                <LinkIcon className="w-4 h-4 mr-1.5 text-gray-400" /> Custom Domain (White Label)
              </label>
              <input 
                type="text" 
                placeholder="e.g. crm.yourcompany.com"
                value={settings.customDomain || ''}
                onChange={(e) => setSettings({...settings, customDomain: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-gray-100 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-5 py-2.5 bg-[var(--theme-bg)] text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition shadow-sm disabled:opacity-50"
          >
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span> : <Save size={16} className="mr-2" />}
            Save Workspace Settings
          </button>
        </div>
      </div>
    </div>
  );
}
