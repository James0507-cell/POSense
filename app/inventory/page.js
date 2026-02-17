'use client';

import React, { useState } from 'react';
import SideBar from '../components/sideBar.js';
import InventoryStatus from './components/InventoryStatus';
import InventoryAnalytics from './components/InventoryAnalytics';
import AIAnalysis from '../products/components/AIAnalysis'; // Reusing AI component

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('status');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello! I am your AI inventory analyst. How can I help you with your stock today?' }
  ]);

  // Mock Inventory Data
  const inventoryData = [
    {
      id: 'INV-001',
      productId: 'PROD-001',
      location: 'Warehouse A',
      quantity: 15,
      threshold: 10,
      updatedBy: 'Admin',
      lastUpdated: '2025-02-15 08:30:00'
    },
    {
      id: 'INV-002',
      productId: 'PROD-002',
      location: 'Main Store',
      quantity: 5,
      threshold: 15,
      updatedBy: 'Manager',
      lastUpdated: '2025-02-16 11:20:00'
    },
    {
      id: 'INV-003',
      productId: 'PROD-003',
      location: 'Warehouse B',
      quantity: 0,
      threshold: 5,
      updatedBy: 'Admin',
      lastUpdated: '2025-02-17 09:45:00'
    },
  ];

  // Metrics Calculation
  const metrics = {
    totalStocks: inventoryData.reduce((acc, item) => acc + item.quantity, 0),
    lowStock: inventoryData.filter(item => item.quantity > 0 && item.quantity <= item.threshold).length,
    outOfStock: inventoryData.filter(item => item.quantity === 0).length,
  };

  // Chart Data for Stock vs Threshold
  const chartData = {
    labels: inventoryData.map(item => item.productId),
    datasets: [
      {
        label: 'Current Quantity',
        data: inventoryData.map(item => item.quantity),
        backgroundColor: 'rgba(29, 78, 216, 0.8)',
        borderRadius: 8,
      },
      {
        label: 'Threshold Level',
        data: inventoryData.map(item => item.threshold),
        backgroundColor: 'rgba(209, 213, 219, 0.8)',
        borderRadius: 8,
      }
    ],
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const newUserMessage = { role: 'user', content: chatMessage };
    setChatHistory([...chatHistory, newUserMessage]);
    setChatMessage('');

    // Simulate AI response
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `Analyzing inventory for "${chatMessage}"... It seems you have ${metrics.lowStock} items low on stock. Would you like me to generate a restock report?` 
      }]);
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-[family-name:var(--font-inter)]">
      <SideBar />

      <main className="flex-1 overflow-y-auto relative">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm">
          <h2 className="text-2xl font-[family-name:var(--font-outfit)] font-bold text-gray-900">
            Inventory Management
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-none">John Doe</p>
              <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-tighter">Manager View</p>
            </div>
          </div>
        </header>

        <div className="p-10 space-y-8 animate-fade-in">
          {/* Tabs Navigation */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
            {[
              { id: 'status', label: 'Inventory Status', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
              { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { id: 'ai', label: 'AI Analysis', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            {activeTab === 'status' && <InventoryStatus inventoryData={inventoryData} metrics={metrics} />}
            {activeTab === 'analytics' && <InventoryAnalytics chartData={chartData} />}
            {activeTab === 'ai' && (
              <AIAnalysis 
                chatHistory={chatHistory} 
                chatMessage={chatMessage} 
                setChatMessage={setChatMessage} 
                handleSendMessage={handleSendMessage} 
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
