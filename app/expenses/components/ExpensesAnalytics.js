'use client';

import React, { useMemo } from 'react';
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

export default function ExpensesAnalytics({ expenses }) {
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Expenses by Category */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 group">
        <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] mb-8">Expenses by Category</h4>
        <div className="h-80">
          <Pie data={categoryData} options={chartOptions} />
        </div>
      </div>

      {/* Expenses over Time */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 group">
        <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] mb-8">Expenses Trend (Last 6 Months)</h4>
        <div className="h-80">
          <Line data={timeData} options={chartOptions} />
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden lg:col-span-2">
        <div className="p-8 border-b border-gray-100">
            <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Category Breakdown</h4>
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
