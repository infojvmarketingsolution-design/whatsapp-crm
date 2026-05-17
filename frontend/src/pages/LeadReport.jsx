import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Calendar, 
  User, 
  TrendingUp, 
  Users, 
  Filter, 
  Download, 
  Printer, 
  X, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Briefcase, 
  Mail, 
  Phone, 
  Tag, 
  Clock, 
  Info,
  CheckCircle,
  AlertTriangle,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LeadReport() {
  // --- States ---
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'leads' | 'charts'
  
  // --- Filter States ---
  const [presetDate, setPresetDate] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  // --- UI Control States ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  // --- Constants for Dropdowns ---
  const monthsList = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const currentYear = new Date().getFullYear();
  const yearsList = [
    { value: String(currentYear), label: `Current Year (${currentYear})` },
    { value: String(currentYear - 1), label: `Previous Year (${currentYear - 1})` },
  ];

  const statusesList = [
    { value: 'NEW,NEW LEAD', label: 'New Leads' },
    { value: 'CONTACTED,INTERESTED,OPEN', label: 'In Progress' },
    { value: 'FOLLOW_UP', label: 'Follow-ups' },
    { value: 'CLOSED_WON,ADMISSION', label: 'Converted' },
    { value: 'CLOSED_LOST,CLOSED,CLOSE', label: 'Lost' },
  ];

  const sourcesList = [
    { value: 'Facebook', label: 'Facebook' },
    { value: 'Instagram', label: 'Instagram' },
    { value: 'Website', label: 'Website' },
    { value: 'Google Ads', label: 'Google Ads' },
    { value: 'Referral', label: 'Referral' },
    { value: 'Manual Entry', label: 'Manual Entry' },
    { value: 'Direct', label: 'Direct' },
  ];

  // --- Fetch Report Data ---
  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      
      const queryParams = new URLSearchParams({
        presetDate,
        startDate,
        endDate,
        month: selectedMonth,
        year: selectedYear,
        status: selectedStatus,
        source: selectedSource,
        agents: selectedAgent,
        search: searchQuery,
        sortBy
      });

      const res = await fetch(`/api/chat/stats/lead-report?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId
        }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch lead report details.');
      }

      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error compiling lead report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
    setCurrentPage(1); // Reset page on filter change
  }, [presetDate, startDate, endDate, selectedMonth, selectedYear, selectedStatus, selectedSource, selectedAgent, sortBy]);

  // Handle Search submit/debounce
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReportData();
  };

  // --- Helpers for formatting ---
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get current logged-in user name
  const getUserName = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.name || 'CRM User';
  };

  // Get current tenant name
  const getWorkspaceName = () => {
    const workspace = localStorage.getItem('workspaceName') || 'My CRM Workspace';
    return workspace;
  };

  // Get Date Range text for cover page
  const getReportPeriodText = () => {
    if (presetDate === 'custom') {
      if (startDate && endDate) return `${formatDate(startDate)} to ${formatDate(endDate)}`;
      if (startDate) return `Since ${formatDate(startDate)}`;
      if (endDate) return `Until ${formatDate(endDate)}`;
      return 'All-Time Custom';
    }
    
    if (selectedYear !== 'all') {
      if (selectedMonth !== 'all') {
        const monthLabel = monthsList.find(m => m.value === selectedMonth)?.label;
        return `${monthLabel} ${selectedYear}`;
      }
      return `Year ${selectedYear}`;
    }

    if (selectedMonth !== 'all') {
      const monthLabel = monthsList.find(m => m.value === selectedMonth)?.label;
      return `${monthLabel} ${new Date().getFullYear()}`;
    }

    switch (presetDate) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'this_week': return 'This Week';
      case 'this_month': return 'This Month';
      case 'current_year': return 'Current Year';
      case 'previous_year': return 'Previous Year';
      default: return 'All Active Period';
    }
  };

  // --- Export Functionalities ---
  
  // 1. CSV / Excel Export
  const handleExportCSV = () => {
    if (!reportData || !reportData.leads || reportData.leads.length === 0) {
      toast.error('No lead records available to export.');
      return;
    }

    const headers = [
      'Lead ID', 'Name', 'Phone', 'Email', 'Company', 'Source Type', 'Source Summary',
      'Assigned Agent', 'Assigned Counsellor', 'Status', 'Heat Level', 'Created At', 'Last Update'
    ];

    const rows = reportData.leads.map(lead => [
      lead._id,
      lead.name || '',
      lead.phone || '',
      lead.email || '',
      lead.companyName || '',
      lead.leadSourceType || 'Manual Entry',
      lead.leadSource || '',
      lead.assignedAgentName || 'Unassigned',
      lead.assignedCounsellorName || 'Unassigned',
      lead.status || '',
      lead.heatLevel || 'Cold',
      lead.createdAt ? new Date(lead.createdAt).toISOString() : '',
      lead.updatedAt ? new Date(lead.updatedAt).toISOString() : ''
    ]);

    // Escape CSV fields
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lead_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Lead records exported successfully!');
  };

  // 2. Trigger Print Window
  const handlePrint = () => {
    window.print();
  };

  // --- Table Pagination Calculations ---
  const leads = reportData?.leads || [];
  const totalPages = Math.ceil(leads.length / pageSize);
  const paginatedLeads = leads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // --- Best Performer Calculation ---
  const getBestPerformer = () => {
    if (!reportData || !reportData.analytics?.teamPerformance || reportData.analytics.teamPerformance.length === 0) {
      return 'N/A';
    }
    const best = [...reportData.analytics.teamPerformance].sort((a,b) => b.convertedLeads - a.convertedLeads)[0];
    return best ? `${best.name} (${best.convertedLeads} Won)` : 'N/A';
  };

  // --- Custom Animated SVGs for Charts ---

  // Sparkline Chart points helper
  const getSparklinePoints = (trendData, width, height, padding) => {
    if (!trendData || trendData.length === 0) return '';
    const maxVal = Math.max(...trendData.map(d => d.value), 5) * 1.2;
    const stepX = (width - padding * 2) / (trendData.length > 1 ? trendData.length - 1 : 1);
    const plotHeight = height - padding * 2;
    
    return trendData.map((d, index) => {
      const x = padding + index * stepX;
      const y = height - padding - (d.value / maxVal) * plotHeight;
      return { x, y, label: d.label, value: d.value };
    });
  };

  const trendPoints = reportData ? getSparklinePoints(reportData.analytics.monthlyLeadTrend, 500, 180, 20) : [];
  const trendLinePath = trendPoints.length > 0 ? `M ${trendPoints.map(p => `${p.x} ${p.y}`).join(' L ')}` : '';
  const trendAreaPath = trendPoints.length > 0 ? `${trendLinePath} L ${trendPoints[trendPoints.length - 1].x} 160 L ${trendPoints[0].x} 160 Z` : '';

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-slate-900 text-slate-100 font-sans relative overflow-hidden">
      {/* Background radial gradients for sleek premium dark mode */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none z-0" />

      {/* --- EXECUTIVE PRINT LAYOUT COVER PAGE (Hidden on screen) --- */}
      <div className="hidden print-layout print:block p-10 bg-white text-slate-900 font-serif min-h-screen">
        <div className="text-center mb-12 border-b-2 border-slate-900 pb-8">
          <h2 className="text-xl font-bold tracking-widest text-slate-500 uppercase">{getWorkspaceName()}</h2>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mt-2">LEAD PERFORMANCE REPORT</h1>
          <p className="text-md italic text-slate-500 mt-2">Executive Summary & Lifecycle Metrics</p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-12 bg-slate-50 p-6 rounded-xl border border-slate-200 text-sm font-sans">
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Metadata Details</p>
            <table className="mt-2 w-full">
              <tbody>
                <tr>
                  <td className="font-semibold py-1">Report Period:</td>
                  <td>{getReportPeriodText()}</td>
                </tr>
                <tr>
                  <td className="font-semibold py-1">Generated By:</td>
                  <td>{reportData?.summary.generatedBy || getUserName()}</td>
                </tr>
                <tr>
                  <td className="font-semibold py-1">Generated On:</td>
                  <td>{formatDateTime(reportData?.summary.generatedAt || new Date())}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">KPI Overview</p>
            <table className="mt-2 w-full">
              <tbody>
                <tr>
                  <td className="font-semibold py-1">Total Captured Leads:</td>
                  <td className="font-bold">{reportData?.summary.totalLeads || 0}</td>
                </tr>
                <tr>
                  <td className="font-semibold py-1">Converted Admissions:</td>
                  <td className="font-bold text-emerald-600">{reportData?.summary.convertedLeads || 0} ({reportData?.summary.conversionRatio || 0}%)</td>
                </tr>
                <tr>
                  <td className="font-semibold py-1">Pending Follow-ups:</td>
                  <td className="font-bold text-amber-500">{reportData?.summary.followupsPending || 0}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <h3 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4 font-sans uppercase">Leads Performance Aggregates</h3>
        <div className="grid grid-cols-5 gap-4 text-center mb-12">
          {[
            { label: 'Total', val: reportData?.summary.totalLeads },
            { label: 'New', val: reportData?.summary.newLeads },
            { label: 'Pending', val: reportData?.summary.pendingLeads },
            { label: 'Converted', val: reportData?.summary.convertedLeads },
            { label: 'Lost', val: reportData?.summary.lostLeads }
          ].map((card, i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{card.label}</p>
              <p className="text-2xl font-black mt-1 text-slate-900">{card.val || 0}</p>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4 font-sans uppercase">Detailed Team Breakdowns</h3>
        <table className="w-full text-left text-sm border-collapse mb-12">
          <thead>
            <tr className="border-b-2 border-slate-400 bg-slate-100 font-sans">
              <th className="p-3">Team Member</th>
              <th className="p-3">Role</th>
              <th className="p-3">Total Leads</th>
              <th className="p-3">Converted</th>
              <th className="p-3">Conversion %</th>
              <th className="p-3">Pending Follow-ups</th>
            </tr>
          </thead>
          <tbody>
            {reportData?.analytics.teamPerformance.map((member, i) => (
              <tr key={i} className="border-b border-slate-200 font-sans">
                <td className="p-3 font-semibold">{member.name}</td>
                <td className="p-3 text-slate-500">{member.role}</td>
                <td className="p-3 font-bold">{member.totalLeads}</td>
                <td className="p-3 text-emerald-600 font-bold">{member.convertedLeads}</td>
                <td className="p-3 font-bold">{member.conversionRate}%</td>
                <td className="p-3 text-amber-500 font-bold">{member.pendingFollowups}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <p className="text-[10px] text-center text-slate-400 italic font-sans mt-20">
          This document is generated dynamically from secure dynamic databases. End of Report.
        </p>
      </div>

      {/* --- SCREEN VIEW INTERFACE (Visible only on monitor screens) --- */}
      <div className="print:hidden relative z-10">
        
        {/* --- PAGE HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">
              <FileText size={14} />
              <span>Executive Reporting Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2">
              Lead Performance Report
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
              Analyze lifecycle movements, conversion metrics, and follow-up activities.
            </p>
          </div>
          
          <div className="flex items-center gap-3 self-start md:self-center">
            <button 
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${showFilterPanel ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
            >
              <Filter size={14} />
              <span>{showFilterPanel ? 'Hide Filters' : 'Show Filters'}</span>
            </button>

            <button 
              onClick={handlePrint}
              className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
            >
              <Printer size={14} />
              <span>Print Report</span>
            </button>

            <button 
              onClick={handleExportCSV}
              className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold hover:shadow-glow transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* --- DYNAMIC FILTER PANEL --- */}
        <AnimatePresence>
          {showFilterPanel && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-5 rounded-2xl shadow-premium">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800/80 pb-3 mb-5">
                  <Filter size={12} className="text-blue-500" />
                  <span>Advanced Report Filters</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Date Preset */}
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Date Preset</label>
                    <div className="relative">
                      <select 
                        value={presetDate} 
                        onChange={(e) => setPresetDate(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                      >
                        <option value="all">All-Time Period</option>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="this_week">This Week</option>
                        <option value="this_month">This Month</option>
                        <option value="current_year">Current Year</option>
                        <option value="previous_year">Previous Year</option>
                        <option value="custom">Custom Date Range</option>
                      </select>
                      <Calendar size={14} className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Custom Date Inputs */}
                  {presetDate === 'custom' && (
                    <>
                      <div className="flex flex-col">
                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Start Date</label>
                        <input 
                          type="date" 
                          value={startDate} 
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">End Date</label>
                        <input 
                          type="date" 
                          value={endDate} 
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </>
                  )}

                  {/* Specific Month (Only active if not custom preset) */}
                  {presetDate !== 'custom' && (
                    <div className="flex flex-col">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Month Filter</label>
                      <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="all">All Months</option>
                        {monthsList.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Specific Year */}
                  {presetDate !== 'custom' && (
                    <div className="flex flex-col">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Year Filter</label>
                      <select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="all">Current Year</option>
                        {yearsList.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Teammate Filter */}
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Teammate (Owner)</label>
                    <select 
                      value={selectedAgent} 
                      onChange={(e) => setSelectedAgent(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="all">All Teammates</option>
                      {reportData?.analytics.teamPerformance.map(agent => (
                        <option key={agent.userId} value={agent.userId}>{agent.name} ({agent.role})</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Status Category</label>
                    <select 
                      value={selectedStatus} 
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      {statusesList.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>

                  {/* Source Filter */}
                  <div className="flex flex-col">
                    <label className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Lead Source</label>
                    <select 
                      value={selectedSource} 
                      onChange={(e) => setSelectedSource(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="all">All Sources</option>
                      {sourcesList.map(src => <option key={src.value} value={src.value}>{src.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Keyword Search box */}
                <form onSubmit={handleSearchSubmit} className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="text"
                      placeholder="Keyword Search on Lead Name, Phone, Email, Company, Lead ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-medium placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <Search size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
                  </div>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest border border-slate-700 transition-colors"
                  >
                    Apply Search
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- TABS NAVIGATION --- */}
        <div className="flex border-b border-slate-850 mb-8 bg-slate-950/40 p-1.5 rounded-xl self-start gap-1">
          {[
            { id: 'overview', label: 'Executive Cover' },
            { id: 'charts', label: 'Dashboard Analytics' },
            { id: 'leads', label: 'Leads Table & Log' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 text-xs uppercase font-bold tracking-widest rounded-lg transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* --- MAIN PAGE VIEW CONTENT --- */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-36">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-xs uppercase font-bold text-slate-400 tracking-widest animate-pulse">Assembling Lead Aggregates...</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* 1. EXECUTIVE COVER VIEW */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Executive Cover card */}
                <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-premium flex flex-col justify-between relative overflow-hidden min-h-[420px]">
                  {/* Decorative background SVG shape */}
                  <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                    <FileText size={350} className="text-blue-500 translate-x-20 translate-y-20" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h2 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Formal Executive Document</h2>
                          <p className="text-xs text-slate-500 font-bold mt-0.5">{getWorkspaceName()}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-[9px] uppercase font-bold tracking-widest">
                        v1.5.4 Secure
                      </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-6">
                      LEAD PERFORMANCE REPORT
                    </h1>
                    <p className="text-slate-400 text-sm mt-2 italic font-serif">
                      A comprehensive analysis of client acquisitions, team conversions, and scheduled sales tasks.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mt-12 text-xs">
                      <div>
                        <p className="text-slate-500 uppercase font-black tracking-wider text-[9px]">Generated Period</p>
                        <p className="text-slate-200 font-bold text-sm mt-1">{getReportPeriodText()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase font-black tracking-wider text-[9px]">Generated By</p>
                        <p className="text-slate-200 font-bold text-sm mt-1">{reportData?.summary.generatedBy || getUserName()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 uppercase font-black tracking-wider text-[9px]">Date Compiled</p>
                        <p className="text-slate-200 font-bold text-sm mt-1">{formatDate(reportData?.summary.generatedAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 pt-6 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>Executive Document ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                    <span>WapiPulse Reporting Core</span>
                  </div>
                </div>

                {/* High level executive conversion circle card */}
                <div className="bg-slate-950/60 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-premium flex flex-col justify-between items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="w-full text-left">
                    <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">Conversion Ratio</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Leads closed won ratio</p>
                  </div>

                  {/* Interactive SVG semi-donut progress bar */}
                  <div className="my-6 relative flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-44 h-44">
                      {/* Trail path */}
                      <circle cx="50" cy="50" r="42" stroke="#1e293b" strokeWidth="8" fill="none" />
                      {/* Gradient fill */}
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="42" 
                        stroke="url(#gradient-convo)" 
                        strokeWidth="8" 
                        fill="none"
                        strokeDasharray="263.89" 
                        strokeDashoffset={263.89 - (263.89 * (reportData?.summary.conversionRatio || 0)) / 100}
                        strokeLinecap="round" 
                        transform="rotate(-90 50 50)"
                        className="transition-all duration-1000 ease-out" 
                      />
                      <defs>
                        <linearGradient id="gradient-convo" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-black text-white">{reportData?.summary.conversionRatio || 0}%</span>
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Ratio</span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <CheckCircle size={14} />
                      <span>{reportData?.summary.convertedLeads || 0} Won</span>
                    </div>
                    <div className="w-px h-4 bg-slate-800" />
                    <div className="text-slate-400 font-medium">
                      Out of {reportData?.summary.totalLeads || 0} Leads
                    </div>
                  </div>
                </div>

                {/* KPI Summary Cards Grid */}
                <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Total Leads', val: reportData?.summary.totalLeads, icon: Users, color: 'from-blue-600 to-indigo-600', text: 'Total Captured' },
                    { label: 'New Leads', val: reportData?.summary.newLeads, icon: TrendingUp, color: 'from-cyan-600 to-blue-600', text: 'Fresh Entrants' },
                    { label: 'Follow-ups Pending', val: reportData?.summary.followupsPending, icon: Clock, color: 'from-amber-600 to-orange-600', text: 'Action Items' },
                    { label: 'Converted Leads', val: reportData?.summary.convertedLeads, icon: CheckCircle, color: 'from-emerald-600 to-teal-600', text: 'Closed Won' },
                    { label: 'Lost Leads', val: reportData?.summary.lostLeads, icon: AlertTriangle, color: 'from-rose-600 to-red-600', text: 'Closed Lost' },
                    { label: 'Best Teammate', val: getBestPerformer(), icon: Award, color: 'from-purple-600 to-pink-600', text: 'Top Converted' }
                  ].map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <motion.div 
                        key={i}
                        whileHover={{ y: -3 }}
                        className="bg-slate-900/60 p-5 rounded-2xl border border-slate-850 shadow-premium flex flex-col justify-between h-[130px] relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest">{card.label}</span>
                          <div className={`p-1.5 rounded-lg bg-gradient-to-br ${card.color} text-white`}>
                            <Icon size={12} />
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <p className="text-xl sm:text-2xl font-black text-white truncate">{card.val ?? 0}</p>
                          <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{card.text}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Quick Snapshot Metrics */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Leads by source list */}
                  <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-premium">
                    <h3 className="text-xs uppercase font-bold text-slate-300 tracking-wider mb-4">Leads by Platform Source</h3>
                    <div className="space-y-4">
                      {reportData?.analytics.leadsBySource.slice(0, 5).map((source, i) => {
                        const maxVal = Math.max(...reportData.analytics.leadsBySource.map(s => s.value), 1);
                        const pct = Math.round((source.value / maxVal) * 100);
                        return (
                          <div key={i} className="flex flex-col">
                            <div className="flex justify-between text-xs font-semibold mb-1">
                              <span className="text-slate-300 flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${
                                  source.label.toLowerCase().includes('facebook') ? 'bg-blue-500' :
                                  source.label.toLowerCase().includes('instagram') ? 'bg-pink-500' :
                                  source.label.toLowerCase().includes('web') ? 'bg-emerald-500' :
                                  source.label.toLowerCase().includes('google') ? 'bg-red-500' : 'bg-slate-400'
                                }`} />
                                {source.label}
                              </span>
                              <span className="text-slate-400">{source.value} Leads</span>
                            </div>
                            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className={`h-full bg-gradient-to-r ${
                                  source.label.toLowerCase().includes('facebook') ? 'from-blue-600 to-indigo-500' :
                                  source.label.toLowerCase().includes('instagram') ? 'from-pink-650 to-rose-500' :
                                  source.label.toLowerCase().includes('web') ? 'from-emerald-650 to-teal-500' :
                                  source.label.toLowerCase().includes('google') ? 'from-red-650 to-orange-500' : 'from-slate-650 to-slate-500'
                                }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                      {reportData?.analytics.leadsBySource.length === 0 && (
                        <p className="text-xs text-slate-500 italic py-4">No sources recorded.</p>
                      )}
                    </div>
                  </div>

                  {/* Quick follow up rate gauge */}
                  <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-premium flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs uppercase font-bold text-slate-300 tracking-wider">Follow-up Completion Rate</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Completed vs Pending Tasks Ratio</p>
                    </div>

                    <div className="flex items-center gap-6 my-4">
                      {/* Metric text */}
                      <div>
                        <p className="text-4xl font-black text-white">{reportData?.summary.followupCompletionRate || 0}%</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Action Items Finished</p>
                      </div>

                      {/* Small horizontal progress visualizer */}
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                          <span>Pending Action Items</span>
                          <span className="text-amber-500">{reportData?.summary.followupsPending || 0}</span>
                        </div>
                        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${reportData?.summary.followupCompletionRate || 0}%` }}
                            transition={{ duration: 1 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 bg-slate-950/40 p-3 rounded-xl border border-slate-850 flex items-center gap-1.5 leading-relaxed font-medium">
                      <Info size={12} className="text-slate-400 shrink-0" />
                      <span>Regular follow-up schedules are critical to lead qualification, ensuring high-conversion funnels.</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 2. DASHBOARD ANALYTICS VIEW */}
            {activeTab === 'charts' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Chart: Monthly Lead Trend */}
                <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-premium">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xs uppercase font-bold text-slate-300 tracking-wider">Monthly Lead Inflow Trend</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Total inbound volume across time</p>
                    </div>
                  </div>

                  {/* Smooth Sparkline line chart SVG */}
                  {reportData?.analytics.monthlyLeadTrend && reportData.analytics.monthlyLeadTrend.length > 0 ? (
                    <div className="relative">
                      <svg viewBox="0 0 500 180" className="w-full h-auto">
                        <defs>
                          <linearGradient id="trend-area-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        
                        {/* Horizontal grid lines */}
                        {[20, 55, 90, 125, 160].map((y, idx) => (
                          <line key={idx} x1="20" y1={y} x2="480" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                        ))}

                        {/* Area Fill */}
                        <path d={trendAreaPath} fill="url(#trend-area-grad)" />

                        {/* Line Path */}
                        <motion.path 
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.5, ease: 'easeOut' }}
                          d={trendLinePath} 
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth="3.5" 
                          strokeLinecap="round" 
                        />

                        {/* Points Markers */}
                        {trendPoints.map((point, idx) => (
                          <g key={idx} className="group cursor-pointer">
                            <circle cx={point.x} cy={point.y} r="5" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" className="transition-transform duration-300 hover:scale-150" />
                            <text x={point.x} y={point.y - 10} textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold" className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900">
                              {point.value}
                            </text>
                            {/* X-axis label */}
                            {idx % 2 === 0 && (
                              <text x={point.x} y="175" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="semibold">
                                {point.label}
                              </text>
                            )}
                          </g>
                        ))}
                      </svg>
                    </div>
                  ) : (
                    <div className="h-44 flex items-center justify-center text-xs text-slate-500 italic">
                      No monthly trend records compiled.
                    </div>
                  )}
                </div>

                {/* Chart: Team Conversion Breakdown */}
                <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-premium">
                  <div>
                    <h3 className="text-xs uppercase font-bold text-slate-300 tracking-wider">Teammate Conversion & Follow-up</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Individual volume and performance aggregates</p>
                  </div>

                  <div className="mt-6 space-y-5 max-h-[300px] overflow-y-auto pr-1">
                    {reportData?.analytics.teamPerformance.map((member, i) => {
                      const maxLeads = Math.max(...reportData.analytics.teamPerformance.map(m => m.totalLeads), 1);
                      const leadsPct = Math.round((member.totalLeads / maxLeads) * 100);
                      
                      return (
                        <div key={i} className="flex flex-col bg-slate-950/40 p-4 rounded-2xl border border-slate-850/80">
                          <div className="flex justify-between items-center text-xs font-semibold mb-2">
                            <div>
                              <span className="text-white font-bold">{member.name}</span>
                              <span className="text-[9px] uppercase tracking-wider text-slate-500 ml-2">({member.role})</span>
                            </div>
                            <div className="flex gap-4">
                              <span className="text-slate-400"><strong className="text-slate-200">{member.totalLeads}</strong> Leads</span>
                              <span className="text-emerald-400"><strong className="text-emerald-350">{member.convertedLeads}</strong> Won ({member.conversionRate}%)</span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            {/* Lead volume bar */}
                            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${leadsPct}%` }}
                                transition={{ duration: 0.8 }}
                                className="h-full bg-blue-600"
                              />
                            </div>
                            
                            {/* Conversion rate bar */}
                            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${member.conversionRate}%` }}
                                transition={{ duration: 0.8 }}
                                className="h-full bg-emerald-500"
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[9px] uppercase font-bold text-slate-500 mt-2 tracking-widest">
                            <span>Pending Follow-ups: <strong className="text-amber-500">{member.pendingFollowups}</strong></span>
                            <span>Follow-up Rate: <strong className="text-slate-300">{member.followupCompletionRate}%</strong></span>
                          </div>
                        </div>
                      );
                    })}
                    {reportData?.analytics.teamPerformance.length === 0 && (
                      <p className="text-xs text-slate-500 italic py-6 text-center">No teammate performance records available.</p>
                    )}
                  </div>
                </div>

                {/* Leads by source platform comparative grid */}
                <div className="lg:col-span-2 bg-slate-900/60 p-6 rounded-3xl border border-slate-800 shadow-premium">
                  <h3 className="text-xs uppercase font-bold text-slate-300 tracking-wider mb-6">Leads Platform Source Distribution</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {reportData?.analytics.leadsBySource.map((source, i) => {
                      const total = reportData.summary.totalLeads || 1;
                      const pct = Math.round((source.value / total) * 100);
                      
                      return (
                        <div key={i} className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850/80 hover:border-blue-500/20 transition-all flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{source.label}</span>
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[9px] font-bold">{pct}%</span>
                          </div>
                          
                          <div className="mt-4">
                            <p className="text-3xl font-black text-white">{source.value}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Acquired Leads</p>
                          </div>
                        </div>
                      );
                    })}
                    {reportData?.analytics.leadsBySource.length === 0 && (
                      <p className="text-xs text-slate-500 italic py-6 text-center col-span-full">No source distribution details available.</p>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* 3. LEADS TABLE & LOG VIEW */}
            {activeTab === 'leads' && (
              <div className="bg-slate-900/60 rounded-3xl border border-slate-800 shadow-premium overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-xs uppercase font-bold text-slate-300 tracking-wider">Leads Lifecycle Registers</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">List of all leads matching filter criteria</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-medium">Sort By:</span>
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="latest">Latest Created</option>
                      <option value="oldest">Oldest Created</option>
                      <option value="priority">Priority (Hot First)</option>
                      <option value="status">Status Wise</option>
                    </select>
                  </div>
                </div>

                {/* Table container */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="p-4 pl-6">Lead ID</th>
                        <th className="p-4">Contact Details</th>
                        <th className="p-4">Company</th>
                        <th className="p-4">Lead Source</th>
                        <th className="p-4">Assigned Expert</th>
                        <th className="p-4">Lifecycle Status</th>
                        <th className="p-4">Priority</th>
                        <th className="p-4">Registered Date</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {paginatedLeads.map((lead) => (
                        <tr 
                          key={lead._id}
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowDrawer(true);
                          }}
                          className="hover:bg-slate-800/40 cursor-pointer transition-colors duration-150"
                        >
                          {/* Lead ID */}
                          <td className="p-4 pl-6 font-mono text-[10px] text-slate-400 font-bold">
                            #{lead._id.toString().slice(-6).toUpperCase()}
                          </td>
                          {/* Contact Details */}
                          <td className="p-4">
                            <div>
                              <p className="font-extrabold text-white text-sm hover:text-blue-400 transition-colors">{lead.name}</p>
                              <div className="flex flex-col gap-0.5 mt-0.5 text-slate-500 font-medium">
                                <span className="flex items-center gap-1"><Phone size={10} /> {lead.phone}</span>
                                {lead.email && <span className="flex items-center gap-1"><Mail size={10} /> {lead.email}</span>}
                              </div>
                            </div>
                          </td>
                          {/* Company */}
                          <td className="p-4 text-slate-300 font-semibold">{lead.companyName || 'N/A'}</td>
                          {/* Lead Source */}
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-slate-950/80 text-slate-400 rounded-md border border-slate-850 text-[10px] font-bold">
                              {lead.leadSourceType || 'Manual Entry'}
                            </span>
                          </td>
                          {/* Assigned Agent */}
                          <td className="p-4">
                            <div>
                              <p className="text-slate-300 font-bold">{lead.assignedAgentName || 'Unassigned'}</p>
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Agent</p>
                              {lead.assignedCounsellorName !== 'Unassigned' && (
                                <>
                                  <p className="text-slate-400 font-bold mt-1.5">{lead.assignedCounsellorName}</p>
                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Counsellor</p>
                                </>
                              )}
                            </div>
                          </td>
                          {/* Status */}
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border ${
                              ['CLOSED_WON', 'ADMISSION'].includes(lead.status) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              ['CLOSED_LOST', 'CLOSED', 'CLOSE'].includes(lead.status) ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                              ['NEW', 'NEW LEAD'].includes(lead.status) ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {lead.status}
                            </span>
                          </td>
                          {/* Heat Level */}
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border ${
                              lead.heatLevel === 'Hot' ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' :
                              lead.heatLevel === 'Warm' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                              'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                              {lead.heatLevel || 'Cold'}
                            </span>
                          </td>
                          {/* Registered Date */}
                          <td className="p-4 text-slate-400 font-bold">{formatDate(lead.createdAt)}</td>
                          {/* Action */}
                          <td className="p-4 pr-6 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLead(lead);
                                setShowDrawer(true);
                              }}
                              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 transition-colors"
                            >
                              Log View
                            </button>
                          </td>
                        </tr>
                      ))}
                      {paginatedLeads.length === 0 && (
                        <tr>
                          <td colSpan="9" className="text-center py-16 text-xs text-slate-500 italic">
                            No lead records matching current parameters found in workspace.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="p-5 border-t border-slate-800/80 bg-slate-950/40 flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-bold">
                      Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, leads.length)} of {leads.length} Records
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-slate-750 bg-slate-800 text-slate-300 disabled:text-slate-600 disabled:bg-slate-900 rounded-xl transition-colors cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                      <span className="text-xs font-bold text-white px-3">
                        Page {currentPage} of {totalPages}
                      </span>
                      
                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-slate-750 bg-slate-800 text-slate-300 disabled:text-slate-600 disabled:bg-slate-900 rounded-xl transition-colors cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* --- LEAD TIMELINE HISTORY DRAWER --- */}
      <AnimatePresence>
        {showDrawer && selectedLead && (
          <>
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 bg-slate-950 z-[90] lg:block print:hidden"
            />

            {/* Slide out drawer panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed top-0 right-0 h-screen w-full sm:w-[480px] bg-slate-950 border-l border-slate-850 z-[100] flex flex-col justify-between print:hidden"
            >
              {/* Header */}
              <div className="p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-start shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[9px] font-mono uppercase tracking-widest font-black">
                      Lead ID: #{selectedLead._id.toString().slice(-6).toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border ${
                      ['CLOSED_WON', 'ADMISSION'].includes(selectedLead.status) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      ['CLOSED_LOST', 'CLOSED', 'CLOSE'].includes(selectedLead.status) ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {selectedLead.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-2 leading-none">{selectedLead.name}</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-1.5">{selectedLead.companyName || 'No Company Recorded'}</p>
                </div>
                <button 
                  onClick={() => setShowDrawer(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                {/* 1. Profile information summary */}
                <div className="bg-slate-900/60 rounded-2xl border border-slate-850 p-4 space-y-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 uppercase font-black tracking-wider text-[9px]">Mobile Phone</span>
                    <span className="text-slate-200 font-bold">{selectedLead.phone}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-slate-850 pt-3">
                    <span className="text-slate-500 uppercase font-black tracking-wider text-[9px]">Email Address</span>
                    <span className="text-slate-200 font-bold truncate max-w-[200px]">{selectedLead.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-slate-850 pt-3">
                    <span className="text-slate-500 uppercase font-black tracking-wider text-[9px]">Platform Source</span>
                    <span className="text-slate-200 font-bold">{selectedLead.leadSourceType || 'Manual Entry'} ({selectedLead.leadSource || 'Manual'})</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-slate-850 pt-3">
                    <span className="text-slate-500 uppercase font-black tracking-wider text-[9px]">Created Date</span>
                    <span className="text-slate-200 font-bold">{formatDateTime(selectedLead.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-slate-850 pt-3">
                    <span className="text-slate-500 uppercase font-black tracking-wider text-[9px]">Assigned Agents</span>
                    <span className="text-slate-200 font-bold">
                      {selectedLead.assignedAgentName || 'Unassigned'}
                      {selectedLead.assignedCounsellorName !== 'Unassigned' && ` / ${selectedLead.assignedCounsellorName}`}
                    </span>
                  </div>
                </div>

                {/* 2. Tasks / Follow-up list */}
                <div>
                  <h3 className="text-xs uppercase font-bold text-slate-300 tracking-wider mb-4 border-b border-slate-850 pb-2 flex items-center gap-1.5">
                    <Clock size={12} className="text-blue-500" />
                    <span>Follow-up Logs & Schedule</span>
                  </h3>
                  <div className="space-y-3">
                    {selectedLead.tasks && selectedLead.tasks.length > 0 ? (
                      selectedLead.tasks.map((task, i) => (
                        <div key={i} className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex items-start justify-between">
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border mb-1.5 ${
                              task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {task.status}
                            </span>
                            <h4 className="text-xs font-black text-white">{task.title || 'Follow-up Call'}</h4>
                            {task.description && <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">{task.description}</p>}
                            {task.outcome && <p className="text-[10px] text-emerald-400 font-semibold mt-1">Remark: {task.outcome}</p>}
                          </div>
                          
                          <span className="text-[9px] font-bold text-slate-500 flex flex-col items-end">
                            <span>Due Date</span>
                            <span className="text-slate-300 mt-1">{formatDate(task.dueDate)}</span>
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic py-2">No follow-ups recorded on lead profile.</p>
                    )}
                  </div>
                </div>

                {/* 3. Event timeline log history */}
                <div>
                  <h3 className="text-xs uppercase font-bold text-slate-300 tracking-wider mb-4 border-b border-slate-850 pb-2 flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-blue-500" />
                    <span>Lead Activity Timeline</span>
                  </h3>

                  <div className="relative border-l-2 border-slate-850 pl-5 ml-2.5 space-y-6 py-2">
                    {selectedLead.timeline && selectedLead.timeline.length > 0 ? (
                      selectedLead.timeline.map((event, idx) => (
                        <div key={idx} className="relative">
                          {/* Timeline dot */}
                          <div className={`absolute left-[-26px] top-1.5 w-2.5 h-2.5 rounded-full border-2 ${
                            event.eventType === 'LEAD_ESTABLISHED' ? 'bg-blue-500 border-blue-500' :
                            event.eventType === 'STATUS_UPDATED' ? 'bg-amber-500 border-amber-500' :
                            event.eventType === 'COUNSELLOR_ASSIGNED' ? 'bg-cyan-500 border-cyan-500' :
                            event.eventType === 'TASK_COMPLETED' ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-400 border-slate-400'
                          }`} />
                          
                          <span className="text-[9px] font-bold text-slate-500">{formatDateTime(event.timestamp)}</span>
                          <h4 className="text-xs font-black text-white mt-1 uppercase tracking-wider text-[10px]">{event.eventType?.replace(/_/g, ' ') || 'Lifecycle Step'}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-relaxed">{event.description}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No timeline history recorded.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-900 border-t border-slate-800 shrink-0">
                <button 
                  onClick={() => setShowDrawer(false)}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-premium"
                >
                  Close Lead Log
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
