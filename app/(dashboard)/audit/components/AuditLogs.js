'use client';

import React, { useState, useEffect } from 'react';
import AuditLogDetailModal from './AuditLogDetailModal';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionType, setActionType] = useState('all'); // 'all', 'INSERT', 'UPDATE', 'DELETE'

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [searchTerm, dateFrom, dateTo, actionType]); // Update dependency array

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(dateFrom && { dateFrom: dateFrom }),
        ...(dateTo && { dateTo: dateTo }),
        ...(actionType !== 'all' && { actionType: actionType }),
      }).toString();

      const res = await fetch(`/api/audit?${queryParams}`);
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setLogs(result.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Performed By', 'Action', 'Table', 'Record ID'];
    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        new Date(log.changed_at).toLocaleString().replace(/,/g, ''),
        `"${String(log.actor_name || '').replace(/"/g, '""')}"`,
        `"${String(log.action_type || '').replace(/"/g, '""')}"`,
        `"${String(log.table_name || '').replace(/"/g, '""')}"`,
        log.record_id
      ].join(','))
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Filters Bar */}
      <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative lg:col-span-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search employee, table, or record ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 lg:col-span-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm outline-none" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm outline-none" />
          </div>
          <div>
            <select value={actionType} onChange={(e) => setActionType(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm font-bold outline-none cursor-pointer text-gray-700">
              <option value="all">All Actions</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit List */}
      <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 md:p-8 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h4 className="text-lg md:text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">System Activity Audit</h4>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            <button 
              onClick={handleExport} 
              className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all whitespace-nowrap shrink-0"
            >
              Export CSV
            </button>
          </div>
        </div>
        {loading ? (
          <div className="p-20 text-center animate-pulse">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
               <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs md:text-sm">Loading activity logs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="bg-gray-50/50">
                  <th className="px-5 md:px-8 py-4 text-[10px] md:text-xs font-bold text-gray-400 uppercase">Timestamp</th>
                  <th className="px-5 md:px-8 py-4 text-[10px] md:text-xs font-bold text-gray-400 uppercase">Performed By</th>
                  <th className="px-5 md:px-8 py-4 text-[10px] md:text-xs font-bold text-gray-400 uppercase">Action</th>
                  <th className="px-5 md:px-8 py-4 text-[10px] md:text-xs font-bold text-gray-400 uppercase">Table</th>
                  <th className="px-5 md:px-8 py-4 text-[10px] md:text-xs font-bold text-gray-400 uppercase">Record ID</th>
                  <th className="px-5 md:px-8 py-4 text-[10px] md:text-xs font-bold text-gray-400 uppercase text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 md:px-8 py-4 md:py-5">
                      <p className="font-bold text-gray-900 text-xs md:text-sm">{new Date(log.changed_at).toLocaleString()}</p>
                    </td>
                    <td className="px-5 md:px-8 py-4 md:py-5">
                      <p className="font-bold text-gray-700 text-xs md:text-sm">{log.actor_name}</p>
                    </td>
                    <td className="px-5 md:px-8 py-4 md:py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        log.action_type === 'INSERT' ? 'bg-green-100 text-green-700' :
                        log.action_type === 'DELETE' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-5 md:px-8 py-4 md:py-5">
                      <p className="font-bold text-gray-500 text-[10px] uppercase tracking-widest">{log.table_name}</p>
                    </td>
                    <td className="px-5 md:px-8 py-4 md:py-5">
                       <span className="font-mono text-xs text-gray-400">#{log.record_id}</span>
                    </td>
                    <td className="px-5 md:px-8 py-4 md:py-5 text-center">
                      <button 
                        onClick={() => {
                          setSelectedLog(log);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <AuditLogDetailModal
          log={selectedLog}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
