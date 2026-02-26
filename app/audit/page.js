'use client';

import React, { useState, useEffect } from 'react';
import SideBar from '../components/sideBar.js';
import AuditLogs from './components/AuditLogs.js';

export default function AuditPage() {
  const [userName, setUserName] = useState('Admin');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const first = sessionStorage.getItem('first_name') || '';
      const last = sessionStorage.getItem('last_name') || '';

      if (first || last) setUserName(`${first} ${last}`);
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-[family-name:var(--font-inter)]">
      <SideBar />

      <main className="flex-1 overflow-y-auto relative">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm">
          <h2 className="text-2xl font-[family-name:var(--font-outfit)] font-bold text-gray-900">
            Audit Logs
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-none">{userName}</p>
              <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-tighter">Security View</p>
            </div>
          </div>
        </header>

        <AuditLogs/>
      </main>
    </div>
  );
}
