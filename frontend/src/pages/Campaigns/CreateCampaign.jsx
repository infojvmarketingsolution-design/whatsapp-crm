import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ChevronRight, Send, UploadCloud, Download, AlertCircle, Info, Trash2, X, Image as ImageIcon, Video, FileText as FileIcon } from 'lucide-react';
import Papa from 'papaparse';

function CreateCampaign() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    templateId: '',
    templateComponents: { header: null, body: { variables: [] } },
    audienceTags: [],
    uploadedContacts: []
  });

  const [templates, setTemplates] = useState([]);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [showMediaGuide, setShowMediaGuide] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const selectedTemplate = templates.find(t => t._id === formData.templateId);
  const [newTemplate, setNewTemplate] = useState({ 
    name: '', category: 'MARKETING', language: 'en', 
    headerType: 'NONE', headerText: '', headerMediaUrl: '', headerFile: null,
    latitude: '', longitude: '',
    bodyText: '', footerText: '', buttons: [] 
  });
  const headerFileRef = React.useRef(null);

  const fileInputRef = React.useRef(null);
  
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
            const normalizedPhone = rawPhone.replace(/[^\d+]/g, '');
            
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

    const components = [];
    
    if (newTemplate.headerType !== 'NONE') {
      if (newTemplate.headerType === 'TEXT' && newTemplate.headerText) {
         components.push({ type: 'HEADER', format: 'TEXT', text: newTemplate.headerText });
      } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(newTemplate.headerType)) {
         let finalUrl = newTemplate.headerMediaUrl;
         
         // If a file is selected, upload it first
         if (newTemplate.headerFile) {
            const formDataMedia = new FormData();
            formDataMedia.append('file', newTemplate.headerFile);
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
                finalUrl = window.location.origin + '/api' + uploadData.url;
              } else {
                const errorData = await uploadRes.json();
                alert('Media upload failed: ' + (errorData.message || uploadRes.statusText));
                setLoading(false);
                return;
              }
            } catch (err) {
              console.error(err);
              alert('Media upload error: ' + err.message);
              setLoading(false);
              return;
            }
         }

         if (finalUrl) {
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
    
    components.push({ type: 'BODY', text: newTemplate.bodyText });
    
    if (newTemplate.footerText) {
       components.push({ type: 'FOOTER', text: newTemplate.footerText });
    }
    
    if (newTemplate.buttons.length > 0) {
        const hasCTA = newTemplate.buttons.some(b => b.type === 'URL' || b.type === 'PHONE_NUMBER');
        const hasQuickReply = newTemplate.buttons.some(b => b.type === 'QUICK_REPLY');

        if (hasCTA && hasQuickReply) {
           alert('Meta does not allow mixing "Visit Website/Call Phone" buttons with "Quick Reply" buttons in the same template. Please use only one type.');
           setLoading(false);
           return;
        }

       const metaBtns = newTemplate.buttons.map(b => {
          if (!b.text) return null;
          
          if (b.text.length > 25) {
             alert(`Button text "${b.text}" is too long. Meta allows maximum 25 characters. Current: ${b.text.length}`);
             setLoading(false);
             throw new Error('Button text too long');
          }

          if (b.type === 'URL' && b.url) {
             let finalUrl = b.url.trim();
             if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                finalUrl = 'https://' + finalUrl;
             }
             return { type: 'URL', text: b.text, url: finalUrl };
          }
          if (b.type === 'PHONE_NUMBER' && b.phoneNumber) return { type: 'PHONE_NUMBER', text: b.text, phone_number: b.phoneNumber };
          if (b.type === 'QUICK_REPLY') return { type: 'QUICK_REPLY', text: b.text };
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
           components
        })
      });
      if (res.ok) {
        const created = await res.json();
        setTemplates([created, ...templates]);
        setFormData({ ...formData, templateId: created._id });
        setIsCreatingTemplate(false);
        setNewTemplate({ name: '', category: 'MARKETING', language: 'en', headerType: 'NONE', headerText: '', headerMediaUrl: '', bodyText: '', footerText: '', buttons: [] });
      } else {
        const err = await res.json();
        let errorMsg = err.error || err.message || 'Error occurred';
        
        // If the backend provided more details (Meta API error), include them
        const details = err.metaDetails?.fbtrace_id ? ` (Trace ID: ${err.metaDetails.fbtrace_id})` : '';
        alert('Failed: ' + errorMsg + details);
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
          uploadedContacts: formData.uploadedContacts
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
    <div className="p-8 bg-crm-bg min-h-full animate-fade-in-up">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/campaigns')} className="flex items-center text-gray-500 hover:text-gray-800 mb-6 transition-colors font-medium">
          <ArrowLeft size={16} className="mr-2" /> Back to Campaigns
        </button>

        <div className="bg-white rounded-xl shadow-premium border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-8">Create New Campaign</h1>

          {/* Stepper */}
          <div className="flex items-center mb-10">
            {[1, 2, 3, 4].map((s, idx) => (
              <React.Fragment key={s}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step >= s ? 'bg-blue-600 text-white shadow-glow' : 'bg-gray-100 text-gray-400'}`}>
                  {step > s ? <CheckCircle size={16} /> : s}
                </div>
                {idx < 3 && <div className={`flex-1 h-1 mx-2 rounded ${step > s ? 'bg-blue-600' : 'bg-gray-100'}`}></div>}
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
                <div className="flex justify-between items-center">
                   <h2 className="text-xl font-bold text-gray-800">{isCreatingTemplate ? 'Create New Template' : 'Select Template'}</h2>
                   {!isCreatingTemplate && (
                     <button onClick={() => setIsCreatingTemplate(true)} className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors border border-transparent hover:border-blue-100">+ New Template</button>
                   )}
                </div>

                {isCreatingTemplate ? (
                   <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 animate-fade-in">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Template Name</label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. spring_promo_v1" value={newTemplate.name} onChange={e => setNewTemplate({...newTemplate, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')})} />
                        <p className="text-[10px] text-gray-400 mt-1">Only lowercase alphanumeric characters and underscores allowed.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                          <select className="w-full px-3 py-2 border border-gray-200 rounded-md outline-none bg-white focus:ring-2 focus:ring-blue-500" value={newTemplate.category} onChange={e => setNewTemplate({...newTemplate, category: e.target.value})}>
                             <option value="MARKETING">Marketing</option>
                             <option value="UTILITY">Utility</option>
                             <option value="AUTHENTICATION">Authentication</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Language</label>
                          <select className="w-full px-3 py-2 border border-gray-200 rounded-md outline-none bg-white focus:ring-2 focus:ring-blue-500" value={newTemplate.language} onChange={e => setNewTemplate({...newTemplate, language: e.target.value})}>
                             <option value="en">English (en)</option>
                             <option value="en_US">English (US)</option>
                             <option value="es">Spanish (es)</option>
                          </select>
                        </div>
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
                           <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Header Text" value={newTemplate.headerText} onChange={e => setNewTemplate({...newTemplate, headerText: e.target.value})} maxLength={60} />
                        )}
                        {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(newTemplate.headerType) && (
                           <div className="space-y-3">
                             <div 
                               className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors"
                               onClick={() => headerFileRef.current?.click()}
                             >
                                <input 
                                  type="file" 
                                  ref={headerFileRef} 
                                  className="hidden" 
                                  accept={newTemplate.headerType === 'IMAGE' ? "image/*" : newTemplate.headerType === 'VIDEO' ? "video/*" : ".pdf,.doc,.docx"} 
                                  onChange={(e) => setNewTemplate({...newTemplate, headerFile: e.target.files[0], headerMediaUrl: ''})} 
                                />
                                {newTemplate.headerFile ? (
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
                               onChange={e => setNewTemplate({...newTemplate, headerMediaUrl: e.target.value, headerFile: null})} 
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
                        <textarea className="w-full px-3 py-2 border border-gray-200 rounded-md outline-none min-h-[100px] focus:ring-2 focus:ring-blue-500" placeholder="Hello {{1}}, your order {{2}} is ready." value={newTemplate.bodyText} onChange={e => setNewTemplate({...newTemplate, bodyText: e.target.value})}></textarea>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Footer (Optional)</label>
                        <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm italic" placeholder="Short footer text (e.g. Reply STOP to unsubscribe)" value={newTemplate.footerText} onChange={e => setNewTemplate({...newTemplate, footerText: e.target.value})} maxLength={60} />
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                           <label className="block text-sm font-semibold text-gray-700">Interactive Buttons</label>
                           {newTemplate.buttons.length < 3 && (
                             <button type="button" onClick={() => {
                               setNewTemplate({...newTemplate, buttons: [...newTemplate.buttons, {type: 'URL', text: '', url: ''}]});
                             }} className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100">+ Add Button</button>
                           )}
                        </div>
                        {newTemplate.buttons.map((btn, idx) => (
                           <div key={idx} className="flex gap-2 mb-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                              <select className="px-2 py-1 border border-gray-200 rounded text-xs bg-white" value={btn.type} onChange={e => {
                                 const btns = [...newTemplate.buttons]; btns[idx].type = e.target.value; btns[idx].url = ''; btns[idx].phoneNumber = ''; setNewTemplate({...newTemplate, buttons: btns});
                              }}>
                                 <option value="URL">Visit Website</option>
                                 <option value="PHONE_NUMBER">Call Phone</option>
                                 <option value="QUICK_REPLY">Quick Reply</option>
                              </select>
                              <div className="flex-1 relative">
                                <input type="text" className={`w-full px-2 py-1.5 border rounded text-xs ${btn.text.length > 25 ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} placeholder="Button Text" value={btn.text} onChange={e => {
                                   const btns = [...newTemplate.buttons]; btns[idx].text = e.target.value; setNewTemplate({...newTemplate, buttons: btns});
                                }} maxLength={50} />
                                <span className={`absolute right-1 -bottom-3 text-[8px] font-bold ${btn.text.length > 25 ? 'text-red-500' : 'text-gray-400'}`}>{btn.text.length}/25</span>
                              </div>
                              
                              {btn.type === 'URL' && <input type="text" className="flex-[1.5] px-2 py-1.5 border border-gray-200 rounded text-xs" placeholder="https://..." value={btn.url} onChange={e => {
                                 const btns = [...newTemplate.buttons]; btns[idx].url = e.target.value; setNewTemplate({...newTemplate, buttons: btns});
                              }} />}
                              {btn.type === 'PHONE_NUMBER' && <input type="text" className="flex-[1.5] px-2 py-1.5 border border-gray-200 rounded text-xs" placeholder="+12345678" value={btn.phoneNumber} onChange={e => {
                                 const btns = [...newTemplate.buttons]; btns[idx].phoneNumber = e.target.value; setNewTemplate({...newTemplate, buttons: btns});
                              }} />}
                              
                              <button type="button" onClick={() => {
                                 const btns = newTemplate.buttons.filter((_, i) => i !== idx); setNewTemplate({...newTemplate, buttons: btns});
                              }} className="text-gray-400 hover:text-red-500 font-bold px-2 rounded transition-colors">×</button>
                           </div>
                        ))}
                      </div>

                      <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-100">
                         <button onClick={() => setIsCreatingTemplate(false)} className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                         <button onClick={handleCreateTemplate} disabled={!newTemplate.name || !newTemplate.bodyText || loading} className="px-5 py-2 text-sm font-bold bg-[var(--theme-bg)] text-white rounded-lg hover:bg-teal-900 disabled:opacity-50 transition-colors shadow-sm flex items-center">
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
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Target by Tags</label>
                    <input 
                      type="text" 
                      placeholder="Enter tags separated by comma (e.g., vip, active)" 
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all mb-2"
                      value={formData.audienceTags.join(', ')}
                      onChange={e => setFormData({ ...formData, audienceTags: e.target.value.split(',').map(t => t.trim()), uploadedContacts: [] })}
                    />
                    <p className="text-xs text-gray-400">Leave blank if uploading a CSV file.</p>
                  </div>
                  
                  <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center hover:bg-gray-50 hover:border-blue-300 transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                     <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                     <UploadCloud size={32} className="text-blue-500 mb-3" />
                     <p className="text-sm font-bold text-gray-700 text-center">Upload CSV List</p>
                     <p className="text-xs text-gray-500 mt-1 mb-3 text-center truncate max-w-[200px]">
                        {formData.uploadedContacts.length > 0 ? <span className="text-green-600 font-bold">{formData.uploadedContacts.length} contacts loaded</span> : 'Drag and drop or click target'}
                     </p>
                     <button onClick={downloadSampleCSV} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 flex items-center transition-colors">
                        <Download size={12} className="mr-1" /> Download Demo CSV
                     </button>
                  </div>
               </div>

                <div className="p-4 bg-brand-light/10 border border-[var(--theme-border)]/20 rounded-lg flex items-start space-x-3 text-[var(--theme-text)] mt-6">
                   <AlertCircle size={20} className="mt-0.5 shrink-0" />
                   <div className="text-sm">
                     {formData.uploadedContacts.length > 0 ? (
                       <p>This campaign will target the <b>{formData.uploadedContacts.length}</b> custom contacts uploaded directly via your CSV file.</p>
                     ) : (
                       <p>This will target approximately <b>500</b> predefined contacts that match the tag requirements and have opted in.</p>
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
                   <div className="flex justify-between pb-1">
                     <span className="text-gray-500">Target Audience</span>
                     <span className="font-bold text-gray-800">
                        {formData.uploadedContacts.length > 0 ? `${formData.uploadedContacts.length} CSV Contacts` : (formData.audienceTags.join(', ') || 'All Contacts')}
                     </span>
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
                                     const finalUrl = window.location.origin + '/api' + uploadData.url;
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
