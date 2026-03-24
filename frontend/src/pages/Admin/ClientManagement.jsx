import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  Settings,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    adminName: '',
    password: '',
    plan: 'BASIC',
    maxMessagesPerDay: 1000,
    subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [configData, setConfigData] = useState({
    phoneNumberId: '',
    wabaId: '',
    accessToken: '',
    phoneNumber: '',
    wabaName: ''
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setClients(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch clients', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Client onboarded successfully!');
        setTimeout(() => {
            setShowModal(false);
            fetchClients();
            setFormData({ 
              name: '', 
              email: '', 
              phone: '', 
              companyName: '', 
              adminName: '', 
              password: '', 
              plan: 'BASIC',
              maxMessagesPerDay: 1000,
              subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
            setSuccess('');
        }, 1500);
      } else {
        setError(data.message || 'Failed to create client');
      }
    } catch (error) {
      console.error('Failed to create client', error);
      setError('Connection error. Please check if the server is running.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/clients/${selectedClient._id}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(selectedClient)
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchClients();
      }
    } catch (error) {
      console.error('Failed to update client', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/clients/${selectedClient._id}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ whatsappConfig: configData })
      });
      if (res.ok) {
        setShowConfigModal(false);
        fetchClients();
      }
    } catch (error) {
      console.error('Failed to save config', error);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (client) => {
    setSelectedClient(client);
    setShowEditModal(true);
  };

  const openConfigModal = (client) => {
    setSelectedClient(client);
    setConfigData(client.whatsappConfig || {
        phoneNumberId: '',
        wabaId: '',
        accessToken: '',
        phoneNumber: '',
        wabaName: ''
    });
    setShowConfigModal(true);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Client Management</h1>
          <p className="text-slate-500">Onboard and manage platform tenants</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 rounded-lg text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
        >
          <Plus size={18} />
          <span>Onboard New Client</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div className="relative w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search clients..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
            </div>
            <div className="flex space-x-2">
                <select className="bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none">
                    <option>All Plans</option>
                    <option>Basic</option>
                    <option>Pro</option>
                    <option>Premium</option>
                </select>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">Organization</th>
                <th className="px-6 py-4">Admin Email</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">WhatsApp API</th>
                <th className="px-6 py-4">Usage/Limit</th>
                <th className="px-6 py-4">Expires</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-12 text-slate-400">Loading clients...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-12 text-slate-400">No clients onboarded yet.</td></tr>
              ) : clients.map((client) => (
                <tr key={client._id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{client.companyName}</div>
                    <div className="text-xs text-slate-400">{client.tenantId}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{client.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                      client.plan === 'PREMIUM' ? 'bg-indigo-100 text-indigo-700' :
                      client.plan === 'PRO' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {client.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {client.whatsappConfig?.phoneNumber ? (
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{client.whatsappConfig.phoneNumber}</span>
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
                                <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                                <span>READY</span>
                            </span>
                        </div>
                    ) : (
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded">NOT CONFIG</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-slate-700">{client.maxMessagesPerDay || 1000} / day</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-600">
                      {client.subscriptionEndsAt ? new Date(client.subscriptionEndsAt).toLocaleDateString() : 'NO DATE'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1.5">
                      <div className={`w-2 h-2 rounded-full ${client.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                      <span className="text-xs font-semibold text-slate-700">{client.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(client)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" 
                        title="Edit Client"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => openConfigModal(client)}
                        className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors" 
                        title="WhatsApp Config"
                      >
                        <Settings size={16} />
                      </button>
                      <button className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors" title="Suspend Client">
                        <AlertCircle size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboarding Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Onboard New Customer</h2>
                    <p className="text-sm text-slate-500">System will automatically provision a new database instance</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6">
                {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center space-x-2">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>}
                
                {success && <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-xl flex items-center space-x-2">
                    <CheckCircle2 size={16} />
                    <span>{success}</span>
                </div>}

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Business Info</h3>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Organization Name</label>
                            <input 
                                required
                                value={formData.companyName}
                                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. Acme Corp"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Primary Email</label>
                            <input 
                                required
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="admin@acme.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Subscription Plan</label>
                            <select 
                                value={formData.plan}
                                onChange={(e) => setFormData({...formData, plan: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-700"
                            >
                                <option value="BASIC">BASIC - ₹999</option>
                                <option value="PRO">PRO - ₹1999</option>
                                <option value="PREMIUM">PREMIUM - ₹2999</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Initial User</h3>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Full Name</label>
                            <input 
                                required
                                value={formData.adminName}
                                onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Set Password</label>
                            <input 
                                required
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Daily Message Limit</label>
                            <input 
                                type="number"
                                value={formData.maxMessagesPerDay}
                                onChange={(e) => setFormData({...formData, maxMessagesPerDay: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Subscription Ends At</label>
                            <input 
                                type="date"
                                value={formData.subscriptionEndsAt}
                                onChange={(e) => setFormData({...formData, subscriptionEndsAt: e.target.value})}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end space-x-3">
                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 transition-shadow shadow-lg shadow-blue-200 disabled:opacity-70 flex items-center space-x-2"
                    >
                        {submitting && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
                        <span>{submitting ? 'Provisioning...' : 'Provision Client Instance'}</span>
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">Edit Client: {selectedClient.companyName}</h2>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateClient} className="p-6 space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Organization Name</label>
                    <input 
                        value={selectedClient.companyName}
                        onChange={(e) => setSelectedClient({...selectedClient, companyName: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Status</label>
                    <select 
                        value={selectedClient.status}
                        onChange={(e) => setSelectedClient({...selectedClient, status: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                    >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Plan</label>
                    <select 
                        value={selectedClient.plan}
                        onChange={(e) => setSelectedClient({...selectedClient, plan: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                    >
                        <option value="BASIC">BASIC</option>
                        <option value="PRO">PRO</option>
                        <option value="PREMIUM">PREMIUM</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Daily Limit</label>
                        <input 
                            type="number"
                            value={selectedClient.maxMessagesPerDay}
                            onChange={(e) => setSelectedClient({...selectedClient, maxMessagesPerDay: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Expires At</label>
                        <input 
                            type="date"
                            value={selectedClient.subscriptionEndsAt ? new Date(selectedClient.subscriptionEndsAt).toISOString().split('T')[0] : ''}
                            onChange={(e) => setSelectedClient({...selectedClient, subscriptionEndsAt: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                        />
                    </div>
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2 text-sm font-bold text-slate-600 rounded-lg outline-none">Cancel</button>
                    <button type="submit" className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm outline-none">Update Client</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Config Modal */}
      {showConfigModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">WhatsApp API Config: {selectedClient.companyName}</h2>
                <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveConfig} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Phone Number ID</label>
                        <input 
                            value={configData.phoneNumberId}
                            onChange={(e) => setConfigData({...configData, phoneNumberId: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                            placeholder="e.g. 1065432..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">WABA ID</label>
                        <input 
                            value={configData.wabaId}
                            onChange={(e) => setConfigData({...configData, wabaId: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                            placeholder="e.g. 14321..."
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Permanent Access Token</label>
                    <textarea 
                        value={configData.accessToken}
                        onChange={(e) => setConfigData({...configData, accessToken: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none h-24 font-mono text-[10px]"
                        placeholder="EAAG..."
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">WhatsApp Number</label>
                        <input 
                            value={configData.phoneNumber}
                            onChange={(e) => setConfigData({...configData, phoneNumber: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                            placeholder="+91..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Display Name</label>
                        <input 
                            value={configData.wabaName}
                            onChange={(e) => setConfigData({...configData, wabaName: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none"
                            placeholder="JV CRM"
                        />
                    </div>
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                    <button type="button" onClick={() => setShowConfigModal(false)} className="px-6 py-2 text-sm font-bold text-slate-600 rounded-lg outline-none">Cancel</button>
                    <button type="submit" className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm outline-none">Save API Credentials</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
