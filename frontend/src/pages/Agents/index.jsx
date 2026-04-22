import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Shield, Circle, UserPlus, Search, CheckCircle, XCircle } from 'lucide-react';

export default function AgentsDashboard() {
  const [agents, setAgents] = useState([]);
  const [dynamicRoles, setDynamicRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'AGENT', phoneNumber: '' });
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
    setFormData({ name: '', email: '', password: '', role: 'AGENT', phoneNumber: '' });
    setShowModal(true);
  };

  const openEditModal = (agent) => {
    setFormData({ ...agent, password: '', phoneNumber: agent.phoneNumber || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const isEdit = !!formData._id;
      const url = isEdit ? `/api/agents/${formData._id}` : `/api/agents`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setFormData({ name: '', email: '', password: '', role: 'AGENT', phoneNumber: '' });
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
    <div className="p-8 bg-crm-bg min-h-full animate-fade-in-up">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Users className="mr-3 text-blue-600" /> Team Agents
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Manage role-based access control and active team seats.</p>
        </div>
        <button onClick={openCreateModal} className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-soft hover:bg-blue-700 transition-colors shadow-glow hover:-translate-y-0.5 transform">
          <UserPlus size={18} /> <span>Provision Seat</span>
        </button>
      </div>

      <div className="bg-crm-card rounded-2xl shadow-soft border border-crm-border mb-8 overflow-hidden">
         <div className="p-4 border-b border-crm-border flex items-center justify-between bg-gray-50/50">
            <div className="relative w-72">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <input 
                  type="text" 
                  placeholder="Search agents by name or email..." 
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <div className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider space-x-4">
               <span className="flex items-center"><Circle size={10} className="fill-green-500 text-green-500 mr-1.5" /> ACTIVE SEATS: {agents.filter(a=>a.status==='ACTIVE').length}</span>
               <span className="flex items-center"><Circle size={10} className="fill-yellow-500 text-yellow-500 mr-1.5" /> INACTIVE: {agents.filter(a=>a.status!=='ACTIVE').length}</span>
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                     <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Agent Details</th>
                     <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role Access</th>
                     <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                     <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {loading ? (
                     <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-medium">Fetching Agent Roster...</td></tr>
                  ) : filteredAgents.length === 0 ? (
                     <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-medium">No agents found globally.</td></tr>
                  ) : filteredAgents.map(agent => (
                     <tr key={agent._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                           <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-sm">
                                 {agent.name.substring(0,2).toUpperCase()}
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-gray-900">{agent.name}</p>
                                 <p className="text-xs text-gray-500">{agent.email}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center space-x-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-md w-fit border border-purple-100">
                              <Shield size={12} />
                              <span className="text-[10px] font-bold tracking-widest">{dynamicRoles.find(r => r.id === agent.role)?.name || agent.role}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           {agent.status === 'ACTIVE' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                                 ACTIVE
                              </span>
                           ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
                                 SUSPENDED
                              </span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                           <button 
                              onClick={() => openEditModal(agent)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                           >
                              <Edit2 size={14} className="inline mr-1"/> Edit
                           </button>
                           <button 
                              onClick={() => handleToggleStatus(agent._id, agent.status)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                                agent.status === 'ACTIVE' 
                                  ? 'border-yellow-200 text-yellow-600 hover:bg-yellow-50' 
                                  : 'border-green-600 bg-green-600 text-white hover:bg-green-700 shadow-md shadow-green-200 ring-2 ring-green-100 ring-offset-1'
                              }`}
                           >
                              {agent.status === 'ACTIVE' ? 'Suspend Seat' : 'Reactivate Account'}
                           </button>
                           <button 
                              onClick={() => handleDelete(agent._id)}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors"
                           >
                              <Trash2 size={14} className="inline mr-1"/> Delete
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
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
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">WhatsApp Number (For OTP Login)</label>
                <input 
                  type="tel" 
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-800"
                  placeholder="e.g. 919876543210"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                />
                <p className="text-[10px] text-gray-400 mt-2 font-medium">Used to send WhatsApp OTP for secure, passwordless authentication.</p>
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
