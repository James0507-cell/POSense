'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import SideBar from '../components/sideBar.js';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();

  // Map path to title
  const titles = {
    '/dashboard': 'Dashboard Overview',
    '/products': 'Products Management',
    '/inventory': 'Inventory & Stock',
    '/sales': 'Sales Management',
    '/expenses': 'Expenses Tracking',
    '/net-balance': 'Net Balance & Cashflow',
    '/audit': 'Audit Logs & Activity'
  };

  const currentTitle = titles[pathname] || 'Management System';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-[family-name:var(--font-inter)]">
      <SideBar />
      <main className="flex-1 overflow-y-auto relative">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm">
          <h2 className="text-2xl font-[family-name:var(--font-outfit)] font-bold text-gray-900">
            {currentTitle}
          </h2>
        </header>
        {children}
      </main>
    </div>
  );
}
