'use client';

import React, { useMemo, useRef } from 'react';
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
import { Bar, Pie, Line } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';

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

// Internal helper for export buttons
const ExportButton = ({ chartRef, fileName, exportPng, exportPdf }) => (
  <div className="relative opacity-0 group-hover:opacity-100 transition-all duration-300">
    <div className="group/export relative">
      <div className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </div>
      
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

export default function ExpensesAnalytics({ expenses }) {
  const pieChartRef = useRef(null);
  const lineChartRef = useRef(null);

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

  const exportCsv = () => {
    if (categoryData.labels.length === 0) return;
    const headers = ['Category', 'Total Spent', 'Percentage'];
    const total = categoryData.datasets[0].data.reduce((a, b) => a + b, 0);
    const csvRows = [
      headers.join(','),
      ...categoryData.labels.map((label, i) => {
        const value = categoryData.datasets[0].data[i];
        const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
        return [
          `"${String(label).replace(/"/g, '""')}"`,
          value.toFixed(2),
          `${percentage}%`
        ].join(',');
      })
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expense_breakdown_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  // Expenses by Category (Pie Chart)
  const categoryData = useMemo(() => {
    const categories = {};
    expenses.forEach(e => {
      const cat = e.category_name || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + Number(e.amount);
    });

    const labels = Object.keys(categories);
    const data = Object.values(categories);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            'rgba(29, 78, 216, 0.8)',
            'rgba(99, 102, 241, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(20, 184, 166, 0.8)',
            'rgba(209, 213, 219, 0.8)',
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [expenses]);

  // Expenses Over Time (Line Chart - Last 6 Months)
  const timeData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const labels = [];
    const totals = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = months[d.getMonth()];
      labels.push(monthLabel);

      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const monthTotal = expenses
        .filter(e => {
          const ed = new Date(e.expense_date);
          return ed >= startOfMonth && ed <= endOfMonth;
        })
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      totals.push(monthTotal);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Total Expenses',
          data: totals,
          borderColor: 'rgba(29, 78, 216, 1)',
          backgroundColor: 'rgba(29, 78, 216, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [expenses]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, font: { weight: '600' } }
      },
      tooltip: {
        backgroundColor: '#111827',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
            label: (context) => ` $${context.raw.toFixed(2)}`
        }
      }
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
      {/* Expenses by Category */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 group">
        <div className="flex items-center justify-between mb-8">
          <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Expenses by Category</h4>
          <ExportButton 
            chartRef={pieChartRef} 
            fileName="expenses_by_category" 
            exportPng={exportChartPng} 
            exportPdf={exportChartPdf} 
          />
        </div>
        <div className="h-80">
          <Pie ref={pieChartRef} data={categoryData} options={chartOptions} />
        </div>
      </div>

      {/* Expenses over Time */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 group">
        <div className="flex items-center justify-between mb-8">
          <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Expenses Trend (Last 6 Months)</h4>
          <ExportButton 
            chartRef={lineChartRef} 
            fileName="expenses_trend" 
            exportPng={exportChartPng} 
            exportPdf={exportChartPdf} 
          />
        </div>
        <div className="h-80">
          <Line ref={lineChartRef} data={timeData} options={chartOptions} />
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden lg:col-span-2">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
            <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Category Breakdown</h4>
            <button 
              onClick={exportCsv}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50/50">
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Category</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Total Spent</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Percentage</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {categoryData.labels.map((label, i) => {
                        const total = categoryData.datasets[0].data.reduce((a, b) => a + b, 0);
                        const value = categoryData.datasets[0].data[i];
                        const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
                        return (
                            <tr key={label} className="hover:bg-gray-50/80 transition-colors">
                                <td className="px-8 py-5 font-bold text-gray-900 text-sm">{label}</td>
                                <td className="px-8 py-5 text-right font-bold text-gray-900 text-sm">${value.toFixed(2)}</td>
                                <td className="px-8 py-5 text-right">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                                        {percentage}%
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
