import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import API_URL from './apiConfig';
import Sidebar from './components/Sidebar';
import Inbox from './pages/Inbox';
import Contacts from './pages/Contacts';
import Login from './pages/Login';
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
import AdminSidebar from './components/AdminSidebar';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ClientManagement from './pages/Admin/ClientManagement';
import PlanManagement from './pages/Admin/PlanManagement';
import AdminSettings from './pages/Admin/AdminSettings';
import AdminAnalytics from './pages/Admin/AdminAnalytics';
import Maintenance from './pages/Maintenance';
import PrivacyPolicy from './pages/PrivacyPolicy';
import { Megaphone, FileText, Users, MessageCircle, Bot, Wallet, Database, Send, PlusCircle, UserCircle, Building2, Menu } from 'lucide-react';

function DashboardCard({ title, value, subtext, icon: Icon, greenBadge }) {
  return (
    <div className="bg-crm-card p-5 rounded-lg shadow-sm border border-crm-border flex flex-col hover:shadow-premium transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xs font-semibold text-gray-400 tracking-wider uppercase">{title}</h3>
        {Icon && <div className="p-2 bg-blue-500 rounded-full text-white"><Icon size={16} /></div>}
      </div>
      <div className="mb-2">
        {greenBadge ? (
          <span className="px-3 py-1 bg-brand-light text-white text-xs font-medium rounded-md">{greenBadge}</span>
        ) : (
          <span className="text-xl font-bold text-gray-800">{value}</span>
        )}
      </div>
      <p className="text-xs text-gray-500 font-medium">{subtext}</p>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = React.useState({ campaigns: 0, recentCampaign: '', templates: 0, contacts: 0, chats: 0 });
  const [loading, setLoading] = React.useState(true);
  const [wabaConfig, setWabaConfig] = React.useState(null);
  
  // Pull active user directly from local session context
  const activeUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = activeUser.name || 'Verified Agent';
  
  const refreshData = async () => {
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenantId');
        
        // Fetch data in parallel
        const [contactRes, wabaRes, campRes, tempRes] = await Promise.all([
          fetch(`${API_URL}/api/chat/contacts`, { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId } }),
          fetch(`${API_URL}/api/whatsapp/config`, { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId } }),
          fetch(`${API_URL}/api/campaigns`, { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId } }),
          fetch(`${API_URL}/api/templates`, { headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId } })
        ]);

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

        setStats({ 
          campaigns: campaignsArr.length, 
          recentCampaign: campaignsArr[0]?.name || 'No campaigns yet',
          templates: templatesArr.length, 
          contacts: realContacts, 
          chats: realChats 
        });
    } catch (err) {
        console.error('Failed to refresh dashboard stats', err);
    } finally {
        setLoading(false);
    }
  };

  React.useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000); // 5-second polling for a "live" feel
    return () => clearInterval(interval);
  }, []);

  const limitValues = { 'TIER_1': 1000, 'TIER_2': 10000, 'TIER_3': 100000, 'TIER_4': Infinity };
  const limitNum = limitValues[wabaConfig?.limitTier] || 0;
  const sentToday = wabaConfig?.sentToday || 0;
  const remainingNum = limitNum === Infinity ? Infinity : Math.max(0, limitNum - sentToday);

  return (
    <div className="p-4 md:p-8 bg-crm-bg min-h-full animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-sm font-bold text-gray-600 tracking-wider uppercase">Dashboard</h1>
        <div className="flex items-center space-x-2 text-gray-700 font-medium">
          <UserCircle className="text-blue-700" size={24} />
          <span className="capitalize">{userName}</span>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome back, <span className="capitalize">{userName}</span> 👋</h2>

      <div className="flex flex-wrap items-center gap-4 mb-8">
        <button onClick={() => navigate('/campaigns')} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-soft">
           <Send size={14} className="text-brand-light" />
           <span>Send campaign</span>
        </button>
        <button onClick={() => navigate('/contacts')} className="flex items-center space-x-2 px-4 py-2 border border-blue-200 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors shadow-soft">
           <PlusCircle size={14} />
           <span>Create contact</span>
        </button>
        <button onClick={() => navigate('/templates')} className="flex items-center space-x-2 px-4 py-2 border border-blue-200 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors shadow-soft">
           <MessageCircle size={14} />
           <span>Create quick reply</span>
        </button>
        <button onClick={() => navigate('/templates')} className="flex items-center space-x-2 px-4 py-2 border border-[var(--theme-border)]/30 rounded-md text-sm font-medium text-[var(--theme-text)] bg-brand-light/10 hover:bg-brand-light/20 transition-colors shadow-soft">
           <FileText size={14} />
           <span>Create template</span>
        </button>
        <div className="flex-1 flex justify-end">
           <button onClick={refreshData} disabled={loading} className="px-6 py-2 bg-blue-500 text-white rounded-md text-sm font-bold hover:bg-blue-600 transition-colors shadow-premium hover:shadow-glow hover:-translate-y-0.5 transform disabled:opacity-50 disabled:cursor-not-allowed">
             {loading ? 'Refreshing...' : 'Refresh Data'}
           </button>
        </div>
      </div>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <DashboardCard title="Campaigns" value={loading && stats.campaigns === 0 ? "..." : stats.campaigns} subtext={stats.campaigns > 0 ? stats.recentCampaign : "No active campaigns"} icon={Megaphone} />
        <DashboardCard title="Templates" value={loading && stats.templates === 0 ? "..." : stats.templates} subtext={`${stats.templates} Synchronized`} icon={FileText} />
        <DashboardCard title="Contacts" value={loading && stats.contacts === 0 ? "..." : stats.contacts} subtext={`${stats.contacts} Total contacts`} icon={Users} />
        <DashboardCard title="Open Chats" value={loading && stats.chats === 0 ? "..." : stats.chats} subtext={`${stats.chats} Active conversations`} icon={MessageCircle} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Reply Bots" value={loading && !wabaConfig ? "..." : "0"} subtext="0 Messages sent" icon={Bot} />
        <DashboardCard title="Billing Status" value="Meta Managed" subtext="Check Business Suite" icon={Wallet} />
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
    </div>
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

function MobileHeader({ onOpenMenu, themeColor }) {
  return (
    <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[var(--theme-bg)] text-white shadow-md sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <button onClick={onOpenMenu} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <Menu size={24} />
        </button>
        <span className="text-lg font-bold tracking-tight">WapiPulse</span>
      </div>
      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
        <UserCircle size={24} />
      </div>
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === '/login';
  const [themeColor, setThemeColor] = React.useState('#10b981'); // Default Teal
  const [isMaintenance, setIsMaintenance] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || 'AGENT';
  const isAdminPath = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
    navigate('/login');
  };

  React.useEffect(() => {
    const fetchGlobalTheme = async () => {
       try {
         const token = localStorage.getItem('token');
         const tenantId = localStorage.getItem('tenantId');
         if (!token) return;
         const res = await fetch(`${API_URL}/api/settings`, {
            headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
         });
         if (res.ok) {
            const data = await res.json();
            const fetchedColor = data.customization?.themeColor;
            const locallySaved = localStorage.getItem('themeColor');
            // Prevent the backend's default 'offline' teal from overwriting the user's locally preferred color
            if (fetchedColor && fetchedColor !== '#10b981') {
               setThemeColor(fetchedColor);
               localStorage.setItem('themeColor', fetchedColor);
            } else if (locallySaved && fetchedColor === '#10b981') {
               setThemeColor(locallySaved);
            }
         }
       } catch (e) {}
    };
    
    // Quick load from local storage
    const saved = localStorage.getItem('themeColor');
    if (saved) setThemeColor(saved);
    
    const checkMaintenance = async () => {
       try {
         const res = await fetch(`${API_URL}/api/health`);
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
    
    // Listen for custom event from CustomizationSettings
    const handleThemeEvent = (e) => {
       if (e.detail?.color) {
          setThemeColor(e.detail.color);
          localStorage.setItem('themeColor', e.detail.color);
       }
    };
    window.addEventListener('themeChanged', handleThemeEvent);
    return () => window.removeEventListener('themeChanged', handleThemeEvent);
  }, [userRole])

  const appStyle = {
    '--theme-bg': themeColor === '#10b981' ? '#075E54' : themeColor,
    '--theme-text': themeColor === '#10b981' ? '#075E54' : themeColor,
    '--theme-border': themeColor === '#10b981' ? '#128C7E' : themeColor,
  };

  if (isMaintenance && !isAdminPath) {
    return <Maintenance />;
  }

  return (
    <div style={appStyle} className={`flex h-screen bg-crm-bg tracking-normal overflow-hidden relative`}>
      {!isAuthPage && (
        userRole === 'SUPER_ADMIN' 
          ? <AdminSidebar onLogout={handleLogout} /> 
          : <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      )}
      
      <div className="flex-1 flex flex-col transition-all duration-300 relative z-10 overflow-hidden">
        {!isAuthPage && <MobileHeader onOpenMenu={() => setIsSidebarOpen(true)} themeColor={themeColor} />}
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/create" element={<CreateCampaign />} />
            <Route path="/flows" element={<Flows />} />
            <Route path="/flows/:id" element={<FlowBuilder />} />
            <Route path="/agents" element={<AgentsDashboard />} />
            <Route path="/widget" element={<WebWidget />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/api" element={<ApiSetup />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />

            {/* Super Admin Routes */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/clients" element={<ClientManagement />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/plans" element={<PlanManagement />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Routes>
          
          {!isAuthPage && (
            <div className="w-full py-4 text-center mt-auto bg-crm-bg shrink-0">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                  Developed by J.V group
               </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
