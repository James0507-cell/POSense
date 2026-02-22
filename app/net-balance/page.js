'use client';

import React, { useState, useEffect, useMemo } from 'react';
import SideBar from '../components/sideBar.js';
import AIAnalysis from '../components/AIAnalysis';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
);

export default function NetBalancePage() {
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Manager');

  // Data
  const [confirmedSales, setConfirmedSales] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Search/Filters
  const [salesSearch, setSalesSearch] = useState('');
  const [expensesSearch, setExpensesSearch] = useState('');
  const [salesDateRange, setSalesDateRange] = useState({ from: '', to: '' });
  const [expensesDateRange, setExpensesDateRange] = useState({ from: '', to: '' });

  // AI State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello! I am your AI financial analyst. I can help you understand your cashflow and net balance. How can I assist you today?' }
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Analytics State
  const [timeUnit, setTimeUnit] = useState('day'); // 'day', 'week', 'month'

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, expRes] = await Promise.all([
        fetch('/api/sales/confirmed'),
        fetch('/api/expenses')
      ]);

      if (salesRes.ok && expRes.ok) {
        const salesData = await salesRes.json();
        const expData = await expRes.json();
        setConfirmedSales(salesData);
        setExpenses(expData);
      }
    } catch (error) {
      console.error("Error fetching net balance data:", error);
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
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const monthSales = confirmedSales.filter(s => new Date(s.sale_date) >= startOfMonth);
    const totalRevenue = monthSales.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0);

    const monthExpenses = expenses.filter(e => new Date(e.expense_date) >= startOfMonth);
    const totalExpenses = monthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return {
      totalRevenue,
      totalExpenses,
      netBalance: totalRevenue - totalExpenses
    };
  }, [confirmedSales, expenses]);

  const filteredSales = confirmedSales.filter(s => {
    const matchesSearch = s.sale_id?.toString().includes(salesSearch);
    const date = new Date(s.sale_date);
    const matchesFrom = !salesDateRange.from || date >= new Date(salesDateRange.from);
    const matchesTo = !salesDateRange.to || date <= new Date(salesDateRange.to);
    return matchesSearch && matchesFrom && matchesTo;
  });

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.description?.toLowerCase().includes(expensesSearch.toLowerCase()) || e.expense_id?.toString().includes(expensesSearch);
    const date = new Date(e.expense_date);
    const matchesFrom = !expensesDateRange.from || date >= new Date(expensesDateRange.from);
    const matchesTo = !expensesDateRange.to || date <= new Date(expensesDateRange.to);
    return matchesSearch && matchesFrom && matchesTo;
  });

  const chartData = useMemo(() => {
    const groupedSales = {};
    const groupedExpenses = {};

    const formatKey = (dateStr) => {
      const d = new Date(dateStr);
      if (timeUnit === 'month') return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (timeUnit === 'week') {
        const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
      }
      return d.toISOString().split('T')[0];
    };

    confirmedSales.forEach(s => {
      const key = formatKey(s.sale_date);
      groupedSales[key] = (groupedSales[key] || 0) + Number(s.amount_paid);
    });

    expenses.forEach(e => {
      const key = formatKey(e.expense_date);
      groupedExpenses[key] = (groupedExpenses[key] || 0) + Number(e.amount);
    });

    const allKeys = [...new Set([...Object.keys(groupedSales), ...Object.keys(groupedExpenses)])].sort();
    
    // Limit keys to recent ones for clarity
    const displayKeys = allKeys.slice(-15);

    return {
      labels: displayKeys,
      datasets: [
        {
          label: 'Revenue',
          data: displayKeys.map(k => groupedSales[k] || 0),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Expenses',
          data: displayKeys.map(k => groupedExpenses[k] || 0),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          tension: 0.3,
          fill: true
        }
      ]
    };
  }, [confirmedSales, expenses, timeUnit]);

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
          context: {
              summary: {
                  total_revenue: stats.totalRevenue,
                  total_expenses: stats.totalExpenses,
                  net_balance: stats.netBalance,
                  currency: 'USD'
              }
          },
          history: chatHistory.slice(-10)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'assistant', content: "Failed to get AI analysis." }]);
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
            Net Balance Summary
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-none">{userName}</p>
              <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-tighter">Finance View</p>
            </div>
          </div>
        </header>

        <div className="p-10 space-y-8 animate-fade-in">
          {/* Tabs Navigation */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
            {[
              { id: 'summary', label: 'Summary List', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
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

          <div className="min-h-[600px]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                <span className="ml-4 text-gray-500 font-medium">Calculating net balance...</span>
              </div>
            ) : (
              <>
                {activeTab === 'summary' && (
                  <div className="space-y-8">
                    {/* Metric Cards - Moved inside Summary Tab */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-5">
                          <div className="p-3 rounded-2xl bg-green-50 group-hover:bg-green-100 transition-colors">
                            <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Total Revenue (Month)</p>
                        <p className="text-2xl font-bold text-green-600 font-[family-name:var(--font-outfit)]">
                          ${stats.totalRevenue.toFixed(2)}
                        </p>
                      </div>

                      <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-5">
                          <div className="p-3 rounded-2xl bg-red-50 group-hover:bg-red-100 transition-colors">
                            <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Total Expenses (Month)</p>
                        <p className="text-2xl font-bold text-red-600 font-[family-name:var(--font-outfit)]">
                          ${stats.totalExpenses.toFixed(2)}
                        </p>
                      </div>

                      <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-5">
                          <div className="p-3 rounded-2xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                            <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Net Balance (Month)</p>
                        <p className={`text-2xl font-bold font-[family-name:var(--font-outfit)] ${stats.netBalance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                          ${stats.netBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-12">
                    {/* Sales Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Confirmed Sales</h4>
                      </div>
                      
                      {/* Sales Filters */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="relative lg:col-span-2">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </span>
                            <input
                              type="text"
                              placeholder="Search Sale ID..."
                              value={salesSearch}
                              onChange={(e) => setSalesSearch(e.target.value)}
                              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                            />
                          </div>

                          <div className="flex gap-2 lg:col-span-2">
                            <input
                              type="date"
                              value={salesDateRange.from}
                              onChange={(e) => setSalesDateRange(prev => ({...prev, from: e.target.value}))}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                            />
                            <input
                              type="date"
                              value={salesDateRange.to}
                              onChange={(e) => setSalesDateRange(prev => ({...prev, to: e.target.value}))}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Sale ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Amount Paid</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {filteredSales.slice(0, 10).map(s => (
                                <tr key={s.sale_id} className="hover:bg-gray-50/80 transition-colors">
                                  <td className="px-6 py-5 font-bold text-blue-700 text-sm">#{s.sale_id}</td>
                                  <td className="px-6 py-5 text-gray-500 text-xs">{new Date(s.sale_date).toLocaleString()}</td>
                                  <td className="px-6 py-5 text-sm font-bold text-green-600 text-right">${Number(s.amount_paid).toFixed(2)}</td>
                                </tr>
                              ))}
                              {filteredSales.length === 0 && (
                                <tr>
                                  <td colSpan="3" className="px-6 py-10 text-center text-gray-500 font-medium">No sales found.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Expenses Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Expenses Records</h4>
                      </div>

                      {/* Expenses Filters */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="relative lg:col-span-2">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </span>
                            <input
                              type="text"
                              placeholder="Search description or ID..."
                              value={expensesSearch}
                              onChange={(e) => setExpensesSearch(e.target.value)}
                              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                            />
                          </div>

                          <div className="flex gap-2 lg:col-span-2">
                            <input
                              type="date"
                              value={expensesDateRange.from}
                              onChange={(e) => setExpensesDateRange(prev => ({...prev, from: e.target.value}))}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                            />
                            <input
                              type="date"
                              value={expensesDateRange.to}
                              onChange={(e) => setExpensesDateRange(prev => ({...prev, to: e.target.value}))}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Exp ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {filteredExpenses.slice(0, 10).map(e => (
                                <tr key={e.expense_id} className="hover:bg-gray-50/80 transition-colors">
                                  <td className="px-6 py-5 font-bold text-red-500 text-sm">#{e.expense_id}</td>
                                  <td className="px-6 py-5 text-sm text-gray-700">{e.description}</td>
                                  <td className="px-6 py-5 text-gray-500 text-xs">{new Date(e.expense_date).toLocaleString()}</td>
                                  <td className="px-6 py-5 text-sm font-bold text-red-600 text-right">${Number(e.amount).toFixed(2)}</td>
                                </tr>
                              ))}
                              {filteredExpenses.length === 0 && (
                                <tr>
                                  <td colSpan="4" className="px-6 py-10 text-center text-gray-500 font-medium">No expenses found.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                )}
                {activeTab === 'analytics' && (
                  <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-bold text-gray-900">Cashflow Analysis</h4>
                      <div className="flex gap-2 p-1 bg-gray-50 rounded-xl">
                        {['day', 'week', 'month'].map(unit => (
                          <button 
                            key={unit}
                            onClick={() => setTimeUnit(unit)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeUnit === unit ? 'bg-white shadow-sm text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}
                          >
                            {unit.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="h-[400px]">
                      <Line 
                        data={chartData} 
                        options={{ 
                          responsive: true, 
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'top' },
                          },
                          scales: {
                            y: { beginAtZero: true }
                          }
                        }} 
                      />
                    </div>
                  </div>
                )}
                {activeTab === 'ai' && (
                  <AIAnalysis 
                    chatHistory={chatHistory} 
                    chatMessage={chatMessage} 
                    setChatMessage={setChatMessage} 
                    handleSendMessage={handleSendMessage} 
                    isAiThinking={isAiThinking}
                    title="Financial AI Analyst"
                    description="Analyze your income, expenses, and net profitability"
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
