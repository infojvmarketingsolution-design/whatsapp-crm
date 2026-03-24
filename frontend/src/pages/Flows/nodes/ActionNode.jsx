import React from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Tag } from 'lucide-react';

export default function ActionNode({ id, data }) {
  const { updateNodeData } = useReactFlow();
  const onTagChange = (e) => {
    updateNodeData(id, { ...data, tag: e.target.value });
  };

  return (
    <div className="bg-white rounded-xl shadow-soft border border-purple-200 w-[250px] overflow-hidden group hover:border-purple-400 transition-colors">
      <div className="bg-purple-50 px-4 py-2 border-b border-purple-100 flex items-center">
         <Tag size={13} className="text-purple-600 mr-2" />
         <span className="text-sm font-bold text-purple-800 uppercase tracking-widest text-[11px]">Action / Add Tag</span>
      </div>
      <div className="p-4 bg-white text-center flex flex-col items-center">
         <span className="text-xs text-gray-500 mb-2 font-bold">Tag to Apply</span>
         <input 
            type="text" 
            className="w-full text-center text-sm border-gray-200 bg-purple-50 text-purple-700 font-bold rounded p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none" 
            placeholder="e.g. VIP_Lead" 
            value={data.tag || ''} 
            onChange={onTagChange}
         />
      </div>
      <Handle type="target" position={Position.Top} className="w-4 h-4 bg-purple-500 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-purple-500 border-2 border-white" />
    </div>
  );
}
