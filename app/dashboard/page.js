'use client';

import React from 'react';
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
  ArcElement
);

export default function Dashboard() {
  // Sales Overview Data (Bar Chart)
  const barData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Revenue',
        data: [4200, 5800, 4900, 7200, 6500, 8100, 9500],
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
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#111827',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6',
        },
        ticks: {
          callback: (value) => `$${value}`,
          font: { weight: '600' },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { weight: '600' },
        },
      },
    },
  };

  // Product Distribution Data (Pie Chart)
  const pieData = {
    labels: ['Electronics', 'Apparel', 'Home', 'Others'],
    datasets: [
      {
        data: [45, 30, 15, 10],
        backgroundColor: [
          'rgba(29, 78, 216, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(209, 213, 219, 0.8)',
        ],
        borderWidth: 0,
        hoverOffset: 15,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { weight: 'bold', size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw}%`,
        },
      },
    },
    cutout: '60%',
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-[family-name:var(--font-inter)]">
      <SideBar />

      <main className="flex-1 overflow-y-auto relative">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-10 shadow-sm shadow-gray-50">
          <h2 className="text-2xl font-[family-name:var(--font-outfit)] font-bold text-gray-900">
            AI Dashboard Overview
          </h2>
          <div className="flex items-center gap-4">

            <div className="text-right hidden sm:block ml-4">
              <p className="text-sm font-bold text-gray-900 leading-none">John Doe</p>
              <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-tighter">Manager View</p>
            </div>
          </div>
        </header>

        <div className="p-10 space-y-8 animate-fade-in">


          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Revenue', value: '$4,250.00', change: '+12%', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { label: 'Net Profit', value: '148', change: '+5%', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
              { label: 'Product Categories', value: '$28.71', change: '-2%', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
              { label: 'Low Stock Alert', value: '112', change: '+18%', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                <div className="flex items-center justify-between mb-5">
                  <div className="p-3 rounded-2xl bg-gray-50 group-hover:bg-blue-50 transition-colors">
                    <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                    </svg>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${stat.change.startsWith('+') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {stat.change}
                  </span>
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
                  <p className="text-sm text-gray-500 font-medium">Weekly revenue distribution</p>
                </div>
                <select className="bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl px-4 py-2 outline-none">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              <div className="h-80 w-full">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
              <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] tracking-tight mb-1">Product Distribution</h4>
              <p className="text-sm text-gray-500 font-medium mb-8">Top selling categories</p>
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
                <p className="text-sm text-gray-500 font-medium">Latest checkout activities</p>
              </div>
              <button className="text-sm font-bold text-blue-700 hover:text-blue-900 transition-colors uppercase tracking-widest">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Method</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { id: '#TRX-9920', name: 'Alice Johnson', status: 'Completed', method: 'Visa', amount: '$124.50' },
                    { id: '#TRX-9919', name: 'Robert Smith', status: 'Processing', method: 'Cash', amount: '$45.00' },
                    { id: '#TRX-9918', name: 'Elena Rodriguez', status: 'Completed', method: 'Apple Pay', amount: '$210.00' },
                    { id: '#TRX-9917', name: 'Michael Chen', status: 'Refunded', method: 'Mastercard', amount: '$89.99' },
                  ].map((trx, i) => (
                    <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-8 py-5 font-bold text-gray-900 text-sm">{trx.id}</td>
                      <td className="px-8 py-5 font-medium text-gray-700 text-sm">{trx.name}</td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                          trx.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                          trx.status === 'Processing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {trx.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-gray-500 text-xs font-medium">{trx.method}</td>
                      <td className="px-8 py-5 text-right font-bold text-gray-900 text-sm">{trx.amount}</td>
                    </tr>
                  ))}
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
              <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider">
                4 Items Critical
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Product Name</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { name: 'Ultra-HD Smart Camera', stock: 3, min: 10 },
                    { name: 'Ergonomic Wireless Mouse', stock: 5, min: 15 },
                    { name: 'Mechanical Keyboard RGB', stock: 2, min: 8 },
                    { name: 'USB-C Fast Charger 65W', stock: 8, min: 20 },
                  ].map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-8 py-5 font-bold text-gray-900 text-sm flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${item.stock <= 3 ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                        {item.name}
                        <span className="text-gray-400 text-xs font-medium ml-2">({item.stock} left / min {item.min})</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="bg-blue-50 text-blue-700 text-xs font-bold py-2 px-4 rounded-lg hover:bg-blue-700 hover:text-white transition-all">
                          Order Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
