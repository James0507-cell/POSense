'use client';

import React, { useState, useEffect } from 'react';
import SideBar from '../components/sideBar.js';
import ProductList from './components/ProductList';
import ProductAnalytics from './components/ProductAnalytics';
import AIAnalysis from '../components/AIAnalysis';
import ProductForm from './components/ProductForm';

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello! I am your AI product analyst. How can I help you today?' }
  ]);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched products data:", data);
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const sortedByStock = [...products]
    .sort((a, b) => Number(b.total_stock || 0) - Number(a.total_stock || 0))
    .slice(0, 10);
  
  const stockBarData = {
    labels: sortedByStock.map(p => p.name),
    datasets: [
      {
        label: 'Total Stock Available',
        data: sortedByStock.map(p => Number(p.total_stock || 0)),
        backgroundColor: 'rgba(29, 78, 216, 0.8)',
        borderRadius: 8,
      },
    ],
  };

  // Product Distribution per Category (Pie Chart)
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const categoryCounts = categories.map(cat => products.filter(p => p.category === cat).length);

  const categoryPieData = {
    labels: categories.length > 0 ? categories : ['No Data'],
    datasets: [
      {
        data: categoryCounts.length > 0 ? categoryCounts : [1],
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

  // Real growth data based on created_at
  const getGrowthData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = [];
    const counts = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(months[d.getMonth()]);
      
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const count = products.filter(p => new Date(p.created_at) <= endOfMonth).length;
      counts.push(count);
    }
    return { labels, counts };
  };

  const { labels: growthLabels, counts: growthCounts } = getGrowthData();

  const productsTimeLineData = {
    labels: growthLabels,
    datasets: [
      {
        label: 'Total Catalog Size',
        data: growthCounts,
        borderColor: 'rgba(29, 78, 216, 1)',
        backgroundColor: 'rgba(29, 78, 216, 0.1)',
        fill: true,
        tension: 0.4,
      },
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
          context: products, // All products with total_stock and metadata
          history: chatHistory.slice(-10) // Last 10 messages for context
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later." 
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
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                <span className="ml-4 text-gray-500 font-medium">Loading products data...</span>
              </div>
            ) : (
              <>
                {activeTab === 'list' && (
                  <ProductList 
                    products={products} 
                    onEdit={handleEdit} 
                    onDelete={fetchProducts} 
                    onAdd={handleAddNew}
                  />
                )}
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
                    isAiThinking={isAiThinking}
                    title="AI Product Analyst"
                    description="Ask anything about your product catalog and categories"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Product Form Modal (Rendered at root for absolute centering) */}
      {isFormOpen && (
        <ProductForm 
          product={editingProduct} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={fetchProducts} 
        />
      )}
    </div>
  );
}
