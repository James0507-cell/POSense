'use client';

import React, { useState, useEffect } from 'react';
import SideBar from '../components/sideBar.js';
import SalesHistory from './components/SalesHistory';
import SalesAnalytics from './components/SalesAnalytics';
import AIAnalysis from '../components/AIAnalysis';
import SaleForm from './components/SaleForm';

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState('history');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello! I am your AI sales analyst. How can I help you analyze your sales data today?' }
  ]);

  const [salesData, setSalesData] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Manager');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isNewSaleFormOpen, setIsNewSaleFormOpen] = useState(false);

  // Helper to map payment IDs to Names
  const enrichSalesData = (sales, types) => {
    return sales.map(sale => {
      // Find the payment type ID or name from the sale object
      // Some databases store it in payment_type_id, others in payment_type
      const ptId = sale.payment_type_id || sale.payment_type;
      
      // If ptId is a number or looks like an ID, try to find the name in our lookup table
      if (ptId !== undefined && ptId !== null) {
        const match = types.find(t => 
          String(t.payment_type_id) === String(ptId) || 
          String(t.id) === String(ptId)
        );
        if (match) {
          return { ...sale, payment_type: match.payment_name || match.name };
        }
      }
      return sale;
    });
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch sales, payment types, and products in parallel
      const [salesRes, typesRes, productsRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/payment-types'),
        fetch('/api/products')
      ]);

      if (salesRes.ok && typesRes.ok && productsRes.ok) {
        const sales = await salesRes.json();
        const types = await typesRes.json();
        const productData = await productsRes.json();
        
        setPaymentTypes(types);
        setProducts(productData);
        setSalesData(enrichSalesData(sales, types));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const first = sessionStorage.getItem('first_name') || '';
      const last = sessionStorage.getItem('last_name') || '';
      if (first || last) setUserName(`${first} ${last}`);
    }

    fetchAllData();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || isAiThinking) return;

    const userMsg = chatMessage;
    const newUserMessage = { role: 'user', content: userMsg };
    setChatHistory(prev => [...prev, newUserMessage]);
    setChatMessage('');
    setIsAiThinking(true);

    // Calculate quick metrics for AI context
    const totalRev = salesData.reduce((acc, s) => acc + (s.total_amount || 0), 0);
    const confirmedSales = salesData.filter(s => s.status === 'Confirmed');
    
    const aiContext = {
      summary: {
        total_records: salesData.length,
        total_revenue: totalRev,
        confirmed_sales_count: confirmedSales.length,
        refunded_sales_count: salesData.filter(s => s.status === 'Refunded').length,
        average_sale_value: salesData.length > 0 ? totalRev / salesData.length : 0
      },
      available_payment_methods: paymentTypes.map(t => t.payment_name || t.name),
      recent_sales: salesData.slice(0, 20) // Send top 20 recent for detailed context
    };

    try {
      const response = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: aiContext, 
          history: chatHistory.slice(-10) 
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: "I'm sorry, I'm having trouble analyzing your sales right now. Please try again." 
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
            Sales Management
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-none">{userName}</p>
              <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-tighter">Manager View</p>
            </div>
          </div>
        </header>

        <div className="p-10 space-y-8 animate-fade-in">
          {/* Tabs Navigation */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
            {[
              { id: 'history', label: 'Sales History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { id: 'ai', label: 'AI Assistant', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
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
                <span className="ml-4 text-gray-500 font-medium">Loading sales data...</span>
              </div>
            ) : (
              <>
                {activeTab === 'history' && (
                  <SalesHistory 
                    salesData={salesData} 
                    products={products}
                    paymentTypes={paymentTypes}
                    onUpdate={fetchAllData}
                    onNewSale={() => setIsNewSaleFormOpen(true)}
                  />
                )}
                {activeTab === 'analytics' && <SalesAnalytics salesData={salesData} />}
                {activeTab === 'ai' && (
                  <AIAnalysis 
                    chatHistory={chatHistory} 
                    chatMessage={chatMessage} 
                    setChatMessage={setChatMessage} 
                    handleSendMessage={handleSendMessage} 
                    isAiThinking={isAiThinking}
                    title="AI Sales Assistant"
                    description="Ask about revenue trends, payment methods, and sales performance"
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Sale Form Modal */}
        {isNewSaleFormOpen && (
          <SaleForm 
            products={products}
            paymentTypes={paymentTypes}
            onClose={() => setIsNewSaleFormOpen(false)}
            onSuccess={fetchAllData}
          />
        )}
      </main>
    </div>
  );
}
