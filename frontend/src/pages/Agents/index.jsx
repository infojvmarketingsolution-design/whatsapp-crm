import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Shield, Circle, UserPlus, Search, CheckCircle, XCircle, Play, Pause } from 'lucide-react';

export default function AgentsDashboard() {
  const [agents, setAgents] = useState([]);
  const [dynamicRoles, setDynamicRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'AGENT', phoneNumber: '', mpin: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAgentsAndRoles();
  }, []);

  const fetchAgentsAndRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const [agentsRes, settingsRes] = await Promise.all([
        fetch(`/api/agents`, { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId } }),
        fetch(`/api/settings`, { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId } })
      ]);
      
      if (agentsRes.ok) {
        setAgents(await agentsRes.json());
      }
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.roleAccess) {
          const derivedRoles = Object.keys(settingsData.roleAccess).map(key => ({
            id: key,
            name: settingsData.roleAccess[key].name || key
          }));
          setDynamicRoles(derivedRoles);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({ name: '', email: '', password: '', role: 'AGENT', phoneNumber: '', mpin: '' });
    setShowModal(true);
  };

  const openEditModal = (agent) => {
    setFormData({ ...agent, password: '', mpin: '', phoneNumber: agent.phoneNumber || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const isEdit = !!formData._id;
      const url = isEdit ? `/api/agents/${formData._id}` : `/api/agents`;
      
      // Only send mpin if it's a full 6-digit entry (to avoid accidental re-hashing or clearing)
      const submitData = { ...formData };
      if (isEdit && formData.mpin.length !== 6) {
        delete submitData.mpin;
      }
      if (isEdit && !formData.password) {
        delete submitData.password;
      }

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });
      
      if (res.ok) {
        setFormData({ name: '', email: '', password: '', role: 'AGENT', phoneNumber: '', mpin: '' });
        setShowModal(false);
        fetchAgentsAndRoles();
      } else {
        const err = await res.json();
        alert(`${isEdit ? 'Update' : 'Creation'} failed: ${err.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/agents/${id}/status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchAgentsAndRoles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this agent? This action cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/agents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        fetchAgentsAndRoles();
      } else {
        const err = await res.json();
        alert(`Deletion failed: ${err.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAgents = agents.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.email.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 sm:p-8 bg-crm-bg min-h-full animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-10">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center">
            <Users className="mr-3 text-blue-600" size={28} /> Team Agents
          </h1>
          <p className="text-[10px] sm:text-sm font-black text-slate-400 mt-1 uppercase tracking-widest leading-relaxed">Manage role-based access control and active team seats.</p>
        </div>
        <button onClick={openCreateModal} className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-glow hover:bg-blue-700 transition-all active:scale-95">
          <UserPlus size={18} /> <span>Provision Seat</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-premium border border-slate-100 mb-8 overflow-hidden">
         <div className="p-4 sm:p-6 border-b border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/30">
            <div className="relative w-full sm:w-72 group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
               <input 
                  type="text" 
                  placeholder="Search agents..." 
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
               <span className="flex items-center text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap"><Circle size={10} className="fill-emerald-500 text-emerald-500 mr-2" /> ACTIVE: {agents.filter(a=>a.status==='ACTIVE').length}</span>
               <span className="flex items-center text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap"><Circle size={10} className="fill-amber-500 text-amber-500 mr-2" /> INACTIVE: {agents.filter(a=>a.status!=='ACTIVE').length}</span>
            </div>
         </div>
         
         {/* Desktop Table */}
         <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Agent Details</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Role Access</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {loading ? (
                     <tr><td colSpan="4" className="px-6 py-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Fetching Agent Roster...</td></tr>
                  ) : filteredAgents.length === 0 ? (
                     <tr><td colSpan="4" className="px-6 py-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">No agents found globally.</td></tr>
                  ) : filteredAgents.map(agent => (
                     <tr key={agent._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                           <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shadow-sm border border-blue-100">
                                 {agent.name.substring(0,2).toUpperCase()}
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-800 tracking-tight">{agent.name}</p>
                                 <p className="text-[10px] font-bold text-slate-400">{agent.email}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl w-fit border border-indigo-100">
                              <Shield size={12} />
                              <span className="text-[10px] font-black uppercase tracking-widest">{dynamicRoles.find(r => r.id === agent.role)?.name || agent.role}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           {agent.status === 'ACTIVE' ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 tracking-widest">
                                 ACTIVE
                              </span>
                           ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200 tracking-widest">
                                 SUSPENDED
                              </span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end gap-2">
                             <button onClick={() => openEditModal(agent)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit Agent"><Edit2 size={16}/></button>
                             <button onClick={() => handleToggleStatus(agent._id, agent.status)} className={`p-2 rounded-xl transition-all ${agent.status === 'ACTIVE' ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 shadow-sm'}`} title={agent.status === 'ACTIVE' ? 'Suspend Seat' : 'Reactivate'}>
                                {agent.status === 'ACTIVE' ? <XCircle size={16}/> : <CheckCircle size={16}/>}
                             </button>
                             <button onClick={() => handleDelete(agent._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete Agent"><Trash2 size={16}/></button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* Mobile Card List */}
         <div className="sm:hidden divide-y divide-slate-50">
            {loading ? (
               <div className="p-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Fetching Agent Roster...</div>
            ) : filteredAgents.length === 0 ? (
               <div className="p-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">No agents found.</div>
            ) : filteredAgents.map(agent => (
               <div key={agent._id} className="p-5 space-y-5 animate-fade-in">
                  <div className="flex items-start justify-between">
                     <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shadow-sm border border-blue-100 text-lg">
                           {agent.name.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                           <p className="text-base font-black text-slate-800 tracking-tight leading-none">{agent.name}</p>
                           <p className="text-[10px] font-bold text-slate-400 mt-1">{agent.email}</p>
                        </div>
                     </div>
                     {agent.status === 'ACTIVE' ? (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-emerald-100">Active</span>
                     ) : (
                        <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-amber-100">Suspended</span>
                     )}
                  </div>

                  <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                        <Shield size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{dynamicRoles.find(r => r.id === agent.role)?.name || agent.role}</span>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => openEditModal(agent)} className="p-3 bg-slate-100 text-slate-600 rounded-xl active:scale-90 transition-all"><Edit2 size={16}/></button>
                        <button onClick={() => handleToggleStatus(agent._id, agent.status)} className={`p-3 rounded-xl active:scale-90 transition-all ${agent.status === 'ACTIVE' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                           {agent.status === 'ACTIVE' ? <Pause size={16} fill="currentColor"/> : <Play size={16} fill="currentColor"/>}
                        </button>
                        <button onClick={() => handleDelete(agent._id)} className="p-3 bg-red-50 text-red-600 rounded-xl active:scale-90 transition-all"><Trash2 size={16}/></button>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-premium border border-gray-100 overflow-hidden transform animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                 <UserPlus className="mr-2 text-blue-600" size={20} />
                 {formData._id ? 'Edit Agent' : 'Provision New Agent'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm">
                 <XCircle size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Full Name</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-800"
                  placeholder="e.g. Jane Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Work Email</label>
                <input 
                  type="email" 
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-800"
                  placeholder="jane@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">WhatsApp Number</label>
                <input 
                  type="tel" 
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-800"
                  placeholder="e.g. 919876543210"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">6-Digit Master PIN (MPIN)</label>
                <input 
                  type="password" 
                  maxLength={6}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-800 tracking-[0.3em]"
                  placeholder="••••••"
                  value={formData.mpin || ''}
                  onChange={(e) => setFormData({...formData, mpin: e.target.value.replace(/\D/g, '')})}
                />
                <p className="text-[10px] text-gray-400 mt-2 font-medium">This MPIN will be used for secure WhatsApp login.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">{formData._id ? 'New Password (Optional)' : 'Temporary Password'}</label>
                <input 
                  type="password" 
                  required={!formData._id}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-800"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <p className="text-[10px] text-gray-400 mt-2 font-medium">The agent will use this to securely authenticate into the internal dashboard.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Agent Role</label>
                <select 
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-800 bg-white"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  {dynamicRoles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex space-x-3">
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl shadow-glow hover:bg-blue-700 transition duration-200 text-sm">
                  {formData._id ? 'Save Changes' : 'Deploy Agent Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
