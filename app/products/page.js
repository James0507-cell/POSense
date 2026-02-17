'use client';

import React, { useState } from 'react';
import SideBar from '../components/sideBar.js';
import ProductList from './components/ProductList';
import ProductAnalytics from './components/ProductAnalytics';
import AIAnalysis from './components/AIAnalysis';

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello! I am your AI product analyst. How can I help you today?' }
  ]);

  // Mock Products Data
  const products = [
    {
      id: 'PROD-001',
      brand: 'TechCorp',
      name: 'Ultra-HD Smart Camera',
      barcode: '1234567890123',
      description: 'High-resolution smart camera with AI motion detection.',
      category: 'Electronics',
      cost_price: 120.00,
      selling_price: 199.99,
      tax_rate: 0.15,
      created_by: 'Admin',
      created_at: '2025-01-10 10:00:00',
      updated_by: 'Admin'
    },
    {
      id: 'PROD-002',
      brand: 'FlexiFit',
      name: 'Ergonomic Wireless Mouse',
      barcode: '1234567890124',
      description: 'Comfortable wireless mouse for long working hours.',
      category: 'Accessories',
      cost_price: 25.00,
      selling_price: 49.99,
      tax_rate: 0.15,
      created_by: 'Admin',
      created_at: '2025-01-12 14:30:00',
      updated_by: 'Editor'
    },
  ];

  // Stock by Product Data (Bar Chart)
  const stockBarData = {
    labels: ['Smart Camera', 'Wireless Mouse', 'RGB Keyboard', 'USB-C Charger', 'Gaming Headset'],
    datasets: [
      {
        label: 'Current Stock',
        data: [15, 42, 8, 56, 12],
        backgroundColor: 'rgba(29, 78, 216, 0.8)',
        borderRadius: 8,
      },
    ],
  };

  // Product Distribution per Category (Pie Chart)
  const categoryPieData = {
    labels: ['Electronics', 'Accessories', 'Peripherals', 'Power', 'Audio'],
    datasets: [
      {
        data: [35, 25, 15, 15, 10],
        backgroundColor: [
          'rgba(29, 78, 216, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(209, 213, 219, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  // Number of Products over Time (Line Chart)
  const productsTimeLineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Total Products',
        data: [120, 135, 150, 175, 190, 215],
        borderColor: 'rgba(29, 78, 216, 1)',
        backgroundColor: 'rgba(29, 78, 216, 0.1)',
        fill: true,
        tension: 0.4,
      },
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
        content: `I am processing your request about "${chatMessage}". As a mock AI, I can tell you that your inventory is looking healthy!` 
      }]);
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-[family-name:var(--font-inter)]">
      <SideBar />

      <main className="flex-1 overflow-y-auto relative">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm">
          <h2 className="text-2xl font-[family-name:var(--font-outfit)] font-bold text-gray-900">
            Products Management
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
              { id: 'list', label: 'Products List', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
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
            {activeTab === 'list' && <ProductList products={products} />}
            {activeTab === 'analytics' && (
              <ProductAnalytics 
                stockBarData={stockBarData} 
                categoryPieData={categoryPieData} 
                productsTimeLineData={productsTimeLineData} 
              />
            )}
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
