import React from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { MessageSquare, Image as ImageIcon, Video, HelpCircle, List, Trash2, Upload, FileText } from 'lucide-react';

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
        const res = await fetch('/api/templates/upload', { // Reuse template upload route
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

  const Icon = msgType === 'IMAGE' ? ImageIcon : msgType === 'VIDEO' ? Video : msgType === 'DOCUMENT' ? FileText : msgType === 'QUESTION' ? HelpCircle : msgType === 'INTERACTIVE' || msgType === 'INTERACTIVE_MESSAGE' ? List : msgType === 'LIST_MESSAGE' ? List : MessageSquare;

  return (
    <div className="bg-white rounded-xl shadow-soft border border-blue-200 w-[320px] overflow-hidden group hover:border-blue-400 transition-colors relative">
      <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex items-center justify-between">
         <div className="flex items-center">
            <Icon size={14} className="text-blue-600 mr-2" />
            <span className="text-sm font-bold text-blue-800 uppercase tracking-widest text-[11px]">{msgType.replace('_', ' ')}</span>
         </div>
         <button onClick={onDelete} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50">
            <Trash2 size={14} />
         </button>
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
            <option value="QUESTION">❓ Ask Question (Input)</option>
         </select>

         {(msgType === 'IMAGE' || msgType === 'VIDEO' || msgType === 'DOCUMENT') && (
            <div className="space-y-2">
               <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-dashed border-gray-300">
                  <span className="text-[10px] text-gray-500 font-bold truncate pr-2">{data.mediaId ? `File Attached: ${data.mediaId.substring(0,15)}...` : `No ${msgType.toLowerCase()} selected`}</span>
                  <label className="cursor-pointer bg-white px-2 py-1 rounded border border-gray-200 text-[10px] font-bold text-blue-600 hover:bg-blue-50 transition-colors flex items-center shrink-0">
                     <Upload size={10} className="mr-1" /> Browse
                     <input type="file" className="hidden" accept={msgType === 'IMAGE' ? "image/*" : msgType === 'VIDEO' ? "video/*" : ".pdf,.doc,.docx"} onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0])} />
                  </label>
               </div>
            </div>
         )}

         <textarea 
            className="w-full text-sm border-gray-200 border rounded p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] resize-none outline-none" 
            placeholder={msgType === 'QUESTION' ? "Ask something (e.g. What is your email?)" : (msgType === 'INTERACTIVE_MESSAGE' || msgType === 'LIST_MESSAGE') ? "Main Body Description..." : "Type your message/caption..."} 
            value={data.text || ''} 
            onChange={(e) => updateField('text', e.target.value)}
         />

         {(msgType === 'INTERACTIVE' || msgType === 'INTERACTIVE_MESSAGE') && (
            <div className="space-y-3 border-t border-gray-100 pt-3">
               {msgType === 'INTERACTIVE_MESSAGE' && (
                 <>
                    <div className="space-y-1">
                       <span className="text-[10px] uppercase font-bold text-gray-400 block">Header Title (Optional)</span>
                       <input 
                          type="text" 
                          className="w-full text-xs border border-gray-200 rounded p-1.5 outline-none focus:border-blue-400" 
                          placeholder="Heading text..."
                          value={data.header?.text || ''}
                          onChange={(e) => updateField('header', { ...data.header, type: 'text', text: e.target.value })}
                       />
                    </div>
                    <div className="space-y-1">
                       <span className="text-[10px] uppercase font-bold text-gray-400 block">Footer Text (Optional)</span>
                       <input 
                          type="text" 
                          className="w-full text-xs border border-gray-200 rounded p-1.5 outline-none focus:border-blue-400" 
                          placeholder="Sub-heading..."
                          value={data.footer || ''}
                          onChange={(e) => updateField('footer', e.target.value)}
                       />
                    </div>
                 </>
               )}
               <span className="text-[10px] uppercase font-bold text-gray-400 block">Buttons (Max 3)</span>
               {[0, 1, 2].map(idx => (
                 <input 
                    key={idx}
                    type="text" 
                    className="w-full text-xs border border-gray-200 rounded p-1.5 outline-none focus:border-blue-400" 
                    placeholder={`Button ${idx + 1}`}
                    value={data.buttons?.[idx] || ''}
                    onChange={(e) => {
                       const newBtns = [...(data.buttons || ['', '', ''])];
                       newBtns[idx] = e.target.value;
                       updateField('buttons', newBtns);
                    }}
                 />
               ))}
            </div>
         )}

         {msgType === 'LIST_MESSAGE' && (
            <div className="space-y-3 border-t border-gray-100 pt-3">
               <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Menu Button Name</span>
                  <input 
                     type="text" 
                     className="w-full text-xs border border-gray-200 rounded p-1.5 outline-none focus:border-blue-400 font-bold text-blue-600" 
                     placeholder="e.g. Select Option"
                     value={data.buttonText || ''}
                     onChange={(e) => updateField('buttonText', e.target.value)}
                  />
               </div>
               <span className="text-[10px] uppercase font-bold text-gray-400 block">List Options (Max 10)</span>
               <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-1">
                  {(data.listOptions || ['', '', '']).map((opt, idx) => (
                    <input 
                       key={idx}
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
                  ))}
               </div>
            </div>
         )}

         {msgType === 'QUESTION' && (
            <div className="border-t border-gray-100 pt-3">
               <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">Save answer to variable</span>
               <input 
                  type="text" 
                  className="w-full text-xs border border-gray-200 rounded p-1.5 font-mono text-purple-600 font-bold outline-none focus:border-purple-400 focus:bg-purple-50" 
                  placeholder="e.g. customer_email"
                  value={data.variableName || ''}
                  onChange={(e) => updateField('variableName', e.target.value.toLowerCase().replace(/\s/g, '_'))}
               />
            </div>
         )}
      </div>
      <Handle type="target" position={Position.Top} className="w-4 h-4 bg-blue-500 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-blue-500 border-2 border-white" />
    </div>
  );
}
