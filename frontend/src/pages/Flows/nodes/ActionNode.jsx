import React from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Tag, Trash2 } from 'lucide-react';

export default function ActionNode({ id, data }) {
  const { updateNodeData, setNodes, setEdges } = useReactFlow();
  
  const updateField = (field, value) => {
    updateNodeData(id, { ...data, [field]: value });
  };

  const onDelete = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };

  return (
    <div className="bg-white rounded-xl shadow-soft border border-purple-200 w-[260px] overflow-hidden group hover:border-purple-400 transition-colors relative">
      <div className="bg-purple-50 px-4 py-2 border-b border-purple-100 flex items-center justify-between">
         <div className="flex items-center">
            <Tag size={13} className="text-purple-600 mr-2" />
            <span className="text-sm font-bold text-purple-800 uppercase tracking-widest text-[11px]">Action / Tag</span>
         </div>
         <button onClick={onDelete} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50">
            <Trash2 size={13} />
         </button>
      </div>
      <div className="p-4 bg-white flex flex-col space-y-3">
         <select 
            className="w-full text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
            value={data.actionType || 'ADD'}
            onChange={(e) => updateField('actionType', e.target.value)}
         >
            <option value="ADD">➕ Add Tag</option>
            <option value="REMOVE">➖ Remove Tag</option>
         </select>
         <div className="text-center">
            <span className="text-[10px] text-gray-400 uppercase font-bold mb-1.5 block">Target Tag</span>
            <input 
               type="text" 
               className="w-full text-center text-sm border-gray-200 bg-purple-50 text-purple-700 font-bold rounded p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none" 
               placeholder="e.g. VIP_Lead" 
               value={data.tag || ''} 
               onChange={(e) => updateField('tag', e.target.value)}
            />
         </div>
      </div>
      <Handle type="target" position={Position.Top} className="w-4 h-4 bg-purple-500 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-purple-500 border-2 border-white" />
    </div>
  );
}
