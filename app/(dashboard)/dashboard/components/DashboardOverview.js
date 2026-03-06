'use client';

import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';

export default function DashboardOverview({ 
  stats, 
  barData, 
  barOptions, 
  pieData, 
  pieOptions, 
  confirmedSales, 
  inventory,
  timeRange = '7',
  setTimeRange,
  topCategoriesLimit = '5',
  setTopCategoriesLimit
}) {
  return (
    <div className="p-10 space-y-8 animate-fade-in">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Monthly Revenue', value: `₱${stats.totalRevenue.toFixed(2)}`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Monthly Net Profit', value: `₱${stats.netProfit.toFixed(2)}`, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'text-green-700', bg: 'bg-green-50' },
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
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] tracking-tight">Sales Overview</h4>
              <p className="text-sm text-gray-500 font-medium">Last {timeRange} days revenue</p>
            </div>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl px-4 py-2 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <option value="7">Last 7 Days</option>
              <option value="14">Last 14 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-1 flex-wrap gap-4">
            <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] tracking-tight">Product Distribution</h4>
            <select 
              value={topCategoriesLimit}
              onChange={(e) => setTopCategoriesLimit(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <option value="5">Top 5</option>
              <option value="10">Top 10</option>
              <option value="all">All</option>
            </select>
          </div>
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
                  <td className="px-8 py-5 font-bold text-blue-700 text-sm">{s.sale_id}</td>
                  <td className="px-8 py-5 text-gray-500 text-xs font-medium">{new Date(s.sale_date).toLocaleString()}</td>
                  <td className="px-8 py-5 text-right font-bold text-gray-900 text-sm">₱{Number(s.amount_paid).toFixed(2)}</td>
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
          {inventory.filter(i => i.quantity <= i.minimum).length > 0 && (
            <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider">
              {inventory.filter(i => i.quantity <= i.minimum).length} Items Critical
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
  );
}
