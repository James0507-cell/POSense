'use client';

import React, { useState, useEffect } from 'react';

export default function EmployeeForm({ employee = null, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    contact_number: '',
    hire_date: new Date().toISOString().split('T')[0],
    role: 'Cashier',
    status: 'Active'
  });

  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        first_name: employee.first_name || '',
        middle_name: employee.middle_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        contact_number: employee.contact_number || '',
        hire_date: employee.hire_date || '',
        role: employee.role || 'Cashier',
        status: employee.status || 'Active'
      });
    }
  }, [employee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const currentUser = parseInt(sessionStorage.getItem('employee_id')) || null;

    try {
      if (employee) {
        // Update Info
        const response = await fetch('/api/employees', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: employee.employee_id,
            ...formData,
            updated_by: currentUser
          })
        });
        if (!response.ok) throw new Error("Failed to update employee");
      } else {
        // Create Employee + Credentials
        const response = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee: { ...formData, created_by: currentUser },
            credentials: { ...credentials }
          })
        });
        if (!response.ok) throw new Error("Failed to create employee");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Form error:", error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = [
    'Store Manager',
    'Products and Inventory Manager',
    'Sales & Expense Analyst',
    'Inventory Clerk',
    'Cashier'
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-3xl">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">
              {employee ? 'Edit Employee Information' : 'Add New Employee'}
            </h3>
            <p className="text-sm text-gray-500 font-medium">
              {employee ? 'Update personal and contact details' : 'Create a new staff member and their account'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Basic Info Section */}
          <div className="space-y-6">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">First Name</label>
                <input
                  required
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Middle Name</label>
                <input
                  type="text"
                  value={formData.middle_name}
                  onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Last Name</label>
                <input
                  required
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Contact Number</label>
                <input
                  type="text"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="space-y-6">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Employment Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all appearance-none cursor-pointer"
                >
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Hire Date</label>
                <input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Initial Credentials Section - Only for New Employees */}
          {!employee && (
            <div className="space-y-6 bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
              <h4 className="text-xs font-bold text-blue-700 uppercase tracking-widest border-b border-blue-100 pb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Account Credentials
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Username</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. james.santiago"
                    value={credentials.username}
                    onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                    className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Initial Password</label>
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-gray-200 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 bg-blue-700 text-white rounded-2xl text-sm font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : employee ? 'Update Employee' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
