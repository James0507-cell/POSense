'use client';

import React, { useState, useEffect } from 'react';
import SideBar from '../components/sideBar.js';
import InventoryStatus from './components/InventoryStatus';
import InventoryAnalytics from './components/InventoryAnalytics';
import AIAnalysis from '../components/AIAnalysis';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('status');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello! I am your AI inventory analyst. How can I help you with your stock today?' }
  ]);

  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInventory() {
      try {
        const response = await fetch('/api/inventory');
        if (response.ok) {
          const data = await response.json();
          setInventoryData(data);
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInventory();
  }, []);

  // Metrics Calculation
  const metrics = {
    totalStocks: inventoryData.reduce((acc, item) => acc + (item.quantity || 0), 0),
    lowStock: inventoryData.filter(item => (item.quantity || 0) > 0 && (item.quantity || 0) <= (item.minimum || item.threshold || 0)).length,
    outOfStock: inventoryData.filter(item => (item.quantity || 0) === 0).length,
  };

  // Chart Data for Stock vs Threshold (Maximum)
  const chartData = {
    labels: inventoryData.map(item => item.productId || item.product_id),
    datasets: [
      {
        label: 'Current Quantity',
        data: inventoryData.map(item => item.quantity || 0),
        backgroundColor: 'rgba(29, 78, 216, 0.8)',
        borderRadius: 8,
      },
      {
        label: 'Minimum Level',
        data: inventoryData.map(item => item.minimum || 0),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderRadius: 8,
      },
      {
        label: 'Maximum (Threshold)',
        data: inventoryData.map(item => item.maximum || item.threshold || 0),
        backgroundColor: 'rgba(209, 213, 219, 0.8)',
        borderRadius: 8,
      }
    ],
  };

  const [isAiThinking, setIsAiThinking] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || isAiThinking) return;

    const userMsg = chatMessage;
    const newUserMessage = { role: 'user', content: userMsg };
    setChatHistory(prev => [...prev, newUserMessage]);
    setChatMessage('');
    setIsAiThinking(true);

    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: inventoryData, 
          history: chatHistory.slice(-10) 
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: "I'm sorry, I'm having trouble analyzing your inventory right now. Please try again." 
        }]);
      }
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsAiThinking(false);
    }
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
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                <span className="ml-4 text-gray-500 font-medium">Loading inventory data...</span>
              </div>
            ) : (
              <>
                {activeTab === 'status' && <InventoryStatus inventoryData={inventoryData} metrics={metrics} />}
                {activeTab === 'analytics' && <InventoryAnalytics chartData={chartData} />}
                {activeTab === 'ai' && (
                  <AIAnalysis 
                    chatHistory={chatHistory} 
                    chatMessage={chatMessage} 
                    setChatMessage={setChatMessage} 
                    handleSendMessage={handleSendMessage} 
                    isAiThinking={isAiThinking}
                    title="AI Inventory Analyst"
                    description="Ask anything about stock levels, locations, and thresholds"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
