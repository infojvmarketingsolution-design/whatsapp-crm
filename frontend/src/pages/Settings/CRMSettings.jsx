import React, { useState, useEffect } from 'react';
import { Save, Users, Tag, GitMerge } from 'lucide-react';

export default function CRMSettings({ roleAccess }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user.role || 'AGENT').toUpperCase();
  const roleData = roleAccess?.[userRole];
  const isSuper = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  const canEditDuplicate = isSuper || roleData?.allAccess || roleData?.permissions?.includes('crm_duplicate_detection');
  const canEditAutoAssign = isSuper || roleData?.allAccess || roleData?.permissions?.includes('crm_auto_assignment');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    defaultPipelineId: '',
    duplicateDetection: true,
    autoAssignment: false,
    autoAssignmentRules: []
  });
  const [users, setUsers] = useState([]);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [newRule, setNewRule] = useState({ type: 'ROLE', targetId: '', targetName: '', limitPerDay: 5 });

  useEffect(() => {
    fetchSettings();
    if (isSuper) fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/stats/agents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.crm) {
          setSettings({
            ...data.crm,
            autoAssignmentRules: data.crm.autoAssignmentRules || []
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch CRM settings', err);
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    if (!newRule.targetId) return;
    
    let name = newRule.targetName;
    if (newRule.type === 'ROLE') {
       name = roleAccess[newRule.targetId]?.name || newRule.targetId;
    } else {
       name = users.find(u => u.userId === newRule.targetId)?.name || 'Unknown User';
    }

    const ruleToAdd = { ...newRule, targetName: name };
    setSettings({
      ...settings,
      autoAssignmentRules: [...(settings.autoAssignmentRules || []), ruleToAdd]
    });
    setShowRuleForm(false);
    setNewRule({ type: 'ROLE', targetId: '', targetName: '', limitPerDay: 5 });
  };

  const removeRule = (index) => {
    const updated = [...settings.autoAssignmentRules];
    updated.splice(index, 1);
    setSettings({ ...settings, autoAssignmentRules: updated });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      await fetch(`/api/settings/crm`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'x-tenant-id': tenantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
    } catch (err) {
      console.error('Failed to save', err);
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ label, description, checked, onChange, disabled }) => (
    <div className={`flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl transition-colors ${disabled ? '' : 'hover:border-teal-100'}`}>
      <div className="pr-4">
        <div className="text-sm font-bold text-gray-800">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</div>
      </div>
      <button 
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${checked ? 'bg-teal-500' : 'bg-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  if (loading) return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></div></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <Users className="mr-2 text-teal-600" size={20} />
          CRM Settings & Rules
        </h2>

        <div className="space-y-4">
          <Toggle 
            label="Duplicate Contact Detection" 
            description="Automatically merge or flag contacts with the same phone number or email address."
            checked={settings.duplicateDetection}
            onChange={(val) => canEditDuplicate && setSettings({...settings, duplicateDetection: val})}
            disabled={!canEditDuplicate}
          />
          
          {!canEditDuplicate && (
            <div className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center">
              <span className="font-bold mr-1 italic">RESTRICTED:</span> You do not have permission to change duplicate detection rules.
            </div>
          )}
          
          <Toggle 
            label="Auto Lead Assignment" 
            description="Round-robin assign new incoming WhatsApp leads to available active agents."
            checked={settings.autoAssignment}
            onChange={(val) => canEditAutoAssign && setSettings({...settings, autoAssignment: val})}
            disabled={!canEditAutoAssign}
          />

          {!canEditAutoAssign && (
            <div className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center">
              <span className="font-bold mr-1 italic">RESTRICTED:</span> You do not have permission to change assignment rules.
            </div>
          )}

          {/* Advanced Auto-Assignment Rules */}
          {settings.autoAssignment && (
            <div className="mt-6 p-5 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Advanced Assignment Rules</h3>
                  <p className="text-[10px] text-gray-500">Set specific daily limits per Role or per User.</p>
                </div>
                <button 
                  onClick={() => setShowRuleForm(true)}
                  className="px-3 py-1 bg-teal-50 text-teal-600 border border-teal-200 rounded-md text-[10px] font-bold hover:bg-teal-100 transition"
                >
                  + Add Rule
                </button>
              </div>

              {showRuleForm && (
                <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Type</label>
                      <select 
                        value={newRule.type}
                        onChange={(e) => setNewRule({...newRule, type: e.target.value, targetId: ''})}
                        className="w-full text-xs p-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-teal-500 outline-none"
                      >
                        <option value="ROLE">Role Based</option>
                        <option value="USER">User Based</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Target</label>
                      <select 
                        value={newRule.targetId}
                        onChange={(e) => setNewRule({...newRule, targetId: e.target.value})}
                        className="w-full text-xs p-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-teal-500 outline-none"
                      >
                        <option value="">Select {newRule.type === 'ROLE' ? 'Role' : 'User'}...</option>
                        {newRule.type === 'ROLE' ? (
                          Object.entries(roleAccess || {}).map(([key, data]) => (
                            <option key={key} value={key}>{data.name}</option>
                          ))
                        ) : (
                          users.map(u => (
                            <option key={u.userId} value={u.userId}>{u.name} ({u.role})</option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Daily Limit (Leads per day)</label>
                    <input 
                      type="number"
                      min="1"
                      value={newRule.limitPerDay}
                      onChange={(e) => setNewRule({...newRule, limitPerDay: parseInt(e.target.value)})}
                      className="w-full text-xs p-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button onClick={() => setShowRuleForm(false)} className="px-3 py-1 text-[10px] text-gray-500 hover:bg-gray-100 rounded-md">Cancel</button>
                    <button onClick={addRule} className="px-4 py-1 text-[10px] bg-teal-600 text-white rounded-md font-bold shadow-sm">Save Rule</button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {(settings.autoAssignmentRules || []).length === 0 ? (
                  <div className="text-center py-4 border border-dashed border-gray-200 rounded-lg text-gray-400 text-[10px]">
                    No advanced rules set. Default logic applies.
                  </div>
                ) : (
                  settings.autoAssignmentRules.map((rule, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-3 ${rule.type === 'ROLE' ? 'bg-blue-400' : 'bg-purple-400'}`}></div>
                        <div>
                          <div className="text-xs font-bold text-gray-800">{rule.targetName}</div>
                          <div className="text-[9px] text-gray-400 uppercase">{rule.type} Rule</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-teal-600">{rule.limitPerDay} Leads</div>
                          <div className="text-[8px] text-gray-400 uppercase">Per Day</div>
                        </div>
                        <button 
                          onClick={() => removeRule(idx)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                        >
                          <GitMerge size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-5 border-t border-gray-100 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving || (!canEditDuplicate && !canEditAutoAssign)}
            className="flex items-center px-5 py-2.5 bg-[var(--theme-bg)] text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition shadow-sm disabled:opacity-50"
          >
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span> : <Save size={16} className="mr-2" />}
            Save CRM Settings
          </button>
        </div>
      </div>
    </div>
  );
}
