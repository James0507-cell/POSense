'use client';

import React, { useRef } from 'react';
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
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';

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
  LineElement
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

export default function ProductAnalytics({ 
  stockBarData, 
  categoryPieData, 
  productsTimeLineData,
  topProducts = [],
  topCategories = [],
  loadingAnalytics = false
}) {
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const lineChartRef = useRef(null);
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

  const exportProductsCsv = () => {
    if (!topProducts || topProducts.length === 0) return;
    const headers = ['Product Name', 'Quantity Sold', 'Revenue'];
    const csvRows = [
      headers.join(','),
      ...topProducts.map(p => [
        `"${String(p.name || '').replace(/"/g, '""')}"`,
        p.quantity || 0,
        (p.revenue || 0).toFixed(2)
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `top_products_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const categoryChartData = {
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, font: { weight: '600' } }
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Stock by Product */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 lg:col-span-2 group">
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Stock levels by Product</h4>
          <ExportButton chartRef={barChartRef} fileName="stock_levels" exportPng={exportChartPng} exportPdf={exportChartPdf} />
        </div>
        <div className="h-80">
          <Bar ref={barChartRef} data={stockBarData} options={chartOptions} />
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 group">
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Category Distribution</h4>
          <ExportButton chartRef={pieChartRef} fileName="category_distribution" exportPng={exportChartPng} exportPdf={exportChartPdf} />
        </div>
        <div className="h-80">
          <Pie ref={pieChartRef} data={categoryPieData} options={chartOptions} />
        </div>
      </div>

      {/* Products over Time */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 group">
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Inventory Growth</h4>
          <ExportButton chartRef={lineChartRef} fileName="inventory_growth" exportPng={exportChartPng} exportPdf={exportChartPdf} />
        </div>
        <div className="h-80">
          <Line ref={lineChartRef} data={productsTimeLineData} options={chartOptions} />
        </div>
      </div>

      {/* Top Selling Products Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] tracking-tight">Top Selling Products</h4>
            <p className="text-sm text-gray-500 font-medium">Most popular items by revenue</p>
          </div>
          <button 
            onClick={exportProductsCsv}
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto min-h-[300px]">
          {loadingAnalytics ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
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
              No sales data available.
            </div>
          )}
        </div>
      </div>

      {/* Top Selling Categories */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 group">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] tracking-tight">Top Selling Categories</h4>
            <p className="text-sm text-gray-500 font-medium">Revenue share per category</p>
          </div>
          <ExportButton 
            chartRef={categoryChartRef} 
            fileName="top_categories" 
            exportPng={exportChartPng} 
            exportPdf={exportChartPdf} 
          />
        </div>
        <div className="h-80 w-full">
          {loadingAnalytics ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            </div>
          ) : topCategories.length > 0 ? (
            <Bar ref={categoryChartRef} data={categoryChartData} options={categoryBarOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 font-medium">
              No category data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
