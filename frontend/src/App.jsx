import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
import Profile from './pages/Profile';
import MobileNavbar from './components/MobileNavbar';
import MobileHeader from './components/MobileHeader';
import NotificationCenter from './components/NotificationCenter';
import GlobalSearch from './components/GlobalSearch';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ClientManagement from './pages/Admin/ClientManagement';
import PlanManagement from './pages/Admin/PlanManagement';
import AdminSettings from './pages/Admin/AdminSettings';
import AdminAnalytics from './pages/Admin/AdminAnalytics';
import Maintenance from './pages/Maintenance';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AdBudgetRefill from './components/AdBudgetRefill';
import TeamPerformance from './pages/TeamPerformance';
import LeadReport from './pages/LeadReport';
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
  CheckCircle,
  Download,
  Phone,
  Hash,
  ChevronDown,
  Save,
  Edit3,
  User,
  GraduationCap,
  Globe,
  Map,
  Award,
  Activity,
  Calendar,
  Tag,
} from 'lucide-react';

function DashboardCard({ title, value, subtext, icon: Icon, greenBadge, onAction, actionLabel = "Add", onClick, isClickable }) {
  return (
    <div 
      onClick={isClickable ? onClick : undefined}
      className={`bg-crm-card p-3 sm:p-5 rounded-xl shadow-sm border border-crm-border flex flex-col transition-all duration-300 group relative ${isClickable ? 'cursor-pointer hover:shadow-premium hover:border-blue-300 hover:-translate-y-1' : 'hover:shadow-soft'}`}
    >
      <div className="flex justify-between items-start mb-1 sm:mb-2">
        <h3 className="text-[9px] sm:text-xs font-semibold text-gray-400 truncate pr-2">{title}</h3>
        <div className="flex items-center space-x-1 sm:space-x-2">
           {onAction && (
             <button 
               onClick={(e) => { e.stopPropagation(); onAction(); }}
               className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-bold flex items-center shadow-sm border border-blue-100 hover:bg-blue-600 hover:text-white"
             >
               <Plus size={8} className="sm:mr-1" /> <span className="hidden sm:inline">{actionLabel}</span>
             </button>
           )}
           {Icon && (
             <div className={`p-1.5 sm:p-2 rounded-full text-white ${isClickable ? 'bg-gradient-to-br from-blue-400 to-indigo-600 shadow-glow' : 'bg-blue-500'}`}>
                <Icon size={12} className="sm:w-4 sm:h-4" />
             </div>
           )}
        </div>
      </div>
      <div className="mb-1 sm:mb-2">
        {greenBadge ? (
          <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-brand-light text-white text-[10px] sm:text-xs font-medium rounded-md">{greenBadge}</span>
        ) : (
          <span className="text-lg sm:text-xl font-bold text-gray-800">{value}</span>
        )}
      </div>
      <div className="flex justify-between items-end">
        <p className="text-[9px] sm:text-xs text-gray-500 font-medium truncate pr-1">{subtext}</p>
        {isClickable && (
          <div className="text-[8px] sm:text-[10px] text-blue-500 font-bold opacity-0 sm:opacity-0 group-hover:opacity-100 transition-opacity">
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
        <h3 className="text-xs font-bold text-slate-400">{title}</h3>
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
           <History size={16} />
        </div>
      </div>
      <div className="space-y-4">
        {(data || []).length === 0 ? (
          <div className="text-center py-8 text-slate-300 font-medium italic text-sm">No lead data available</div>
        ) : data.map((item, i) => (
          <div key={i} className="group cursor-default">
            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
              <span>{item.label}</span>
              <span className="text-indigo-600">{item.value}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 ${
                    type === 'status' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 
                    type === 'source' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 
                    'bg-gradient-to-r from-rose-500 to-orange-500'
                 }`}
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
  const [stats, setStats] = React.useState({ campaigns: 0, recentCampaign: '', templates: 0, contacts: 0, chats: 0, pendingTasks: 0 });
  const [analysisData, setAnalysisData] = React.useState({ statusStats: [], sourceStats: [], tagStats: [] });
  const [loading, setLoading] = React.useState(true);
  const [wabaConfig, setWabaConfig] = React.useState(null);
  const [showRefillModal, setShowRefillModal] = React.useState(false);
  const [breakdownModal, setBreakdownModal] = React.useState({ show: false, category: '', categoryName: '', data: [], loading: false });
  const [leadDetailsModal, setLeadDetailsModal] = React.useState({ show: false, category: '', categoryName: '', data: [], loading: false });
  const [pendingTasksModal, setPendingTasksModal] = React.useState({ show: false, telecallerTasks: [], counsellorTasks: [], loading: false });

  const [allContacts, setAllContacts] = React.useState([]);
  const [agents, setAgents] = React.useState([]);

  // Lead Profile Drawer States
  const [selectedLead, setSelectedLead] = React.useState(null);
  const [showLeadProfile, setShowLeadProfile] = React.useState(false);
  const [editedLead, setEditedLead] = React.useState(null);
  const [isUpdatingLead, setIsUpdatingLead] = React.useState(false);
  const [activeLeadTab, setActiveLeadTab] = React.useState('strategic notes');
  const [leadNoteInput, setLeadNoteInput] = React.useState('');
  const [showLeadNoteModal, setShowLeadNoteModal] = React.useState(false);
  const [isAddingLeadNote, setIsAddingLeadNote] = React.useState(false);

  // Follow-up States
  const [showFollowUpModal, setShowFollowUpModal] = React.useState(false);
  const [followUpTitle, setFollowUpTitle] = React.useState('');
  const [followUpDate, setFollowUpDate] = React.useState('');
  const [followUpDesc, setFollowUpDesc] = React.useState('');
  const [isAddingFollowUp, setIsAddingFollowUp] = React.useState(false);

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

  const fetchAgentsList = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/chat/agents', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (err) {
      console.error('Failed to fetch agents list', err);
    }
  };

  const fetchLeadDetails = async (category, categoryName, userId = null) => {
    setLeadDetailsModal({ show: true, category, categoryName, data: [], loading: true, userId });
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      
      // Concurrently fetch the absolute latest full contacts array for profile rehydration
      const contactRes = await fetch(`/api/chat/contacts?t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (contactRes.ok) {
         const fullList = await contactRes.json();
         setAllContacts(fullList);
      }

      const url = `/api/chat/stats/lead-details?category=${category}${userId ? `&userId=${userId}` : ''}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        setLeadDetailsModal(prev => ({ ...prev, data, loading: false }));
      }
    } catch (e) {
      console.error('Failed to fetch lead details', e);
      setLeadDetailsModal(prev => ({ ...prev, loading: false }));
    }
  };

  const openLeadProfile = (lead) => {
    const fullLead = allContacts.find(c => c._id === lead._id || c.phone === lead.phone);
    if (!fullLead) {
       toast.error("Contact profiles are loading, please wait a brief moment...");
       return;
    }
    setSelectedLead(fullLead);
    setEditedLead({
       ...fullLead,
       secondaryPhone: fullLead.secondaryPhone || '',
       altMobile: fullLead.altMobile || '',
       houseNo: fullLead.houseNo || '',
       societyName: fullLead.societyName || '',
       streetAddress: fullLead.streetAddress || '',
       city: fullLead.city || '',
       state: fullLead.state || '',
       pincode: fullLead.pincode || '',
       qualification: fullLead.qualification || '',
       email: fullLead.email || '',
       selectedProgram: fullLead.selectedProgram || '',
       visitStatus: fullLead.visitStatus || 'Not Done',
       visitType: fullLead.visitType || '',
       assignedCounsellor: fullLead.assignedCounsellor || '',
       closeReason: fullLead.closeReason || '',
       leadSourceType: fullLead.leadSourceType || 'Manual Entry',
       socialMediaSource: fullLead.socialMediaSource || '',
       referenceName: fullLead.referenceName || '',
       referencePhone: fullLead.referencePhone || '',
       b2bOrgName: fullLead.b2bOrgName || '',
       b2bPersonName: fullLead.b2bPersonName || '',
       b2bPhone: fullLead.b2bPhone || ''
    });
    setShowLeadProfile(true);
    setActiveLeadTab('strategic notes');
  };

  const handleLeadFieldChange = (field, val) => {
     setEditedLead(prev => ({
        ...prev,
        [field]: val
     }));
  };

  const updateLeadDetail = async (contactId, updates) => {
    setIsUpdatingLead(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      
      const cleanPayload = { ...updates };
      delete cleanPayload._id;
      delete cleanPayload.__v;
      delete cleanPayload.createdAt;
      delete cleanPayload.updatedAt;
      delete cleanPayload.timeline;
      delete cleanPayload.notes;
      delete cleanPayload.tasks;

      const res = await fetch(`/api/chat/action`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, action: 'update_contact', payload: cleanPayload })
      });
      if (res.ok) {
        const data = await res.json();
        const freshContact = data.contact;

        setAllContacts(prev => prev.map(c => c._id === contactId ? freshContact : c));
        setSelectedLead(freshContact);
        setEditedLead({
           ...freshContact,
           secondaryPhone: freshContact.secondaryPhone || '',
           altMobile: freshContact.altMobile || '',
           houseNo: freshContact.houseNo || '',
           societyName: freshContact.societyName || '',
           streetAddress: freshContact.streetAddress || '',
           city: freshContact.city || '',
           state: freshContact.state || '',
           pincode: freshContact.pincode || '',
           qualification: freshContact.qualification || '',
           email: freshContact.email || '',
           selectedProgram: freshContact.selectedProgram || '',
           visitStatus: freshContact.visitStatus || 'Not Done',
           visitType: freshContact.visitType || '',
           assignedCounsellor: freshContact.assignedCounsellor || '',
           closeReason: freshContact.closeReason || '',
           leadSourceType: freshContact.leadSourceType || 'Manual Entry',
           socialMediaSource: freshContact.socialMediaSource || '',
           referenceName: freshContact.referenceName || '',
           referencePhone: freshContact.referencePhone || '',
           b2bOrgName: freshContact.b2bOrgName || '',
           b2bPersonName: freshContact.b2bPersonName || '',
           b2bPhone: freshContact.b2bPhone || ''
        });
        
        toast.success("Lead sync updated successfully!");
        refreshData();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || "Server declined to update lead details");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network synchronization failed");
    } finally {
      setIsUpdatingLead(false);
    }
  };

  const addLeadInternalNote = async (contactId) => {
    if (!leadNoteInput.trim()) return;
    setIsAddingLeadNote(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/chat/action`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, action: 'add_note', payload: { note: leadNoteInput } })
      });
      if (res.ok) {
        const data = await res.json();
        const freshContact = data.contact;
        setSelectedLead(freshContact);
        setAllContacts(prev => prev.map(c => c._id === contactId ? freshContact : c));
        setLeadNoteInput('');
        setShowLeadNoteModal(false);
        toast.success("Strategic Note saved successfully!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to append remark note");
    } finally {
      setIsAddingLeadNote(false);
    }
  };

  const addLeadFollowUp = async (contactId) => {
    if (!followUpDate) {
       toast.error("Select target date/time for the follow-up reminder");
       return;
    }
    setIsAddingFollowUp(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/chat/action`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           contactId, 
           action: 'add_followup', 
           payload: { 
              title: followUpTitle || 'Follow-up Reminder', 
              dateTime: followUpDate, 
              description: followUpDesc || ''
           } 
        })
      });
      if (res.ok) {
        const data = await res.json();
        const freshContact = data.contact;
        setSelectedLead(freshContact);
        setAllContacts(prev => prev.map(c => c._id === contactId ? freshContact : c));
        setFollowUpTitle('');
        setFollowUpDate('');
        setFollowUpDesc('');
        setShowFollowUpModal(false);
        toast.success("Follow-up reminder successfully set!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create follow-up reminder");
    } finally {
      setIsAddingFollowUp(false);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
         day: '2-digit',
         month: 'short',
         year: 'numeric',
         hour: '2-digit',
         minute: '2-digit',
         hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error("No data to download");
      return;
    }
    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));
    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + (row[header] || '')).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

  const userRole = (activeUser?.role || localStorage.getItem('role') || 'AGENT').toUpperCase().replace(/\s/g, '_');
  const isAdminOrSuperAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  
  React.useEffect(() => {
    refreshData();
    fetchAgentsList();
    const interval = setInterval(refreshData, 15000); 
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) {
      if (breakdownModal.show || showRefillModal || pendingTasksModal.show || showLeadProfile) {
        container.style.overflow = 'hidden';
      } else {
        container.style.overflow = 'auto';
      }
    }
    return () => {
      if (container) container.style.overflow = 'auto';
    };
  }, [breakdownModal.show, showRefillModal, pendingTasksModal.show, showLeadProfile]);

  const limitValues = { 'TIER_1': 1000, 'TIER_2': 10000, 'TIER_3': 100000, 'TIER_4': Infinity };
  const limitNum = limitValues[wabaConfig?.limitTier] || 0;
  const sentToday = wabaConfig?.sentToday || 0;
  const remainingNum = limitNum === Infinity ? Infinity : Math.max(0, limitNum - sentToday);

  return (
    <>
      <div className="p-resp bg-crm-bg min-h-full animate-fade-in-up">
      {/* Modern Unified Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4 min-w-0">
           <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-all duration-300">
              <UserCircle size={28} />
           </div>
           <div className="flex flex-col min-w-0">
              <h1 className="text-base sm:text-xl font-black text-slate-900 truncate tracking-tight leading-tight">{userName}</h1>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeUser.role || 'SAAS WORKSPACE'}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span> Online
                </span>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white/50 backdrop-blur-sm border border-white/20 p-5 rounded-[2rem] mb-8 shadow-sm">
        <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">Welcome back, <span className="text-blue-600 capitalize">{userName.split(' ')[0]}</span> 👋</h2>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">Here's what's happening in your workspace today.</p>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 sm:gap-4 flex-1">
          {isAdminOrSuperAdmin && (
            <button onClick={() => navigate('/campaigns')} className="group flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:px-5 sm:py-3 border border-slate-200 rounded-2xl text-[10px] sm:text-xs font-black text-slate-700 bg-white hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm hover:shadow-md">
               <Send size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
               <span className="uppercase tracking-widest">Campaign</span>
            </button>
          )}
          {isAdminOrSuperAdmin && (
            <>
              <button onClick={() => navigate('/templates')} className="group flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:px-5 sm:py-3 border border-slate-200 rounded-2xl text-[10px] sm:text-xs font-black text-slate-700 bg-white hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md">
                 <MessageCircle size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                 <span className="uppercase tracking-widest">Quick Reply</span>
              </button>
              <button onClick={() => navigate('/templates')} className="group flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:px-5 sm:py-3 border border-slate-200 rounded-2xl text-[10px] sm:text-xs font-black text-slate-700 bg-white hover:border-teal-500 hover:text-teal-600 transition-all shadow-sm hover:shadow-md">
                 <FileText size={14} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                 <span className="uppercase tracking-widest">Template</span>
              </button>
            </>
          )}
        </div>
        <button onClick={refreshData} disabled={loading} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50">
           {loading ? 'SYNCING...' : 'REFRESH DATA'}
        </button>
      </div>

      {isAdminOrSuperAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
          <div className="bg-crm-card p-4 sm:p-6 rounded-3xl shadow-soft border border-slate-100 flex flex-col justify-center">
             <h3 className="text-[10px] sm:text-xs font-black text-slate-400 tracking-widest uppercase mb-2">API STATUS</h3>
             <div>
               <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] sm:text-xs font-black rounded-xl shadow-glow">CONNECTED</span>
             </div>
          </div>
          <div className="bg-crm-card p-4 sm:p-6 rounded-3xl shadow-soft flex flex-col justify-center border border-slate-100">
             <h3 className="text-[10px] sm:text-xs font-black text-slate-400 tracking-widest uppercase mb-2">HEALTH</h3>
             <div>
               <span className="px-3 py-1 bg-blue-500 text-white text-[10px] sm:text-xs font-black rounded-xl">OPTIMAL</span>
             </div>
          </div>
          <div className="bg-crm-card p-4 sm:p-6 rounded-3xl shadow-soft flex flex-col justify-center relative overflow-hidden border border-slate-100 col-span-2 sm:col-span-1">
             <h3 className="text-[10px] sm:text-xs font-black text-slate-400 tracking-widest uppercase mb-1">OFFICIAL NUMBER</h3>
             <span className="text-sm sm:text-base font-black text-slate-800 tracking-tight truncate">{wabaConfig?.phoneNumber || 'Not Connected'}</span>
             <p className="text-[9px] font-bold text-blue-600 mt-1 uppercase tracking-widest truncate">{wabaConfig?.wabaName || 'Workspace Official'}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        {isAdminOrSuperAdmin && (
          <>
            <DashboardCard title="Campaigns" value={loading && stats.campaigns === 0 ? "..." : stats.campaigns} subtext={stats.campaigns > 0 ? stats.recentCampaign : "No active campaigns"} icon={Megaphone} />
            <DashboardCard title="Templates" value={loading && stats.templates === 0 ? "..." : stats.templates} subtext={`${stats.templates} Synchronized`} icon={FileText} />
          </>
        )}
        
        {/* Core Metrics - ADMIN ONLY */}
        {isAdminOrSuperAdmin && (
          <>
            <DashboardCard title="Contacts" value={loading && stats.contacts === 0 ? "..." : stats.contacts} subtext={`${stats.contacts} Total contacts`} icon={Users} />
            <DashboardCard title="Open Chats" value={loading && stats.chats === 0 ? "..." : stats.chats} subtext={`${stats.chats} Active conversations`} icon={MessageCircle} />
          </>
        )}
      </div>

      {/* Lead Lifecycle & Performance Section (Visible for all non-admin roles) */}
      {!isAdminOrSuperAdmin && (
        <div className="mt-8 animate-fade-in-up">
           <div className="flex items-center space-x-2 mb-6">
              <div className="w-1.5 h-6 bg-teal-600 rounded-full"></div>
              <h3 className="text-sm font-black text-slate-700 tracking-widest uppercase">Lead Lifecycle & Revenue</h3>
              <span className="text-[10px] bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full font-bold animate-pulse">Live Stats</span>
           </div>
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <DashboardCard 
                isClickable={true}
                onClick={() => fetchLeadDetails('new_leads', 'New Leads')}
                title="NEW" value={loading ? "..." : stats.newLeads} subtext="Pending initial contact" icon={PlusCircle} 
              />
              <DashboardCard 
                isClickable={true}
                onClick={() => fetchLeadDetails('open_leads', 'Open Leads')}
                title="OPEN" value={loading ? "..." : stats.openLeads} subtext="Active in pipeline" icon={MessageCircle} 
              />
              <DashboardCard 
                isClickable={true}
                onClick={() => fetchLeadDetails('closed_leads', 'Closed Leads')}
                title="CLOSE" value={loading ? "..." : stats.closedLeads} subtext="Total Won/Lost" icon={X} 
              />
              <DashboardCard 
                isClickable={true}
                onClick={() => fetchLeadDetails('visited', 'Visited Leads')}
                title="VISIT" value={loading ? "..." : stats.totalVisit} subtext="Leads who Visited" icon={Building2} 
              />
              <DashboardCard 
                isClickable={true}
                onClick={() => fetchLeadDetails('pending_visit', 'Pending Visit Leads')}
                title="PENDING VISIT" value={loading ? "..." : stats.pendingVisit} subtext="Follow-up required" icon={History} 
              />
              <DashboardCard 
                isClickable={true}
                onClick={() => fetchLeadDetails('admissions', 'Admission Enrolled')}
                title="ADMISSION" value={loading ? "..." : stats.totalAdmission} subtext="Successfully enrolled" icon={CheckCircle} 
              />
              <DashboardCard 
                isClickable={true}
                onClick={() => fetchLeadDetails('collections', 'Total Fee Collection')}
                title="COLLECTION" value={loading ? "..." : `₹${stats.totalCollection?.toLocaleString()}`} subtext="Total fee received" icon={Wallet} 
              />
               <DashboardCard 
                isClickable={true}
                onClick={() => fetchLeadDetails('pending_collections', 'Pending Fee Collection')}
                title="PENDING COLLECTION" value={loading ? "..." : `₹${stats.pendingCollection?.toLocaleString()}`} subtext="Outstanding balance" icon={Wallet} 
              />
              <DashboardCard 
                isClickable={true}
                onClick={() => navigate('/tasks')}
                title="PENDING TASKS" value={loading ? "..." : stats.pendingTasks} subtext="Tasks to complete" icon={Clock} 
              />
           </div>
        </div>
      )}

      {isAdminOrSuperAdmin && (
        <div className="mt-8 animate-fade-in-up">
           <div className="flex items-center space-x-2 mb-6">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              <h3 className="text-sm font-black text-slate-700 tracking-widest uppercase">Lead & Revenue Performance</h3>
              <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold animate-pulse">Live Stats</span>
           </div>
           <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-8">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <DashboardCard title="Reply Bots" value={loading && !wabaConfig ? "..." : (wabaConfig?.botEnabled ? "ACTIVE" : "INACTIVE")} subtext={wabaConfig?.botEnabled ? "Automation Engine LIVE" : "Bot currently disabled"} icon={Bot} />
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

      {/* Market Intelligence Section */}
      <div className="mt-12 mb-8 animate-fade-in-up">
         <div className="flex items-center space-x-2 mb-6">
            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
            <h3 className="text-sm font-black text-slate-700 tracking-widest uppercase">Market Intelligence</h3>
            <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">Source Insights</span>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LeadAnalysisCard title="Lead Source Distribution" data={analysisData.sourceStats} type="source" />
            <LeadAnalysisCard title="Lead Tag Distribution" data={analysisData.tagStats || []} type="tag" />
         </div>
      </div>
      </div>

      {/* User Breakdown Modal */}
      {breakdownModal.show && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-fade-in p-4" onClick={() => setBreakdownModal(prev => ({ ...prev, show: false }))}>
           <div className="bg-white/90 backdrop-blur-xl w-full max-w-3xl rounded-[32px] shadow-2xl border border-white/20 relative overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="p-resp border-b border-slate-100 flex flex-col items-center justify-center text-center relative bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                 <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{breakdownModal.categoryName}</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">User Performance Breakdown</p>
                 </div>
                 <button onClick={() => setBreakdownModal(prev => ({ ...prev, show: false }))} className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all shadow-sm">
                    <X size={20} />
                 </button>
              </div>

              <div className="p-resp max-h-[70vh] overflow-y-auto scrollbar-hide">
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
                        <div 
                          key={i} 
                          onClick={() => fetchLeadDetails(breakdownModal.category, `${user.name}'s ${breakdownModal.categoryName}`, user.userId)}
                          className="flex items-center justify-between p-5 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-soft transition-all group cursor-pointer"
                        >
                           <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 font-black text-lg border border-slate-100 group-hover:scale-110 transition-transform">
                                 {user.name.charAt(0)}
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-800">{user.name}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{user.role} • {user.email}</p>
                              </div>
                           </div>
                           <div className="text-right flex items-center space-x-6">
                              <div className="text-right">
                                 <p className="text-2xl font-black text-blue-600 leading-none">{user.count}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Leads</p>
                              </div>
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Plus size={16} />
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
              </div>
              
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-4">
                 <button 
                   onClick={async () => {
                     try {
                       const token = localStorage.getItem('token');
                       const tenantId = localStorage.getItem('tenantId');
                       const res = await fetch(`/api/chat/stats/lead-details?category=${breakdownModal.category}`, {
                         headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
                       });
                       if (res.ok) {
                         const allData = await res.json();
                         downloadCSV(allData, `all_${breakdownModal.category}_data`);
                       }
                     } catch (err) {
                       toast.error("Failed to download all data");
                     }
                   }} 
                   className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center space-x-2"
                 >
                    <Download size={14} />
                    <span>Download All</span>
                 </button>
                 <button onClick={() => setBreakdownModal(prev => ({ ...prev, show: false }))} className="flex-1 px-8 py-3 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-premium">
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
       {/* Lead Details Modal */}
       {leadDetailsModal.show && (
         <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-fade-in p-4" onClick={() => setLeadDetailsModal(prev => ({ ...prev, show: false }))}>
            <div className="bg-white/95 backdrop-blur-2xl w-full max-w-2xl rounded-[32px] shadow-2xl border border-white/20 relative overflow-hidden animate-scale-in flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
               <div className="p-resp border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-teal-50/50 to-blue-50/50 shrink-0">
                  <div className="flex items-center space-x-4">
                     <div className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl text-teal-600">
                        {leadDetailsModal.category === 'new_leads' ? <PlusCircle size={24} /> :
                         leadDetailsModal.category === 'open_leads' ? <MessageCircle size={24} /> :
                         leadDetailsModal.category === 'closed_leads' ? <X size={24} /> :
                         leadDetailsModal.category === 'visited' ? <Building2 size={24} /> :
                         leadDetailsModal.category === 'pending_visit' ? <History size={24} /> :
                         leadDetailsModal.category === 'admissions' ? <CheckCircle size={24} /> : <Wallet size={24} />}
                     </div>
                     <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">{leadDetailsModal.categoryName}</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Detailed Contact List</p>
                     </div>
                  </div>
                  <button onClick={() => setLeadDetailsModal(prev => ({ ...prev, show: false }))} className="p-3 bg-white/50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all shadow-sm">
                     <X size={20} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-resp bg-slate-50/30 custom-scrollbar">
                  {leadDetailsModal.loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                       <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-600 rounded-full animate-spin mb-4"></div>
                       <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Fetching contacts...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       {leadDetailsModal.data.length === 0 ? (
                         <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                               <Users size={32} />
                            </div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">No contacts found in this<br/>category at the moment.</p>
                         </div>
<<<<<<< HEAD
                       ) : leadDetailsModal.data.map((lead, i) => (
                          <div key={i} onClick={() => openLeadProfile(lead)} className="group flex flex-col p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer active:scale-[0.98]">
                             <div className="flex items-center justify-between w-full">
                                <div className="flex items-center space-x-4">
                                   <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-teal-600 font-black text-lg group-hover:bg-teal-50 group-hover:scale-110 transition-all">
                                      {lead.name?.charAt(0) || 'L'}
                                   </div>
                                   <div>
                                      <div className="flex items-center gap-2">
                                         <p className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">{lead.name}</p>
                                         <span className="text-[8px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">View Details →</span>
                                      </div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lead.phone}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <span className="inline-block px-3 py-1 bg-teal-50 text-teal-600 text-[9px] font-black uppercase rounded-lg border border-teal-100 group-hover:bg-teal-100 group-hover:text-teal-700 transition-colors">
                                      {lead.status}
                                   </span>
                                </div>
                             </div>
                             
                             {/* Render Last Remark & Follow-up Details on the card */}
                             {(() => {
                                // Normalize status to match standard groups
                                const upperStatus = (lead.status || '').toUpperCase().replace(/_/g, ' ');
                                const showRemarkGroup = [
                                   'NEW LEAD', 'NEW',
                                   'OPEN', 'CONTACTED', 'INTERESTED', 'FOLLOW UP',
                                   'CLOSE', 'CLOSED', 'CLOSED LOST',
                                   'ADMISSION', 'CLOSED WON'
                                ].includes(upperStatus);
                                
                                if (!showRemarkGroup) return null;

                                // Find last note
                                const lastNote = lead.notes && lead.notes.length > 0 ? lead.notes[lead.notes.length - 1] : null;
                                // Find last task
                                const lastTask = lead.tasks && lead.tasks.length > 0 ? lead.tasks[lead.tasks.length - 1] : null;

                                if (!lastNote && !lastTask) return null;

                                return (
                                   <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-[10px] w-full text-left">
                                      {lastNote && (
                                         <div className="bg-teal-50/50 p-2.5 rounded-xl border border-teal-100/30 flex items-start space-x-2">
                                            <FileText size={12} className="text-teal-600 mt-0.5 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                               <div className="flex justify-between items-center mb-0.5">
                                                  <span className="font-bold text-teal-800">Last Remark Note ({lastNote.createdBy || 'Agent'})</span>
                                                  <span className="text-[8px] text-teal-500 font-bold">
                                                     {lastNote.createdAt ? new Date(lastNote.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                                  </span>
                                               </div>
                                               <p className="text-slate-600 font-medium truncate leading-normal" title={lastNote.content}>{lastNote.content}</p>
                                            </div>
                                         </div>
                                      )}
                                      
                                      {lastTask && (
                                         <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/30 flex items-start space-x-2">
                                            <Calendar size={12} className="text-indigo-600 mt-0.5 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                               <div className="flex justify-between items-center mb-0.5">
                                                  <span className="font-bold text-indigo-800">Last Follow-up: {lastTask.title}</span>
                                                  <span className="text-[8px] text-indigo-500 font-bold">
                                                     {lastTask.date ? new Date(lastTask.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                                  </span>
                                               </div>
                                               {lastTask.description && (
                                                  <p className="text-slate-600 font-medium truncate leading-normal" title={lastTask.description}>{lastTask.description}</p>
                                               )}
                                            </div>
                                         </div>
                                      )}
                                   </div>
                                );
                             })()}
                          </div>
                       ))}
=======
                        ) : leadDetailsModal.data.map((lead, i) => {
                           const fullContact = allContacts.find(c => c._id === lead._id || c.phone === lead.phone) || lead;
                           return (
                           <div key={i} onClick={() => openLeadProfile(lead)} className="group flex flex-col p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer active:scale-[0.98]">
                              <div className="flex items-center justify-between w-full">
                                 <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-teal-600 font-black text-lg group-hover:bg-teal-50 group-hover:scale-110 transition-all">
                                       {lead.name?.charAt(0) || 'L'}
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-2">
                                          <p className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">{lead.name}</p>
                                          <span className="text-[8px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">View Details →</span>
                                       </div>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lead.phone}</p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <span className="inline-block px-3 py-1 bg-teal-50 text-teal-600 text-[9px] font-black uppercase rounded-lg border border-teal-100 group-hover:bg-teal-100 group-hover:text-teal-700 transition-colors">
                                       {lead.status}
                                    </span>
                                 </div>
                              </div>
                              
                              {/* Render Last Remark & Follow-up Details on the card */}
                              {(() => {
                                 // Normalize status to match standard groups
                                 const upperStatus = (lead.status || '').toUpperCase().replace(/_/g, ' ');
                                 const showRemarkGroup = [
                                    'NEW LEAD', 'NEW',
                                    'OPEN', 'CONTACTED', 'INTERESTED', 'FOLLOW UP',
                                    'CLOSE', 'CLOSED', 'CLOSED LOST',
                                    'ADMISSION', 'CLOSED WON'
                                 ].includes(upperStatus);
                                 
                                 if (!showRemarkGroup) return null;

                                 // Find last note
                                 const lastNote = fullContact.notes && fullContact.notes.length > 0 ? fullContact.notes[fullContact.notes.length - 1] : null;
                                 // Find last task
                                 const lastTask = fullContact.tasks && fullContact.tasks.length > 0 ? fullContact.tasks[fullContact.tasks.length - 1] : null;

                                 return (
                                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-[10px] w-full text-left">
                                       {lastNote ? (
                                          <div className="bg-teal-50/50 p-2.5 rounded-xl border border-teal-100/30 flex items-start space-x-2 animate-fade-in">
                                             <FileText size={12} className="text-teal-600 mt-0.5 shrink-0" />
                                             <div className="min-w-0 flex-1">
                                                <div className="flex justify-between items-center mb-0.5">
                                                   <span className="font-bold text-teal-800">Last Remark Note ({lastNote.createdBy || 'Agent'})</span>
                                                   <span className="text-[8px] text-teal-500 font-bold">
                                                      {lastNote.createdAt ? new Date(lastNote.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                                   </span>
                                                </div>
                                                <p className="text-slate-600 font-medium truncate leading-normal" title={lastNote.content}>{lastNote.content}</p>
                                             </div>
                                          </div>
                                       ) : (
                                          <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50 flex items-start space-x-2 opacity-75">
                                             <FileText size={12} className="text-slate-400 mt-0.5 shrink-0" />
                                             <div className="min-w-0 flex-1">
                                                <div className="flex justify-between items-center mb-0.5">
                                                   <span className="font-bold text-slate-500">Last Remark Note</span>
                                                   <span className="text-[8px] text-slate-400 font-bold">N/A</span>
                                                </div>
                                                <p className="text-slate-400 font-semibold italic truncate leading-normal">No remark note recorded</p>
                                             </div>
                                          </div>
                                       )}
                                       
                                       {lastTask ? (
                                          <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/30 flex items-start space-x-2 animate-fade-in">
                                             <Calendar size={12} className="text-indigo-600 mt-0.5 shrink-0" />
                                             <div className="min-w-0 flex-1">
                                                <div className="flex justify-between items-center mb-0.5">
                                                   <span className="font-bold text-indigo-800">Last Follow-up: {lastTask.title}</span>
                                                   <span className="text-[8px] text-indigo-500 font-bold">
                                                      {lastTask.dueDate ? new Date(lastTask.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                                   </span>
                                                </div>
                                                {lastTask.description && (
                                                   <p className="text-slate-600 font-medium truncate leading-normal" title={lastTask.description}>{lastTask.description}</p>
                                                )}
                                             </div>
                                          </div>
                                       ) : (
                                          <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50 flex items-start space-x-2 opacity-75">
                                             <Calendar size={12} className="text-slate-400 mt-0.5 shrink-0" />
                                             <div className="min-w-0 flex-1">
                                                <div className="flex justify-between items-center mb-0.5">
                                                   <span className="font-bold text-slate-500">Last Follow-up Task</span>
                                                   <span className="text-[8px] text-slate-400 font-bold">N/A</span>
                                                </div>
                                                <p className="text-slate-400 font-semibold italic truncate leading-normal">No follow-up scheduled</p>
                                             </div>
                                          </div>
                                       )}
                                    </div>
                                 );
                              })()}
                           </div>
                           );
                        })}
>>>>>>> 2d1e08c85a3ac8b175cacef31ab98ab4c8c1a908
                    </div>
                  )}
               </div>
               
               <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between gap-4 shrink-0">
                  <button 
                   onClick={() => downloadCSV(leadDetailsModal.data, `${leadDetailsModal.categoryName.replace(/\s+/g, '_').toLowerCase()}_report`)}
                   className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center space-x-2"
                  >
                     <Download size={16} />
                     <span>Download Report</span>
                  </button>
                  <button onClick={() => setLeadDetailsModal(prev => ({ ...prev, show: false }))} className="flex-1 px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-premium">
                     Close Details
                  </button>

                  {showLeadProfile && createPortal(
                     <div className="fixed inset-0 z-[1000] flex justify-end items-stretch bg-slate-900/50 backdrop-blur-[6px] animate-fade-in" onClick={() => setShowLeadProfile(false)}>
                        <div className="w-full max-w-[960px] bg-[#fcfcfd] shadow-2xl flex flex-col animate-slide-left h-full" onClick={e=>e.stopPropagation()}>
                           
                           {/* HEADER SECTION */}
                           <div className="p-6 sm:p-8 bg-white border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm relative z-10">
                              <div className="flex items-center space-x-4 min-w-0">
                                 <div className="w-14 h-14 rounded-2xl bg-teal-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-teal-500/20 transform rotate-3 shrink-0">
                                    {editedLead.name?.charAt(0) || 'L'}
                                 </div>
                                 <div className="min-w-0">
                                    <div className="flex items-center space-x-3">
                                       <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight truncate capitalize">{editedLead.name}</h2>
                                       <span className="shrink-0 text-[8px] font-bold text-slate-300 border border-slate-100 px-2 py-0.5 rounded uppercase tracking-widest bg-slate-50">
                                          {editedLead.leadSourceType || 'Manual'}
                                       </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center">
                                       <Phone size={10} className="mr-1 text-slate-300" /> {editedLead.phone}
                                    </p>
                                 </div>
                              </div>

                              {/* Quick Status and Actions */}
                              <div className="flex items-center space-x-3 self-end md:self-auto shrink-0">
                                 <div className="space-y-1">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block ml-1">Lifecycle Status</label>
                                    <select 
                                       value={editedLead.status} 
                                       onChange={e=>handleLeadFieldChange('status', e.target.value)} 
                                       className="bg-slate-50 border-2 border-slate-50 rounded-xl py-2.5 px-4 text-xs font-black text-slate-700 outline-none focus:bg-white focus:border-teal-500/20 transition-all appearance-none pr-8 relative"
                                    >
                                       {['NEW LEAD', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'].map(s => (
                                          <option key={s} value={s}>{s}</option>
                                       ))}
                                    </select>
                                 </div>

                                 <button 
                                    onClick={() => updateLeadDetail(selectedLead._id, editedLead)}
                                    disabled={isUpdatingLead}
                                    className="px-6 py-3 bg-teal-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-teal-700 transition-all flex items-center space-x-2 shadow-lg shadow-teal-500/10 active:scale-95 disabled:opacity-50 mt-4"
                                 >
                                    <Save size={14} />
                                    <span>{isUpdatingLead ? "Syncing..." : "Sync Changes"}</span>
                                 </button>

                                 <button 
                                    onClick={() => setShowLeadProfile(false)} 
                                    className="p-3 bg-slate-50 text-slate-400 hover:text-slate-800 rounded-xl transition-all border border-slate-100 hover:border-slate-200 mt-4"
                                 >
                                    <X size={16} />
                                 </button>
                              </div>
                           </div>

                           {/* TWO-PANEL INTERFACE */}
                           <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                              
                              {/* LEFT PANEL: STRUCTURED STEP-BY-STEP FLOW */}
                              <div className="flex-1 lg:w-[460px] bg-slate-50/80 border-b lg:border-b-0 lg:border-r border-slate-100 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-8 lg:shrink-0">
                                 
                                 {/* STEP 0: BASIC INFORMATION */}
                                 <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                       <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold shadow-md">00</div>
                                          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Basic Information</h3>
                                       </div>
                                       <User size={16} className="text-slate-300" />
                                    </div>
                                    
                                    <div className="space-y-4">
                                       <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Legal Full Name</label>
                                          <input 
                                            value={editedLead.firstName || editedLead.name || ''} 
                                            onChange={e=>handleLeadFieldChange('firstName', e.target.value)} 
                                            placeholder="Enter full name" 
                                            className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-4 text-xs font-bold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-teal-500/20 transition-all" 
                                          />
                                       </div>

                                       <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-1">
                                             <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Alternative Phone</label>
                                             <input 
                                               value={editedLead.altMobile || ''} 
                                               onChange={e=>handleLeadFieldChange('altMobile', e.target.value)} 
                                               placeholder="Alt number" 
                                               className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-4 text-xs font-bold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-teal-500/20 transition-all" 
                                             />
                                          </div>
                                          <div className="space-y-1">
                                             <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Secondary WhatsApp</label>
                                             <input 
                                               value={editedLead.secondaryPhone || ''} 
                                               onChange={e=>handleLeadFieldChange('secondaryPhone', e.target.value)} 
                                               placeholder="Secondary number" 
                                               className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-4 text-xs font-bold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-teal-500/20 transition-all" 
                                             />
                                          </div>
                                       </div>

                                       <div className="space-y-3 pt-3 border-t border-slate-50">
                                          <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Location Details</label>
                                          <div className="grid grid-cols-2 gap-3">
                                             <input value={editedLead.houseNo || ''} onChange={e=>handleLeadFieldChange('houseNo', e.target.value)} placeholder="House No" className="w-full bg-slate-50/50 border border-slate-100 py-2 px-3 text-xs font-bold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-teal-500/20 transition-all" />
                                             <input value={editedLead.societyName || ''} onChange={e=>handleLeadFieldChange('societyName', e.target.value)} placeholder="Society Name" className="w-full bg-slate-50/50 border border-slate-100 py-2 px-3 text-xs font-bold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-teal-500/20 transition-all" />
                                          </div>
                                          <input value={editedLead.streetAddress || ''} onChange={e=>handleLeadFieldChange('streetAddress', e.target.value)} placeholder="Street Address" className="w-full bg-slate-50/50 border border-slate-100 py-2 px-3 text-xs font-bold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-teal-500/20 transition-all" />
                                          
                                          <div className="grid grid-cols-2 gap-3">
                                             <select value={editedLead.city || ''} onChange={e=>handleLeadFieldChange('city', e.target.value)} className="w-full bg-slate-50/50 border border-slate-100 py-2 px-3 text-xs font-bold text-slate-700 rounded-xl outline-none focus:bg-white transition-all appearance-none pr-8">
                                                <option value="">Choose City</option>
                                                {['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Mumbai', 'Pune', 'Bangalore', 'Delhi'].map(c => <option key={c} value={c}>{c}</option>)}
                                             </select>
                                             <select value={editedLead.state || ''} onChange={e=>handleLeadFieldChange('state', e.target.value)} className="w-full bg-slate-50/50 border border-slate-100 py-2 px-3 text-xs font-bold text-slate-700 rounded-xl outline-none focus:bg-white transition-all appearance-none pr-8">
                                                <option value="">Choose State</option>
                                                {['Gujarat', 'Maharashtra', 'Karnataka', 'Rajasthan', 'Madhya Pradesh', 'Delhi'].map(s => <option key={s} value={s}>{s}</option>)}
                                             </select>
                                          </div>
                                          <div className="grid grid-cols-2 gap-3">
                                             <div className="w-full bg-slate-100/50 border border-transparent py-2 px-3 text-[10px] font-bold text-slate-400 rounded-xl flex items-center uppercase">India</div>
                                             <input value={editedLead.pincode || ''} onChange={e=>handleLeadFieldChange('pincode', e.target.value)} placeholder="Pincode" className="w-full bg-slate-50/50 border border-slate-100 py-2 px-3 text-xs font-bold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-teal-500/20 transition-all" />
                                          </div>
                                       </div>
                                    </div>
                                 </div>

                                 {/* STEP 1: QUALIFICATION DETAILS */}
                                 <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                       <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 rounded-xl bg-teal-500 text-white text-[10px] flex items-center justify-center font-bold shadow-md">01</div>
                                          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Qualification Details</h3>
                                       </div>
                                       <GraduationCap size={16} className="text-slate-300" />
                                    </div>

                                    <div className="space-y-4">
                                       <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Last Qualification</label>
                                          <input value={editedLead.qualification || ''} onChange={e=>handleLeadFieldChange('qualification', e.target.value)} placeholder="e.g. Bachelor of Commerce" className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-4 text-xs font-bold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-teal-500/20 transition-all" />
                                       </div>
                                       <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Selected Program</label>
                                          <select value={editedLead.selectedProgram || ''} onChange={e=>handleLeadFieldChange('selectedProgram', e.target.value)} className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-4 text-xs font-bold text-slate-700 rounded-xl outline-none focus:bg-white focus:border-teal-500/20 transition-all appearance-none pr-8">
                                             <option value="">Choose Program</option>
                                             {['MBA Professional', 'Executive PGDM', 'Digital Marketing', 'Data Science', 'UI/UX Design'].map(p => <option key={p} value={p}>{p}</option>)}
                                          </select>
                                       </div>
                                    </div>
                                 </div>

                                 {/* STEP 2: LEAD SOURCE */}
                                 <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                       <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold shadow-md">02</div>
                                          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Lead Source</h3>
                                       </div>
                                       <Globe size={16} className="text-slate-300" />
                                    </div>
                                    
                                    <div className="space-y-4">
                                       <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Primary Source</label>
                                          <select 
                                            value={editedLead.leadSourceType || 'Manual Entry'} 
                                            onChange={e=>handleLeadFieldChange('leadSourceType', e.target.value)}
                                            className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-4 text-xs font-bold text-slate-700 rounded-xl outline-none focus:bg-white focus:border-indigo-500/20 transition-all appearance-none pr-8"
                                          >
                                             <option value="Manual Entry">Manual Entry</option>
                                             <option value="Social media">Social media</option>
                                             <option value="Reference">Reference</option>
                                             <option value="B2B agents">B2B agents</option>
                                             <option value="Direct">Direct</option>
                                             <option value="Other">Other</option>
                                          </select>
                                       </div>

                                       {editedLead.leadSourceType === 'Social media' && (
                                          <div className="space-y-1 animate-fade-in">
                                             <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Platform</label>
                                             <select 
                                               value={editedLead.socialMediaSource || ''} 
                                               onChange={e=>handleLeadFieldChange('socialMediaSource', e.target.value)}
                                               className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-4 text-xs font-bold text-slate-700 rounded-xl outline-none focus:bg-white focus:border-blue-500/20 transition-all appearance-none pr-8"
                                             >
                                                <option value="">Choose Platform</option>
                                                {['Instagram', 'Snapchat', 'YouTube', 'Jio Hotstar', 'Google Ads', 'Whatsapp Marketing'].map(p => <option key={p} value={p}>{p}</option>)}
                                             </select>
                                          </div>
                                       )}

                                       {editedLead.leadSourceType === 'Reference' && (
                                          <div className="grid grid-cols-2 gap-3 animate-fade-in">
                                             <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Reference Name</label>
                                                <input value={editedLead.referenceName || ''} onChange={e=>handleLeadFieldChange('referenceName', e.target.value)} placeholder="Name" className="w-full bg-slate-50/50 border border-slate-100 py-2 px-3 text-xs font-bold text-slate-800 rounded-xl outline-none focus:bg-white transition-all" />
                                             </div>
                                             <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Phone</label>
                                                <input value={editedLead.referencePhone || ''} onChange={e=>handleLeadFieldChange('referencePhone', e.target.value)} placeholder="Phone" className="w-full bg-slate-50/50 border border-slate-100 py-2 px-3 text-xs font-bold text-slate-800 rounded-xl outline-none focus:bg-white transition-all" />
                                             </div>
                                          </div>
                                       )}

                                       {editedLead.leadSourceType === 'B2B agents' && (
                                          <div className="space-y-3 animate-fade-in">
                                             <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Agency Organization</label>
                                                <input value={editedLead.b2bOrgName || ''} onChange={e=>handleLeadFieldChange('b2bOrgName', e.target.value)} placeholder="Organization" className="w-full bg-slate-50/50 border border-slate-100 py-2 px-3 text-xs font-bold text-slate-800 rounded-xl outline-none focus:bg-white transition-all" />
                                             </div>
                                             <div className="grid grid-cols-2 gap-3">
                                                <input value={editedLead.b2bPersonName || ''} onChange={e=>handleLeadFieldChange('b2bPersonName', e.target.value)} placeholder="Agent Name" className="w-full bg-slate-50/50 border border-slate-100 py-2 px-3 text-xs font-bold text-slate-800 rounded-xl outline-none focus:bg-white transition-all" />
                                                <input value={editedLead.b2bPhone || ''} onChange={e=>handleLeadFieldChange('b2bPhone', e.target.value)} placeholder="Agent Phone" className="w-full bg-slate-50/50 border border-slate-100 py-2 px-3 text-xs font-bold text-slate-800 rounded-xl outline-none focus:bg-white transition-all" />
                                             </div>
                                          </div>
                                       )}
                                    </div>
                                 </div>

                                                                  {/* TAGS & LABELS */}
                                 <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                       <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 rounded-xl bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold shadow-md">
                                             <Tag size={14}/>
                                          </div>
                                          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Custom Tags</h3>
                                       </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                       <div className="flex items-center space-x-2">
                                          <input 
                                            type="text"
                                            id="new-tag-input"
                                            placeholder="Add custom tag (e.g. Hot Lead)..." 
                                            className="flex-1 bg-slate-50/50 border-2 border-slate-50 py-3 px-4 text-xs font-bold text-slate-800 rounded-xl outline-none focus:bg-white focus:border-rose-500/20 transition-all"
                                            onKeyDown={(e) => {
                                               if (e.key === 'Enter' && e.target.value.trim() !== '') {
                                                  e.preventDefault();
                                                  const val = e.target.value.trim();
                                                  const currentTags = editedLead.tags || [];
                                                  if (!currentTags.includes(val)) {
                                                     handleLeadFieldChange('tags', [...currentTags, val]);
                                                  }
                                                  e.target.value = '';
                                               }
                                            }}
                                          />
                                          <button 
                                            onClick={(e) => {
                                               e.preventDefault();
                                               const input = document.getElementById('new-tag-input');
                                               if (input && input.value.trim() !== '') {
                                                  const val = input.value.trim();
                                                  const currentTags = editedLead.tags || [];
                                                  if (!currentTags.includes(val)) {
                                                     handleLeadFieldChange('tags', [...currentTags, val]);
                                                  }
                                                  input.value = '';
                                               }
                                            }}
                                            className="px-5 py-3 bg-teal-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-teal-700 shadow-sm transition-all"
                                          >
                                            Add
                                          </button>
                                       </div>
                                       
                                       {/* Suggested Tags */}
                                       <div className="flex flex-wrap gap-2">
                                          {['Hot Lead', 'Warm Lead', 'Cold Lead', 'Interested', 'Not Interested', 'Spam'].map(tag => (
                                             <button 
                                               key={tag}
                                               onClick={(e) => {
                                                  e.preventDefault();
                                                  const currentTags = editedLead.tags || [];
                                                  if (!currentTags.includes(tag)) {
                                                     handleLeadFieldChange('tags', [...currentTags, tag]);
                                                  }
                                               }}
                                               className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all"
                                             >
                                                + {tag}
                                             </button>
                                          ))}
                                       </div>

                                       {/* Active Tags */}
                                       <div className="pt-4 mt-2 border-t border-slate-50">
                                          {(!editedLead.tags || editedLead.tags.length === 0) ? (
                                             <p className="text-[10px] font-medium text-slate-400 italic">No tags added yet.</p>
                                          ) : (
                                             <div className="flex flex-wrap gap-2">
                                                {editedLead.tags.map(tag => (
                                                   <span key={tag} className="pl-3 pr-1 py-1 bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-100/50 text-rose-600 text-[10px] font-black tracking-wide rounded-lg flex items-center space-x-2 shadow-sm">
                                                      <span>{tag}</span>
                                                      <button 
                                                        onClick={(e) => {
                                                           e.preventDefault();
                                                           handleLeadFieldChange('tags', editedLead.tags.filter(t => t !== tag));
                                                        }}
                                                        className="p-1 hover:bg-rose-100 rounded-md transition-colors"
                                                      >
                                                         <X size={10} className="text-rose-600" />
                                                      </button>
                                                   </span>
                                                ))}
                                             </div>
                                          )}
                                       </div>
                                    </div>
                                 </div>

                                 {/* STEP 3: VISIT FORMAT */}
                                 <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                       <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white text-[10px] flex items-center justify-center font-bold shadow-md">03</div>
                                          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Visit Format</h3>
                                       </div>
                                       <Map size={16} className="text-slate-300" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                       <button 
                                          onClick={() => handleLeadFieldChange('visitStatus', editedLead.visitStatus === 'Done' ? 'Not Done' : 'Done')}
                                          className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center space-y-2 ${
                                             editedLead.visitStatus === 'Done' 
                                             ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm' 
                                             : 'bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200'
                                          }`}
                                       >
                                          <CheckCircle size={18} />
                                          <span className="text-[10px] font-bold">{editedLead.visitStatus === 'Done' ? 'Visit Done' : 'Mark Done'}</span>
                                       </button>

                                       <select 
                                          value={editedLead.visitType || ''} 
                                          onChange={e=>handleLeadFieldChange('visitType', e.target.value)} 
                                          className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-4 text-xs font-bold capitalize text-slate-700 rounded-2xl outline-none focus:bg-white transition-all appearance-none text-center"
                                       >
                                          <option value="">Choose Format</option>
                                          <option value="Online">Online</option>
                                          <option value="Office Visit">Office Visit</option>
                                          <option value="Campus Visit">Campus Visit</option>
                                       </select>
                                    </div>
                                 </div>

                                 {/* STEP 4: COUNSELLING STATUS */}
                                 <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                                       <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold shadow-md">04</div>
                                          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Counselling Status</h3>
                                       </div>
                                       <Award size={16} className="text-slate-300" />
                                    </div>

                                    <div className="space-y-4">
                                       <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-slate-400 capitalize ml-1">Assigned Counsellor</label>
                                          <select 
                                             value={editedLead.assignedCounsellor || ''} 
                                             onChange={e=>handleLeadFieldChange('assignedCounsellor', e.target.value)} 
                                             className="w-full bg-slate-50/50 border-2 border-slate-50 py-3 px-4 text-xs font-bold text-slate-700 rounded-xl outline-none focus:bg-white focus:border-amber-500/20 transition-all appearance-none pr-8"
                                          >
                                             <option value="">Assign Expert...</option>
                                             {agents.map(a => (
                                                <option key={a._id} value={a._id}>{a.name} ({a.role || 'Counsellor'})</option>
                                             ))}
                                          </select>
                                       </div>
                                     </div>
                                  </div>

                               </div>

                            {/* RIGHT PANEL: INTERACTION HUB */}
                            <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                                    {/* QUICK STRATEGIC ACTIONS BAR */}
                                    <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-3 shrink-0">
                                       <button
                                          onClick={() => setShowLeadNoteModal(true)}
                                          className="py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-[11px] font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 border border-teal-400/20 hover:-translate-y-0.5"
                                       >
                                          <Plus size={14} className="stroke-[3]" />
                                          <span>Add Strategic Note</span>
                                       </button>
                                       
                                       <button
                                          onClick={() => setShowFollowUpModal(true)}
                                          className="py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-[11px] font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 border border-indigo-400/20 hover:-translate-y-0.5"
                                       >
                                          <Calendar size={14} className="stroke-[3]" />
                                          <span>Schedule Follow-up</span>
                                       </button>
                                    </div>

                                    {/* TAB SELECTION BAR */}
                                    <div className="flex items-center space-x-1 p-2 shrink-0 bg-slate-100/50 border-b border-slate-200">
                                       {['strategic notes', 'tasks & follow-ups', 'timeline'].map((tab) => {
                                          const isActive = activeLeadTab === tab;
                                          return (
                                             <button
                                                key={tab}
                                                onClick={() => setActiveLeadTab(tab)}
                                                className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black capitalize transition-all duration-300 flex items-center justify-center space-x-2 ${
                                                   isActive 
                                                   ? tab === 'strategic notes'
                                                      ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25 scale-[1.03] z-10'
                                                      : tab === 'tasks & follow-ups'
                                                         ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 scale-[1.03] z-10'
                                                         : 'bg-slate-900 text-white shadow-lg shadow-slate-900/25 scale-[1.03] z-10'
                                                   : 'text-slate-500 hover:text-slate-850 hover:bg-slate-200/50'
                                                }`}
                                             >
                                                {tab === 'strategic notes' && <FileText size={12} className={isActive ? "text-white" : "text-teal-500"} />}
                                                {tab === 'tasks & follow-ups' && <Calendar size={12} className={isActive ? "text-white" : "text-indigo-500"} />}
                                                {tab === 'timeline' && <Activity size={12} className={isActive ? "text-white" : "text-slate-500"} />}
                                                <span>{tab}</span>
                                             </button>
                                          );
                                       })}
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                    
                                    {/* TIMELINE TAB */}
                                    {activeLeadTab === 'timeline' && (
                                       <div className="space-y-6 relative">
                                           {(!selectedLead.timeline || selectedLead.timeline.length === 0) ? (
                                             <div className="py-20 text-center flex flex-col items-center">
                                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                                   <Activity size={20} className="text-slate-200" />
                                                </div>
                                                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No activity log recorded</p>
                                             </div>
                                           ) : (
                                             <div className="relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
                                                {(selectedLead.timeline || []).filter(e => !e.description?.includes('Contact details updated')).slice().reverse().map((event, idx) => (
                                                   <div key={idx} className="relative pl-8 mb-6 last:mb-0">
                                                      <div className="absolute left-0 top-1 w-[22px] h-[22px] rounded-full bg-white border-2 border-slate-100 flex items-center justify-center z-10 shadow-sm">
                                                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                      </div>
                                                      <div className="flex flex-col">
                                                         <div className="flex justify-between items-start gap-4">
                                                            <p className="text-xs font-bold text-slate-700 leading-tight">{event.description?.split(' - ')[0]}</p>
                                                            <span className="shrink-0 text-[8px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                               {event.eventType?.replace('_', ' ')}
                                                            </span>
                                                         </div>
                                                         {event.description?.includes(' - ') && (
                                                            <p className="text-[10px] text-slate-500 font-medium mt-1 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50 italic">
                                                               {event.description.split(' - ').slice(1).join(' - ')}
                                                            </p>
                                                         )}
                                                         <p className="text-[9px] font-bold text-slate-400 mt-1 flex items-center">
                                                            <Clock size={10} className="mr-1 opacity-50" /> {formatDateTime(event.timestamp)}
                                                         </p>
                                                      </div>
                                                   </div>
                                                ))}
                                             </div>
                                           )}
                                       </div>
                                    )}

                                    {activeLeadTab === 'strategic notes' && (
                                       <div className="space-y-6">
                                          <div className="flex items-center justify-between bg-teal-50/50 p-6 rounded-2xl border border-teal-100 shadow-sm hover:shadow-md transition-all">
                                             <div>
                                                <h4 className="text-xs font-black text-teal-900 uppercase tracking-wider flex items-center space-x-1.5">
                                                   <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping"></span>
                                                   <span>Internal Remarks</span>
                                                </h4>
                                                <p className="text-[9px] font-bold text-teal-600 uppercase tracking-widest mt-1">Record client interaction logs</p>
                                             </div>
                                             <button 
                                                onClick={() => setShowLeadNoteModal(true)}
                                                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-teal-500/25 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center space-x-2 border border-teal-400/20"
                                             >
                                                <Plus size={14} className="stroke-[3]" />
                                                <span>Add Remark Note</span>
                                             </button>
                                          </div>

                                          <div className="space-y-3">
                                             {(!selectedLead.notes || selectedLead.notes.length === 0) ? (
                                                <div 
                                                   onClick={() => setShowLeadNoteModal(true)}
                                                   className="py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/10 group transition-all"
                                                >
                                                   <FileText size={24} className="text-slate-300 group-hover:text-teal-400 transition-colors mb-2" />
                                                   <p className="text-[10px] font-black text-slate-450 uppercase tracking-wider group-hover:text-teal-600 transition-colors">No Remarks Added Yet</p>
                                                   <p className="text-[8px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Click here to write your first daily note</p>
                                                </div>
                                             ) : (selectedLead.notes || []).slice().reverse().map((note, idx) => (
                                                <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:scale-[1.01]">
                                                   <p className="text-xs font-medium text-slate-700 leading-relaxed">{note.content}</p>
                                                   <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 capitalize mt-3 pt-3 border-t border-slate-50">
                                                      <span className="flex items-center"><UserCircle size={10} className="mr-1" /> {note.createdBy}</span>
                                                      <span className="flex items-center"><Clock size={10} className="mr-1" /> {formatDateTime(note.createdAt)}</span>
                                                   </div>
                                                </div>
                                             ))}
                                          </div>
                                       </div>
                                    )}

                                    {/* TASKS & FOLLOW-UPS TAB */}
                                    {activeLeadTab === 'tasks & follow-ups' && (
                                       <div className="space-y-6">
                                          <div className="flex items-center justify-between bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-all">
                                             <div>
                                                <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center space-x-1.5">
                                                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
                                                   <span>Follow-up Tasks</span>
                                                </h4>
                                                <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Schedule daily reminders & callbacks</p>
                                             </div>
                                             <button 
                                                onClick={() => setShowFollowUpModal(true)}
                                                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center space-x-2 border border-indigo-400/20"
                                             >
                                                <Calendar size={14} className="stroke-[3]" />
                                                <span>Schedule Follow-up</span>
                                             </button>
                                          </div>

                                          <div className="space-y-3">
                                             {(!selectedLead.tasks || selectedLead.tasks.length === 0) ? (
                                                <div 
                                                   onClick={() => setShowFollowUpModal(true)}
                                                   className="py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/10 group transition-all"
                                                >
                                                   <Calendar size={24} className="text-slate-300 group-hover:text-indigo-400 transition-colors mb-2" />
                                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">No Follow-ups Scheduled Yet</p>
                                                   <p className="text-[8px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Click here to schedule a callback task</p>
                                                </div>
                                             ) : (selectedLead.tasks || []).slice().reverse().map((task, idx) => (
                                                <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:scale-[1.01] flex justify-between items-start gap-4">
                                                   <div>
                                                      <div className="flex items-center space-x-2 mb-1">
                                                         <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                                            task.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                         }`}>
                                                            {task.status}
                                                         </span>
                                                         <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide bg-slate-50 px-1.5 py-0.5 rounded">
                                                            {task.type}
                                                         </span>
                                                      </div>
                                                      <h5 className="text-xs font-bold text-slate-800">{task.title}</h5>
                                                      {task.description && (
                                                         <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal italic">{task.description}</p>
                                                      )}
                                                   </div>
                                                   <div className="text-right shrink-0">
                                                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Due Date</span>
                                                      <span className="text-[10px] font-semibold text-slate-700 block mt-0.5">{formatDateTime(task.dueDate)}</span>
                                                   </div>
                                                </div>
                                             ))}
                                          </div>
                                       </div>
                                    )}

                                 </div>
                              </div>
                           </div>

                           {/* BOTTOM ACTION BAR */}
                           <div className="p-5 border-t border-slate-100 bg-white grid grid-cols-2 gap-4 shrink-0">
                              <button 
                                 onClick={() => setShowLeadProfile(false)}
                                 className="py-3.5 border border-slate-200 rounded-xl text-[10px] font-bold capitalize text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-wider"
                              >
                                 Cancel / Close
                              </button>
                              <button 
                                 onClick={() => updateLeadDetail(selectedLead._id, editedLead)}
                                 disabled={isUpdatingLead}
                                 className="py-3.5 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-teal-500/10 hover:bg-teal-700 transition-all disabled:opacity-50"
                              >
                                 {isUpdatingLead ? "Updating..." : "Commit All Changes"}
                              </button>
                           </div>

                        </div>
                     </div>,
                     document.body
                  )}

                  {/* ADD REMARK / NOTE MODAL */}
                  {showLeadNoteModal && createPortal(
                     <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/60 backdrop-blur-[6px] animate-fade-in p-4" onClick={() => setShowLeadNoteModal(false)}>
                        <div className="bg-white p-8 rounded-[2rem] w-full max-w-[500px] shadow-3xl animate-scale-in relative border border-white/50 overflow-hidden" onClick={e=>e.stopPropagation()}>
                           <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-3xl"></div>
                           <button onClick={() => setShowLeadNoteModal(false)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-all hover:rotate-90"><X size={20} /></button>
                           <div className="w-12 h-12 bg-teal-500 text-white rounded-2xl flex items-center justify-center shadow-md mb-6 transform -rotate-6"><Plus size={24} /></div>
                           
                           <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Add Remark Note</h2>
                           <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-wider">Internal strategic observations</p>
                           
                           <div className="space-y-5">
                              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-inner">
                                 <textarea 
                                    autoFocus
                                    value={leadNoteInput} 
                                    onChange={e=>setLeadNoteInput(e.target.value)} 
                                    placeholder="Type lead outcome, counsellor notes or task results..." 
                                    className="w-full h-32 bg-transparent text-xs font-bold text-slate-700 placeholder-slate-300 outline-none resize-none leading-relaxed"
                                 />
                              </div>
                              <button 
                                  onClick={() => addLeadInternalNote(selectedLead._id)}
                                  disabled={isAddingLeadNote || !leadNoteInput.trim()}
                                  className="w-full py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50"
                               >
                                  {isAddingLeadNote ? "Saving..." : "Save Note Now"}
                               </button>
                           </div>
                        </div>
                     </div>,
                     document.body
                  )}

                  {/* ADD FOLLOW-UP MODAL */}
                  {showFollowUpModal && createPortal(
                     <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/60 backdrop-blur-[6px] animate-fade-in p-4" onClick={() => setShowFollowUpModal(false)}>
                        <div className="bg-white p-8 rounded-[2rem] w-full max-w-[500px] shadow-3xl animate-scale-in relative border border-white/50 overflow-hidden" onClick={e=>e.stopPropagation()}>
                           <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl"></div>
                           <button onClick={() => setShowFollowUpModal(false)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-all hover:rotate-90"><X size={20} /></button>
                           <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md mb-6 transform -rotate-6"><Calendar size={20} /></div>
                           
                           <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Schedule Follow-up</h2>
                           <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-wider">Set reminders and actions</p>
                           
                           <div className="space-y-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Follow-up Title</label>
                                 <input 
                                    type="text"
                                    value={followUpTitle}
                                    onChange={e=>setFollowUpTitle(e.target.value)}
                                    placeholder="e.g. Call back for registration fee" 
                                    className="w-full bg-slate-50 border border-slate-100 py-3 px-4 text-xs font-bold text-slate-800 rounded-xl outline-none focus:bg-white transition-all"
                                 />
                              </div>

                              <div className="space-y-1">
                                 <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Due Date & Time</label>
                                 <input 
                                    type="datetime-local"
                                    value={followUpDate}
                                    onChange={e=>setFollowUpDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 py-3 px-4 text-xs font-bold text-slate-800 rounded-xl outline-none focus:bg-white transition-all"
                                 />
                              </div>

                              <div className="space-y-1">
                                 <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Description / Remarks</label>
                                 <textarea 
                                    value={followUpDesc}
                                    onChange={e=>setFollowUpDesc(e.target.value)}
                                    placeholder="Additional details (mode, special questions, etc.)"
                                    className="w-full h-20 bg-slate-50 border border-slate-100 py-3 px-4 text-xs font-bold text-slate-700 outline-none resize-none"
                                 />
                              </div>

                              <button 
                                  onClick={() => addLeadFollowUp(selectedLead._id)}
                                  disabled={isAddingFollowUp || !followUpDate}
                                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 mt-2"
                               >
                                  {isAddingFollowUp ? "Scheduling..." : "Create Reminder Now"}
                               </button>
                           </div>
                        </div>
                     </div>,
                     document.body
                  )}
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
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 1024);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [customization, setCustomization] = React.useState(null);
  const [workspace, setWorkspace] = React.useState(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user?.role || localStorage.getItem('role') || 'AGENT').toUpperCase().replace(/\s/g, '_');
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
    // 0. Version Enforcement Logic
    const SYSTEM_VERSION = '1.4.5';
    const lastSeenVersion = localStorage.getItem('wapipulse_version');
    if (lastSeenVersion && lastSeenVersion !== SYSTEM_VERSION) {
       console.log('🔄 New System Version Detected! Clearing Cache & Reloading...');
       localStorage.setItem('wapipulse_version', SYSTEM_VERSION);
       window.location.reload(true);
       return;
    }
    localStorage.setItem('wapipulse_version', SYSTEM_VERSION);

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
             if (data.customization) {
                const { themeColor: fColor, customLogin: fLogin } = data.customization;
                setThemeColor(fColor);
                localStorage.setItem('themeColor', fColor);
                localStorage.setItem('customLogin', fLogin);
                localStorage.setItem('logoUrl', data.customization.logoUrl || '');
                setCustomization(data.customization);
             }

            if (data.roleAccess) {
               setRoleAccess(data.roleAccess);
            }
            if (data.customization) {
               setCustomization(data.customization);
            }
            if (data.workspace) {
               setWorkspace(data.workspace);
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
    const handleBrandingUpdate = (e) => {
       if (e.detail?.color) {
          setThemeColor(e.detail.color);
          localStorage.setItem('themeColor', e.detail.color);
       }
       if (e.detail?.customization) {
          setCustomization(e.detail.customization);
          localStorage.setItem('customLogin', e.detail.customization.customLogin);
       }
    };
    const handleResize = () => {
       setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('themeChanged', handleBrandingUpdate);
    window.addEventListener('brandingUpdated', handleBrandingUpdate);
    window.addEventListener('resize', handleResize);

    return () => {
       window.removeEventListener('themeChanged', handleBrandingUpdate);
       window.removeEventListener('brandingUpdated', handleBrandingUpdate);
       window.removeEventListener('resize', handleResize);
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
    <div style={appStyle} className={`flex h-screen bg-crm-bg tracking-normal overflow-hidden ${!isAuthPage && isMobile ? 'flex-col' : 'flex-row'}`}>
      <Toaster position="top-right" reverseOrder={false} />
      {!isAuthPage && <AutoLogout />}
      {!isAuthPage && <GlobalSuspensionTimer />}
      
      {/* Mobile Top Header */}
      {!isAuthPage && isMobile && (
        <MobileHeader 
          onOpenNotifications={() => setIsNotificationsOpen(true)} 
          onOpenSearch={() => setIsSearchOpen(true)}
        />
      )}

      {/* Notifications Drawer */}
      {!isAuthPage && <NotificationCenter isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />}
      
      {/* Global Search Overlay */}
      {!isAuthPage && <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />}
      
      {/* Keyboard Shortcut Listener */}
      {useEffect(() => {
        const handleKeyDown = (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            setIsSearchOpen(true);
          }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }, [])}

      {/* Main Sidebar (Drawer on mobile) */}
      {!isAuthPage && (
        userRole === 'SUPER_ADMIN' 
          ? <AdminSidebar 
              onLogout={handleLogout} 
              isMobileOpen={isSidebarOpen} 
              onClose={() => setIsSidebarOpen(false)} 
              isMobile={isMobile}
            /> 
          : <Sidebar 
              whatsappConfig={whatsappConfig} 
              roleAccess={roleAccess} 
              customization={customization}
              workspace={workspace}
              isMobileOpen={isSidebarOpen} 
              onClose={() => setIsSidebarOpen(false)} 
              isMobile={isMobile}
            />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 relative z-10 overflow-hidden ${!isAuthPage && isMobile ? 'main-content-mobile' : ''}`}>
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
            <Route path="/team-performance" element={<TeamPerformance />} />
            <Route path="/lead-report" element={<LeadReport />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/profile" element={<Profile />} />
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

        {!isAuthPage && !isMobile && (
          <div className="w-full py-1.5 px-8 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
             <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">System Online</span>
             </div>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Developed by J.V group | WapiPulse v1.5.4-STABLE
             </p>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      {!isAuthPage && isMobile && <MobileNavbar onMenuClick={() => setIsSidebarOpen(true)} />}
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
