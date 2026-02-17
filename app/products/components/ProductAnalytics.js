'use client';

import React from 'react';
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

export default function ProductAnalytics({ stockBarData, categoryPieData, productsTimeLineData }) {
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
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 lg:col-span-2">
        <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] mb-8">Stock levels by Product</h4>
        <div className="h-80">
          <Bar data={stockBarData} options={chartOptions} />
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] mb-8">Category Distribution</h4>
        <div className="h-80">
          <Pie data={categoryPieData} options={chartOptions} />
        </div>
      </div>

      {/* Products over Time */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] mb-8">Inventory Growth</h4>
        <div className="h-80">
          <Line data={productsTimeLineData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
