import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  Shield,
  Zap,
  Crown,
  Info
} from 'lucide-react';

const PlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalSettings, setGlobalSettings] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    features: {
      whatsappApi: true,
      crm: false,
      campaigns: 'NONE',
      automation: 'NONE',
      userLimit: 1
    }
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/plans', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPlans(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch plans', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchGlobalSettings();
  }, []);

  const fetchGlobalSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setGlobalSettings(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch global settings', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = isEditing 
        ? `/api/plans/${selectedPlanId}` 
        : '/api/plans';
      
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        fetchPlans();
        resetForm();
      }
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} plan`, error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/plans/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPlans();
      }
    } catch (error) {
      console.error('Failed to delete plan', error);
    }
  };

  const openEditModal = (plan) => {
    setIsEditing(true);
    setSelectedPlanId(plan._id);
    setFormData({
        name: plan.name,
        price: plan.price,
        features: { ...plan.features }
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', price: 0, features: { whatsappApi: true, crm: false, campaigns: 'NONE', automation: 'NONE', userLimit: 1 } });
    setIsEditing(false);
    setSelectedPlanId(null);
  };

  const getPlanIcon = (name) => {
    switch(name.toUpperCase()) {
      case 'PREMIUM': return <Crown size={32} className="text-indigo-500" />;
      case 'PRO': return <Zap size={32} className="text-blue-500" />;
      default: return <Shield size={32} className="text-slate-400" />;
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscription Plans</h1>
          <p className="text-slate-500">Define pricing and feature limits for your SaaS</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 rounded-lg text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
        >
          <Plus size={18} />
          <span>Create New Plan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">No subscription plans found. Create one to get started.</div>
        ) : plans.map((plan) => (
          <div key={plan._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all border-t-4 border-t-blue-500">
            <div className="p-6 text-center border-b border-slate-50">
              <div className="mx-auto mb-4 p-3 bg-slate-50 rounded-2xl inline-block">{getPlanIcon(plan.name)}</div>
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{plan.name}</h2>
              <div className="mt-2 flex items-baseline justify-center">
                <span className="text-3xl font-bold text-slate-900">₹{plan.price}</span>
                <span className="text-slate-400 text-sm font-medium ml-1">/month</span>
              </div>
            </div>

            <div className="p-6 flex-1 bg-slate-50/30">
              <ul className="space-y-4">
                <li className="flex items-center space-x-3 text-sm font-medium text-slate-700">
                  <Check size={16} className="text-emerald-500" />
                  <span>{plan.features.userLimit === -1 ? 'Unlimited' : plan.features.userLimit} Users</span>
                </li>
                <li className="flex items-center space-x-3 text-sm font-medium text-slate-700">
                  {plan.features.whatsappApi ? <Check size={16} className="text-emerald-500" /> : <X size={16} className="text-red-400" />}
                  <span>WhatsApp Business API</span>
                </li>
                 <li className="flex items-center space-x-3 text-sm font-medium text-slate-700">
                  {plan.features.crm ? (
                    globalSettings?.allowedModules?.crm ? <Check size={16} className="text-emerald-500" /> : <Info size={16} className="text-amber-500" />
                  ) : <X size={16} className="text-red-400" />}
                  <span>CRM {globalSettings?.allowedModules?.crm === false && plan.features.crm && <span className="text-[10px] text-amber-600 font-bold ml-1 uppercase">(Globally Disabled)</span>}</span>
                </li>
                 <li className="flex items-center space-x-3 text-sm font-medium text-slate-700">
                  <div className={`w-1.5 h-1.5 rounded-full ${plan.features.campaigns !== 'NONE' ? (globalSettings?.allowedModules?.campaigns ? 'bg-emerald-500' : 'bg-amber-400') : 'bg-slate-300'}`}></div>
                  <span>Campaigns: <span className="font-bold">{plan.features.campaigns}</span> {globalSettings?.allowedModules?.campaigns === false && plan.features.campaigns !== 'NONE' && <span className="text-[10px] text-amber-600 font-bold ml-1 uppercase">(Disabled)</span>}</span>
                </li>
                <li className="flex items-center space-x-3 text-sm font-medium text-slate-700">
                  <div className={`w-1.5 h-1.5 rounded-full ${plan.features.automation !== 'NONE' ? (globalSettings?.allowedModules?.automation ? 'bg-emerald-500' : 'bg-amber-400') : 'bg-slate-300'}`}></div>
                  <span>Automation: <span className="font-bold">{plan.features.automation}</span> {globalSettings?.allowedModules?.automation === false && plan.features.automation !== 'NONE' && <span className="text-[10px] text-amber-600 font-bold ml-1 uppercase">(Disabled)</span>}</span>
                </li>
              </ul>
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex justify-end space-x-2">
                <button 
                    onClick={() => openEditModal(plan)}
                    className="flex-1 py-2 text-blue-600 font-bold text-sm bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                    Edit Plan
                </button>
                <button 
                    onClick={() => handleDelete(plan._id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <Trash2 size={18} />
                </button>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">{isEditing ? 'Edit Subscription Plan' : 'Define New Plan'}</h2>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 p-2"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Plan Name</label>
                        <input 
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. BUSINESS PRO"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Price (INR)</label>
                        <input 
                            required
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({...formData, price: e.target.value})}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Feature Set</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-xs font-bold text-slate-700 uppercase">Enable CRM</span>
                            <input 
                                type="checkbox"
                                checked={formData.features.crm}
                                onChange={(e) => setFormData({
                                    ...formData, 
                                    features: { ...formData.features, crm: e.target.checked }
                                })}
                                className="w-5 h-5 rounded accent-blue-600"
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-xs font-bold text-slate-700 uppercase">User Limit</span>
                            <select 
                                value={formData.features.userLimit}
                                onChange={(e) => setFormData({
                                    ...formData, 
                                    features: { ...formData.features, userLimit: parseInt(e.target.value) }
                                })}
                                className="bg-transparent font-bold text-blue-600 text-sm outline-none"
                            >
                                <option value="1">1</option>
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="-1">UL</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Campaigns Access</label>
                            <select 
                                value={formData.features.campaigns}
                                onChange={(e) => setFormData({
                                    ...formData, 
                                    features: { ...formData.features, campaigns: e.target.value }
                                })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                            >
                                <option value="NONE">None</option>
                                <option value="LIMITED">Limited</option>
                                <option value="FULL">Full</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Automation Access</label>
                            <select 
                                value={formData.features.automation}
                                onChange={(e) => setFormData({
                                    ...formData, 
                                    features: { ...formData.features, automation: e.target.value }
                                })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                            >
                                <option value="NONE">None</option>
                                <option value="LIMITED">Limited</option>
                                <option value="FULL">Full</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end space-x-3">
                    <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-6 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" className="px-8 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 transition-shadow shadow-lg shadow-blue-100">
                        {isEditing ? 'Save Changes' : 'Publish Plan'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanManagement;
