import React from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { MessageSquare, Image as ImageIcon, Video, HelpCircle, List } from 'lucide-react';

export default function MessageNode({ id, data }) {
  const { updateNodeData } = useReactFlow();
  
  const msgType = data.msgType || 'TEXT';

  const updateField = (field, value) => {
    updateNodeData(id, { ...data, [field]: value });
  };

  const Icon = msgType === 'IMAGE' ? ImageIcon : msgType === 'VIDEO' ? Video : msgType === 'QUESTION' ? HelpCircle : msgType === 'INTERACTIVE' ? List : MessageSquare;

  return (
    <div className="bg-white rounded-xl shadow-soft border border-blue-200 w-[300px] overflow-hidden group hover:border-blue-400 transition-colors">
      <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex items-center">
         <Icon size={14} className="text-blue-600 mr-2" />
         <span className="text-sm font-bold text-blue-800 uppercase tracking-widest text-[11px]">{msgType} Message</span>
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
            <option value="INTERACTIVE">🔘 Interactive Buttons</option>
            <option value="QUESTION">❓ Ask Question (Input)</option>
         </select>

         {(msgType === 'IMAGE' || msgType === 'VIDEO') && (
            <input 
               type="text" 
               className="w-full text-xs font-mono text-gray-600 border border-gray-200 rounded p-2 focus:outline-none focus:border-blue-500" 
               placeholder={msgType === 'IMAGE' ? "Image URL (https://...)" : "Video URL (https://...)"} 
               value={data.mediaUrl || ''} 
               onChange={(e) => updateField('mediaUrl', e.target.value)}
            />
         )}

         <textarea 
            className="w-full text-sm border-gray-200 border rounded p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[60px] resize-none outline-none" 
            placeholder={msgType === 'QUESTION' ? "Ask something (e.g. What is your email?)" : "Type your message/caption..."} 
            value={data.text || ''} 
            onChange={(e) => updateField('text', e.target.value)}
         />

         {msgType === 'INTERACTIVE' && (
            <div className="space-y-2 border-t border-gray-100 pt-3">
               <span className="text-[10px] uppercase font-bold text-gray-400 block">Button Options (Max 3)</span>
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
