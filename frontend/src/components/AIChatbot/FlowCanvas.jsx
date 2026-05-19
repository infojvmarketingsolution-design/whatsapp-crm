import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { MessageSquare, HelpCircle, Award, Target } from 'lucide-react';

const CustomNode = ({ data }) => {
  const isStart = (data.id || '').toUpperCase() === 'GREETING' || (data.type || '').toUpperCase() === 'GREETING';
  const Icon = data.type === 'QUESTION' ? HelpCircle : data.type === 'SUCCESS_PROOF' ? Award : MessageSquare;
  
  return (
    <div className={`px-4 py-3 shadow-premium rounded-xl border-2 bg-white min-w-[200px] ${isStart ? 'border-teal-500' : 'border-slate-200'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-300" />
      <div className="flex items-center space-x-2 mb-2 border-b border-slate-100 pb-2">
        <div className={`p-1.5 rounded-lg ${isStart ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-600'}`}>
          <Icon size={14} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{data.type || 'MESSAGE'}</span>
        {isStart && <span className="ml-auto text-[8px] font-black bg-teal-500 text-white px-1.5 py-0.5 rounded-full">START</span>}
      </div>
      <h4 className="text-sm font-bold text-slate-800 mb-1">{data.title}</h4>
      <p className="text-[10px] text-slate-500 line-clamp-2 italic">"{data.text}"</p>
      
      {data.options && data.options.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-50 space-y-1">
          {data.options.map((opt, i) => (
            <div key={i} className="flex items-center text-[9px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded-md">
              <Target size={10} className="mr-1" /> {opt.label}
            </div>
          ))}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export default function FlowCanvas({ steps }) {
  const { nodes, edges } = useMemo(() => {
    const initialNodes = [];
    const initialEdges = [];
    
    // Position parameters
    const xOffset = 300;
    const yOffset = 250;
    const levels = {}; // To track Y level per ID to avoid overlapping

    steps.forEach((step, index) => {
      // Calculate a basic grid layout based on index for now
      // A more complex layout algorithm like dagre would be better for auto-layout
      const level = Math.floor(index / 3);
      const posInLevel = index % 3;

      initialNodes.push({
        id: step.id,
        type: 'custom',
        data: { ...step },
        position: { x: posInLevel * xOffset, y: level * yOffset },
      });

      // Create edges for options
      if (step.options) {
        step.options.forEach((opt, optIndex) => {
          if (opt.nextStepId) {
            initialEdges.push({
              id: `e-${step.id}-${opt.nextStepId}-${optIndex}`,
              source: step.id,
              target: opt.nextStepId,
              label: opt.label,
              animated: true,
              style: { stroke: '#6366f1', strokeWidth: 2 },
              labelStyle: { fill: '#6366f1', fontWeight: 700, fontSize: 10 },
              type: 'smoothstep',
            });
          }
        });
      }
    });

    return { nodes: initialNodes, edges: initialEdges };
  }, [steps]);

  return (
    <div className="w-full h-[600px] bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#cbd5e1" variant="dots" />
        <Controls />
        <MiniMap />
      </ReactFlow>
      <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center">
          <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></div>
          Interactive Student Journey Map
        </p>
      </div>
    </div>
  );
}
