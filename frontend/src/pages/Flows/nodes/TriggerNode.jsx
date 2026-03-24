import React from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Zap } from 'lucide-react';

export default function TriggerNode({ id, data }) {
  const { updateNodeData } = useReactFlow();

  const onTriggerWordsChange = (e) => {
    updateNodeData(id, { ...data, triggerWords: e.target.value });
  };

  return (
    <div className="bg-white rounded-xl shadow-premium border-2 border-green-500 w-[280px] overflow-hidden group hover:border-green-600 transition-colors">
      <div className="bg-green-500 px-4 py-2 flex items-center">
         <Zap size={16} className="text-white mr-2" />
         <span className="text-sm font-bold text-white uppercase tracking-wider">Start Trigger</span>
      </div>
      <div className="p-4 bg-green-50 pb-6 text-center">
         <p className="text-[10px] text-green-700 font-bold mb-2 uppercase tracking-widest">Keyword Listener</p>
         <input 
            type="text" 
            className="w-full text-center text-sm font-bold text-gray-800 bg-white border border-green-200 rounded-lg p-2 focus:ring-2 focus:ring-green-400 outline-none" 
            placeholder="Any Message" 
            value={data.triggerWords || ''} 
            onChange={onTriggerWordsChange}
         />
         <p className="text-[9px] text-green-600 mt-2 font-medium italic opacity-70">Leave empty to trigger on any message</p>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-green-500 border-2 border-white" />
    </div>
  );
}
