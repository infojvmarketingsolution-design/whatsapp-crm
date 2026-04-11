import React, { useState, useEffect } from 'react';
import { Key, Phone, Database, CheckCircle, Copy, Eye, EyeOff, Save, AlertCircle, Webhook, Zap, Wallet, ExternalLink } from 'lucide-react';

export default function ApiSetup() {
  const [token, setToken] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [wabaName, setWabaName] = useState('');
  const [limitTier, setLimitTier] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');

  useEffect(() => {
    fetchConfig();

    // Dynamically load the Facebook SDK scoped to this execution
    if (!window.FB) {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId      : '1435701250882704', 
          cookie     : true,
          xfbml      : true,
          version    : 'v21.0'
        });
      };

      (function(d, s, id){
         var js, fjs = d.getElementsByTagName(s)[0];
         if (d.getElementById(id)) {return;}
         js = d.createElement(s); js.id = id;
         js.src = "https://connect.facebook.net/en_US/sdk.js";
         fjs.parentNode.insertBefore(js, fjs);
       }(document, 'script', 'facebook-jssdk'));
    }
  }, []);

  const fetchConfig = async () => {
    try {
      const jwtToken = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/whatsapp/config`, {
        headers: { 'Authorization': `Bearer ${jwtToken}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.accessToken) setToken(data.accessToken);
        if (data.phoneNumberId) setPhoneId(data.phoneNumberId);
        if (data.wabaId) setWabaId(data.wabaId);
        if (data.phoneNumber) setPhoneNumber(data.phoneNumber);
        if (data.wabaName) setWabaName(data.wabaName);
        if (data.limitTier) setLimitTier(data.limitTier);
        if (data.callbackUrl) setCallbackUrl(data.callbackUrl);
        if (data.verifyToken) setVerifyToken(data.verifyToken);
        if (data.openaiApiKey) setOpenaiApiKey(data.openaiApiKey);
      }
    } catch (err) {
      console.error('Failed to fetch config', err);
    }
  };
  
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleFacebookConnect = () => {
    if (!window.FB) {
      alert("Facebook System is still initializing or was blocked by an ad-blocker. Please turn off ad-blockers, refresh the page, and try again.");
      return;
    }

    try {
      window.FB.login(function(response) {
        console.log("Meta Embedded Signup Response:", response);
        
        const processResponse = async () => {
          if (response.authResponse) {
            const code = response.authResponse.code;
            if (!code) {
               alert("Embedded Signup closed early or failed to provide a valid OAuth code. Please try again.");
               return;
            }
            console.log("OAuth Code received. Initiating Server Exchange...");
            
            try {
              const jwtToken = localStorage.getItem('token');
              const tenantId = localStorage.getItem('tenantId');
              
              setSaving(true);
              const res = await fetch('/api/whatsapp/oauth', {
                method: 'POST',
                headers: { 
                  'Authorization': `Bearer ${jwtToken}`, 
                  'x-tenant-id': tenantId, 
                  'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ code })
              });

              const data = await res.json();
              if (res.ok) {
                alert("Success! Meta Access Token successfully exchanged and saved.");
                if (data.accessToken) setToken(data.accessToken);
                fetchConfig();
              } else {
                alert("OAuth Exchange Failed: " + data.message);
              }
            } catch (err) {
               alert("Network Error during Token Exchange: " + err.message);
            } finally {
               setSaving(false);
            }

          } else {
            alert('Meta Embedded Signup sequence was blocked, cancelled, or failed validation. (Check pop-up blockers!)');
            console.warn('User cancelled login or did not fully authorize the Meta Embedded Signup.', response);
          }
        };

        processResponse();

      }, {
        config_id: '1270957501788115',
        response_type: 'code',
        override_default_response_type: true,
        extras: {"sessionInfoVersion":"3","version":"v4"}
      });
    } catch (e) {
      alert("Failed to open Facebook Window: " + e.message);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const jwtToken = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/whatsapp/test-connection`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'x-tenant-id': tenantId
        }
      });

      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const jwtToken = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/whatsapp/config`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${jwtToken}`, 
          'x-tenant-id': tenantId, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ accessToken: token, phoneNumberId: phoneId, wabaId, phoneNumber, wabaName })
      });
      
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to save config');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-full flex flex-col pt-10 px-10 relative overflow-y-auto custom-scrollbar animate-fade-in pb-10">
      <div className="mb-8 relative z-10">
         <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-brand-light/10 rounded-xl flex items-center justify-center">
               <Key className="text-[var(--theme-text)]" size={20} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">API Configuration</h1>
         </div>
         <p className="text-gray-500 mt-2 font-medium">Connect your Meta Developer App to enable the WhatsApp Cloud Engine and Webhooks.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* API Keys Panel */}
        <div className="xl:col-span-2 space-y-6">
           <div className="bg-crm-card border border-crm-border rounded-2xl shadow-soft p-8">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-lg font-bold text-gray-800 flex items-center">
                    <Database className="mr-2 text-brand-light" size={20} />
                    WhatsApp Business API Credentials
                 </h2>
                 <button 
                   onClick={handleFacebookConnect}
                   className="flex items-center space-x-2 bg-[#1877F2]/10 text-[#1877F2] px-4 py-2 rounded-lg font-bold hover:bg-[#1877F2]/20 transition border border-[#1877F2]/20 text-sm shadow-sm"
                 >
                   <span>Connect Meta Portfolio</span>
                 </button>
              </div>
              
              <div className="space-y-6">
                 {/* Access Token */}
                 <div>
                    <label className="flex justify-between items-center text-[13px] font-bold text-gray-700 mb-2 uppercase tracking-wide">
                       <span>Permanent Access Token</span>
                       <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">VERIFIED</span>
                    </label>
                    <div className="relative">
                       <input 
                         type={showToken ? "text" : "password"} 
                         value={token}
                         readOnly
                         placeholder="EAA..."
                         className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-24 text-sm font-medium text-gray-500 cursor-not-allowed outline-none"
                       />
                       <div className="absolute right-2 top-2 flex space-x-1">
                          <button onClick={() => setShowToken(!showToken)} className="p-1.5 text-gray-400 hover:text-gray-600 transition bg-white rounded-md border border-gray-200 shadow-sm">
                             {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button onClick={() => handleCopy(token)} className="p-1.5 text-gray-400 hover:text-[var(--theme-text)] transition bg-white rounded-md border border-gray-200 shadow-sm">
                             <Copy size={16} />
                          </button>
                       </div>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2 font-medium">Token must have `whatsapp_business_messaging` and `whatsapp_business_management` permissions.</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Phone Number ID */}
                    <div>
                       <label className="block text-[13px] font-bold text-gray-700 mb-2 uppercase tracking-wide">Phone Number ID</label>
                       <div className="relative">
                          <input 
                            type="text" 
                            value={phoneId}
                            readOnly
                            placeholder="e.g. 103564477..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-10 text-sm font-bold text-gray-500 cursor-not-allowed outline-none"
                          />
                          <button onClick={() => handleCopy(phoneId)} className="absolute right-3 top-3 text-gray-400 hover:text-[var(--theme-text)] transition bg-white/80 p-1 rounded-md">
                             <Copy size={16} />
                          </button>
                       </div>
                    </div>

                    {/* WABA ID */}
                    <div>
                       <label className="block text-[13px] font-bold text-gray-700 mb-2 uppercase tracking-wide">Business Account ID</label>
                       <div className="relative">
                          <input 
                            type="text" 
                            value={wabaId}
                            readOnly
                            placeholder="e.g. 4217981..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-10 text-sm font-bold text-gray-500 cursor-not-allowed outline-none"
                          />
                          <button onClick={() => handleCopy(wabaId)} className="absolute right-3 top-3 text-gray-400 hover:text-[var(--theme-text)] transition bg-white/80 p-1 rounded-md">
                             <Copy size={16} />
                          </button>
                       </div>
                    </div>
                 </div>

                 {/* Display Number & Name */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-[13px] font-bold text-gray-700 mb-2 uppercase tracking-wide">Registered Phone Number</label>
                      <div className="relative flex items-center">
                         <div className="absolute left-4 text-gray-400">
                            <Phone size={18} />
                         </div>
                         <input 
                           type="text" 
                           value={phoneNumber}
                           readOnly
                           className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-gray-500 cursor-not-allowed outline-none"
                         />
                      </div>
                   </div>
                   <div>
                      <label className="block text-[13px] font-bold text-gray-700 mb-2 uppercase tracking-wide">WhatsApp Display Name</label>
                      <div className="relative">
                         <input 
                           type="text" 
                           value={wabaName}
                           readOnly
                           className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-sm font-bold text-gray-500 cursor-not-allowed outline-none"
                         />
                      </div>
                   </div>
                 </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end items-center">
                 <p className="text-sm font-medium text-gray-400">These credentials are managed by the system and cannot be edited.</p>
              </div>
           </div>

           {/* OpenAI API Key Panel */}
           <div className="bg-crm-card border border-crm-border rounded-2xl shadow-soft p-8">
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                 <Zap className="mr-2 text-purple-500" size={20} />
                 AI Services Configuration
              </h2>
              <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-2 uppercase tracking-wide">OpenAI API Key</label>
                  <div className="relative">
                     <input 
                       type="text" 
                       value={openaiApiKey}
                       readOnly
                       className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-4 pr-10 text-sm font-medium text-purple-700 cursor-not-allowed outline-none font-mono tracking-wider"
                     />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 font-medium">This key powers Conversation Summarization and AI classification. It is securely managed via server environment.</p>
              </div>
           </div>
        </div>

        {/* Side Panels */}
        <div className="space-y-6">
           {/* Webhook Status */}
           <div className="bg-gradient-to-br from-brand-dark to-[#0a2e2a] rounded-2xl p-6 text-white shadow-premium relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-white/10">
                 <Webhook size={100} />
              </div>
               <h3 className="font-bold text-lg mb-1 relative z-10 flex items-center justify-between">
                  <div className="flex items-center">
                    <Zap size={18} className="mr-2 text-yellow-400" fill="currentColor" />
                    Webhook Status
                  </div>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">v1.3.0-LIVE</span>
               </h3>
              <p className="text-sm text-teal-100/70 mb-6 relative z-10">Listening for incoming Meta hooks on verified endpoint.</p>
              
              <div className="bg-black/20 rounded-xl p-4 border border-white/10 relative z-10">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold tracking-wide text-teal-200 uppercase">Status</span>
                    <span className="flex items-center text-xs font-bold text-brand-light">
                       <span className="w-2 h-2 rounded-full bg-brand-light mr-1.5 animate-pulse"></span> Active
                    </span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold tracking-wide text-teal-200 uppercase">Callback URL</span>
                 </div>
                  <p className="text-[11px] font-mono text-white mt-1 break-all bg-black/30 p-2 rounded-md">
                     {callbackUrl || 'Fetching...'}
                  </p>
                  <p className="text-[10px] font-bold text-teal-200 mt-3 uppercase tracking-wide">Verify Token</p>
                  <p className="text-[11px] font-mono text-white mt-1 break-all bg-black/30 p-2 rounded-md">
                     {verifyToken || 'Fetching...'}
                  </p>
                  <button onClick={() => handleCopy(callbackUrl)} className="text-[10px] uppercase font-bold text-brand-light mt-3 hover:text-white transition w-full text-center">
                     Copy Callback URL
                  </button>
              </div>
           </div>

           {/* Diagnostics */}
           <div className="bg-white border text-center border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-3">
                 <AlertCircle size={24} />
              </div>
              <h3 className="font-bold text-gray-800">Connection Diagnostics</h3>
              <p className="text-xs text-gray-500 mt-2 font-medium">Test your credentials by triggering a test payload.</p>

              {testResult && (
                <div className={`mt-3 p-3 rounded-xl text-xs font-bold w-full text-left ${testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {testResult.message}
                </div>
              )}

              <button 
                onClick={handleTestConnection}
                disabled={testing}
                className="mt-4 w-full flex items-center justify-center border border-gray-200 text-gray-700 font-bold text-sm py-2.5 rounded-xl hover:bg-gray-50 transition shadow-soft disabled:opacity-50"
              >
                 {testing ? <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></span> : 'Run Connectivity Test'}
              </button>
           </div>

        </div>
      </div>
    </div>
  );
}
