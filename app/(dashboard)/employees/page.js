'use client';

import React, { useState, useEffect, Suspense } from 'react';
import EmployeeForm from './components/EmployeeForm';
import EmployeeDetailsModal from './components/EmployeeDetailsModal';
import CredentialForm from './components/CredentialForm';

function EmployeesContent() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCredentialFormOpen, setIsCredentialFormOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                         emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.employee_id.toString().includes(searchTerm);
    
    const matchesRole = roleFilter === 'All' || emp.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddEmployee = () => {
    setEmployeeToEdit(null);
    setIsFormOpen(true);
  };

  const handleViewDetails = (emp) => {
    setSelectedEmployee(emp);
    setIsDetailsOpen(true);
  };

  const handleEditInfo = (emp) => {
    setEmployeeToEdit(emp);
    setIsDetailsOpen(false);
    setIsFormOpen(true);
  };

  const handleEditCredentials = (emp) => {
    setEmployeeToEdit(emp);
    setIsDetailsOpen(false);
    setIsCredentialFormOpen(true);
  };

  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Employee Records</h1>
          <p className="text-xs md:text-sm text-gray-500 font-medium mt-1">Manage staff information, roles, and system access</p>
        </div>
        <button 
          onClick={handleAddEmployee}
          className="bg-blue-700 text-white px-4 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input
            type="text"
            placeholder="Search by name, email or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
          />
        </div>
        <div className="flex gap-4">
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 outline-none cursor-pointer"
          >
            <option value="All">All Roles</option>
            <option value="Store Manager">Store Manager</option>
            <option value="Products and Inventory Manager">Inventory Manager</option>
            <option value="Sales & Expense Analyst">Analyst</option>
            <option value="Inventory Clerk">Clerk</option>
            <option value="Cashier">Cashier</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 outline-none cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Employee</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Contact</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Hire Date</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700 mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Fetching employee records...</p>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center text-gray-500 font-medium">
                    No employees found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center font-bold text-xs">
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            {emp.first_name} {emp.middle_name ? `${emp.middle_name} ` : ''}{emp.last_name}
                          </p>
                          <p className="text-xs text-gray-400">ID: #{emp.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded-full border border-blue-100">
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-gray-700">{emp.email || 'No Email'}</p>
                        <p className="text-xs text-gray-400">{emp.contact_number || 'No Contact'}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-gray-600 font-medium">
                      {emp.hire_date ? new Date(emp.hire_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full border ${
                        emp.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button 
                        onClick={() => handleViewDetails(emp)}
                        className="px-4 py-2 bg-white border border-gray-200 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Form Modal */}
      {isFormOpen && (
        <EmployeeForm 
          employee={employeeToEdit} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={fetchEmployees} 
        />
      )}

      {/* Details Modal */}
      {isDetailsOpen && (
        <EmployeeDetailsModal 
          employee={selectedEmployee} 
          onClose={() => setIsDetailsOpen(false)} 
          onEditInfo={handleEditInfo}
          onEditCredentials={handleEditCredentials}
        />
      )}

      {/* Credentials Form Modal */}
      {isCredentialFormOpen && (
        <CredentialForm 
          employee={employeeToEdit} 
          onClose={() => setIsCredentialFormOpen(false)} 
          onSuccess={fetchEmployees} 
        />
      )}
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading Employees...</div>}>
      <EmployeesContent />
    </Suspense>
  );
}
