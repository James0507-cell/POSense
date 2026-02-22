'use client';

import React, { useState, useEffect, useMemo } from 'react';
import SideBar from '../components/sideBar.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

export default function Dashboard() {
  const [userName, setUserName] = useState('Manager');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [confirmedSales, setConfirmedSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [salesTrend, setSalesTrend] = useState({ labels: [], data: [] });
  const [topCategories, setTopCategories] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const first = sessionStorage.getItem('first_name') || '';
      const last = sessionStorage.getItem('last_name') || '';
      if (first || last) setUserName(`${first} ${last}`);
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [salesRes, expRes, invRes, prodRes, trendRes, catRes] = await Promise.all([
          fetch('/api/sales/confirmed'),
          fetch('/api/expenses'),
          fetch('/api/inventory'),
          fetch('/api/products'),
          fetch('/api/analytics/sales-trend?days=7'),
          fetch('/api/analytics/top-categories')
        ]);

        if (salesRes.ok) setConfirmedSales(await salesRes.json());
        if (expRes.ok) setExpenses(await expRes.json());
        if (invRes.ok) setInventory(await invRes.json());
        if (prodRes.ok) setProducts(await prodRes.json());
        if (trendRes.ok) setSalesTrend(await trendRes.json());
        if (catRes.ok) setTopCategories(await catRes.json());
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = useMemo(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Revenue
    const monthlySales = confirmedSales.filter(s => new Date(s.sale_date) >= startOfMonth);
    const totalRevenue = monthlySales.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0);

    // Expenses
    const monthlyExpenses = expenses.filter(e => new Date(e.expense_date) >= startOfMonth);
    const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Categories
    const categories = new Set(products.map(p => p.category).filter(Boolean));
    
    // Low Stock
    const lowStockCount = inventory.filter(i => i.quantity <= i.minimum).length;

    return {
      totalRevenue,
      netProfit: totalRevenue - totalExpenses,
      categoryCount: categories.size,
      lowStockCount
    };
  }, [confirmedSales, expenses, products, inventory]);

  const barData = {
    labels: salesTrend.labels.length > 0 ? salesTrend.labels : ['No Data'],
    datasets: [
      {
        label: 'Revenue',
        data: salesTrend.data.length > 0 ? salesTrend.data : [0],
        backgroundColor: 'rgba(29, 78, 216, 0.8)',
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(29, 78, 216, 1)',
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6' },
        ticks: { callback: (value) => `$${value}`, font: { weight: '600' } },
      },
      x: { grid: { display: false }, ticks: { font: { weight: '600' } } },
    },
  };

  const pieData = {
    labels: topCategories.length > 0 ? topCategories.map(c => c.name) : ['No Data'],
    datasets: [
      {
        data: topCategories.length > 0 ? topCategories.map(c => c.revenue) : [1],
        backgroundColor: [
          'rgba(29, 78, 216, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(20, 184, 166, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, padding: 20, font: { weight: 'bold', size: 12 } },
      },
    },
    cutout: '60%',
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-[family-name:var(--font-inter)]">
      <SideBar />

      <main className="flex-1 overflow-y-auto relative">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm">
          <h2 className="text-2xl font-[family-name:var(--font-outfit)] font-bold text-gray-900">
            Dashboard Overview
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-none">{userName}</p>
              <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-tighter">Manager View</p>
            </div>
          </div>
        </header>

        <div className="p-10 space-y-8 animate-fade-in">
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Monthly Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'Monthly Net Profit', value: `$${stats.netProfit.toFixed(2)}`, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'text-green-700', bg: 'bg-green-50' },
              { label: 'Total Categories', value: stats.categoryCount, icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', color: 'text-purple-700', bg: 'bg-purple-50' },
              { label: 'Low Stock Items', value: stats.lowStockCount, icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: stats.lowStockCount > 0 ? 'text-red-700' : 'text-gray-700', bg: stats.lowStockCount > 0 ? 'bg-red-50' : 'bg-gray-50' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-center justify-between mb-5">
                  <div className={`p-3 rounded-2xl ${stat.bg} transition-colors`}>
                    <svg className={`w-6 h-6 ${stat.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] tracking-tight">Sales Overview</h4>
                  <p className="text-sm text-gray-500 font-medium">Last 7 days revenue</p>
                </div>
              </div>
              <div className="h-80 w-full">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
              <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] tracking-tight mb-1">Product Distribution</h4>
              <p className="text-sm text-gray-500 font-medium mb-8">Revenue by category</p>
              <div className="h-64 w-full">
                <Pie data={pieData} options={pieOptions} />
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] tracking-tight">Recent Transactions</h4>
                <p className="text-sm text-gray-500 font-medium">Latest confirmed activities</p>
              </div>
              <button 
                onClick={() => window.location.href = '/net-balance'}
                className="text-sm font-bold text-blue-700 hover:text-blue-900 transition-colors uppercase tracking-widest"
              >
                View Financials
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Sale ID</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {confirmedSales.slice(0, 5).map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-8 py-5 font-bold text-blue-700 text-sm">#{s.sale_id}</td>
                      <td className="px-8 py-5 text-gray-500 text-xs font-medium">{new Date(s.sale_date).toLocaleString()}</td>
                      <td className="px-8 py-5 text-right font-bold text-gray-900 text-sm">${Number(s.amount_paid).toFixed(2)}</td>
                    </tr>
                  ))}
                  {confirmedSales.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-8 py-10 text-center text-gray-500">No recent transactions.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] tracking-tight">Low Stock Alerts</h4>
                <p className="text-sm text-gray-500 font-medium">Items requiring immediate restock</p>
              </div>
              {stats.lowStockCount > 0 && (
                <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider">
                  {stats.lowStockCount} Items Critical
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Product Name</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Stock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {inventory.filter(i => i.quantity <= i.minimum).slice(0, 5).map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-8 py-5 font-bold text-gray-900 text-sm flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        {item.product_name}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="text-red-600 text-xs font-bold">
                          {item.quantity} units left (Min: {item.minimum})
                        </span>
                      </td>
                    </tr>
                  ))}
                  {inventory.filter(i => i.quantity <= i.minimum).length === 0 && (
                    <tr>
                      <td colSpan="2" className="px-8 py-10 text-center text-gray-500">All inventory levels are healthy.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
