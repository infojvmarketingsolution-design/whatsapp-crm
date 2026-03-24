import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';

export default function TriggerNode({ data }) {
  return (
    <div className="bg-white rounded-xl shadow-premium border-2 border-green-500 w-[280px] overflow-hidden">
      <div className="bg-green-500 px-4 py-2 flex items-center">
         <Zap size={16} className="text-white mr-2" />
         <span className="text-sm font-bold text-white uppercase tracking-wider">Start Trigger</span>
      </div>
      <div className="p-4 bg-green-50 pb-6 text-center">
         <p className="text-xs text-green-700 font-medium font-bold mb-2">Keyword Listener</p>
         <div className="bg-white border border-green-200 text-sm font-bold text-gray-800 p-2 rounded-lg">
             {data.triggerWords || "Any Message"}
         </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-green-500 border-2 border-white" />
    </div>
  );
}
