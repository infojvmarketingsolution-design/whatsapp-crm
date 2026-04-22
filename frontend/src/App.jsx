import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import io from 'socket.io-client';
import Sidebar from './components/Sidebar';
import GlobalSuspensionTimer from './components/GlobalSuspensionTimer';
import Inbox from './pages/Inbox';
import Contacts from './pages/Contacts';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import ApiSetup from './pages/ApiSetup';
import Campaigns from './pages/Campaigns';
import CreateCampaign from './pages/Campaigns/CreateCampaign';
import Templates from './pages/Templates';
import Flows from './pages/Flows';
import FlowBuilder from './pages/Flows/Builder';
import Pipeline from './pages/Pipeline';
import Tasks from './pages/Tasks';
import AgentsDashboard from './pages/Agents';
import WebWidget from './pages/WebWidget';
import Settings from './pages/Settings';
import AIChatbot from './pages/AIChatbot/AIChatbot';
import AdminSidebar from './components/AdminSidebar';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ClientManagement from './pages/Admin/ClientManagement';
import PlanManagement from './pages/Admin/PlanManagement';
import AdminSettings from './pages/Admin/AdminSettings';
import AdminAnalytics from './pages/Admin/AdminAnalytics';
import Maintenance from './pages/Maintenance';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AdBudgetRefill from './components/AdBudgetRefill';
import AutoLogout from './components/AutoLogout';
import UserActivityDashboard from './pages/Admin/UserActivityDashboard';
import OAuthCallback from './pages/OAuthCallback';
import { 
  Megaphone, 
  FileText, 
  Users, 
  MessageCircle, 
  Bot, 
  Wallet, 
  Database, 
  Send, 
  PlusCircle, 
  UserCircle, 
  Building2, 
  AlertCircle, 
  History, 
  Clock, 
  X, 
  Plus, 
  CheckCircle 
} from 'lucide-react';

