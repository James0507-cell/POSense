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
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function InventoryAnalytics({ chartData }) {
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
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6' },
        ticks: { font: { weight: '600' } },
      },
      x: {
        grid: { display: false },
        ticks: { font: { weight: '600' } },
      },
    },
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] tracking-tight">Stock Levels vs Threshold</h4>
          <p className="text-sm text-gray-500 font-medium">Comparison of current stock and minimum required levels</p>
        </div>
      </div>
      <div className="h-96 w-full">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
