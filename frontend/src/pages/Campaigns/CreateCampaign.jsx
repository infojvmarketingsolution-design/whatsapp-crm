import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ChevronRight, Send, AlertCircle, UploadCloud, Trash2, Download } from 'lucide-react';
import Papa from 'papaparse';

function CreateCampaign() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    templateId: '',
    audienceTags: [],
    uploadedContacts: []
  });
  
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ 
    name: '', category: 'MARKETING', language: 'en', 
    headerType: 'NONE', headerText: '', headerMediaUrl: '', headerFile: null,
    bodyText: '', footerText: '', buttons: [] 
  });
  const headerFileRef = React.useRef(null);

  const fileInputRef = React.useRef(null);
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          const parsed = results.data.map(row => ({
            phone: row.phone || row.Phone || row.PHONE || Object.values(row)[0],
            name: row.name || row.Name || row.NAME || ''
          })).filter(c => c.phone);
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

  const [templates, setTemplates] = useState([]);
  
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
      } else if (newTemplate.headerType === 'IMAGE') {
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
                alert('Media upload failed');
                setLoading(false);
                return;
              }
            } catch (err) {
              console.error(err);
              alert('Media upload error');
              setLoading(false);
              return;
            }
         }

         if (finalUrl) {
            components.push({ type: 'HEADER', format: 'IMAGE', example: { header_url: [finalUrl] } });
         } else {
            alert('Please provide an image URL or upload a file.');
            setLoading(false);
            return;
         }
      }
    }
    
    components.push({ type: 'BODY', text: newTemplate.bodyText });
    
    if (newTemplate.footerText) {
       components.push({ type: 'FOOTER', text: newTemplate.footerText });
    }
    
    if (newTemplate.buttons.length > 0) {
       const metaBtns = newTemplate.buttons.map(b => {
          if (b.type === 'URL' && b.text && b.url) {
             let finalUrl = b.url.trim();
             if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                finalUrl = 'https://' + finalUrl;
             }
             return { type: 'URL', text: b.text, url: finalUrl };
          }
          if (b.type === 'PHONE_NUMBER' && b.text && b.phoneNumber) return { type: 'PHONE_NUMBER', text: b.text, phone_number: b.phoneNumber };
          if (b.type === 'QUICK_REPLY' && b.text) return { type: 'QUICK_REPLY', text: b.text };
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
        if (errorMsg === 'An unknown error has occurred') {
          errorMsg += '. Please verify your WhatsApp API configuration (WABA ID/Token) and ensure all button URLs (like website links) are valid and accessible.';
        }
        alert('Failed: ' + errorMsg);
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
                        </select>
                        {newTemplate.headerType === 'TEXT' && (
                           <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500" placeholder="Header Text" value={newTemplate.headerText} onChange={e => setNewTemplate({...newTemplate, headerText: e.target.value})} maxLength={60} />
                        )}
                        {newTemplate.headerType === 'IMAGE' && (
                           <div className="space-y-3">
                             <div 
                               className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors"
                               onClick={() => headerFileRef.current?.click()}
                             >
                                <input 
                                  type="file" 
                                  ref={headerFileRef} 
                                  className="hidden" 
                                  accept="image/*" 
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
                                    <p className="text-xs font-bold text-gray-500 text-center">Click to upload image</p>
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
                               placeholder="Enter Public Image URL" 
                               value={newTemplate.headerMediaUrl} 
                               onChange={e => setNewTemplate({...newTemplate, headerMediaUrl: e.target.value, headerFile: null})} 
                             />
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
                              <input type="text" className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-xs" placeholder="Button Text" value={btn.text} onChange={e => {
                                 const btns = [...newTemplate.buttons]; btns[idx].text = e.target.value; setNewTemplate({...newTemplate, buttons: btns});
                              }} maxLength={25} />
                              
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
                  <div className="grid gap-4">
                    {templates.length === 0 && <p className="text-sm text-gray-500 italic p-4 text-center border border-dashed rounded-lg bg-gray-50">No templates found. Please create one.</p>}
                    {templates.map(t => (
                      <div 
                        key={t._id} 
                        onClick={() => setFormData({ ...formData, templateId: t._id })}
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
    </div>
  );
}

export default CreateCampaign;
