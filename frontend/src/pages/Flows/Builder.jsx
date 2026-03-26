import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlow, useNodesState, useEdgesState, addEdge, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Save, Play, Pause, MessageSquare, Tag, Zap } from 'lucide-react';
import TriggerNode from './nodes/TriggerNode';
import MessageNode from './nodes/MessageNode';
import ActionNode from './nodes/ActionNode';

const nodeTypes = {
  triggerNode: TriggerNode,
  messageNode: MessageNode,
  actionNode: ActionNode
};

const initialNodes = [
  { id: 'start-1', position: { x: 250, y: 100 }, data: { label: 'Start Flow' }, type: 'input' }
];

export default function FlowBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowData, setFlowData] = useState(null);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  useEffect(() => {
    fetchFlow();
  }, [id]);

  const fetchFlow = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/flows/${id}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        setFlowData(data);
        if (data.nodes?.length > 0) setNodes(data.nodes);
        if (data.edges?.length > 0) setEdges(data.edges);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/flows/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: flowData.name, nodes, edges })
      });
      if (res.ok) alert('Flow canvas saved securely!');
      else alert('Failed to save flow');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus = flowData.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/flows/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setFlowData({ ...flowData, status: newStatus });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNode = (type) => {
    const id = `${type}-${Date.now()}`;
    const newNode = {
      id,
      type,
      position: { x: Math.random() * 200 + 400, y: Math.random() * 200 + 200 },
      data: type === 'messageNode' ? { text: '' } : type === 'actionNode' ? { tag: '' } : {}
    };
    setNodes((nds) => nds.concat(newNode));
  };

  if (!flowData) return <div className="p-10 flex h-full items-center justify-center text-gray-500 animate-pulse">Initializing Workflow Canvas...</div>;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200 shadow-sm z-10 shrink-0 relative">
         <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/flows')} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={20} /></button>
            <div>
               <div className="flex items-center">
                  <input 
                     className="text-lg font-bold text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none transition-all px-1 -ml-1"
                     value={flowData.name}
                     onChange={(e) => setFlowData({ ...flowData, name: e.target.value })}
                     onBlur={handleSave}
                     onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                  />
                  <span className={`ml-3 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${flowData.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-200 border' : 'bg-yellow-100 text-yellow-800 border-yellow-200 border'}`}>
                     {flowData.status === 'ACTIVE' ? 'Live' : 'Draft Mode'}
                  </span>
               </div>
               <p className="text-xs text-gray-500 mt-0.5">{flowData.triggerType} Trigger {flowData.triggerKeywords?.length > 0 ? `("${flowData.triggerKeywords.join(', ')}")` : ''}</p>
            </div>
         </div>
         <div className="flex items-center space-x-3">
            <button onClick={handleSave} className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold shadow-soft hover:bg-gray-50 transition-colors">
              <Save size={16} /> <span>Save Canvas</span>
            </button>
            {flowData.status === 'ACTIVE' ? (
              <button onClick={handleToggleStatus} className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-bold shadow-soft hover:bg-yellow-600 transition-colors">
                <Pause size={16} /> <span>Pause Flow</span>
              </button>
            ) : (
              <button onClick={handleToggleStatus} className="flex items-center space-x-2 px-4 py-2 bg-[var(--theme-bg)] text-white rounded-lg text-sm font-bold shadow-soft hover:bg-teal-900 transition-colors">
                <Play size={16} /> <span>Activate Flow</span>
              </button>
            )}
         </div>
      </div>
      
      <div className="flex-1 w-full h-full relative flex">
         <div className="w-[80px] bg-white border-r border-gray-200 shadow-sm flex flex-col items-center py-6 space-y-6 z-10">
            <button onClick={() => handleAddNode('messageNode')} className="flex flex-col items-center justify-center p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors group">
               <div className="bg-blue-100 p-3 rounded-xl group-hover:bg-blue-200 transition-colors mb-2 shadow-soft"><MessageSquare size={20} /></div>
               <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider text-center">Msg</span>
            </button>
            <button onClick={() => handleAddNode('actionNode')} className="flex flex-col items-center justify-center p-3 text-purple-600 hover:bg-purple-50 rounded-xl transition-colors group">
               <div className="bg-purple-100 p-3 rounded-xl group-hover:bg-purple-200 transition-colors mb-2 shadow-soft"><Tag size={20} /></div>
               <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider text-center">Tag</span>
            </button>
         </div>

         <div className="flex-1 h-full">
            <ReactFlow
               nodes={nodes}
               edges={edges}
               onNodesChange={onNodesChange}
               onEdgesChange={onEdgesChange}
               onConnect={onConnect}
               nodeTypes={nodeTypes}
               fitView
               fitViewOptions={{ padding: 0.5 }}
            >
               <Background gap={16} color="#e0e0e0" />
               <Controls />
               <MiniMap nodeStrokeColor="#999" nodeColor="#f1f1f1" nodeBorderRadius={2} />
            </ReactFlow>
         </div>
      </div>
    </div>
  );
}
