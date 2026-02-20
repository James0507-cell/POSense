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

export default function ProductAnalytics({ stockBarData, categoryPieData, productsTimeLineData }) {
  const barChartRef = useRef(null);
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
    </div>
  );
}
