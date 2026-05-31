import React, { useState, useEffect } from 'react';
import { Download, Filter, Search, ArrowLeft, FileText, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function FailedMessageReport() {
  const [logs, setLogs] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    errorCode: '',
    phone: '',
    campaignId: ''
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.errorCode) queryParams.append('errorCode', filters.errorCode);
      if (filters.phone) queryParams.append('phone', filters.phone);
      if (filters.campaignId) queryParams.append('campaignId', filters.campaignId);

      const res = await fetch(`/api/campaigns/errors/report?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error('Failed to load error report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filters.startDate, filters.endDate, filters.errorCode, filters.campaignId]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenantId');
        const res = await fetch('/api/campaigns', {
          headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
        });
        if (res.ok) {
          setCampaigns(await res.json());
        }
      } catch (err) {
        console.error('Failed to load campaigns', err);
      }
    };
    fetchCampaigns();
  }, []);

  const handleExportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(logs.map(log => ({
      'Campaign Name': log.campaignName,
      'Phone Number': log.phone,
      'Error Code': log.errorCode || 'N/A',
      'Reason': log.errorReason || 'Unknown',
      'Sent At': log.sentAt ? new Date(log.sentAt).toLocaleString() : 'N/A'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FailedMessages");
    XLSX.writeFile(wb, "Failed_Message_Report.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Failed Message Report", 14, 15);
    
    const tableColumn = ["Campaign Name", "Phone", "Error Code", "Reason", "Date"];
    const tableRows = [];

    logs.forEach(log => {
      const logData = [
        log.campaignName,
        log.phone,
        log.errorCode || 'N/A',
        log.errorReason || 'Unknown',
        log.sentAt ? new Date(log.sentAt).toLocaleDateString() : 'N/A'
      ];
      tableRows.push(logData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    doc.save("Failed_Message_Report.pdf");
  };

  return (
    <div className="p-4 sm:p-8 bg-crm-bg min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate('/campaigns/errors/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
               <ArrowLeft size={20} className="text-gray-600" />
             </button>
             <h1 className="text-2xl font-black text-gray-800 tracking-tight">Failed Message Report</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-green-100 transition-colors">
              <FileSpreadsheet size={16} /> Excel
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-red-100 transition-colors">
              <FileText size={16} /> PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Start Date</label>
            <input 
              type="date" 
              className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={filters.startDate}
              onChange={e => setFilters({...filters, startDate: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">End Date</label>
            <input 
              type="date" 
              className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={filters.endDate}
              onChange={e => setFilters({...filters, endDate: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Error Code</label>
            <input 
              type="text" 
              placeholder="e.g. 131049"
              className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={filters.errorCode}
              onChange={e => setFilters({...filters, errorCode: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Campaign</label>
            <select
              className="px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              value={filters.campaignId}
              onChange={e => setFilters({...filters, campaignId: e.target.value})}
            >
              <option value="">All Campaigns</option>
              {campaigns.map(camp => (
                <option key={camp._id} value={camp._id}>{camp.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Phone Number</label>
            <div className="relative">
               <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
               <input 
                 type="text" 
                 placeholder="Search by phone..."
                 className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                 value={filters.phone}
                 onChange={e => setFilters({...filters, phone: e.target.value})}
                 onKeyDown={(e) => { if (e.key === 'Enter') fetchReports(); }}
               />
            </div>
          </div>
          <button onClick={fetchReports} className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-gray-700 transition-colors h-[38px]">
            Apply Filters
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Error Code</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading reports...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No failed messages found matching the criteria.</td></tr>
                ) : logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">{log.campaignName}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">{log.phone}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">
                        {log.errorCode || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{log.errorReason}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {log.sentAt ? new Date(log.sentAt).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
