import React, { useState } from 'react';
import { Save, Link as LinkIcon, Facebook, ShoppingBag, Webhook } from 'lucide-react';

export default function IntegrationsSettings() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [integrations, setIntegrations] = useState({
    facebook: false,
    shopify: false,
    zapier: true
  });

  const handleSave = async () => {
    setSaving(true);
    setTimeout(() => {
        setSaving(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
    }, 800);
  };

  const IntegrationCard = ({ id, name, description, icon: Icon, connected, colorClass }) => (
    <div className={`p-5 rounded-xl border transition-all ${connected ? 'bg-white border-green-200 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
       <div className="flex justify-between items-start mb-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
             <Icon size={24} />
          </div>
          <button 
            onClick={() => setIntegrations({...integrations, [id]: !connected})}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${connected ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600' : 'bg-[var(--theme-bg)] text-white hover:bg-teal-700 shadow-sm'}`}
          >
            {connected ? 'Disconnect' : 'Connect'}
          </button>
       </div>
       <h3 className="text-sm font-bold text-gray-900">{name}</h3>
       <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
       
       {connected && (
         <div className="mt-4 pt-3 border-t border-green-100 flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">Connected & Syncing</span>
         </div>
       )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <LinkIcon className="mr-2 text-teal-600" size={20} />
          Third-Party Integrations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           <IntegrationCard 
             id="facebook"
             name="Facebook Lead Ads"
             description="Automatically sync leads generated from Facebook and Instagram Lead Forms directly into the CRM."
             icon={Facebook}
             colorClass="bg-blue-50 text-blue-600"
             connected={integrations.facebook}
           />
           <IntegrationCard 
             id="shopify"
             name="Shopify API"
             description="Connect your Shopify store to sync contacts, trigger abandoned cart WhatsApp messages, and track orders."
             icon={ShoppingBag}
             colorClass="bg-[#f3fbf4] text-[#95bf47]"
             connected={integrations.shopify}
           />
           <IntegrationCard 
             id="zapier"
             name="Zapier Webhooks"
             description="Trigger automations with thousands of apps via incoming and outgoing webhooks."
             icon={Webhook}
             colorClass="bg-orange-50 text-orange-600"
             connected={integrations.zapier}
           />
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
            {success ? 'Saved Successfully!' : 'Save Integrations'}
          </button>
        </div>
      </div>
    </div>
  );
}
