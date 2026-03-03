'use client';

import React, { useState, useEffect } from 'react';

export default function EmployeeDetailsModal({ employee, onClose, onEditInfo, onEditCredentials }) {
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const response = await fetch(`/api/employees/credentials?employeeId=${employee.employee_id}`);
        if (response.ok) {
          const data = await response.json();
          setCredentials(data);
        }
      } catch (error) {
        console.error("Error fetching credentials:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCredentials();
  }, [employee]);

  const detailItem = (label, value, icon) => (
    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
      <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
        </svg>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm font-bold text-gray-900">{value || 'Not provided'}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center text-2xl font-bold">
              {employee.first_name[0]}{employee.last_name[0]}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">
                {employee.first_name} {employee.middle_name ? `${employee.middle_name} ` : ''}{employee.last_name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded-full border border-blue-100">
                  {employee.role}
                </span>
                <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                  employee.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                }`}>
                  {employee.status}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Information Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Employee Information</h4>
              <button 
                onClick={() => onEditInfo(employee)}
                className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1.5 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Update Information
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {detailItem('Employee ID', `#${employee.employee_id}`, 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4')}
              {detailItem('Email Address', employee.email, 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z')}
              {detailItem('Contact Number', employee.contact_number, 'M3 5a2 2 0 012-2h3.28a1 1 0 011.94.484l-1.176 5.88a1 1 0 01-1.32.713L7.05 8.11a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l5.925 1.186a1 1 0 01.708.98V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z')}
              {detailItem('Hire Date', employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'N/A', 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z')}
            </div>
          </div>

          {/* Credentials Section */}
          <div className="space-y-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Account Credentials</h4>
              <button 
                onClick={() => onEditCredentials(employee)}
                className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1.5 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Manage Access
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div></div>
            ) : credentials?.username ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Username</p>
                  <p className="text-sm font-bold text-gray-900 bg-white px-4 py-2 rounded-xl border border-gray-100 inline-block min-w-[120px]">
                    {credentials.username}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-gray-500 font-medium italic">No account created for this employee</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 bg-gray-50 rounded-b-3xl border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all shadow-sm"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
