'use client';

import React, { useState, useEffect } from 'react';

export default function CredentialForm({ employee, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const response = await fetch(`/api/employees/credentials?employeeId=${employee.employee_id}`);
        if (response.ok) {
          const data = await response.json();
          setFormData(prev => ({ ...prev, username: data.username || '' }));
        }
      } catch (error) {
        console.error("Error fetching credentials:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCredentials();
  }, [employee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const currentUser = parseInt(sessionStorage.getItem('employee_id')) || null;

    try {
      const response = await fetch('/api/employees/credentials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employee.employee_id,
          username: formData.username,
          password: formData.password || undefined, // Only send if not empty
          updated_by: currentUser
        })
      });

      if (!response.ok) throw new Error("Failed to update credentials");

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Credential update error:", error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Update Credentials</h3>
            <p className="text-xs text-gray-500 font-medium">For: {employee.first_name} {employee.last_name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div></div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Username</label>
              <input
                required
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">New Password (Leave blank to keep current)</label>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-blue-700 text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
              >
                {isSubmitting ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
