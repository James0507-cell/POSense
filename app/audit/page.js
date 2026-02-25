'use client';

import React from 'react';
import SideBar from '../components/sideBar.js';
import AuditLogs from './components/AuditLogs.js';

export default function AuditPage() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-[family-name:var(--font-inter)]">
      <SideBar />

      <main className="flex-1 overflow-y-auto relative">
        <AuditLogs/>
      </main>
    </div>
  );
}
