'use client';

import React from 'react';
import AuditLogs from './components/AuditLogs.js';

export default function AuditPage() {
  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-8 animate-fade-in">
      <AuditLogs/>
    </div>
  );
}
