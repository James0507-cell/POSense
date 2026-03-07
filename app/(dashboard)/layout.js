'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import SideBar from '../components/sideBar.js';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Map path to title
  const titles = {
    '/dashboard': 'Dashboard Overview',
    '/products': 'Products Management',
    '/inventory': 'Inventory & Stock',
    '/inventory-list': 'Stock Inventory List',
    '/sales': 'Sales Management',
    '/sales-records': 'Sales & Refund Records',
    '/expenses': 'Expenses Tracking',
    '/net-balance': 'Net Balance & Cashflow',
    '/audit': 'Audit Logs & Activity',
    '/employees': 'Employee Records',
    '/settings': 'System Configuration'
  };

  const rolePermissions = {
    'Admin': ['/dashboard', '/products', '/inventory', '/inventory-list', '/sales', '/sales-records', '/expenses', '/net-balance', '/audit', '/employees', '/settings'],
    'Store Manager': ['/dashboard', '/products', '/inventory', '/sales', '/expenses', '/net-balance', '/audit'],
    'Products and Inventory Manager': ['/products', '/inventory'],
    'Sales & Expense Analyst': ['/sales', '/expenses', '/net-balance'],
    'Cashier': ['/sales-records', '/sales'],
    'Inventory Clerk': ['/inventory-list']
  };

  const roleDefaults = {
    'Admin': '/dashboard',
    'Store Manager': '/dashboard',
    'Products and Inventory Manager': '/products',
    'Sales & Expense Analyst': '/sales',
    'Cashier': '/sales-records',
    'Inventory Clerk': '/inventory-list'
  };

  useEffect(() => {
    const role = localStorage.getItem('role') || sessionStorage.getItem('role');
    const employeeId = localStorage.getItem('employee_id') || sessionStorage.getItem('employee_id');

    if (!employeeId || !role) {
      router.push('/');
      return;
    }

    const allowedPaths = rolePermissions[role] || [];
    const isAllowed = allowedPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

    if (!isAllowed) {
      const defaultPath = roleDefaults[role] || '/';
      router.push(defaultPath);
    } else {
      setIsAuthorized(true);
    }
    setIsLoading(false);
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  const currentTitle = titles[pathname] || 'Management System';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-[family-name:var(--font-inter)]">
      <SideBar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="flex-1 overflow-y-auto relative">
        <header className="h-16 md:h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-10 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-600 hover:text-blue-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-lg md:text-2xl font-[family-name:var(--font-outfit)] font-bold text-gray-900 truncate">
              {currentTitle}
            </h2>
          </div>
          
          {/* Mobile Logo for Header */}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
          </div>
        </header>
        <div className="max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
