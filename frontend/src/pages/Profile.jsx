import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Shield, Clock, Camera, Save, 
  Key, LogOut, CheckCircle, MessageSquare, 
  KanbanSquare, CheckSquare 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    chats: 0,
    tasks: 0,
    deals: 0
  });

  useEffect(() => {
    // Mock fetching personal stats
    setStats({
      chats: Math.floor(Math.random() * 100) + 50,
      tasks: Math.floor(Math.random() * 20) + 5,
      deals: Math.floor(Math.random() * 10) + 2
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    // In a real app, we'd call an API here
    setTimeout(() => {
      localStorage.setItem('user', JSON.stringify(user));
      toast.success('Profile updated successfully');
      setLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="p-resp bg-crm-bg min-h-full animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
         <h1 className="text-xs sm:text-sm font-bold text-gray-600 tracking-wider uppercase">Account Settings</h1>
         <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage your professional identity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Quick Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] shadow-premium p-8 text-center border border-slate-100">
            <div className="relative inline-block group mb-6">
              <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-4xl font-black shadow-glow overflow-hidden">
                {user.name?.charAt(0) || 'A'}
              </div>
              <button className="absolute bottom-0 right-0 p-2.5 bg-white shadow-xl rounded-2xl text-teal-600 border border-teal-50 hover:bg-teal-50 transition-all">
                <Camera size={18} />
              </button>
            </div>
            
            <h2 className="text-xl font-bold text-slate-800 mb-1">{user.name}</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{user.role?.replace(/_/g, ' ')}</p>
            
            <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-xl text-[10px] font-black uppercase tracking-widest mb-8">
              <Shield size={14} />
              <span>Verified Agent Account</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-lg font-black text-slate-800">{stats.chats}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase">Chats</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-lg font-black text-slate-800">{stats.tasks}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase">Tasks</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <p className="text-lg font-black text-slate-800">{stats.deals}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase">Deals</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] shadow-premium p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="relative z-10">
              <h3 className="text-xs font-black text-teal-400 uppercase tracking-widest mb-4">Security Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    <Clock size={16} className="text-teal-500" />
                    <span className="text-slate-300">Last Login</span>
                  </div>
                  <span className="font-bold">Today, 10:45 AM</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    <CheckCircle size={16} className="text-teal-500" />
                    <span className="text-slate-300">2FA Status</span>
                  </div>
                  <span className="text-teal-500 font-bold uppercase text-[10px]">Enabled</span>
                </div>
              </div>
              <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2">
                <Key size={14} />
                <span>Change Password</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-[2rem] shadow-premium p-8 border border-slate-100">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center space-x-3">
              <User size={18} className="text-teal-600" />
              <span>Personal Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    value={user.name}
                    onChange={e => setUser({...user, name: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="email" 
                    value={user.email}
                    onChange={e => setUser({...user, email: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button 
                type="submit"
                disabled={loading}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-glow flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                  <>
                    <Save size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
              
              <button 
                type="button"
                onClick={handleLogout}
                className="flex-1 bg-rose-50 text-rose-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center space-x-2"
              >
                <LogOut size={16} />
                <span>Sign Out Account</span>
              </button>
            </div>
          </form>

          {/* Activity Timeline / Recent Actions */}
          <div className="bg-white rounded-[2rem] shadow-premium p-8 border border-slate-100">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center space-x-3">
              <Clock size={18} className="text-blue-600" />
              <span>Recent Activity</span>
            </h3>
            
            <div className="space-y-6">
              {[
                { type: 'CHAT', action: 'Replied to John Doe', time: '10 mins ago', icon: MessageSquare, color: 'text-teal-600 bg-teal-50' },
                { type: 'TASK', action: 'Completed Follow-up Task', time: '2 hours ago', icon: CheckSquare, color: 'text-blue-600 bg-blue-50' },
                { type: 'DEAL', action: 'Moved Lead to "In Progress"', time: 'Yesterday', icon: KanbanSquare, color: 'text-purple-600 bg-purple-50' }
              ].map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-soft transition-all border border-transparent hover:border-slate-100">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${activity.color}`}>
                      <activity.icon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{activity.action}</p>
                      <p className="text-[10px] font-medium text-slate-400">{activity.time}</p>
                    </div>
                  </div>
                  <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    {activity.type}
                  </div>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-8 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all">
              View All Activity Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