function DashboardCard({ title, value, subtext, icon: Icon, greenBadge, onAction, actionLabel = "Add", onClick, isClickable }) {
  return (
    <div 
      onClick={isClickable ? onClick : undefined}
      className={`bg-crm-card p-5 rounded-lg shadow-sm border border-crm-border flex flex-col transition-all duration-300 group relative ${isClickable ? 'cursor-pointer hover:shadow-premium hover:border-blue-300 hover:-translate-y-1' : 'hover:shadow-soft'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xs font-semibold text-gray-400 tracking-wider uppercase">{title}</h3>
        <div className="flex items-center space-x-2">
           {onAction && (
             <button 
               onClick={(e) => { e.stopPropagation(); onAction(); }}
               className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-black uppercase flex items-center shadow-sm border border-blue-100 hover:bg-blue-600 hover:text-white"
             >
               <Plus size={10} className="mr-1" /> {actionLabel}
             </button>
           )}
           {Icon && (
             <div className={`p-2 rounded-full text-white ${isClickable ? 'bg-gradient-to-br from-blue-400 to-indigo-600 shadow-glow' : 'bg-blue-500'}`}>
                <Icon size={16} />
             </div>
           )}
        </div>
      </div>
      <div className="mb-2">
        {greenBadge ? (
          <span className="px-3 py-1 bg-brand-light text-white text-xs font-medium rounded-md">{greenBadge}</span>
        ) : (
          <span className="text-xl font-bold text-gray-800">{value}</span>
        )}
      </div>
      <div className="flex justify-between items-end">
        <p className="text-xs text-gray-500 font-medium">{subtext}</p>
        {isClickable && (
          <div className="text-[10px] text-blue-500 font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
            Details →
          </div>
        )}
      </div>
    </div>
  );
}

function LeadAnalysisCard({ title, data, type = 'status' }) {
  const max = Math.max(...(data || []).map(d => d.value), 1);
  return (
    <div className="bg-crm-card p-6 rounded-2xl shadow-soft border border-crm-border flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-black text-slate-400 tracking-widest uppercase">{title}</h3>
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
           <History size={16} />
        </div>
      </div>
      <div className="space-y-4">
        {(data || []).length === 0 ? (
          <div className="text-center py-8 text-slate-300 font-medium italic text-sm">No lead data available</div>
        ) : data.map((item, i) => (
          <div key={i} className="group cursor-default">
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
              <span>{item.label}</span>
              <span className="text-indigo-600">{item.value}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 ${type === 'status' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}
                 style={{ width: `${(item.value / max) * 100}%` }}
               />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = React.useState({ campaigns: 0, recentCampaign: '', templates: 0, contacts: 0, chats: 0 });
  const [analysisData, setAnalysisData] = React.useState({ statusStats: [], sourceStats: [] });
  const [loading, setLoading] = React.useState(true);
  const [wabaConfig, setWabaConfig] = React.useState(null);
  const [showRefillModal, setShowRefillModal] = React.useState(false);
  const [breakdownModal, setBreakdownModal] = React.useState({ show: false, category: '', categoryName: '', data: [], loading: false });
  const [pendingTasksModal, setPendingTasksModal] = React.useState({ show: false, telecallerTasks: [], counsellorTasks: [], loading: false });

  const fetchPendingTasksTeam = async () => {
    setPendingTasksModal(prev => ({ ...prev, show: true, loading: true }));
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/chat/stats/pending-tasks', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingTasksModal({
          show: true,
          telecallerTasks: data.telecallerTasks || [],
          counsellorTasks: data.counsellorTasks || [],
          loading: false
        });
      }
    } catch (err) {
      console.error('Failed to fetch pending tasks', err);
      setPendingTasksModal(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchUserBreakdown = async (category, categoryName) => {
    setBreakdownModal({ show: true, category, categoryName, data: [], loading: true });
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/chat/stats/user-breakdown?category=${category}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        setBreakdownModal(prev => ({ ...prev, data, loading: false }));
      }
    } catch (err) {
      console.error('Failed to fetch user breakdown', err);
      setBreakdownModal(prev => ({ ...prev, loading: false }));
    }
  };
  
  // Pull active user directly from local session context
  const activeUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = activeUser.name || 'Verified Agent';
  
  const refreshData = async () => {
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenantId');
        
        // Fetch data in parallel
        const [contactRes, wabaRes, campRes, tempRes, analysisRes, statsRes] = await Promise.all([
          fetch('/api/chat/contacts', { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId } }),
          fetch('/api/whatsapp/config', { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId } }),
          fetch('/api/campaigns', { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId } }),
          fetch('/api/templates', { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId } }),
          fetch('/api/chat/analysis', { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId } }),
          fetch('/api/chat/stats', { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId } })
        ]);

        if (analysisRes.ok) {
           setAnalysisData(await analysisRes.json());
        }

        if (wabaRes.ok) {
           const wConfig = await wabaRes.json();
           setWabaConfig(wConfig);
        }

        let realContacts = 0;
        let realChats = 0;
        if (contactRes.ok) {
           const cpts = await contactRes.json();
           realContacts = cpts.length;
           realChats = cpts.filter(c => c.status !== 'CLOSED_WON' && c.status !== 'CLOSED_LOST').length;
        }

        let campaignsArr = [];
        if (campRes.ok) campaignsArr = await campRes.json();

        let templatesArr = [];
        if (tempRes.ok) templatesArr = await tempRes.json();

        if (statsRes.ok) {
           const sData = await statsRes.json();
           setStats(prev => ({ ...prev, ...sData }));
        }

        setStats(prev => ({ 
          ...prev,
          campaigns: campaignsArr.length, 
          recentCampaign: campaignsArr[0]?.name || 'No campaigns yet',
          templates: templatesArr.length, 
          contacts: realContacts, 
          chats: realChats 
        }));
    } catch (err) {
        console.error('Failed to refresh dashboard stats', err);
    } finally {
        setLoading(false);
    }
  };

  const userRole = activeUser.role || localStorage.getItem('role') || 'AGENT';
  const isAdminOrSuperAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  
  React.useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 15000); 
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) {
      if (breakdownModal.show || showRefillModal || pendingTasksModal.show) {
        container.style.overflow = 'hidden';
      } else {
        container.style.overflow = 'auto';
      }
    }
    return () => {
      if (container) container.style.overflow = 'auto';
    };
  }, [breakdownModal.show, showRefillModal, pendingTasksModal.show]);

  const limitValues = { 'TIER_1': 1000, 'TIER_2': 10000, 'TIER_3': 100000, 'TIER_4': Infinity };
  const limitNum = limitValues[wabaConfig?.limitTier] || 0;
  const sentToday = wabaConfig?.sentToday || 0;
  const remainingNum = limitNum === Infinity ? Infinity : Math.max(0, limitNum - sentToday);

  return (
    <>
      <div className="p-8 bg-crm-bg min-h-full animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-sm font-bold text-gray-600 tracking-wider uppercase">Dashboard</h1>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">SaaS Workspace Overview</p>
        </div>
        <div className="flex items-center space-x-3 text-right">
          <div>
             <p className="text-sm font-black text-slate-800 capitalize leading-none mb-1">{userName}</p>
             <p className="text-[10px] font-bold text-slate-400 leading-none">{activeUser.email || 'agent@workspace.crm'}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
             <UserCircle size={24} />
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome back, <span className="capitalize">{userName}</span> 👋</h2>

      <div className="flex flex-wrap items-center gap-4 mb-8">
        {isAdminOrSuperAdmin && (
          <button onClick={() => navigate('/campaigns')} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-soft">
             <Send size={14} className="text-brand-light" />
             <span>Send campaign</span>
          </button>
        )}
        {isAdminOrSuperAdmin && (
          <>
            <button onClick={() => navigate('/templates')} className="flex items-center space-x-2 px-4 py-2 border border-blue-200 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors shadow-soft">
               <MessageCircle size={14} />
               <span>Create quick reply</span>
            </button>
            <button onClick={() => navigate('/templates')} className="flex items-center space-x-2 px-4 py-2 border border-[var(--theme-border)]/30 rounded-md text-sm font-medium text-[var(--theme-text)] bg-brand-light/10 hover:bg-brand-light/20 transition-colors shadow-soft">
               <FileText size={14} />
               <span>Create template</span>
            </button>
          </>
        )}
        <div className="flex-1 flex justify-end">
           <button onClick={refreshData} disabled={loading} className="px-6 py-2 bg-blue-500 text-white rounded-md text-sm font-bold hover:bg-blue-600 transition-colors shadow-premium hover:shadow-glow hover:-translate-y-0.5 transform disabled:opacity-50 disabled:cursor-not-allowed">
             {loading ? 'Refreshing...' : 'Refresh Data'}
           </button>
        </div>
      </div>

      {isAdminOrSuperAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-crm-card p-5 rounded-lg shadow-soft border-l-4 border-[var(--theme-border)] flex flex-col justify-center lg:col-span-2">
             <h3 className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-3">WhatsApp Business API Status</h3>
             <div>
               <span className="px-3 py-1 bg-brand-light text-white text-xs font-bold rounded-md shadow-glow">CONNECTED</span>
             </div>
          </div>
          <div className="bg-crm-card p-5 rounded-lg shadow-soft flex flex-col justify-center border border-crm-border">
             <h3 className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-3">Quality Rating</h3>
             <div>
               <span className="px-3 py-1 bg-brand-light text-white text-xs font-medium rounded-md">High</span>
             </div>
          </div>
          <div className="bg-crm-card p-5 rounded-lg shadow-soft flex flex-col justify-center relative overflow-hidden border border-crm-border">
             <h3 className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-1">WABA Phone Number</h3>
             <span className="text-md font-bold text-gray-800">{wabaConfig?.phoneNumber || 'Not Connected'}</span>
             <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wide">WhatsApp Display Name</p>
             <p className="text-sm font-bold text-[var(--theme-text)]">{wabaConfig?.wabaName || 'Not Connected'}</p>
             <div className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-brand-light/10 text-[var(--theme-text)] rounded-full">
                <UserCircle size={20} />
             </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {isAdminOrSuperAdmin && (
          <>
            <DashboardCard title="Campaigns" value={loading && stats.campaigns === 0 ? "..." : stats.campaigns} subtext={stats.campaigns > 0 ? stats.recentCampaign : "No active campaigns"} icon={Megaphone} />
            <DashboardCard title="Templates" value={loading && stats.templates === 0 ? "..." : stats.templates} subtext={`${stats.templates} Synchronized`} icon={FileText} />
          </>
        )}
        
        {/* Core Metrics shown for everyone */}
        <DashboardCard title="Contacts" value={loading && stats.contacts === 0 ? "..." : stats.contacts} subtext={`${stats.contacts} Total contacts`} icon={Users} />
        <DashboardCard title="Open Chats" value={loading && stats.chats === 0 ? "..." : stats.chats} subtext={`${stats.chats} Active conversations`} icon={MessageCircle} />

        {/* Telecaller Metrics - Priority display */}
        {userRole === 'TELECALLER' && (
           <>
              <DashboardCard title="New Leads" value={loading ? "..." : stats.newLeads} subtext="Unattended Contacts" icon={PlusCircle} />
              <DashboardCard title="Open Leads" value={loading ? "..." : stats.openLeads} subtext="Active Conversations" icon={MessageCircle} />
              <DashboardCard title="Total Visited" value={loading ? "..." : stats.totalVisit} subtext="Leads who Visited" icon={Building2} />
              <DashboardCard title="Pending Visited" value={loading ? "..." : stats.pendingVisit} subtext="Follow-up required" icon={History} />
              <DashboardCard title="Total Admissions" value={loading ? "..." : stats.totalAdmission} subtext="Closed Enrolments" icon={CheckCircle} />
              <DashboardCard title="Closed Leads" value={loading ? "..." : stats.closedLeads} subtext="Pipeline Finished" icon={X} />
           </>
        )}

        {/* Standard Agent Metrics */}
        {!isAdminOrSuperAdmin && userRole === 'AGENT' && (
           <>
              <DashboardCard title="Qualified" value={loading ? "..." : stats.qualifiedLeads} subtext="AI Qualified" icon={CheckCircle} />
              <DashboardCard title="Priority" value={loading ? "..." : (stats.hotLeads + stats.warmLeads)} subtext="Hot & Warm Leads" icon={History} />
           </>
        )}
      </div>

      {userRole === 'MANAGER_COUNSELLOUR' && (
        <div className="animate-fade-in-up">
           <h3 className="text-xs font-black text-slate-400 tracking-widest uppercase mb-4">Counsellor Progress Tracking</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <DashboardCard title="New Leads" value={loading ? "..." : stats.newLeads} subtext="Pending Initial Contact" icon={PlusCircle} />
              <DashboardCard title="Open Leads" value={loading ? "..." : stats.openLeads} subtext="Active in Pipeline" icon={MessageCircle} />
              <DashboardCard title="Total Visit" value={loading ? "..." : stats.totalVisit} subtext="Campus/Office Visits" icon={Building2} />
              <DashboardCard title="Admission Closed" value={loading ? "..." : stats.totalAdmission} subtext="Successfully Enrolled" icon={CheckCircle} />
              <DashboardCard title="Pending Admission" value={loading ? "..." : stats.pendingAdmission} subtext="Documentation Stage" icon={PlusCircle} />
              <DashboardCard title="Lead Closed" value={loading ? "..." : stats.closedLeads} subtext="Won or Lost" icon={X} />
              <DashboardCard title="Total Collection" value={loading ? "..." : `₹${stats.totalCollection?.toLocaleString()}`} subtext="Total Fee Received" icon={Wallet} />
              <DashboardCard title="Pending Collection" value={loading ? "..." : `₹${stats.pendingCollection?.toLocaleString()}`} subtext="Outstanding Balance" icon={Wallet} />
           </div>
        </div>
      )}

      {userRole === 'BUSINESS_HEAD' && (
        <div className="animate-fade-in-up mt-6">
           <h3 className="text-xs font-black text-slate-400 tracking-widest uppercase mb-4">Business Head Overview</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <DashboardCard title="New Leads" value={loading ? "..." : stats.newLeads} subtext="Pending Initial Contact" icon={PlusCircle} />
              <DashboardCard title="Open Leads" value={loading ? "..." : stats.openLeads} subtext="Active in Pipeline" icon={MessageCircle} />
              <DashboardCard title="Closed Leads" value={loading ? "..." : stats.closedLeads} subtext="Won or Lost" icon={X} />
              <DashboardCard title="Admissions" value={loading ? "..." : stats.totalAdmission} subtext="Successfully Enrolled" icon={CheckCircle} />
              <DashboardCard title="Pending Admission" value={loading ? "..." : stats.pendingAdmission} subtext="Documentation Stage" icon={History} />
              <DashboardCard title="Total Collection" value={loading ? "..." : `₹${stats.totalCollection?.toLocaleString()}`} subtext="Total Fee Received" icon={Wallet} />
              <DashboardCard title="Pending Collection" value={loading ? "..." : `₹${stats.pendingCollection?.toLocaleString()}`} subtext="Outstanding Balance" icon={Wallet} />
              <DashboardCard 
                isClickable={true}
                onClick={fetchPendingTasksTeam}
                title="Pending Tasks" 
                value={loading ? "..." : "View All"} 
                subtext="Telecallers & Counsellors" 
                icon={Clock} 
              />
           </div>
        </div>
      )}


      {!isAdminOrSuperAdmin && userRole !== 'TELECALLER' && userRole !== 'BUSINESS_HEAD' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 mt-6">
           <LeadAnalysisCard title="Lead Status Report" data={analysisData.statusStats} type="status" />
           <LeadAnalysisCard title="Lead Source Report" data={analysisData.sourceStats} type="source" />
        </div>
      )}

      {isAdminOrSuperAdmin && (
        <div className="mt-8 animate-fade-in-up">
           <div className="flex items-center space-x-2 mb-6">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              <h3 className="text-sm font-black text-slate-700 tracking-widest uppercase">Lead & Revenue Performance</h3>
              <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold animate-pulse">Live Stats</span>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <DashboardCard 
                isClickable={true} 
                onClick={() => fetchUserBreakdown('new_leads', 'New Leads')}
                title="New Leads" 
                value={loading ? "..." : stats.newLeads} 
                subtext="Pending initial contact" 
                icon={PlusCircle} 
              />
              <DashboardCard 
                isClickable={true} 
                onClick={() => fetchUserBreakdown('open_leads', 'Open Leads')}
                title="Open Leads" 
                value={loading ? "..." : stats.openLeads} 
                subtext="Active in pipeline" 
                icon={MessageCircle} 
              />
              <DashboardCard 
                isClickable={true} 
                onClick={() => fetchUserBreakdown('closed_leads', 'Lead Closed')}
                title="Lead Closed" 
                value={loading ? "..." : stats.closedLeads} 
                subtext="Total Won/Lost" 
                icon={X} 
              />
              <DashboardCard 
                isClickable={true} 
                onClick={() => fetchUserBreakdown('admissions', 'Admission Closed')}
                title="Admissions" 
                value={loading ? "..." : stats.totalAdmission} 
                subtext="Successfully enrolled" 
                icon={CheckCircle} 
              />
              <DashboardCard 
                isClickable={true} 
                onClick={() => fetchUserBreakdown('pending_admissions', 'Admissions Pending')}
                title="Admissions Pending" 
                value={loading ? "..." : stats.pendingAdmission} 
                subtext="Documentation stage" 
                icon={History} 
              />
              <DashboardCard 
                isClickable={true} 
                onClick={() => fetchUserBreakdown('collections', 'Total Fee Collection')}
                title="Total Collection" 
                value={loading ? "..." : `₹${stats.totalCollection?.toLocaleString()}`} 
                subtext="Total fee received" 
                icon={Wallet} 
              />
              <DashboardCard 
                isClickable={true} 
                onClick={() => fetchUserBreakdown('pending_collections', 'Pending Collection')}
                title="Pending Collection" 
                value={loading ? "..." : `₹${stats.pendingCollection?.toLocaleString()}`} 
                subtext="Outstanding balance" 
                icon={Wallet} 
              />
           </div>
        </div>
      )}

      {isAdminOrSuperAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard title="Reply Bots" value={loading && !wabaConfig ? "..." : "0"} subtext="0 Messages sent" icon={Bot} />
          <DashboardCard 
             title="Ad Budget Credit" 
             value={loading && !wabaConfig ? "..." : "₹0.00"} 
             subtext="Available Balance" 
             icon={Wallet} 
             onAction={() => setShowRefillModal(true)}
             actionLabel="Add"
          />
          <DashboardCard 
            title="WABA Daily Limit" 
            value={loading && !wabaConfig ? "..." : (limitNum === Infinity ? 'Unlimited' : limitNum.toLocaleString())}
            subtext={wabaConfig?.limitTier || 'Not Configured'} 
            icon={Database} 
          />
          <DashboardCard 
            title="Daily Remaining" 
            value={loading && !wabaConfig ? "..." : (remainingNum === Infinity ? 'Unlimited' : remainingNum.toLocaleString())}
            subtext={`Sent Today: ${sentToday}`} 
            icon={Database} 
          />
        </div>
      )}
      </div>

      {/* User Breakdown Modal */}
      {breakdownModal.show && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-fade-in p-4" onClick={() => setBreakdownModal(prev => ({ ...prev, show: false }))}>
           <div className="bg-white/90 backdrop-blur-xl w-full max-w-3xl rounded-[32px] shadow-2xl border border-white/20 relative overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="p-8 border-b border-slate-100 flex flex-col items-center justify-center text-center relative bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                 <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{breakdownModal.categoryName}</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">User Performance Breakdown</p>
                 </div>
                 <button onClick={() => setBreakdownModal(prev => ({ ...prev, show: false }))} className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all shadow-sm">
                    <X size={20} />
                 </button>
              </div>

              <div className="p-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
                 {breakdownModal.loading ? (
                   <div className="flex flex-col items-center justify-center py-20">
                      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Fetching data...</p>
                   </div>
                 ) : breakdownModal.data.length === 0 ? (
                   <div className="text-center py-20 text-slate-400 font-medium">No data found for this category</div>
                 ) : (
                   <div className="space-y-3">
                      {breakdownModal.data.map((user, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-soft transition-all group">
                           <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 font-black text-lg border border-slate-100 group-hover:scale-110 transition-transform">
                                 {user.name.charAt(0)}
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-800">{user.name}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{user.role} • {user.email}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-2xl font-black text-blue-600 leading-none">{user.count}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Leads</p>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </div>
              
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
                 <button onClick={() => setBreakdownModal(prev => ({ ...prev, show: false }))} className="px-8 py-3 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-premium">
                    Close Breakdown
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Pending Tasks Modal */}
      {pendingTasksModal.show && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-fade-in p-4" onClick={() => setPendingTasksModal(prev => ({ ...prev, show: false }))}>
           <div className="bg-white/90 backdrop-blur-xl w-full max-w-5xl rounded-[32px] shadow-2xl border border-white/20 relative overflow-hidden animate-scale-in flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50/50 to-purple-50/50 shrink-0">
                 <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Pending Team Tasks</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Telecallers vs Counsellors</p>
                 </div>
                 <button onClick={() => setPendingTasksModal(prev => ({ ...prev, show: false }))} className="p-3 bg-white/50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all shadow-sm">
                    <X size={20} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                 {pendingTasksModal.loading ? (
                   <div className="flex flex-col items-center justify-center py-20">
                      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading tasks...</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Telecaller Column */}
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                         <div className="flex items-center space-x-2 mb-4 border-b border-slate-50 pb-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><UserCircle size={18} /></div>
                            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Telecaller Tasks</h3>
                            <span className="ml-auto bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md">{pendingTasksModal.telecallerTasks.length} Pending</span>
                         </div>
                         <div className="space-y-3">
                            {pendingTasksModal.telecallerTasks.length === 0 ? (
                               <p className="text-xs font-medium text-slate-400 text-center py-8">No pending tasks for telecallers</p>
                            ) : (
                               pendingTasksModal.telecallerTasks.map((t, i) => (
                                 <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                       <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded-full">{t.type}</span>
                                       <span className="text-[10px] font-bold text-slate-400">{new Date(t.dueDate).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 mb-1">{t.title}</p>
                                    <div className="flex justify-between items-end mt-3">
                                       <div>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase">Contact</p>
                                          <p className="text-xs font-semibold text-slate-600">{t.contactName}</p>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned To</p>
                                          <p className="text-xs font-bold text-blue-700">{t.assignedTo}</p>
                                       </div>
                                    </div>
                                 </div>
                               ))
                            )}
                         </div>
                      </div>

                      {/* Counsellor Column */}
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                         <div className="flex items-center space-x-2 mb-4 border-b border-slate-50 pb-3">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><UserCircle size={18} /></div>
                            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Counsellor Tasks</h3>
                            <span className="ml-auto bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md">{pendingTasksModal.counsellorTasks.length} Pending</span>
                         </div>
                         <div className="space-y-3">
                            {pendingTasksModal.counsellorTasks.length === 0 ? (
                               <p className="text-xs font-medium text-slate-400 text-center py-8">No pending tasks for counsellors</p>
                            ) : (
                               pendingTasksModal.counsellorTasks.map((t, i) => (
                                 <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/30 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                       <span className="text-[10px] font-black uppercase text-purple-600 bg-purple-100/50 px-2 py-0.5 rounded-full">{t.type}</span>
                                       <span className="text-[10px] font-bold text-slate-400">{new Date(t.dueDate).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 mb-1">{t.title}</p>
                                    <div className="flex justify-between items-end mt-3">
                                       <div>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase">Contact</p>
                                          <p className="text-xs font-semibold text-slate-600">{t.contactName}</p>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned To</p>
                                          <p className="text-xs font-bold text-purple-700">{t.assignedTo}</p>
                                       </div>
                                    </div>
                                 </div>
                               ))
                            )}
                         </div>
                      </div>
                   </div>
                 )}
              </div>
              
              <div className="p-4 bg-white border-t border-slate-100 text-right shrink-0">
                 <button onClick={() => setPendingTasksModal(prev => ({ ...prev, show: false }))} className="px-6 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                    Close Monitor
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Refill Modal Overlay */}
      {showRefillModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-[6px] animate-fade-in p-4" onClick={() => setShowRefillModal(false)}>
           <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                 <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Refill Meta Ad Budget</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Select quantity and complete payment</p>
                 </div>
                 <button onClick={() => setShowRefillModal(false)} className="p-2 bg-gray-50 text-gray-400 hover:text-rose-500 rounded-full transition-colors">
                    <X size={20} />
                 </button>
              </div>
              <div className="overflow-y-auto max-h-[80vh]">
                 <AdBudgetRefill isModal={true} />
              </div>
           </div>
        </div>
      )}
    </>
  );
}

function PlaceholderPage({ title }) {
  return (
    <div className="p-10 w-full h-full bg-crm-bg flex items-center justify-center">
      <div className="bg-crm-card p-10 rounded-2xl shadow-premium inline-block border-[var(--theme-border)] animate-fade-in-up text-center max-w-lg">
         <div className="w-16 h-16 bg-brand-light/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bot size={32} className="text-[var(--theme-text)]" />
         </div>
         <h1 className="text-3xl font-bold text-gray-900 mb-3">{title} Module</h1>
         <p className="text-gray-500 font-medium leading-relaxed">This enterprise feature is currently being provisioned for your workspace and will be available shortly.</p>
         <button className="mt-8 px-6 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors">
            Return to Dashboard
         </button>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("Global Catch:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10 font-sans">
          <div className="bg-white p-10 rounded-3xl shadow-2xl border border-rose-100 max-w-xl w-full">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6"><AlertCircle size={32} /></div>
            <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Application Shell Failure</h1>
            <p className="text-sm font-bold text-slate-500 mb-8 lowercase tracking-wide">A critical runtime error has occurred in the UI layer.</p>
            <div className="bg-slate-900 rounded-2xl p-6 mb-8 overflow-x-auto">
               <code className="text-rose-400 text-xs font-mono">{this.state.error?.toString()}</code>
            </div>
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Attempt System Recovery</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/';
  const [themeColor, setThemeColor] = React.useState('#10b981'); // Default Teal
  const [isMaintenance, setIsMaintenance] = React.useState(false);
  const [whatsappConfig, setWhatsappConfig] = React.useState(null);
  const [roleAccess, setRoleAccess] = React.useState(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || 'AGENT';
  const isAdminPath = location.pathname.startsWith('/admin');

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (e) {}
    localStorage.clear();
    navigate('/login');
  };

  React.useEffect(() => {
    // 1. Initialize Facebook SDK dynamically
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (appId) {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        });
        window.FB.AppEvents.logPageView();
      };

      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    }

    const fetchGlobalTheme = async () => {
       try {
         const token = localStorage.getItem('token');
         const tenantId = localStorage.getItem('tenantId');
         if (!token) return;
         const res = await fetch(`/api/settings`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
         });
         if (res.ok) {
            const data = await res.json();
            const fetchedColor = data.customization?.themeColor;
            const locallySaved = localStorage.getItem('themeColor');
            if (fetchedColor && fetchedColor !== '#10b981') {
               setThemeColor(fetchedColor);
               localStorage.setItem('themeColor', fetchedColor);
            } else if (locallySaved && fetchedColor === '#10b981') {
               setThemeColor(locallySaved);
            }

            if (data.roleAccess) {
               setRoleAccess(data.roleAccess);
            }
         }
       } catch (e) {}
    };
    
    // Quick load from local storage
    const saved = localStorage.getItem('themeColor');
    if (saved) setThemeColor(saved);
    
    const checkMaintenance = async () => {
       try {
         const res = await fetch('/api/health');
         if (res.status === 503) {
            const data = await res.json();
            if (data.maintenance && userRole !== 'SUPER_ADMIN') {
                setIsMaintenance(true);
            }
         }
       } catch (e) {}
    };

    checkMaintenance();

    fetchGlobalTheme();
    
    const fetchWhatsappConfig = async () => {
       try {
         const token = localStorage.getItem('token');
         const tenantId = localStorage.getItem('tenantId');
         if (!token) return;
         const res = await fetch('/api/whatsapp/config', {
            headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
         });
         if (res.ok) {
            const data = await res.json();
            setWhatsappConfig(data);
         }
       } catch (e) {}
    };

    fetchWhatsappConfig();
    const configInterval = setInterval(fetchWhatsappConfig, 30000); // Poll every 30 seconds
    
    // 3. Socket Listener for Template Status Updates
    const tenantId = localStorage.getItem('tenantId');
    const socket = io('', { query: { tenantId } });
    
    socket.on('template_status_update', (data) => {
       console.log('🔔 Template Status Update:', data);
       if (data.status === 'APPROVED') {
          toast.success(`Template "${data.name}" was APPROVED! ✅`, { duration: 6000 });
       } else if (data.status === 'REJECTED') {
          toast.error(`Template "${data.name}" was REJECTED. ❌`, { duration: 8000 });
       } else {
          toast(`Template "${data.name}" status updated to: ${data.status}`, { icon: 'ℹ️' });
       }
    });

    // Listen for custom event from CustomizationSettings
    const handleThemeEvent = (e) => {
       if (e.detail?.color) {
          setThemeColor(e.detail.color);
          localStorage.setItem('themeColor', e.detail.color);
       }
    };
    window.addEventListener('themeChanged', handleThemeEvent);
    return () => {
       window.removeEventListener('themeChanged', handleThemeEvent);
       clearInterval(configInterval);
       socket.disconnect();
    };
  }, [])
  const appStyle = {
    '--theme-bg': themeColor === '#10b981' ? '#075E54' : themeColor,
    '--theme-text': themeColor === '#10b981' ? '#075E54' : themeColor,
    '--theme-border': themeColor === '#10b981' ? '#128C7E' : themeColor,
  };

  if (isMaintenance && !isAdminPath) {
    return <Maintenance />;
  }

  return (
    <div style={appStyle} className={`flex h-screen bg-crm-bg tracking-normal overflow-hidden`}>
      <Toaster position="top-right" reverseOrder={false} />
      {!isAuthPage && <AutoLogout />}
      {!isAuthPage && <GlobalSuspensionTimer />}
      {!isAuthPage && (userRole === 'SUPER_ADMIN' ? <AdminSidebar onLogout={handleLogout} /> : <Sidebar whatsappConfig={whatsappConfig} roleAccess={roleAccess} />)}
      <div className="flex-1 flex flex-col transition-all duration-300 relative z-10 overflow-hidden">
        <div id="main-scroll-container" className="flex-1 overflow-y-auto custom-scrollbar">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/inbox" element={<Inbox roleAccess={roleAccess} />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/create" element={<CreateCampaign />} />
            <Route path="/flows" element={<Flows />} />
            <Route path="/flows/:id" element={<FlowBuilder />} />
            <Route path="/agents" element={<AgentsDashboard />} />
            <Route path="/widget" element={<WebWidget />} />
            <Route path="/contacts" element={<Contacts roleAccess={roleAccess} />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/api" element={<ApiSetup />} />
            <Route path="/settings" element={<Settings roleAccess={roleAccess} />} />
            <Route path="/ai-chatbot" element={<AIChatbot />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />

            {/* Super Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/clients" element={<ClientManagement />} />
            <Route path="/admin/user-sessions" element={<UserActivityDashboard />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/plans" element={<PlanManagement />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Routes>
        </div>

        {!isAuthPage && (
          <div className="w-full py-1.5 px-8 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
             <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">System Online</span>
             </div>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Developed by J.V group | WapiPulse v1.2.5-STABLE
             </p>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppLayout />
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
