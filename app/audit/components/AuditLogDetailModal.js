'use client';

import React from 'react';

export default function AuditLogDetailModal({ log, onClose }) {
  if (!log) return null;

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

  const oldData = log.change_details?.old_data;
  const newData = log.change_details?.new_data;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">
              Audit Log Details: {log.action_type} on {log.table_name}
            </h3>
            <p className="text-sm text-gray-500">Record ID: {log.record_id}</p>
            <p className="text-sm text-gray-500">Timestamp: {new Date(log.changed_at).toLocaleString()}</p>
            <p className="text-sm text-gray-500">Employee: {log.actor_name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {log.action_type === 'INSERT' && (
            <div className="md:col-span-2">
              <h4 className="text-lg font-bold text-gray-800 mb-4">Newly Added Data</h4>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                {renderJsonDiff(null, newData)}
              </div>
            </div>
          )}

          {(log.action_type === 'UPDATE' || log.action_type === 'DELETE') && (
            <>
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-4">Old Data</h4>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                  {renderJsonDiff(oldData, null)}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-4">New Data</h4>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  {renderJsonDiff(null, newData)}
                </div>
              </div>
            </>
          )}

          {log.action_type === 'UPDATE' && (
            <div className="md:col-span-2">
              <h4 className="text-lg font-bold text-gray-800 mb-4">Changes</h4>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                {renderJsonDiff(oldData, newData)}
              </div>
            </div>
          )}

          {/* Fallback for other action types or if change_details format is unexpected */}
          {(!log.change_details || Object.keys(log.change_details).length === 0) && log.action_type !== 'INSERT' && (
             <div className="md:col-span-2 text-gray-500 italic">No specific change details available for this action type.</div>
          )}
        </div>
      </div>
    </div>
  );
}
