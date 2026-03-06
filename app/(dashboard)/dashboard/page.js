'use client';

import React, { useState, useEffect, useMemo } from 'react';
import DashboardOverview from './components/DashboardOverview.js';

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
  LineElement,
  Filler
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7');
  const [topCategoriesLimit, setTopCategoriesLimit] = useState('5');
  
  // Data State
  const [confirmedSales, setConfirmedSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [salesTrend, setSalesTrend] = useState({ labels: [], data: [] });
  const [topCategories, setTopCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [salesRes, expRes, invRes, prodRes] = await Promise.all([
          fetch('/api/sales/confirmed'),
          fetch('/api/expenses'),
          fetch('/api/inventory'),
          fetch('/api/products')
        ]);

        if (salesRes.ok) setConfirmedSales(await salesRes.json());
        if (expRes.ok) setExpenses(await expRes.json());
        if (invRes.ok) setInventory(await invRes.json());
        if (prodRes.ok) setProducts(await prodRes.json());
      } catch (error) {
        console.error("Error fetching dashboard static data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [trendRes, catRes] = await Promise.all([
          fetch(`/api/analytics/sales-trend?days=${timeRange}`),
          fetch(`/api/analytics/top-categories?limit=${topCategoriesLimit}`)
        ]);

        if (trendRes.ok) setSalesTrend(await trendRes.json());
        if (catRes.ok) setTopCategories(await catRes.json());
      } catch (error) {
        console.error("Error fetching dashboard analytics:", error);
      }
    };

    fetchAnalytics();
  }, [timeRange, topCategoriesLimit]);

  const stats = useMemo(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Revenue
    const monthlySales = confirmedSales.filter(s => new Date(s.sale_date) >= startOfMonth);
    const totalRevenue = monthlySales.reduce((sum, s) => sum + Number(s.amount_paid || 0), 0);

    // Expenses
    const monthlyExpenses = expenses.filter(e => new Date(e.expense_date) >= startOfMonth);
    const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Categories
    const categories = new Set(products.map(p => p.category).filter(Boolean));
    
    // Low Stock
    const lowStockCount = inventory.filter(i => i.quantity <= i.minimum).length;

    return {
      totalRevenue,
      netProfit: totalRevenue - totalExpenses,
      categoryCount: categories.size,
      lowStockCount
    };
  }, [confirmedSales, expenses, products, inventory]);

  const barData = {
    labels: salesTrend.labels.length > 0 ? salesTrend.labels : ['No Data'],
    datasets: [
      {
        label: 'Revenue',
        data: salesTrend.data.length > 0 ? salesTrend.data : [0],
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
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6' },
        ticks: { callback: (value) => `₱${value}`, font: { weight: '600' } },
      },
      x: { grid: { display: false }, ticks: { font: { weight: '600' } } },
    },
  };

  const pieData = {
    labels: topCategories.length > 0 ? topCategories.map(c => c.name) : ['No Data'],
    datasets: [
      {
        data: topCategories.length > 0 ? topCategories.map(c => c.revenue) : [1],
        backgroundColor: [
          'rgba(29, 78, 216, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(20, 184, 166, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, padding: 20, font: { weight: 'bold', size: 12 } },
      },
    },
    cutout: '60%',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-8 animate-fade-in">
      <DashboardOverview 
          stats={stats}
          barData={barData}
          barOptions={barOptions}
          pieData={pieData}
          pieOptions={pieOptions}
          confirmedSales={confirmedSales}
          inventory={inventory}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          topCategoriesLimit={topCategoriesLimit}
          setTopCategoriesLimit={setTopCategoriesLimit}
        />
    </div>
  );
}
