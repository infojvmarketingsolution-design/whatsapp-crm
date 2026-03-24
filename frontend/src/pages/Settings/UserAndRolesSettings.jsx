import React, { useState, useEffect } from 'react';
import { UserCog, UserPlus, MoreVertical } from 'lucide-react';

export default function UserAndRolesSettings() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/agents`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-40 bg-gray-200 rounded-xl"></div></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-lg font-bold text-gray-900 flex items-center">
             <UserCog className="mr-2 text-teal-600" size={20} />
             Team Members
           </h2>
           <button className="flex items-center px-4 py-2 bg-[var(--theme-bg)] text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition shadow-sm">
             <UserPlus size={16} className="mr-2" />
             Invite User
           </button>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user._id || user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900">{user.name}</td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                     <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'ADMIN' || user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'MANAGER' || user.role === 'Manager' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                     }`}>
                        {user.role}
                     </span>
                  </td>
                  <td className="px-4 py-3">
                     <span className={`flex items-center text-xs font-bold ${user.status === 'ACTIVE' || user.status === 'Active' ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${user.status === 'ACTIVE' || user.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}></span> {user.status || 'Active'}
                     </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors inline-block">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
