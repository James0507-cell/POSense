'use client';

import React from 'react';
import AuditLogs from './components/AuditLogs.js';

export default function AuditPage() {
  return (
    <div className="p-10 space-y-8 animate-fade-in">
      <AuditLogs/>
    </div>
  );
}
