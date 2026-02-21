'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { Line, Pie, Bar } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';

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

// Internal helper for export buttons to avoid re-mounting and state loss in dev
const ExportButton = ({ chartRef, fileName, exportPng, exportPdf }) => (
  <div className="relative opacity-0 group-hover:opacity-100 transition-all duration-300">
    <div className="group/export relative">
      <div className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </div>
      
      {/* Transparent bridge to prevent menu from closing when moving mouse */}
      <div className="absolute top-full left-0 w-full h-2 opacity-0 group-hover/export:block"></div>

      <div className="absolute right-0 top-[calc(100%+4px)] w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 invisible group-hover/export:visible opacity-0 group-hover/export:opacity-100 transition-all duration-200">
        <button 
          onClick={() => exportPng(chartRef, fileName)}
          className="w-full text-left px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          PNG Image
        </button>
        <button 
          onClick={() => exportPdf(chartRef, fileName)}
          className="w-full text-left px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          PDF Document
        </button>
      </div>
    </div>
  </div>
);

export default function SalesAnalytics({ salesData }) {
  const [timeRange, setTimeRange] = useState('7');
  const [topProducts, setTopProducts] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  const trendChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const categoryChartRef = useRef(null);

  const exportChartPng = (ref, fileName) => {
    const chart = ref.current;
    if (!chart) return;

    const url = chart.toBase64Image();
    const link = document.createElement('a');
    link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.png`;
    link.href = url;
    link.click();
  };

  const exportChartPdf = (ref, fileName) => {
    const chart = ref.current;
    if (!chart) return;

    const canvas = chart.canvas;
    const imgData = chart.toBase64Image();
    
    const orientation = canvas.width > canvas.height ? 'l' : 'p';
    const pdf = new jsPDF(orientation, 'px', [canvas.width, canvas.height]);
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const downloadCsv = (csvContent, fileName) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportProductsCsv = () => {
    if (topProducts.length === 0) return;
    const headers = ['Product Name', 'Quantity Sold', 'Revenue'];
    const csvRows = [
      headers.join(','),
      ...topProducts.map(p => [
        `"${String(p.name || '').replace(/"/g, '""')}"`,
        p.quantity || 0,
        (p.revenue || 0).toFixed(2)
      ].join(','))
    ];
    downloadCsv(csvRows.join('\n'), `top_products_${new Date().toISOString().split('T')[0]}.csv`);
  };

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
          return (
            saleDate.toDateString() === d.toDateString() &&
            sale.status?.toLowerCase() !== 'refunded'
          );
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
      if (sale.status?.toLowerCase() === 'refunded') return; // Skip refunded sales
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

  const processCategoryChartData = () => {
    return {
      labels: topCategories.map(c => c.name),
      datasets: [{
        label: 'Revenue Share %',
        data: topCategories.map(c => c.percentage),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(20, 184, 166, 0.8)',
        ],
        borderRadius: 8,
        barThickness: 12,
      }]
    };
  };

  const categoryBarOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context) => ` Share: ${context.raw}%`
        }
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        grid: { color: '#f3f4f6' },
        ticks: { 
          callback: (value) => `${value}%`,
          font: { weight: '600', size: 10 }
        },
      },
      y: {
        grid: { display: false },
        ticks: { font: { weight: '600', size: 11 } },
      },
    },
  };

  const trendData = processTrendData();
  const pieData = processPaymentData();
  const categoryData = processCategoryChartData();

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
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] tracking-tight">Sales Trend</h4>
              <p className="text-sm text-gray-500 font-medium">Revenue performance over time</p>
            </div>
            <div className="flex items-center gap-3">
              <ExportButton 
                chartRef={trendChartRef} 
                fileName="sales_trend" 
                exportPng={exportChartPng} 
                exportPdf={exportChartPdf} 
              />
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
          </div>
          <div className="h-80 w-full">
            <Line ref={trendChartRef} data={trendData} options={lineOptions} />
          </div>
        </div>

        {/* Revenue by Payment Method Pie Chart */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] tracking-tight mb-1">Revenue by Payment Method</h4>
              <p className="text-sm text-gray-500 font-medium">Distribution across payment types</p>
            </div>
            <ExportButton 
              chartRef={pieChartRef} 
              fileName="payment_methods" 
              exportPng={exportChartPng} 
              exportPdf={exportChartPdf} 
            />
          </div>
          <div className="h-80 w-full">
            <Pie ref={pieChartRef} data={pieData} options={pieOptions} />
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
            <button 
              onClick={exportProductsCsv}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
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
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] tracking-tight">Top Selling Categories</h4>
              <p className="text-sm text-gray-500 font-medium">Revenue by business sector</p>
            </div>
            <ExportButton 
              chartRef={categoryChartRef} 
              fileName="top_categories" 
              exportPng={exportChartPng} 
              exportPdf={exportChartPdf} 
            />
          </div>
          <div className="h-80 w-full">
            {isLoadingDetails ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
              </div>
            ) : topCategories.length > 0 ? (
              <Bar ref={categoryChartRef} data={categoryData} options={categoryBarOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 font-medium">
                No category data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
