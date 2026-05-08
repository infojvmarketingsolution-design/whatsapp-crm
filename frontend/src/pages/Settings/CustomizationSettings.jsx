import React, { useState, useEffect, useRef } from 'react';
import { Save, Palette, Monitor, Upload, X as CloseIcon, Image as ImageIcon, PlusCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CustomizationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [settings, setSettings] = useState({
    themeColor: '#10b981',
    customLogin: false,
    logoUrl: null
  });

  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#f97316', '#14b8a6', '#0f172a'];

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
        if (data.customization) {
          setSettings({
            themeColor: data.customization.themeColor || '#10b981',
            customLogin: !!data.customization.customLogin,
            logoUrl: data.customization.logoUrl || null
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be smaller than 2MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/settings/upload-branding', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setSettings({ ...settings, logoUrl: data.url });
        toast.success('Logo uploaded! Click Save to apply.');
      } else {
        toast.error('Upload failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Upload error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/settings/customization`, {
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
         toast.success('Branding settings saved!');
         window.dispatchEvent(new CustomEvent('brandingUpdated', { detail: { customization: settings } }));
         setTimeout(() => setSuccess(false), 2000);
      } else {
         toast.error('Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save', err);
      toast.error('Connection error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-40 bg-gray-200 rounded-xl"></div></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] border border-gray-200 shadow-premium p-8">
        <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center">
          <Palette className="mr-3 text-blue-600" size={24} />
          Visual Branding
        </h2>

        <div className="space-y-10">
          {/* Logo Section */}
          <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
             <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Workspace Logo</label>
             <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                   <div className="w-24 h-24 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-blue-400 transition-all">
                      {settings.logoUrl ? (
                         <img src={settings.logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                      ) : (
                         <ImageIcon size={32} className="text-slate-300" />
                      )}
                   </div>
                   {settings.logoUrl && (
                      <button 
                        onClick={() => setSettings({...settings, logoUrl: null})}
                        className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-all"
                      >
                         <CloseIcon size={14} />
                      </button>
                   )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                   <p className="text-xs font-bold text-slate-500 mb-4 leading-relaxed">
                      Upload your company logo to display in the sidebar.<br/>
                      Recommended: PNG or SVG with transparent background.
                   </p>
                   <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleLogoUpload} 
                      accept="image/*" 
                      className="hidden" 
                   />
                   <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 hover:border-blue-300 transition-all shadow-sm flex items-center justify-center"
                   >
                      {uploading ? (
                         <span className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin mr-2"></span>
                      ) : (
                         <Upload size={14} className="mr-2 text-blue-500" />
                      )}
                      {uploading ? 'Uploading...' : (settings.logoUrl ? 'Change Logo' : 'Select Logo')}
                   </button>
                </div>
             </div>
          </div>

          {/* Color Section */}
          <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
            <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Primary Brand Color</label>
            <div className="flex flex-wrap items-center gap-4">
               {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => {
                        setSettings({...settings, themeColor: color});
                        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { color } }));
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${settings.themeColor === color ? 'ring-4 ring-offset-2 scale-110 shadow-lg' : 'hover:scale-110 shadow-sm border border-black/10'}`}
                    style={{ 
                      backgroundColor: color,
                      ringColor: color,
                      borderColor: settings.themeColor === color ? color : 'transparent'
                    }}
                  >
                     {settings.themeColor === color && <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm animate-pop-in"></div>}
                  </button>
               ))}
               
               {/* Custom Color Picker */}
               <div className="relative group">
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 border-dashed border-slate-300 hover:border-blue-400 hover:scale-110 shadow-sm cursor-pointer overflow-hidden ${!colors.includes(settings.themeColor) ? 'ring-4 ring-offset-2 border-transparent' : ''}`}
                    style={{ 
                      backgroundColor: !colors.includes(settings.themeColor) ? settings.themeColor : 'white',
                      ringColor: settings.themeColor
                    }}
                    onClick={() => document.getElementById('customColorPicker').click()}
                  >
                     {colors.includes(settings.themeColor) ? (
                        <div className="flex flex-col items-center justify-center text-[8px] font-black text-slate-400 uppercase leading-none">
                           <span>Custom</span>
                           <PlusCircle size={10} className="mt-0.5" />
                        </div>
                     ) : (
                        <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm"></div>
                     )}
                  </div>
                  <input 
                    id="customColorPicker"
                    type="color" 
                    value={settings.themeColor} 
                    onChange={(e) => {
                       const color = e.target.value;
                       setSettings({...settings, themeColor: color});
                       window.dispatchEvent(new CustomEvent('themeChanged', { detail: { color } }));
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
               </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-6 font-bold uppercase tracking-widest">Select a palette color or choose a custom brand color.</p>
          </div>
          
          {/* Custom Login Section */}
          <div className="pt-6 border-t border-slate-100">
             <div className="flex items-center justify-between p-6 bg-slate-900 rounded-[2rem] shadow-premium">
                <div className="flex items-start pr-4">
                  <div className="mt-1 mr-4 p-3 bg-white/10 rounded-2xl text-blue-400 border border-white/5">
                     <Monitor size={20} />
                  </div>
                  <div>
                    <div className="text-base font-black text-white uppercase tracking-tight">White-label Login Page</div>
                    <div className="text-xs text-slate-400 mt-1 leading-relaxed font-medium">Hide WapiPulse branding and show your workspace logo on the login screen.</div>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setSettings({...settings, customLogin: !settings.customLogin})}
                  className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${settings.customLogin ? 'bg-blue-500' : 'bg-slate-700'}`}
                >
                  <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${settings.customLogin ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving || success}
            className={`flex items-center px-8 py-4 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-premium disabled:opacity-50 ${success ? 'bg-emerald-500' : 'hover:scale-105 active:scale-95'}`}
            style={{ 
              backgroundColor: success ? undefined : (settings.themeColor === '#10b981' ? '#075E54' : settings.themeColor)
            }}
          >
            {saving ? (
               <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
            ) : success ? (
               <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            ) : (
               <Save size={18} className="mr-2" />
            )}
            {success ? 'Applied Successfully!' : 'Save Branding Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
