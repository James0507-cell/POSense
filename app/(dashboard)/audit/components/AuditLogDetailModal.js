'use client';

import React, { useState, useEffect, useCallback } from 'react';

export default function AuditLogDetailModal({ log: initialLog, onClose }) {
  const [log, setLog] = useState(initialLog);
  const [loading, setLoading] = useState(!initialLog?.change_details);
  const [error, setError] = useState(null);

  const fetchLogDetails = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/audit?id=${id}`);
      if (!res.ok) throw new Error('Failed to fetch log details');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLog(data);
    } catch (err) {
      console.error('Error fetching log details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialLog?.id && (!initialLog.change_details || Object.keys(initialLog.change_details).length === 0)) {
      fetchLogDetails(initialLog.id);
    } else {
        setLog(initialLog);
        setLoading(false);
    }
  }, [initialLog, fetchLogDetails]);

  if (!initialLog) return null;

  const renderJsonDiff = (oldData, newData) => {
    const diff = {};
    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

    allKeys.forEach(key => {
      const oldVal = oldData ? oldData[key] : undefined;
      const newVal = newData ? newData[key] : undefined;

      if (oldVal !== newVal) {
        if (oldVal === undefined) {
          diff[key] = { status: 'added', newValue: newVal };
        } else if (newVal === undefined) {
          diff[key] = { status: 'removed', oldValue: oldVal };
        } else {
          diff[key] = { status: 'changed', oldValue: oldVal, newValue: newVal };
        }
      } else if (oldVal !== undefined) {
        // If values are the same, still show them for context
        diff[key] = { status: 'unchanged', value: oldVal };
      }
    });

    if (Object.keys(diff).length === 0) return <p className="text-gray-500 italic text-sm text-center">No data details available</p>;

    return Object.entries(diff).map(([key, value]) => (
      <div key={key} className="flex flex-col mb-2 p-2 border-b border-gray-100 last:border-b-0">
        <span className="font-bold text-gray-700 text-sm">{key}:</span>
        {value.status === 'added' && (
          <span className="text-green-600 text-xs pl-2">Added: {JSON.stringify(value.newValue)}</span>
        )}
        {value.status === 'removed' && (
          <span className="text-red-600 text-xs pl-2">Removed: {JSON.stringify(value.oldValue)}</span>
        )}
        {value.status === 'changed' && (
          <>
            <span className="text-red-600 text-xs pl-2">Old: {JSON.stringify(value.oldValue)}</span>
            <span className="text-green-600 text-xs pl-2">New: {JSON.stringify(value.newValue)}</span>
          </>
        )}
        {value.status === 'unchanged' && (
          <span className="text-gray-500 text-xs pl-2">Unchanged: {JSON.stringify(value.value)}</span>
        )}
      </div>
    ));
  };

  const oldData = log?.change_details?.old_data || log?.old_data;
  const newData = log?.change_details?.new_data || log?.new_data;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">
              Audit Log Details: {initialLog.action_type} on {initialLog.table_name}
            </h3>
            <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-500 font-medium">Record ID: <span className="text-gray-900 font-bold">{initialLog.record_id}</span></p>
                <p className="text-sm text-gray-500 font-medium">Timestamp: <span className="text-gray-900 font-bold">{new Date(initialLog.changed_at).toLocaleString()}</span></p>
                <p className="text-sm text-gray-500 font-medium">Performed By: <span className="text-gray-900 font-bold">{initialLog.actor_name}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Fetching detailed changes...</p>
                </div>
            ) : error ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <p className="text-gray-900 font-bold mb-2">Failed to load details</p>
                    <p className="text-gray-500 text-sm mb-6">{error}</p>
                    <button 
                        onClick={() => fetchLogDetails(initialLog.id)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {initialLog.action_type === 'INSERT' && (
                        <div className="md:col-span-2">
                        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Newly Added Data
                        </h4>
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            {renderJsonDiff(null, newData)}
                        </div>
                        </div>
                    )}

                    {(initialLog.action_type === 'UPDATE' || initialLog.action_type === 'DELETE') && (
                        <>
                        <div>
                            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                Old Data
                            </h4>
                            <div className="bg-red-50/30 p-6 rounded-2xl border border-red-100">
                            {renderJsonDiff(oldData, null)}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                New Data
                            </h4>
                            <div className="bg-green-50/30 p-6 rounded-2xl border border-green-100">
                            {renderJsonDiff(null, newData)}
                            </div>
                        </div>
                        </>
                    )}

                    {initialLog.action_type === 'UPDATE' && (
                        <div className="md:col-span-2">
                        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Specific Changes
                        </h4>
                        <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100">
                            {renderJsonDiff(oldData, newData)}
                        </div>
                        </div>
                    )}

                    {(!log?.change_details && !log?.old_data && !log?.new_data) && initialLog.action_type !== 'INSERT' && (
                        <div className="md:col-span-2 flex flex-col items-center justify-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-gray-400 font-medium italic">No detailed change history recorded for this entry.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
