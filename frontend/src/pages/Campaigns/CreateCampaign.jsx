import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ChevronRight, Send, UploadCloud, Download, AlertCircle, Info, Trash2, X, Image as ImageIcon, Video, FileText as FileIcon, Calendar } from 'lucide-react';
import Papa from 'papaparse';

const META_LANGUAGES = [
  { code: 'af', name: 'Afrikaans' }, { code: 'sq', name: 'Albanian' }, { code: 'ar', name: 'Arabic' },
  { code: 'az', name: 'Azerbaijani' }, { code: 'bn', name: 'Bengali' }, { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' }, { code: 'zh_CN', name: 'Chinese (CHN)' }, { code: 'zh_HK', name: 'Chinese (HKG)' },
  { code: 'zh_TW', name: 'Chinese (TAI)' }, { code: 'hr', name: 'Croatian' }, { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' }, { code: 'nl', name: 'Dutch' }, { code: 'en', name: 'English' },
  { code: 'en_GB', name: 'English (UK)' }, { code: 'en_US', name: 'English (US)' }, { code: 'et', name: 'Estonian' },
  { code: 'fil', name: 'Filipino' }, { code: 'fi', name: 'Finnish' }, { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' }, { code: 'el', name: 'Greek' }, { code: 'gu', name: 'Gujarati' },
  { code: 'ha', name: 'Hausa' }, { code: 'he', name: 'Hebrew' }, { code: 'hi', name: 'Hindi' },
  { code: 'hu', name: 'Hungarian' }, { code: 'id', name: 'Indonesian' }, { code: 'ga', name: 'Irish' },
  { code: 'it', name: 'Italian' }, { code: 'ja', name: 'Japanese' }, { code: 'kn', name: 'Kannada' },
  { code: 'kk', name: 'Kazakh' }, { code: 'ko', name: 'Korean' }, { code: 'lo', name: 'Lao' },
  { code: 'lv', name: 'Latvian' }, { code: 'lt', name: 'Lithuanian' }, { code: 'mk', name: 'Macedonian' },
  { code: 'ms', name: 'Malay' }, { code: 'ml', name: 'Malayalam' }, { code: 'mr', name: 'Marathi' },
  { code: 'nb', name: 'Norwegian' }, { code: 'fa', name: 'Persian' }, { code: 'pl', name: 'Polish' },
  { code: 'pt_BR', name: 'Portuguese (BR)' }, { code: 'pt_PT', name: 'Portuguese (POR)' }, { code: 'pa', name: 'Punjabi' },
  { code: 'ro', name: 'Romanian' }, { code: 'ru', name: 'Russian' }, { code: 'sr', name: 'Serbian' },
  { code: 'sk', name: 'Slovak' }, { code: 'sl', name: 'Slovenian' }, { code: 'es', name: 'Spanish' },
  { code: 'es_AR', name: 'Spanish (ARG)' }, { code: 'es_ES', name: 'Spanish (SPA)' }, { code: 'es_MX', name: 'Spanish (MEX)' },
  { code: 'sw', name: 'Swahili' }, { code: 'sv', name: 'Swedish' }, { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' }, { code: 'th', name: 'Thai' }, { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' }, { code: 'ur', name: 'Urdu' }, { code: 'uz', name: 'Uzbek' },
  { code: 'vi', name: 'Vietnamese' }, { code: 'zu', name: 'Zulu' }
];

function CreateCampaign() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    templateId: '',
    templateComponents: { header: null, body: { variables: [] } },
    audienceTags: [],
    uploadedContacts: [],
    scheduledAt: ''
  });

  const [templates, setTemplates] = useState([]);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showMediaGuide, setShowMediaGuide] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const selectedTemplate = templates.find(t => t._id === formData.templateId);
  const [newTemplate, setNewTemplate] = useState({ 
    name: '', category: 'MARKETING', language: 'en', 
    headerType: 'NONE', headerText: '', headerMediaUrl: '', headerFile: null, headerSample: '', headerMetaHandle: '',
    latitude: '', longitude: '',
    bodyText: '', bodySamples: [], footerText: '', buttons: [],
    useCustomTtl: false, messageSendTtl: ''
  });
  const headerFileRef = React.useRef(null);

  const fileInputRef = React.useRef(null);
  
  const handleDirectFileUpload = async (file) => {
    if (!file) return;
    const sizeMB = file.size / (1024 * 1024);
    if (newTemplate.headerType === 'IMAGE' && sizeMB > 5) return alert("Image must be under 5 MB.");
    if (newTemplate.headerType === 'VIDEO' && sizeMB > 16) return alert("Video must be under 16 MB.");
    if (newTemplate.headerType === 'DOCUMENT' && sizeMB > 100) return alert("Document must be under 100 MB.");

    setIsUploadingMedia(true);
    setNewTemplate(prev => ({...prev, headerFile: file, headerMediaUrl: '', headerMetaHandle: ''})); 

    const formDataMedia = new FormData();
    formDataMedia.append('file', file);
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId');
    
    try {
      const uploadRes = await fetch('/api/templates/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId },
        body: formDataMedia
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        
        if (uploadData.metaError) {
          console.error("Meta Upload Error:", uploadData.metaError);
          alert("Meta Resumable Upload failed. Please check your App ID and Access Token permissions. Error: " + JSON.stringify(uploadData.metaError));
        }

        const finalUrl = window.location.origin + uploadData.url;
        setNewTemplate(prev => ({...prev, headerMediaUrl: finalUrl, headerMetaHandle: uploadData.metaHandle || ''}));
      } else {
        alert('Media upload failed: ' + uploadRes.statusText);
        setNewTemplate(prev => ({...prev, headerFile: null, headerMetaHandle: ''}));
      }
    } catch (err) {
      console.error(err);
      alert('Media upload error: ' + err.message);
      setNewTemplate(prev => ({...prev, headerFile: null, headerMetaHandle: ''}));
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: 'greedy',
        complete: function(results) {
          const rows = results.data;
          if (!rows || rows.length === 0) return;

          // Attempt to find the phone and name columns
          const firstRow = rows[0].map(c => String(c || '').toLowerCase().trim());
          const phoneKeywords = ['phone', 'mobile', 'whatsapp', 'number', 'contact', 'tele'];
          const nameKeywords = ['name', 'full name', 'first name', 'customer', 'user', 'label'];

          let phoneIdx = firstRow.findIndex(cell => phoneKeywords.some(k => cell.includes(k)));
          let nameIdx = firstRow.findIndex(cell => nameKeywords.some(k => cell.includes(k)));

          // Fallback logic if no headers match
          if (phoneIdx === -1) {
            // Check if first row contains something that looks like a phone number
            phoneIdx = rows[0].findIndex(cell => /^\+?\d{7,15}$/.test(String(cell || '').replace(/\s+/g, '')));
            if (phoneIdx === -1) phoneIdx = 0; // Default to first column
          }

          // Decide if we should skip the first row (if it's a header)
          const isHeader = phoneIdx !== -1 && !/^\d{7,}$/.test(String(rows[0][phoneIdx] || '').replace(/\D/g, ''));
          const startIndex = isHeader ? 1 : 0;

          const parsed = rows.slice(startIndex).map(row => {
            const rawPhone = String(row[phoneIdx] || '').trim();
            
            // Comprehensive cleaning: Allow leading + then only digits
            let normalizedPhone = rawPhone.replace(/\s+/g, ''); 
            if (normalizedPhone.startsWith('+')) {
                normalizedPhone = '+' + normalizedPhone.substring(1).replace(/\D/g, '');
            } else {
                normalizedPhone = normalizedPhone.replace(/\D/g, '');
            }
            
            // Basic validation: must have at least 7 digits
            if (normalizedPhone.replace(/\D/g, '').length < 7) return null;

            return {
              phone: normalizedPhone,
              name: nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : ''
            };
          }).filter(Boolean);

          console.log(`[CSV Parser] Successfully parsed ${parsed.length} contacts`);
          setFormData(prev => ({ ...prev, uploadedContacts: parsed, audienceTags: [] }));
        }
      });
    }
  };

  const downloadSampleCSV = (e) => {
    e.stopPropagation();
    const csvContent = "name,phone\nJohn Doe,1234567890\nJane Smith,0987654321";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample_contacts.csv";
    link.click();
  };


  
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenantId');
        const res = await fetch('/api/templates', {
          headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
        });
        if (res.ok) {
          const data = await res.json();
          setTemplates(data);
        }
      } catch (err) {
        console.error("Failed to load templates:", err);
      }
    };
    fetchTemplates();
  }, []);

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const handleCreateTemplate = async () => {
    setLoading(true);

    if (!newTemplate.name || newTemplate.name.trim() === '') {
       alert("Template name is required. Please provide a unique lowercase name.");
       setLoading(false);
       return;
    }
    
    if (!newTemplate.bodyText || newTemplate.bodyText.trim() === '') {
       alert("Body text is required.");
       setLoading(false);
       return;
    }

    const components = [];
    
    if (newTemplate.headerType !== 'NONE') {
      if (newTemplate.headerType === 'TEXT' && newTemplate.headerText) {
         let headerComp = { type: 'HEADER', format: 'TEXT', text: newTemplate.headerText };
         if (newTemplate.headerText.includes('{{1}}')) {
            if (!newTemplate.headerSample) {
               alert("Please provide a sample for the Header variable {{1}}.");
               setLoading(false);
               return;
            }
            headerComp.example = { header_text: [newTemplate.headerSample] };
         }
         components.push(headerComp);
      } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(newTemplate.headerType)) {
         let finalUrl = newTemplate.headerMediaUrl;

         if (newTemplate.headerMetaHandle) {
            components.push({ type: 'HEADER', format: newTemplate.headerType, example: { header_handle: [newTemplate.headerMetaHandle] } });
         } else if (finalUrl) {
            if (finalUrl.includes('localhost') || finalUrl.includes('127.0.0.1')) {
                alert('Cannot use local media URL for Meta API. Please ensure your app is accessible publicly, or check your App ID configuration to allow Resumable Upload.');
                setLoading(false);
                return;
            }
            components.push({ type: 'HEADER', format: newTemplate.headerType, example: { header_url: [finalUrl] } });
         } else {
            alert('Please provide a URL or upload a file for the ' + newTemplate.headerType.toLowerCase());
            setLoading(false);
            return;
         }
      } else if (newTemplate.headerType === 'LOCATION') {
         if (!newTemplate.latitude || !newTemplate.longitude) {
            alert('Please provide latitude and longitude for location header.');
            setLoading(false);
            return;
         }
         components.push({ type: 'HEADER', format: 'LOCATION', example: { location: { latitude: parseFloat(newTemplate.latitude), longitude: parseFloat(newTemplate.longitude) } } });
      }
    }
    
    let bodyComp = { type: 'BODY', text: newTemplate.bodyText };
    const bodyVarMatches = newTemplate.bodyText.match(/{{(\d+)}}/g);
    if (bodyVarMatches && bodyVarMatches.length > 0) {
       const numVars = new Set(bodyVarMatches).size;
       if (newTemplate.bodySamples.length < numVars || newTemplate.bodySamples.some((s, i) => i < numVars && !s)) {
          alert("Please provide sample values for all Body variables.");
          setLoading(false);
          return;
       }
       bodyComp.example = { body_text: [newTemplate.bodySamples.slice(0, numVars)] };
    }
    components.push(bodyComp);
    
    if (newTemplate.footerText) {
       components.push({ type: 'FOOTER', text: newTemplate.footerText });
    }
    
    if (newTemplate.buttons.length > 0) {
        const hasCTA = newTemplate.buttons.some(b => ['URL', 'PHONE_NUMBER', 'COPY_CODE', 'FLOW'].includes(b.type));
        const hasQuickReply = newTemplate.buttons.some(b => b.type === 'QUICK_REPLY');

        if (hasCTA && hasQuickReply) {
           alert('Meta does not allow mixing "Visit Website/Call Phone" buttons with "Quick Reply" buttons in the same template. Please use only one type.');
           setLoading(false);
           return;
        }

       const metaBtns = newTemplate.buttons.map(b => {
          if (b.type === 'COPY_CODE') {
             if (!b.example || b.example.trim() === '') {
                alert("Offer Code is required for the Copy Offer Code button.");
                setLoading(false);
                throw new Error('Missing offer code');
             }
             if (b.example.length > 15) {
                alert(`Offer code "${b.example}" is too long. Maximum 15 characters allowed. Current: ${b.example.length}`);
                setLoading(false);
                throw new Error('Offer code too long');
             }
             return { type: 'COPY_CODE', example: b.example.trim() };
          }
          
          if (!b.text) return null;
          
          if (b.text.length > 25) {
             alert(`Button text "${b.text}" is too long. Meta allows maximum 25 characters. Current: ${b.text.length}`);
             setLoading(false);
             throw new Error('Button text too long');
          }

          if (b.type === 'URL') {
             if (!b.url || b.url.trim() === '') {
                alert("URL is required for the Visit Website button.");
                setLoading(false);
                throw new Error('Missing URL');
             }
             let finalUrl = b.url.trim();
             if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                finalUrl = 'https://' + finalUrl;
             }
             return { type: 'URL', text: b.text.trim(), url: finalUrl };
          }
          if (b.type === 'PHONE_NUMBER') {
             if (!b.phoneNumber || b.phoneNumber.trim() === '') {
                alert("Phone Number is required for the Call Phone button.");
                setLoading(false);
                throw new Error('Missing Phone Number');
             }
             let cleanedPhone = b.phoneNumber.replace(/[^\d+]/g, '');
             if (!cleanedPhone.startsWith('+')) cleanedPhone = '+' + cleanedPhone;
             return { type: 'PHONE_NUMBER', text: b.text.trim(), phone_number: cleanedPhone };
          }
          if (b.type === 'QUICK_REPLY') return { type: 'QUICK_REPLY', text: b.text.trim() };
          if (b.type === 'FLOW') {
             if (!b.flow_id || b.flow_id.trim() === '') {
                alert("Flow ID is required for the Complete flow button.");
                setLoading(false);
                throw new Error('Missing Flow ID');
             }
             return { type: 'FLOW', text: b.text.trim(), flow_id: b.flow_id.trim(), flow_action: 'navigate', navigate_screen: b.navigate_screen?.trim() || 'HOME' };
          }
          return null;
       }).filter(Boolean);
       if (metaBtns.length > 0) components.push({ type: 'BUTTONS', buttons: metaBtns });
    }

    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
           name: newTemplate.name,
           category: newTemplate.category,
           language: newTemplate.language,
           components,
           message_send_ttl_seconds: newTemplate.useCustomTtl && newTemplate.messageSendTtl ? parseInt(newTemplate.messageSendTtl) : undefined
        })
      });
      if (res.ok) {
        const created = await res.json();
        setTemplates([created, ...templates]);
        setFormData({ ...formData, templateId: created._id });
        setIsCreatingTemplate(false);
        setNewTemplate({ name: '', category: 'MARKETING', language: 'en', headerType: 'NONE', headerText: '', headerMediaUrl: '', headerFile: null, headerSample: '', latitude: '', longitude: '', bodyText: '', bodySamples: [], footerText: '', buttons: [], useCustomTtl: false, messageSendTtl: '' });
      } else {
        const err = await res.json();
        let errorMsg = err.error || err.message || 'Error occurred';
        
        // If the backend provided more details (Meta API error), include them
        let metaDetailedMsg = '';
        if (err.metaDetails) {
            metaDetailedMsg = err.metaDetails.error_user_title ? `\n[Meta API: ${err.metaDetails.error_user_title} - ${err.metaDetails.error_user_msg}]` : `\n[Meta API: ${err.metaDetails.message}]`;
        }
        const details = err.metaDetails?.fbtrace_id ? `\n(Trace ID: ${err.metaDetails.fbtrace_id})` : '';
        alert('Failed to create template: ' + errorMsg + metaDetailedMsg + details);
      }
    } catch (e) {
      console.error(e);
      alert('Error creating template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this template from Meta?')) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
         setTemplates(templates.filter(t => t._id !== id));
         if (formData.templateId === id) setFormData({ ...formData, templateId: '' });
      } else {
         const err = await res.json();
         alert('Failed to delete: ' + (err.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting template');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          templateId: formData.templateId,
          templateComponents: formData.templateComponents,
          audienceTags: formData.audienceTags,
          uploadedContacts: formData.uploadedContacts,
          scheduledAt: formData.scheduledAt || null
        })
      });
      
      if (res.ok) {
        navigate('/campaigns');
      } else {
        const err = await res.json();
        alert('Failed to launch campaign: ' + (err.error || err.message));
      }
    } catch (err) {
      console.error(err);
      alert('Error launching campaign.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-crm-bg min-h-full animate-fade-in-up">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/campaigns')} className="flex items-center text-gray-500 hover:text-gray-800 mb-4 sm:mb-6 transition-colors font-bold text-xs sm:text-sm uppercase tracking-widest">
          <ArrowLeft size={16} className="mr-2" /> <span className="hidden sm:inline">Back to</span> Campaigns
        </button>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-premium border border-gray-100 p-5 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-black text-gray-800 mb-6 sm:mb-8 tracking-tight">New Campaign</h1>

          {/* Stepper */}
          <div className="flex items-center mb-8 sm:mb-10">
            {[1, 2, 3, 4].map((s, idx) => (
              <React.Fragment key={s}>
                <div className={`flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full font-black text-xs sm:text-sm transition-all ${step >= s ? 'bg-blue-600 text-white shadow-glow' : 'bg-gray-100 text-gray-400'}`}>
                  {step > s ? <CheckCircle size={14} /> : s}
                </div>
                {idx < 3 && <div className={`flex-1 h-1 mx-1 sm:mx-2 rounded-full transition-all ${step > s ? 'bg-blue-600' : 'bg-gray-100'}`}></div>}
              </React.Fragment>
            ))}
          </div>

          <div className="min-h-[300px]">
            {step === 1 && (
              <div className="space-y-6 animate-fade-in-up">
                <h2 className="text-xl font-bold text-gray-800">Campaign Details</h2>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Campaign Name</label>
                  <input 
                    type="text" 
                    placeholder="E.g., Diwali Mega Sale 2026" 
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                   <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">{isCreatingTemplate ? 'New Template' : 'Select Template'}</h2>
                   {!isCreatingTemplate && (
                     <button onClick={() => setIsCreatingTemplate(true)} className="w-full sm:w-auto text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl transition-all border border-blue-100 uppercase tracking-widest">+ New Template</button>
                   )}
                </div>

                {isCreatingTemplate ? (
                   <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 animate-fade-in">
                        <div className="relative">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Template Name</label>
                          <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 text-sm font-bold placeholder-slate-300" placeholder="e.g. spring_promo_v1" value={newTemplate.name} maxLength={512} onChange={e => setNewTemplate({...newTemplate, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')})} />
                          <div className="flex justify-between mt-2">
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Lowercase alphanumeric & underscores only.</p>
                             <span className="text-[9px] font-bold text-slate-400">{newTemplate.name.length}/512</span>
                          </div>
                        </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                          <div className="flex bg-slate-100 p-1 rounded-xl">
                            {['MARKETING', 'UTILITY', 'AUTHENTICATION'].map(cat => (
                               <button 
                                 key={cat}
                                 type="button"
                                 onClick={() => {
                                    // Reset TTL when category changes
                                    setNewTemplate({...newTemplate, category: cat, useCustomTtl: false, messageSendTtl: ''});
                                 }}
                                 className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${newTemplate.category === cat ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                               >
                                 {cat === 'AUTHENTICATION' ? 'AUTH' : cat}
                               </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Language</label>
                          <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none bg-white focus:ring-4 focus:ring-blue-100 text-xs font-bold" value={newTemplate.language} onChange={e => setNewTemplate({...newTemplate, language: e.target.value})}>
                             {META_LANGUAGES.map(lang => (
                               <option key={lang.code} value={lang.code}>{lang.name} ({lang.code})</option>
                             ))}
                          </select>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                           <div>
                             <label className="block text-sm font-semibold text-gray-700">Message validity period</label>
                             <p className="text-[10px] text-gray-500 mt-0.5">Set a custom expiration time for this message.</p>
                           </div>
                           <label className="relative inline-flex items-center cursor-pointer">
                             <input type="checkbox" className="sr-only peer" checked={newTemplate.useCustomTtl} onChange={e => setNewTemplate({...newTemplate, useCustomTtl: e.target.checked, messageSendTtl: ''})} />
                             <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                           </label>
                        </div>
                        {newTemplate.useCustomTtl && (
                           <div className="mt-3 animate-fade-in-up">
                              <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none bg-white focus:ring-4 focus:ring-blue-100 text-xs font-bold" value={newTemplate.messageSendTtl} onChange={e => setNewTemplate({...newTemplate, messageSendTtl: e.target.value})}>
                                 <option value="">Select Custom Period</option>
                                 {newTemplate.category === 'MARKETING' && (
                                   <>
                                     <option value="86400">1 Day</option>
                                     <option value="604800">7 Days</option>
                                     <option value="1209600">14 Days</option>
                                     <option value="2592000">30 Days</option>
                                   </>
                                 )}
                                 {newTemplate.category === 'UTILITY' && (
                                   <>
                                     <option value="3600">1 Hour</option>
                                     <option value="21600">6 Hours</option>
                                     <option value="43200">12 Hours</option>
                                   </>
                                 )}
                                 {newTemplate.category === 'AUTHENTICATION' && (
                                   <>
                                     <option value="300">5 Minutes</option>
                                     <option value="600">10 Minutes</option>
                                     <option value="900">15 Minutes</option>
                                   </>
                                 )}
                              </select>
                           </div>
                        )}
                      </div>
                      
                      <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Header (Optional)</label>
                        <select className="w-full px-3 py-2 border border-gray-200 rounded-md outline-none bg-white focus:ring-2 focus:ring-blue-500 mb-3" value={newTemplate.headerType} onChange={e => setNewTemplate({...newTemplate, headerType: e.target.value})}>
                           <option value="NONE">None</option>
                           <option value="TEXT">Text Title</option>
                           <option value="IMAGE">Image Media</option>
                           <option value="VIDEO">Video Media</option>
                           <option value="DOCUMENT">Document (PDF/Doc)</option>
                           <option value="LOCATION">Location</option>
                        </select>
                        {newTemplate.headerType === 'TEXT' && (
                           <div className="relative">
                             <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Header Text" value={newTemplate.headerText} onChange={e => setNewTemplate({...newTemplate, headerText: e.target.value})} maxLength={60} />
                             <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">{newTemplate.headerText.length}/60</span>
                             {newTemplate.headerText.includes('{{1}}') && (
                                <div className="mt-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                   <label className="block text-[10px] font-black text-yellow-800 uppercase tracking-widest mb-1">Header Sample {"{{1}}"}</label>
                                   <input type="text" className="w-full px-3 py-2 border border-yellow-300 rounded-md outline-none focus:ring-2 focus:ring-yellow-500 text-sm" placeholder="e.g. John" value={newTemplate.headerSample} onChange={e => setNewTemplate({...newTemplate, headerSample: e.target.value})} />
                                   <p className="text-[9px] text-yellow-600 mt-1">Meta requires a sample value for any variable used.</p>
                                </div>
                             )}
                           </div>
                        )}
                        {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(newTemplate.headerType) && (
                           <div className="space-y-3">
                             <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 mb-3">
                                <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">Meta Upload Limits:</h4>
                                <ul className="text-[10px] text-blue-600 font-medium space-y-1">
                                  <li>• Image (JPEG/PNG): Max 5 MB</li>
                                  <li>• Video (MP4): Max 16 MB</li>
                                  <li>• Document (PDF): Max 100 MB</li>
                                </ul>
                             </div>
                             <div 
                               className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors"
                               onClick={() => headerFileRef.current?.click()}
                             >
                                <input 
                                  type="file" 
                                  ref={headerFileRef} 
                                  className="hidden" 
                                  accept={newTemplate.headerType === 'IMAGE' ? "image/*" : newTemplate.headerType === 'VIDEO' ? "video/*" : ".pdf,.doc,.docx"} 
                                  onChange={(e) => handleDirectFileUpload(e.target.files[0])} 
                                />
                                {isUploadingMedia ? (
                                  <div className="text-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <p className="text-xs font-bold text-blue-600">Uploading...</p>
                                    <p className="text-[10px] text-gray-400">Please wait</p>
                                  </div>
                                ) : newTemplate.headerFile ? (
                                  <div className="text-center">
                                    <p className="text-xs font-bold text-green-600">Selected: {newTemplate.headerFile.name}</p>
                                    <p className="text-[10px] text-gray-400">Click to change</p>
                                  </div>
                                ) : (
                                  <>
                                    <UploadCloud size={24} className="text-gray-400 mb-1" />
                                    <p className="text-xs font-bold text-gray-500 text-center">Click to upload {newTemplate.headerType.toLowerCase()}</p>
                                  </>
                                )}
                             </div>
                             <div className="relative flex items-center">
                               <div className="flex-grow border-t border-gray-100"></div>
                               <span className="flex-shrink mx-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">OR</span>
                               <div className="flex-grow border-t border-gray-100"></div>
                             </div>
                             <input 
                               type="text" 
                               className="w-full px-3 py-2 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500" 
                               placeholder={`Enter Public ${newTemplate.headerType.toLowerCase()} URL`} 
                               value={newTemplate.headerMediaUrl} 
                               onChange={e => setNewTemplate({...newTemplate, headerMediaUrl: e.target.value, headerFile: null, headerMetaHandle: ''})} 
                             />
                           </div>
                        )}
                        {newTemplate.headerType === 'LOCATION' && (
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Latitude</label>
                                 <input type="number" step="any" className="w-full px-3 py-2 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="e.g. 23.0225" value={newTemplate.latitude} onChange={e => setNewTemplate({...newTemplate, latitude: e.target.value})} />
                              </div>
                              <div>
                                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Longitude</label>
                                 <input type="number" step="any" className="w-full px-3 py-2 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="e.g. 72.5714" value={newTemplate.longitude} onChange={e => setNewTemplate({...newTemplate, longitude: e.target.value})} />
                              </div>
                           </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Message Body</label>
                        <div className="relative">
                          <textarea className="w-full px-3 py-2 border border-gray-200 rounded-md outline-none min-h-[100px] focus:ring-2 focus:ring-blue-500" maxLength={1024} placeholder="Hello {{1}}, your order {{2}} is ready." value={newTemplate.bodyText} onChange={e => setNewTemplate({...newTemplate, bodyText: e.target.value})}></textarea>
                          <span className="absolute right-3 bottom-3 text-xs text-gray-400 font-bold bg-white px-1">{newTemplate.bodyText.length}/1024</span>
                        </div>
                        {newTemplate.bodyText.match(/{{(\d+)}}/g) && (
                           <div className="mt-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200 space-y-2">
                             <h4 className="text-[10px] font-black text-yellow-800 uppercase tracking-widest">Body Variable Samples</h4>
                             <p className="text-[10px] text-yellow-600 mb-2">Meta requires a sample value for every variable in your body text.</p>
                             {Array.from(new Set(newTemplate.bodyText.match(/{{(\d+)}}/g))).map((match, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                   <span className="text-xs font-bold text-yellow-800 w-8">{match}</span>
                                   <input type="text" className="flex-1 px-3 py-1.5 border border-yellow-300 rounded-md outline-none focus:ring-2 focus:ring-yellow-500 text-sm" placeholder={`Sample for ${match}`} value={newTemplate.bodySamples[idx] || ''} onChange={e => {
                                      const newSamples = [...newTemplate.bodySamples];
                                      newSamples[idx] = e.target.value;
                                      setNewTemplate({...newTemplate, bodySamples: newSamples});
                                   }} />
                                </div>
                             ))}
                           </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Footer (Optional)</label>
                        <div className="relative">
                          <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm italic pr-16" placeholder="Short footer text (e.g. Reply STOP to unsubscribe)" value={newTemplate.footerText} onChange={e => setNewTemplate({...newTemplate, footerText: e.target.value})} maxLength={60} />
                          <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold">{newTemplate.footerText.length}/60</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-3">
                           <div>
                             <label className="block text-sm font-black text-slate-800 uppercase tracking-widest">Interactive Buttons</label>
                             <p className="text-[10px] text-gray-500 mt-0.5">Max: 2 URLs, 1 Phone Number, 3 Quick Replies (Max 10 total).</p>
                           </div>
                           {newTemplate.buttons.length < 10 && (
                             <button type="button" onClick={() => {
                               const urlCount = newTemplate.buttons.filter(b => b.type === 'URL').length;
                               const phoneCount = newTemplate.buttons.filter(b => b.type === 'PHONE_NUMBER').length;
                               const replyCount = newTemplate.buttons.filter(b => b.type === 'QUICK_REPLY').length;
                               
                               // Auto-select type based on what's available
                               let newType = 'URL';
                               if (urlCount >= 2 && phoneCount === 0) newType = 'PHONE_NUMBER';
                               else if (urlCount >= 2 && phoneCount >= 1) newType = 'QUICK_REPLY';

                               if (newType === 'QUICK_REPLY' && replyCount >= 3) {
                                  alert("You have reached the maximum number of Quick Reply buttons (3).");
                                  return;
                               }
                               setNewTemplate({...newTemplate, buttons: [...newTemplate.buttons, {type: newType, text: '', url: '', phoneNumber: '', example: ''}]});
                             }} className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 uppercase tracking-widest border border-blue-100">+ Add Button</button>
                           )}
                        </div>
                        <div className="space-y-3">
                          {newTemplate.buttons.map((btn, idx) => (
                             <div key={idx} className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 relative group animate-fade-in-up">
                                <select className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white outline-none focus:ring-4 focus:ring-blue-100" value={btn.type} onChange={e => {
                                   const newType = e.target.value;
                                   const urlCount = newTemplate.buttons.filter((b, i) => i !== idx && b.type === 'URL').length;
                                   const phoneCount = newTemplate.buttons.filter((b, i) => i !== idx && b.type === 'PHONE_NUMBER').length;
                                   const replyCount = newTemplate.buttons.filter((b, i) => i !== idx && b.type === 'QUICK_REPLY').length;
                                   const copyCodeCount = newTemplate.buttons.filter((b, i) => i !== idx && b.type === 'COPY_CODE').length;
                                   const flowCount = newTemplate.buttons.filter((b, i) => i !== idx && b.type === 'FLOW').length;
                                   
                                   if (newType === 'URL' && urlCount >= 2) return alert("Maximum 2 Visit Website buttons allowed.");
                                   if (newType === 'PHONE_NUMBER' && phoneCount >= 1) return alert("Maximum 1 Call Phone button allowed.");
                                   if (newType === 'QUICK_REPLY' && replyCount >= 3) return alert("Maximum 3 Quick Reply buttons allowed.");
                                   if (newType === 'COPY_CODE' && copyCodeCount >= 1) return alert("Maximum 1 Copy Offer Code button allowed.");
                                   if (newType === 'FLOW' && flowCount >= 1) return alert("Maximum 1 Complete flow button allowed.");
                                   
                                   const btns = [...newTemplate.buttons]; btns[idx].type = newType; btns[idx].url = ''; btns[idx].phoneNumber = ''; btns[idx].example = ''; btns[idx].flow_id = ''; btns[idx].navigate_screen = ''; setNewTemplate({...newTemplate, buttons: btns});
                                }}>
                                   <option value="URL">Visit website</option>
                                   <option value="PHONE_NUMBER">Call Phone Number (1 button maximum)</option>
                                   <option value="FLOW">Complete flow (1 button maximum)</option>
                                   <option value="COPY_CODE">Copy offer code (1 button maximum)</option>
                                   <option value="QUICK_REPLY">Custom</option>
                                </select>
                                {btn.type !== 'COPY_CODE' ? (
                                  <div className="flex-1 relative">
                                    <input type="text" className={`w-full px-3 py-2 border rounded-xl text-xs font-bold ${btn.text.length > 25 ? 'border-red-500 bg-red-50' : 'border-slate-200'} outline-none focus:ring-4 focus:ring-blue-100`} placeholder="Button Label" value={btn.text || ''} onChange={e => {
                                       const btns = [...newTemplate.buttons]; btns[idx].text = e.target.value; setNewTemplate({...newTemplate, buttons: btns});
                                    }} maxLength={25} />
                                    <span className={`absolute right-3 -bottom-4 text-[8px] font-black uppercase tracking-tighter ${btn.text?.length > 25 ? 'text-red-500' : 'text-slate-400'}`}>{btn.text?.length || 0}/25</span>
                                  </div>
                                ) : (
                                  <div className="flex-1 relative">
                                    <input type="text" className={`w-full px-3 py-2 border rounded-xl text-xs font-bold ${btn.example?.length > 15 ? 'border-red-500 bg-red-50' : 'border-slate-200'} outline-none focus:ring-4 focus:ring-blue-100`} placeholder="Offer Code (e.g. 25OFF)" value={btn.example || ''} onChange={e => {
                                       const btns = [...newTemplate.buttons]; btns[idx].example = e.target.value; setNewTemplate({...newTemplate, buttons: btns});
                                    }} maxLength={15} />
                                    <span className={`absolute right-3 -bottom-4 text-[8px] font-black uppercase tracking-tighter ${btn.example?.length > 15 ? 'text-red-500' : 'text-slate-400'}`}>{btn.example?.length || 0}/15</span>
                                  </div>
                                )}
                                
                                {btn.type === 'URL' && <input type="text" className="w-full sm:flex-[1.5] px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-100 bg-white" placeholder="https://..." value={btn.url} onChange={e => {
                                   const btns = [...newTemplate.buttons]; btns[idx].url = e.target.value; setNewTemplate({...newTemplate, buttons: btns});
                                }} />}
                                {btn.type === 'PHONE_NUMBER' && <input type="text" className="w-full sm:flex-[1.5] px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-100 bg-white" placeholder="+12345678" value={btn.phoneNumber} onChange={e => {
                                   const btns = [...newTemplate.buttons]; btns[idx].phoneNumber = e.target.value; setNewTemplate({...newTemplate, buttons: btns});
                                }} />}
                                {btn.type === 'FLOW' && (
                                   <>
                                     <input type="text" className="w-full sm:w-[120px] px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-100 bg-white" placeholder="Flow ID" value={btn.flow_id || ''} onChange={e => {
                                        const btns = [...newTemplate.buttons]; btns[idx].flow_id = e.target.value; setNewTemplate({...newTemplate, buttons: btns});
                                     }} />
                                     <input type="text" className="w-full sm:w-[120px] px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-100 bg-white" placeholder="Navigate Screen (optional)" value={btn.navigate_screen || ''} onChange={e => {
                                        const btns = [...newTemplate.buttons]; btns[idx].navigate_screen = e.target.value; setNewTemplate({...newTemplate, buttons: btns});
                                     }} />
                                   </>
                                 )}
                                
                                <button type="button" onClick={() => {
                                   const btns = newTemplate.buttons.filter((_, i) => i !== idx); setNewTemplate({...newTemplate, buttons: btns});
                                }} className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 text-slate-400 hover:text-red-500 font-bold rounded-full transition-all shadow-sm flex items-center justify-center">×</button>
                             </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                         <button onClick={() => setIsCreatingTemplate(false)} className="w-full sm:w-auto px-6 py-3 text-xs font-black text-slate-500 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest order-2 sm:order-1">Cancel</button>
                         <button onClick={handleCreateTemplate} disabled={!newTemplate.name || !newTemplate.bodyText || loading} className="w-full sm:w-auto px-8 py-3 text-xs font-black bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-glow flex items-center justify-center uppercase tracking-widest order-1 sm:order-2">
                            {loading ? <span className="animate-pulse">Submitting...</span> : 'Submit to Meta'}
                         </button>
                      </div>
                   </div>
                ) : (
                  <>
                    <div className="grid gap-4">
                      {templates.length === 0 && <p className="text-sm text-gray-500 italic p-4 text-center border border-dashed rounded-lg bg-gray-50">No templates found. Please create one.</p>}
                      {templates.map(t => (
                        <div 
                          key={t._id} 
                          onClick={() => {
                             setFormData(prev => ({ 
                               ...prev, 
                               templateId: t._id,
                               templateComponents: { header: null, body: { variables: [] } }
                             }));
                             setShowConfigModal(true);
                          }}
                          className={`p-4 border rounded-xl cursor-pointer transition-all flex items-center justify-between ${formData.templateId === t._id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-soft' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <div>
                            <h3 className="font-bold text-gray-800 flex items-center">{t.name} {t.status === 'PENDING' && <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full uppercase">Pending Review</span>}</h3>
                            <p className="text-xs text-gray-500 mt-1">{t.category} • {t.language}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                             {formData.templateId === t._id && <CheckCircle size={20} className="text-blue-600" />}
                             <button onClick={(e) => handleDeleteTemplate(e, t._id)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors">
                               <Trash2 size={16} />
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <TemplateConfigModal 
                      isOpen={showConfigModal} 
                      onClose={() => setShowConfigModal(false)}
                      selectedTemplate={selectedTemplate}
                      formData={formData}
                      setFormData={setFormData}
                      setLoading={setLoading}
                      setShowMediaGuide={setShowMediaGuide}
                    />
                  </>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-fade-in-up">
                <h2 className="text-xl font-bold text-gray-800">Select Audience</h2>
               <p className="text-sm text-gray-500">Filter existing contacts or upload a new CSV file to target this campaign.</p>
               
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target by Tags</label>
                    <input 
                      type="text" 
                      placeholder="vip, active, organic..." 
                      className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all mb-2 text-sm font-bold"
                      value={formData.audienceTags.join(', ')}
                      onChange={e => setFormData({ ...formData, audienceTags: e.target.value.split(',').map(t => t.trim()), uploadedContacts: [] })}
                    />
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Leave blank for CSV upload.</p>
                  </div>
                  
                  <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center hover:bg-blue-50/30 hover:border-blue-300 transition-all cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                     <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                     <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
                        <UploadCloud size={28} />
                     </div>
                     <p className="text-xs font-black text-slate-800 text-center uppercase tracking-widest">CSV Payload</p>
                     <p className="text-[10px] text-slate-500 mt-1 mb-4 text-center truncate max-w-[200px]">
                        {formData.uploadedContacts.length > 0 ? <span className="text-emerald-600 font-black">{formData.uploadedContacts.length} Leads Loaded</span> : 'Drag & Drop CSV'}
                     </p>
                     <button onClick={downloadSampleCSV} className="text-[10px] font-black text-blue-600 bg-white border border-blue-100 px-4 py-2 rounded-xl hover:bg-blue-50 flex items-center transition-all uppercase tracking-widest shadow-sm">
                        <Download size={14} className="mr-2" /> Sample CSV
                     </button>
                  </div>
               </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start space-x-3 text-slate-600 mt-6">
                   <AlertCircle size={18} className="mt-0.5 shrink-0 text-blue-500" />
                   <div className="text-[10px] font-bold uppercase tracking-tight leading-relaxed">
                     {formData.uploadedContacts.length > 0 ? (
                       <p>Targeting <span className="text-blue-600">{formData.uploadedContacts.length}</span> verified contacts from your uploaded payload.</p>
                     ) : (
                       <p>Targeting approximately <span className="text-blue-600">500</span> predefined leads matching your criteria.</p>
                     )}
                   </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-fade-in-up">
                <h2 className="text-xl font-bold text-gray-800">Review & Launch</h2>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-4">
                   <div className="flex justify-between border-b border-gray-200 pb-3">
                     <span className="text-gray-500">Campaign Name</span>
                     <span className="font-bold text-gray-800">{formData.name || 'Untitled'}</span>
                   </div>
                   <div className="flex justify-between border-b border-gray-200 pb-3">
                     <span className="text-gray-500">Template</span>
                     <span className="font-bold text-gray-800">{templates.find(t => t._id === formData.templateId)?.name || 'None selected'}</span>
                   </div>
                   <div className="flex justify-between pb-1 border-b border-gray-200">
                     <span className="text-gray-500">Target Audience</span>
                     <span className="font-bold text-gray-800">
                        {formData.uploadedContacts.length > 0 ? `${formData.uploadedContacts.length} CSV Contacts` : (formData.audienceTags.join(', ') || 'All Contacts')}
                     </span>
                   </div>
                   
                   <div className="pt-2">
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Scheduling Options</label>
                     <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setFormData({...formData, scheduledAt: ''})}
                          className={`p-3 rounded-xl border-2 text-sm font-bold transition-all flex flex-col items-center justify-center ${!formData.scheduledAt ? 'border-brand-dark bg-brand-light/10 text-brand-dark' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                           <Send size={18} className="mb-1" />
                           Send Immediately
                        </button>
                        <div className="relative">
                           <button 
                             onClick={() => setFormData({...formData, scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0,16)})}
                             className={`w-full p-3 rounded-xl border-2 text-sm font-bold transition-all flex flex-col items-center justify-center ${formData.scheduledAt ? 'border-brand-dark bg-brand-light/10 text-brand-dark' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                           >
                              <Calendar size={18} className="mb-1" />
                              Schedule for Later
                           </button>
                           {formData.scheduledAt && (
                             <div className="absolute top-full mt-2 w-full z-10 bg-white p-3 rounded-xl shadow-lg border border-gray-100 animate-fade-in-up">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Select Date & Time</label>
                                <input 
                                  type="datetime-local" 
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-brand-dark text-sm font-bold text-gray-800"
                                  value={formData.scheduledAt}
                                  onChange={e => setFormData({...formData, scheduledAt: e.target.value})}
                                  min={new Date().toISOString().slice(0,16)}
                                />
                             </div>
                           )}
                        </div>
                     </div>
                   </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
            <button 
              onClick={handlePrev}
              disabled={step === 1}
              className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-colors ${step === 1 ? 'opacity-0 cursor-default' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
            >
              Previous
            </button>
            {step < 4 ? (
              <button 
                onClick={handleNext}
                disabled={step === 1 && !formData.name}
                className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-soft disabled:opacity-50"
              >
                Continue <ChevronRight size={16} className="ml-1" />
              </button>
            ) : (
               <button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center px-8 py-2.5 bg-brand-light text-white rounded-lg font-bold text-sm hover:bg-green-500 transition-colors shadow-premium hover:-translate-y-0.5 transform disabled:opacity-50"
              >
                {loading ? 'Launching...' : <><Send size={16} className="mr-2" /> Launch Campaign</>}
              </button>
            )}
          </div>
        </div>
      </div>
      <MediaRequirementsModal isOpen={showMediaGuide} onClose={() => setShowMediaGuide(false)} />
    </div>
  );
}

// Template Configuration Modal
const TemplateConfigModal = ({ isOpen, onClose, selectedTemplate, formData, setFormData, setLoading, setShowMediaGuide }) => {
  if (!isOpen || !selectedTemplate) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-300">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-blue-600 text-white rounded-lg shadow-soft">
                <AlertCircle size={20} />
             </div>
             <div>
                <h2 className="text-xl font-bold text-gray-900">Configure Parameters</h2>
                <p className="text-xs text-gray-500 font-medium">Template: {selectedTemplate.name}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 space-y-8 bg-white">
           {/* Header Media Config */}
           {selectedTemplate.components?.find(c => c.type === 'HEADER' && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(c.format)) && (
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Header {selectedTemplate.components.find(c => c.type === 'HEADER').format.toLowerCase()}
                   </label>
                   <button 
                     onClick={() => setShowMediaGuide(true)}
                     className="text-[10px] font-bold text-blue-600 hover:text-blue-700 underline"
                   >
                     View Requirements
                   </button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className="border-2 border-dashed border-blue-200 rounded-xl p-5 flex flex-col items-center justify-center hover:bg-blue-50 cursor-pointer transition-all group"
                      onClick={() => {
                         const input = document.createElement('input');
                         input.type = 'file';
                         input.accept = selectedTemplate.components.find(c => c.type === 'HEADER').format === 'IMAGE' ? "image/*" : selectedTemplate.components.find(c => c.type === 'HEADER').format === 'VIDEO' ? "video/*" : ".pdf";
                         input.onchange = async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                               const format = selectedTemplate.components.find(c => c.type === 'HEADER').format;
                               const sizeMB = file.size / (1024 * 1024);
                               if (format === 'IMAGE' && sizeMB > 5) return alert("Image must be under 5 MB to comply with Meta limits.");
                               if (format === 'VIDEO' && sizeMB > 16) return alert("Video must be under 16 MB to comply with Meta limits.");
                               if (format === 'DOCUMENT' && sizeMB > 100) return alert("Document must be under 100 MB to comply with Meta limits.");
                               
                               setLoading(true);
                               const formDataMedia = new FormData();
                               formDataMedia.append('file', file);
                               const token = localStorage.getItem('token');
                               const tenantId = localStorage.getItem('tenantId');
                               try {
                                  const uploadRes = await fetch('/api/templates/upload', {
                                     method: 'POST',
                                     headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId },
                                     body: formDataMedia
                                  });
                                  if (uploadRes.ok) {
                                     const uploadData = await uploadRes.json();
                                      const finalUrl = (window.location.origin.replace('http:', 'https:')) + uploadData.url;
                                     setFormData(prev => ({
                                        ...prev,
                                        templateComponents: {
                                           ...prev.templateComponents,
                                           header: { 
                                              type: selectedTemplate.components.find(c => c.type === 'HEADER').format.toLowerCase(),
                                              link: finalUrl,
                                              filename: file.name
                                           }
                                        }
                                     }));
                                  } else {
                                     let errorMsg = uploadRes.statusText;
                                     const contentType = uploadRes.headers.get("content-type");
                                     if (contentType && contentType.includes("application/json")) {
                                       const errorData = await uploadRes.json();
                                       errorMsg = errorData.message || errorData.error || uploadRes.statusText;
                                     } else {
                                       if (uploadRes.status === 413) errorMsg = "File is too large (exceeds server limit). Please upload a smaller file.";
                                       else if (uploadRes.status === 502) errorMsg = "Bad Gateway (Server might be restarting).";
                                       else errorMsg = `Server returned HTTP ${uploadRes.status}: ${uploadRes.statusText}`;
                                     }
                                     alert('Media upload failed: ' + errorMsg);
                                  }
                               } catch (err) {
                                   console.error(err);
                                   alert('Upload failed');
                               } finally {
                                  setLoading(false);
                               }
                            }
                         };
                         input.click();
                      }}
                    >
                       {formData.templateComponents.header?.link ? (
                          <div className="text-center">
                             <CheckCircle size={28} className="text-green-500 mx-auto mb-2" />
                             <p className="text-xs font-bold text-green-700 truncate max-w-[150px]">{formData.templateComponents.header.filename || 'Media Uploaded'}</p>
                             <p className="text-[10px] text-gray-400 mt-1">Click to change</p>
                          </div>
                       ) : (
                          <>
                             <div className="p-3 bg-blue-50 rounded-full group-hover:scale-110 transition-transform mb-3">
                                <UploadCloud size={24} className="text-blue-500" />
                             </div>
                             <p className="text-xs font-bold text-blue-600">Upload {selectedTemplate.components.find(c => c.type === 'HEADER').format.toLowerCase()}</p>
                          </>
                       )}
                    </div>
                    <div className="flex flex-col justify-center space-y-2">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">OR</p>
                       <input 
                         type="text" 
                         className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" 
                         placeholder="Enter Public URL"
                         value={formData.templateComponents.header?.link || ''}
                         onChange={e => setFormData(prev => ({
                            ...prev,
                            templateComponents: {
                               ...prev.templateComponents,
                               header: { 
                                  type: selectedTemplate.components.find(c => c.type === 'HEADER').format.toLowerCase(),
                                  link: e.target.value
                               }
                            }
                         }))}
                       />
                    </div>
                 </div>
              </div>
           )}

           {/* Body Variables Config */}
           {selectedTemplate.variables?.length > 0 && (
              <div className="space-y-4">
                 <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Body Variables
                 </label>
                 <div className="space-y-4">
                    {selectedTemplate.variables.map((v, idx) => (
                       <div key={idx} className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">{v}</span>
                            <span className="text-[10px] font-bold text-gray-500">Value for variable</span>
                          </div>
                          <input 
                            type="text" 
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                            placeholder={`e.g. customer name, order ID...`}
                            value={formData.templateComponents.body.variables[idx] || ''}
                            onChange={e => {
                               const vars = [...formData.templateComponents.body.variables];
                               vars[idx] = e.target.value;
                               setFormData(prev => ({
                                  ...prev,
                                  templateComponents: {
                                     ...prev.templateComponents,
                                     body: { variables: vars }
                                  }
                               }));
                            }}
                          />
                       </div>
                    ))}
                 </div>
              </div>
           )}

           {(!selectedTemplate.variables?.length && !selectedTemplate.components?.find(c => c.type === 'HEADER' && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(c.format))) && (
              <div className="py-10 text-center space-y-4">
                 <div className="p-4 bg-green-50 rounded-full w-fit mx-auto">
                    <CheckCircle size={40} className="text-green-500" />
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-800">No configuration needed</h3>
                    <p className="text-sm text-gray-500">This template is ready to use without any additional parameters.</p>
                 </div>
              </div>
           )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-center">
          <button 
            onClick={onClose}
            className="px-16 py-3 bg-gray-900 text-white font-bold rounded-xl text-sm hover:bg-black transition-all shadow-md hover:-translate-y-0.5 transform active:scale-95"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

// Media Requirements Guidance Modal
const MediaRequirementsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const data = [
    {
      type: 'IMAGE',
      icon: <ImageIcon size={20} className="text-pink-500" />,
      title: 'Images',
      formats: 'JPG, PNG',
      size: '5 MB',
      details: [
        'Recommended resolution: 800x800 px',
        'Supported aspect ratios: 1.91:1 to 4:5',
        'Must be static (no animated GIFs)'
      ]
    },
    {
      type: 'VIDEO',
      icon: <Video size={20} className="text-purple-500" />,
      title: 'Videos',
      formats: 'MP4, 3GP',
      size: '16 MB',
      details: [
        'H.264 video codec and AAC audio codec',
        'Recommended: Square (1:1) or Vertical (4:5)',
        'Avoid high bitrates to ensure delivery'
      ]
    },
    {
      type: 'DOCUMENT',
      icon: <FileIcon size={20} className="text-blue-500" />,
      title: 'Documents',
      formats: 'PDF only',
      size: '100 MB',
      details: [
        'Maximum page count: None (limited by size)',
        'Ideal for brochures, catalogs, and invoices',
        'Must end with .pdf extension'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-blue-600 text-white rounded-lg shadow-soft">
                <Info size={20} />
             </div>
             <div>
                <h2 className="text-xl font-bold text-gray-900">Media Support Guide</h2>
                <p className="text-xs text-gray-500 font-medium">WhatsApp Business API Specifications</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.map((item, idx) => (
              <div key={idx} className="flex flex-col border border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-soft transition-all bg-gray-50/30">
                 <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                       {item.icon}
                    </div>
                    <h3 className="font-bold text-gray-800">{item.title}</h3>
                 </div>
                 
                 <div className="space-y-3 flex-1">
                    <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Formats</p>
                       <p className="text-sm font-semibold text-gray-700">{item.formats}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Max Size</p>
                       <p className="text-sm font-bold text-blue-600">{item.size}</p>
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Best Practices</p>
                       <ul className="space-y-1.5">
                          {item.details.map((d, i) => (
                            <li key={i} className="text-[10px] text-gray-500 flex items-start">
                               <CheckCircle size={10} className="mr-1.5 mt-0.5 text-green-500 shrink-0" />
                               {d}
                            </li>
                          ))}
                       </ul>
                    </div>
                 </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-100 rounded-xl flex items-start space-x-3">
             <AlertCircle size={18} className="text-yellow-600 mt-0.5 shrink-0" />
             <div className="text-xs text-yellow-800 leading-relaxed">
                <p className="font-bold mb-1">Important Note</p>
                Meta Graph API v19.0+ enforces strict size validation. If your media exceeds these limits, the campaign status will show as <b>FAILED</b> with a "Media size too large" error.
             </div>
          </div>
        </div>

        <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-center">
          <button 
            onClick={onClose}
            className="px-10 py-2.5 bg-gray-900 text-white font-bold rounded-xl text-sm hover:bg-black transition-all shadow-md hover:-translate-y-0.5 transform active:scale-95"
          >
            Got it, Clear!
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;
