'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SalesHistory from './components/SalesHistory';
import SalesAnalytics from './components/SalesAnalytics';
import AIAnalysis from '../../components/AIAnalysis';
import SaleForm from './components/SaleForm';
import KioskOrderForm from './components/KioskOrderForm';

function SalesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') || 'history';
  const viewParam = searchParams.get('view');

  const [activeTab, setActiveTab] = useState(tabParam);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello! I am your AI sales analyst. How can I help you analyze your sales data today?' }
  ]);

  const [salesData, setSalesData] = useState([]);
  const [refundsData, setRefundsData] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isNewSaleFormOpen, setIsNewSaleFormOpen] = useState(tabParam === 'standard');
  const [isKioskMode, setIsKioskMode] = useState(tabParam === 'kiosk');

  useEffect(() => {
    setActiveTab(tabParam);
    setIsNewSaleFormOpen(tabParam === 'standard');
    setIsKioskMode(tabParam === 'kiosk');
  }, [tabParam]);

  // Helper to map payment IDs to Names
  const enrichSalesData = (sales, types) => {
    return sales.map(sale => {
      const ptId = sale.payment_type_id || sale.payment_type;
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
      const [salesRes, refundsRes, typesRes, productsRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/refunds'),
        fetch('/api/payment-types'),
        fetch('/api/products')
      ]);

      if (salesRes.ok && refundsRes.ok && typesRes.ok && productsRes.ok) {
        const sales = await salesRes.json();
        const refunds = await refundsRes.json();
        const types = await typesRes.json();
        const productData = await productsRes.json();
        
        // Pre-filter types for the UI forms (only Active ones)
        setPaymentTypes(types); 
        setProducts(productData.filter(p => (p.status || 'Active') === 'Active'));
        setRefundsData(refunds);
        setSalesData(enrichSalesData(sales, types));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

    const totalRev = salesData.reduce((acc, s) => acc + (s.total_amount || 0), 0);
    const confirmedSales = salesData.filter(s => s.status?.toLowerCase() === 'confirmed');
    
    const aiContext = {
      summary: {
        total_records: salesData.length,
        total_revenue: totalRev,
        confirmed_sales_count: confirmedSales.length,
        voided_sales_count: salesData.filter(s => s.status?.toLowerCase() === 'voided').length,
        average_sale_value: salesData.length > 0 ? totalRev / salesData.length : 0
      },
      available_payment_methods: paymentTypes.map(t => t.payment_name || t.name),
      recent_sales: salesData.slice(0, 20)
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

  const closeStandardForm = () => {
    setIsNewSaleFormOpen(false);
    const role = sessionStorage.getItem('role');
    if (role === 'Cashier') {
      router.push('/sales-records');
    } else {
      router.push('/sales?tab=history');
    }
  };

  const closeKioskForm = () => {
    setIsKioskMode(false);
    const role = sessionStorage.getItem('role');
    if (role === 'Cashier') {
      router.push('/sales-records');
    } else {
      router.push('/sales?tab=history');
    }
  };

  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-8 animate-fade-in">
      {/* Tabs Navigation */}
          {!isKioskMode && !isNewSaleFormOpen && (
            <div className="flex gap-1 md:gap-2 p-1 bg-gray-100 rounded-2xl w-fit max-w-full overflow-x-auto">
              {[
                { id: 'history', label: 'Sales History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                { id: 'ai', label: 'AI Assistant', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    router.push(`/sales?tab=${tab.id}`);
                  }}
                  className={`flex items-center gap-2 px-3 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Tab Content */}
          <div className="min-h-[600px]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                <span className="ml-4 text-gray-500 font-medium">Loading sales data...</span>
              </div>
            ) : (
              <>
                {isKioskMode ? (
                  <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm relative">
                    <button onClick={closeKioskForm} className="absolute top-4 md:top-8 right-4 md:right-8 p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all z-10">
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8 font-[family-name:var(--font-outfit)]">Kiosk Order Point</h2>
                    <SaleForm 
                      products={products}
                      paymentTypes={paymentTypes}
                      onClose={closeKioskForm}
                      onSuccess={() => {
                        fetchAllData();
                        closeKioskForm();
                      }}
                      isInline={true}
                      initialViewMode="kiosk"
                    />
                  </div>
                ) : isNewSaleFormOpen ? (
                  <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm relative max-w-4xl mx-auto">
                     <button onClick={closeStandardForm} className="absolute top-4 md:top-8 right-4 md:right-8 p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all">
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                    <SaleForm 
                      products={products}
                      paymentTypes={paymentTypes}
                      onClose={closeStandardForm}
                      onSuccess={() => {
                        fetchAllData();
                        closeStandardForm();
                      }}
                      isInline={true}
                    />
                  </div>
                ) : (
                  <>
                    {activeTab === 'history' && (
                      <SalesHistory 
                        salesData={salesData} 
                        refundsData={refundsData}
                        products={products}
                        paymentTypes={paymentTypes}
                        onUpdate={fetchAllData}
                        onNewSale={() => router.push('/sales?tab=standard')}
                        initialView={viewParam}
                      />
                    )}
                    {activeTab === 'analytics' && (
                      <SalesAnalytics 
                        salesData={salesData} 
                        refundsData={refundsData}
                        paymentTypes={paymentTypes}
                      />
                    )}
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
              </>
            )}
          </div>
        </div>
      );
}

export default function SalesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SalesContent />
    </Suspense>
  );
}
