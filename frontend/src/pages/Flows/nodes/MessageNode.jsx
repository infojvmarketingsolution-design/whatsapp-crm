import React from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { MessageSquare, Image as ImageIcon, Video, HelpCircle, List, Trash2, Upload, FileText, Sparkles } from 'lucide-react';

export default function MessageNode({ id, data }) {
  const { updateNodeData } = useReactFlow();
  
  const msgType = data.msgType || 'TEXT';

  const updateField = (field, value) => {
    updateNodeData(id, { ...data, [field]: value });
  };

   const { setNodes, setEdges } = useReactFlow();
   const onDelete = () => {
     setNodes((nds) => nds.filter((n) => n.id !== id));
     setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
   };

   const handleUpload = async (file, field = 'mediaId') => {
      const formData = new FormData();
      formData.append('file', file);
      const tenantId = localStorage.getItem('tenantId');
      const token = localStorage.getItem('token');
      
      try {
        const res = await fetch('/api/templates/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId },
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          updateField(field, data.mediaId);
          if (field === 'mediaId') updateField('mediaUrl', data.url);
        } else {
          alert('Upload failed');
        }
      } catch (err) {
        console.error(err);
        alert('Upload error');
      }
   };

   const loadDemo = () => {
     const demos = {
       'TEXT': { text: "Welcome to JV Group! 🚀 We provide end-to-end WhatsApp Marketing solutions. How can we help you today?" },
       'IMAGE': { 
         text: "Check out our JV Group office culture! 🏢 We create winning teams.",
         mediaUrl: "https://placehold.co/600x400/blue/white?text=JV+Group+Office",
         mediaId: "demo_image_id"
       },
       'VIDEO': { 
         text: "Watch how JV Group scales businesses with Automation. 🎥",
         mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
         mediaId: "demo_video_id"
       },
       'DOCUMENT': { 
         text: "Download our JV Group Portfolio 2024. 📄",
         mediaUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
         mediaId: "demo_doc_id"
       },
       'INTERACTIVE_MESSAGE': {
         header: { type: 'text', text: "JV Group Services" },
         text: "Select a service to grow your business with us.",
         footer: "Expertise in AI & Marketing",
         buttons: ["WhatsApp Marketing", "Web Development", "CRM Solutions"]
       },
       'LIST_MESSAGE': {
         text: "Explore JV Group's industry-specific solutions.",
         buttonText: "Select Industry",
         listOptions: ["Real Estate", "E-commerce", "Education", "Healthcare", "SaaS"]
       },
       'QUESTION': {
         text: "Great! To get started with JV Group, please enter your Business Name. 🏢",
         variableName: "business_name"
       }
     };

     const demoData = demos[msgType] || {};
     updateNodeData(id, { ...data, ...demoData });
   };

  const Icon = msgType === 'IMAGE' ? ImageIcon : msgType === 'VIDEO' ? Video : msgType === 'DOCUMENT' ? FileText : msgType === 'QUESTION' ? HelpCircle : msgType === 'INTERACTIVE' || msgType === 'INTERACTIVE_MESSAGE' ? List : msgType === 'LIST_MESSAGE' ? List : MessageSquare;

  return (
    <div className="bg-white rounded-xl shadow-soft border border-blue-200 w-[320px] overflow-hidden group hover:border-blue-400 transition-colors relative">
      <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex items-center justify-between">
         <div className="flex items-center">
            <Icon size={14} className="text-blue-600 mr-2" />
            <span className="text-sm font-bold text-blue-800 uppercase tracking-widest text-[11px]">{msgType.replace('_', ' ')}</span>
         </div>
         <div className="flex items-center space-x-2">
            <button onClick={loadDemo} title="Load JV Demo" className="text-blue-500 hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-100 flex items-center space-x-1">
               <Sparkles size={14} />
               <span className="text-[10px] font-bold">DEMO</span>
            </button>
            <button onClick={onDelete} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50">
               <Trash2 size={14} />
            </button>
         </div>
      </div>
      <div className="p-4 bg-white flex flex-col space-y-3">
         <select 
            className="w-full text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={msgType}
            onChange={(e) => updateField('msgType', e.target.value)}
         >
            <option value="TEXT">📝 Text Message</option>
            <option value="IMAGE">📸 Image Message</option>
            <option value="VIDEO">🎥 Video Message</option>
            <option value="DOCUMENT">📄 Document Message</option>
            <option value="INTERACTIVE_MESSAGE">🔘 Interactive Buttons</option>
            <option value="LIST_MESSAGE">📋 List Menu</option>
            <option value="CTA_URL">🔗 Website Link Button</option>
            <option value="CTA_CALL">📞 Phone Call Button</option>
            <option value="QUESTION">❓ Ask Question (Input)</option>
         </select>

         {(msgType === 'IMAGE' || msgType === 'VIDEO' || msgType === 'DOCUMENT' || msgType === 'INTERACTIVE_MESSAGE') && (
            <div className="space-y-2">
               {msgType === 'INTERACTIVE_MESSAGE' && (
                  <div className="flex space-x-2 mb-2">
                     <select className="text-[10px] w-full border rounded p-1 font-bold text-gray-600" value={data.headerType || 'image'} onChange={(e) => updateField('headerType', e.target.value)}>
                        <option value="image">📸 Image Header</option>
                        <option value="video">🎥 Video Header</option>
                        <option value="document">📄 Document Header</option>
                        <option value="text">📊 Text Header Only</option>
                     </select>
                  </div>
               )}
               {(!data.headerType || data.headerType !== 'text') && (
                 <div className="space-y-2">
                   <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-dashed border-gray-300">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 uppercase font-black">Media Source</span>
                        <span className="text-[10px] text-gray-700 font-bold truncate max-w-[150px]">{data.mediaId ? `ID: ${data.mediaId.slice(0, 10)}...` : (data.mediaUrl ? 'External Link Set' : 'No File')}</span>
                      </div>
                      <label className="cursor-pointer bg-blue-600 px-3 py-1.5 rounded shadow-sm text-[10px] font-bold text-white hover:bg-blue-700 transition-colors flex items-center shrink-0">
                         <Upload size={12} className="mr-1.5" /> Browse
                         <input 
                           type="file" 
                           className="hidden" 
                           accept={data.headerType === 'video' || msgType === 'VIDEO' ? "video/*" : data.headerType === 'document' || msgType === 'DOCUMENT' ? ".pdf,.doc,.docx,.xls,.xlsx" : "image/*"} 
                           onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])} 
                         />
                      </label>
                   </div>
                   <div className="relative group">
                      <span className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Manual Media URL (Link)</span>
                      <input 
                        type="text" 
                        placeholder="https://example.com/media.jpg"
                        className="w-full text-[10px] p-2 border border-gray-200 rounded outline-none focus:border-blue-400 bg-gray-50/50"
                        value={data.mediaUrl || ''}
                        onChange={(e) => updateField('mediaUrl', e.target.value)}
                      />
                   </div>
                 </div>
               )}
            </div>
         )}

         <textarea 
            className="w-full text-sm border-gray-200 border rounded p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] resize-none outline-none" 
            placeholder={(msgType === 'QUESTION') ? "Ask something (e.g. What is your email?)" : (msgType === 'INTERACTIVE_MESSAGE' || msgType === 'LIST_MESSAGE' || msgType === 'CTA_URL' || msgType === 'CTA_CALL') ? "Main Body Description..." : "Type your message/caption..."} 
            value={data.text || ''} 
            onChange={(e) => updateField('text', e.target.value)}
         />

         {msgType === 'INTERACTIVE_MESSAGE' && data.headerType === 'text' && (
             <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Header Text</span>
                <input 
                   type="text" 
                   className="w-full text-xs border border-gray-200 rounded p-1.5 outline-none focus:border-blue-400" 
                   placeholder="Heading text..."
                   value={data.headerText || ''}
                   onChange={(e) => updateField('headerText', e.target.value)}
                />
             </div>
         )}

         {(msgType === 'INTERACTIVE_MESSAGE') && (
            <div className="space-y-3 border-t border-gray-100 pt-3 pr-4">
               <div className="flex items-center justify-between uppercase font-bold text-gray-400 text-[9px]">
                  <span>Buttons</span>
                  <span className="text-teal-600">Reply ONLY</span>
               </div>
               {[0, 1, 2].map(idx => (
                 <div key={idx} className="space-y-1">
                    <div className="relative">
                       <input 
                          type="text" 
                          className="w-full text-xs border border-gray-200 rounded p-1.5 outline-none focus:border-blue-400 bg-blue-50/30" 
                          placeholder={`Button Text ${idx + 1}`}
                          value={data.buttons?.[idx] || ''}
                          onChange={(e) => {
                             const newBtns = [...(data.buttons || ['', '', ''])];
                             newBtns[idx] = e.target.value;
                             updateField('buttons', newBtns);
                          }}
                       />
                       {data.buttons?.[idx] && (
                          <Handle 
                             type="source" 
                             position={Position.Right} 
                             id={`btn_${idx}`} 
                             style={{ top: '50%', right: '-20px', background: '#3b82f6' }} 
                          />
                       )}
                    </div>
                 </div>
               ))}
               <div className="mt-2 text-[8px] text-gray-400 italic">
                  Note: Standard buttons can only lead to other nodes. Use "Website Link Button" node for external links.
               </div>
            </div>
         )}
         
         {(msgType === 'CTA_URL' || msgType === 'CTA_CALL') && (
            <div className="space-y-3 border-t border-gray-100 pt-3">
               <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Button Title</span>
                  <input 
                     type="text" 
                     className="w-full text-xs border border-gray-200 rounded p-1.5 outline-none focus:border-blue-400" 
                     placeholder={msgType === 'CTA_URL' ? "Visit Website" : "Call Us"}
                     value={data.ctaTitle || ''}
                     onChange={(e) => updateField('ctaTitle', e.target.value)}
                  />
               </div>
               <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">{msgType === 'CTA_URL' ? "Website URL" : "Phone Number (with country code)"}</span>
                  <input 
                     type="text" 
                     className="w-full text-xs border border-gray-200 rounded p-1.5 outline-none focus:border-blue-400" 
                     placeholder={msgType === 'CTA_URL' ? "https://example.com" : "+1234567890"}
                     value={data.ctaValue || ''}
                     onChange={(e) => updateField('ctaValue', e.target.value)}
                  />
               </div>
            </div>
         )}

         {msgType === 'LIST_MESSAGE' && (
            <div className="space-y-3 border-t border-gray-100 pt-3 pr-4">
               <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Menu Button</span>
                  <input 
                     type="text" 
                     className="w-full text-xs border border-gray-200 rounded p-1.5 outline-none focus:border-blue-400 font-bold text-blue-600" 
                     value={data.buttonText || ''}
                     onChange={(e) => updateField('buttonText', e.target.value)}
                  />
               </div>
               <span className="text-[10px] uppercase font-bold text-gray-400 block">Options</span>
               <div className="max-h-[150px] overflow-y-auto space-y-1.5">
                  {(data.listOptions || ['', '', '']).map((opt, idx) => (
                    <div key={idx} className="relative">
                       <input 
                          type="text" 
                          className="w-full text-xs border border-gray-200 rounded p-1.5 outline-none focus:border-blue-400" 
                          placeholder={`Option ${idx + 1}`}
                          value={opt}
                          onChange={(e) => {
                             const newOpts = [...(data.listOptions || ['', '', ''])];
                             newOpts[idx] = e.target.value;
                             if (idx === newOpts.length - 1 && newOpts.length < 10) newOpts.push('');
                             updateField('listOptions', newOpts);
                          }}
                       />
                       {opt && (
                          <Handle 
                             type="source" 
                             position={Position.Right} 
                             id={`list_${idx}`} 
                             style={{ top: '50%', right: '-20px', background: '#3b82f6' }} 
                          />
                       )}
                    </div>
                  ))}
               </div>
            </div>
         )}

         {msgType === 'QUESTION' && (
            <div className="border-t border-gray-100 pt-3">
               <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">Save answer to:</span>
               <input 
                  type="text" 
                  className="w-full text-xs border border-gray-200 rounded p-1.5 font-mono text-purple-600 font-bold outline-none focus:border-purple-400 focus:bg-purple-50" 
                  value={data.variableName || ''}
                  onChange={(e) => updateField('variableName', e.target.value.toLowerCase().replace(/\s/g, '_'))}
               />
            </div>
         )}
      </div>
      <Handle type="target" position={Position.Top} className="w-4 h-4 bg-blue-500 border-2 border-white" />
      {/* Default source handle for linear types or if no branches are used */}
      {(!['INTERACTIVE_MESSAGE', 'LIST_MESSAGE'].includes(msgType)) && (
         <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-blue-500 border-2 border-white" />
      )}
    </div>
  );
}
