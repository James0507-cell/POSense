'use client';

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export default function SalesAnalytics({ salesData }) {
  const [timeRange, setTimeRange] = useState('7');
  const [topProducts, setTopProducts] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  // 1. Process Sales Trend (Line Chart)
  const processTrendData = () => {
    const days = parseInt(timeRange);
    const labels = [];
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      labels.push(dateStr);

      // Sum revenue for this day
      const dayRevenue = salesData
        .filter(sale => {
          const saleDate = new Date(sale.sale_date);
          return saleDate.toDateString() === d.toDateString();
        })
        .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      
      data.push(dayRevenue);
    }

    return {
      labels,
      datasets: [{
        label: 'Revenue',
        data,
        borderColor: 'rgba(29, 78, 216, 1)',
        backgroundColor: 'rgba(29, 78, 216, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    };
  };

  // 2. Process Revenue by Payment Method (Pie Chart)
  const processPaymentData = () => {
    const methods = {};
    salesData.forEach(sale => {
      const method = sale.payment_type || 'Unknown';
      methods[method] = (methods[method] || 0) + (sale.total_amount || 0);
    });

    const labels = Object.keys(methods);
    const values = Object.values(methods);

    // Fallback if empty
    if (labels.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [1], backgroundColor: ['#f3f4f6'] }]
      };
    }

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          'rgba(29, 78, 216, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderWidth: 0,
      }]
    };
  };

  // 3. Fetch Top Products and Categories (using new analytics endpoint)
  useEffect(() => {
    const fetchDetailedAnalytics = async () => {
      setIsLoadingDetails(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/analytics/top-products'),
          fetch('/api/analytics/top-categories')
        ]);

        if (prodRes.ok) {
          const topP = await prodRes.json();
          setTopProducts(topP);
        }

        if (catRes.ok) {
          const topC = await catRes.json();
          // Add colors to categories
          const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500'];
          const coloredCategories = topC.map((cat, i) => ({
            ...cat,
            color: colors[i % colors.length]
          }));
          setTopCategories(coloredCategories);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    if (salesData.length > 0) {
      fetchDetailedAnalytics();
    } else {
      setIsLoadingDetails(false);
    }
  }, [salesData]);

  const trendData = processTrendData();
  const pieData = processPaymentData();

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => ` Revenue: $${context.raw.toLocaleString()}`
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6' },
        ticks: { 
          callback: (value) => `$${value}`,
          font: { weight: '600', size: 11 }
        },
      },
      x: {
        grid: { display: false },
        ticks: { font: { weight: '600', size: 11 } },
      },
    },
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
          font: { weight: 'bold', size: 11 },
        },
      },
    },
    cutout: '65%',
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Trend Line Chart */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] tracking-tight">Sales Trend</h4>
              <p className="text-sm text-gray-500 font-medium">Revenue performance over time</p>
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
            <Line data={trendData} options={lineOptions} />
          </div>
        </div>

        {/* Revenue by Payment Method Pie Chart */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] tracking-tight mb-1">Revenue by Payment Method</h4>
          <p className="text-sm text-gray-500 font-medium mb-8">Distribution across payment types</p>
          <div className="h-80 w-full">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Selling Products Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] tracking-tight">Top Selling Products</h4>
              <p className="text-sm text-gray-500 font-medium">Most popular items (Last 50 sales)</p>
            </div>
          </div>
          <div className="overflow-x-auto min-h-[300px]">
            {isLoadingDetails ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
                <p className="text-sm text-gray-500 font-medium">Analyzing product performance...</p>
              </div>
            ) : topProducts.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Product</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Qty Sold</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topProducts.map((product, i) => (
                    <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-8 py-5 font-bold text-gray-900 text-sm">{product.name}</td>
                      <td className="px-8 py-5 text-center text-gray-700 font-bold text-sm">{product.quantity}</td>
                      <td className="px-8 py-5 text-right font-bold text-blue-700 text-sm">
                        ${product.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500 font-medium">
                No product data available for analysis.
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Categories */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] tracking-tight mb-1">Top Selling Categories</h4>
          <p className="text-sm text-gray-500 font-medium mb-8">Revenue by business sector</p>
          <div className="space-y-6 min-h-[250px]">
            {isLoadingDetails ? (
              <div className="flex flex-col items-center justify-center h-full pt-10 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
              </div>
            ) : topCategories.length > 0 ? (
              topCategories.map((category, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-gray-700">{category.name}</span>
                    <span className="text-gray-900">{category.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`${category.color} h-full rounded-full transition-all duration-1000`} 
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full pt-10 text-gray-500 font-medium">
                No category data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
