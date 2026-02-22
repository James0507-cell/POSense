'use client';

import React, { useState } from 'react';
import SaleForm from './SaleForm';

export default function SalesHistory({ salesData, refundsData = [], products = [], paymentTypes = [], onUpdate, onNewSale }) {
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleItems, setSaleItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Refund State
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [refundItems, setRefundItems] = useState([]);
  const [isLoadingRefundItems, setIsLoadingRefundItems] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  // Edit State
  const [editingSale, setEditingSale] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Sales Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortOrder, setSortOrder] = useState('date-desc');

  // Refund Search and Filter State
  const [refundSearchTerm, setRefundSearchTerm] = useState('');
  const [refundDateFrom, setRefundDateFrom] = useState('');
  const [refundDateTo, setRefundDateTo] = useState('');
  const [refundType, setRefundType] = useState('all');
  const [refundSortOrder, setRefundSortOrder] = useState('date-desc');

  const handleEdit = (sale) => {
    setEditingSale(sale);
    setIsFormOpen(true);
  };

  const handleViewDetails = async (sale) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
    setIsLoadingItems(true);
    
    const idKey = Object.keys(sale).find(key => 
      (key.toLowerCase() === 'sales_id' || 
       key.toLowerCase() === 'sales id' || 
       key.toLowerCase() === 'id' || 
       key.toLowerCase().includes('id')) && 
      sale[key] !== null
    );
    
    const currentId = idKey ? sale[idKey] : null;
    
    if (currentId === null || currentId === undefined) {
      setSaleItems([]);
      setIsLoadingItems(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/sales/items?saleId=${currentId}`);
      if (response.ok) {
        const data = await response.json();
        setSaleItems(data);
      } else {
        setSaleItems([]);
      }
    } catch (error) {
      console.error("Error fetching sale items:", error);
      setSaleItems([]);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleViewRefundDetails = async (refund) => {
    setSelectedRefund(refund);
    setIsRefundModalOpen(true);
    setIsLoadingRefundItems(true);
    
    try {
      const response = await fetch(`/api/refunds/items?refundId=${refund.refund_id}`);
      if (response.ok) {
        const data = await response.json();
        setRefundItems(data);
      }
    } catch (error) {
      console.error("Error fetching refund items:", error);
      setRefundItems([]);
    } finally {
      setIsLoadingRefundItems(false);
    }
  };

  const filteredSales = salesData.filter((sale) => {
    const dbId = (sale['sales id'] || sale.sales_id || sale.id || '').toString();
    const employeeId = (sale.employee_id || '').toString();
    const paymentType = (sale.payment_type || '').toString();
    const totalAmount = sale.total_amount || 0;
    const saleDate = new Date(sale.sale_date);

    const matchesSearch = 
      dbId.toLowerCase().includes(searchTerm.toLowerCase()) || 
      employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paymentType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const productDate = new Date(saleDate);
    const matchesDateFrom = !dateFrom || productDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || productDate <= new Date(dateTo);
    
    const matchesMinAmount = !minAmount || totalAmount >= parseFloat(minAmount);
    const matchesMaxAmount = !maxAmount || totalAmount <= parseFloat(maxAmount);

    return matchesSearch && matchesDateFrom && matchesDateTo && matchesMinAmount && matchesMaxAmount;
  }).sort((a, b) => {
    const aDate = new Date(a.sale_date);
    const bDate = new Date(b.sale_date);
    const aAmount = a.total_amount || 0;
    const bAmount = b.total_amount || 0;

    if (sortOrder === 'date-desc') return bDate - aDate;
    if (sortOrder === 'date-asc') return aDate - bDate;
    if (sortOrder === 'amount-desc') return bAmount - aAmount;
    if (sortOrder === 'amount-asc') return aAmount - bAmount;
    return 0;
  });

  const filteredRefunds = refundsData.filter((refund) => {
    const id = (refund.refund_id || '').toString();
    const saleId = (refund.sale_id || '').toString();
    const type = (refund.refund_type || '').toString();
    const date = new Date(refund.created_at);

    const matchesSearch = 
      id.toLowerCase().includes(refundSearchTerm.toLowerCase()) || 
      saleId.toLowerCase().includes(refundSearchTerm.toLowerCase());
    
    const matchesDateFrom = !refundDateFrom || date >= new Date(refundDateFrom);
    const matchesDateTo = !refundDateTo || date <= new Date(refundDateTo);
    
    const matchesType = refundType === 'all' || type.toLowerCase() === refundType.toLowerCase();

    return matchesSearch && matchesDateFrom && matchesDateTo && matchesType;
  }).sort((a, b) => {
    const aDate = new Date(a.created_at);
    const bDate = new Date(b.created_at);
    const aAmount = a.total_refund_amount || 0;
    const bAmount = b.total_refund_amount || 0;

    if (refundSortOrder === 'date-desc') return bDate - aDate;
    if (refundSortOrder === 'date-asc') return aDate - bDate;
    if (refundSortOrder === 'amount-desc') return bAmount - aAmount;
    if (refundSortOrder === 'amount-asc') return aAmount - bAmount;
    return 0;
  });

  const handleExport = () => {
    if (filteredSales.length === 0) return;
    const headers = ['Sales ID', 'Sale Timestamp', 'Employee ID', 'Payment Type', 'Total Amount', 'Total Tax', 'Status', 'Updated By'];
    const csvRows = [
      headers.join(','),
      ...filteredSales.map(sale => [
        sale['sales id'] || sale.sales_id || sale.id,
        sale.sale_date,
        `"${String(sale.employee_id || '').replace(/"/g, '""')}"`,
        `"${String(sale.payment_type || '').replace(/"/g, '""')}"`,
        sale.total_amount || 0,
        sale.total_tax || 0,
        `"${String(sale.status || '').replace(/"/g, '""')}"`,
        `"${String(sale.updated_by || '').replace(/"/g, '""')}"`
      ].join(','))
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthSales = salesData.filter(sale => {
    const saleDate = new Date(sale.sale_date);
    return (
      saleDate.getMonth() === currentMonth && 
      saleDate.getFullYear() === currentYear &&
      sale.status?.toLowerCase() !== 'voided'
    );
  });

  const thisMonthRefunds = refundsData.filter(refund => {
    const refundDate = new Date(refund.created_at);
    return refundDate.getMonth() === currentMonth && refundDate.getFullYear() === currentYear;
  });

  const totalSalesRevenue = thisMonthSales.reduce((acc, sale) => acc + (sale.total_amount || 0), 0);
  const totalRefundAmount = thisMonthRefunds.reduce((acc, refund) => acc + (refund.total_refund_amount || 0), 0);
  
  const netRevenue = Math.max(0, totalSalesRevenue - totalRefundAmount);
  const totalSalesCount = thisMonthSales.length;
  const averageSale = totalSalesCount > 0 ? netRevenue / totalSalesCount : 0;

  const stats = [
    { label: 'Total Revenue This Month', value: `$${netRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Total Sales This Month', value: totalSalesCount.toString(), icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z', color: 'text-green-700', bg: 'bg-green-50' },
    { label: 'Average Sale This Month', value: `$${averageSale.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'text-purple-700', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-5">
              <div className={`p-3 rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform`}>
                <svg className={`w-6 h-6 ${stat.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative lg:col-span-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search ID, employee or payment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 lg:col-span-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
          </div>
          <div className="flex gap-2">
            <input type="number" placeholder="Min $" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
            <input type="number" placeholder="Max $" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
          </div>
          <div>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none cursor-pointer">
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Amount High-Low</option>
              <option value="amount-asc">Amount Low-High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Sales History</h4>
          <div className="flex gap-3">
            <button onClick={onNewSale} className="px-6 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-bold hover:bg-blue-800 shadow-lg shadow-blue-100 transition-all">New Sale</button>
            <button onClick={handleExport} className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50">Export CSV</button>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase">Sales ID</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase">Date</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase text-right">Amount</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase">Processed By</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase">Updated By</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSales.map((sale) => {
                const id = sale.sale_id || sale.sales_id || sale.id || sale['sales id'];
                return (
                  <tr key={id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-8 py-5 font-bold text-gray-900">{id}</td>
                    <td className="px-8 py-5 text-gray-600 text-sm">{new Date(sale.sale_date).toLocaleString()}</td>
                    <td className="px-8 py-5 text-right font-bold text-blue-700">${(sale.total_amount || 0).toFixed(2)}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${sale.status?.toLowerCase() === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {sale.status || 'Confirmed'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-gray-600 text-sm">{sale.employee_id || 'N/A'}</td>
                    <td className="px-8 py-5 text-gray-600 text-sm">{sale.updated_by || 'N/A'}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleViewDetails(sale)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </button>
                        <button onClick={() => handleEdit(sale)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refunds Filter Bar */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative lg:col-span-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search Refund ID or Sale ID..."
              value={refundSearchTerm}
              onChange={(e) => setRefundSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2 lg:col-span-2">
            <input type="date" value={refundDateFrom} onChange={(e) => setRefundDateFrom(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
            <input type="date" value={refundDateTo} onChange={(e) => setRefundDateTo(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
          </div>
          <div>
            <select value={refundType} onChange={(e) => setRefundType(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none cursor-pointer text-gray-700">
              <option value="all">All Types</option>
              <option value="full">Full Refund</option>
              <option value="partial">Partial Refund</option>
            </select>
          </div>
          <div>
            <select value={refundSortOrder} onChange={(e) => setRefundSortOrder(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none cursor-pointer">
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Amount High-Low</option>
              <option value="amount-asc">Amount Low-High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Refunds Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100">
          <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Refunds List</h4>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase">Refund ID</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase">Sale ID</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase">Date</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase">Type</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase text-right">Amount</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase text-center">Processed By</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRefunds.map((refund) => (
                <tr key={refund.refund_id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-8 py-5 font-bold text-gray-900">{refund.refund_id}</td>
                  <td className="px-8 py-5 text-blue-700 font-bold">{refund.sale_id}</td>
                  <td className="px-8 py-5 text-gray-600 text-sm">{new Date(refund.created_at).toLocaleString()}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${refund.refund_type === 'full' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {refund.refund_type}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-bold text-red-600">-${(refund.total_refund_amount || 0).toFixed(2)}</td>
                  <td className="px-8 py-5 text-center text-gray-600 text-sm">{refund.processed_by || 'N/A'}</td>
                  <td className="px-8 py-5 text-center">
                    <button onClick={() => handleViewRefundDetails(refund)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Form Modal */}
      {isFormOpen && (
        <SaleForm sale={editingSale} products={products} paymentTypes={paymentTypes} onClose={() => setIsFormOpen(false)} onSuccess={onUpdate} />
      )}

      {/* Sale Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Sale Details: {selectedSale?.sale_id || selectedSale?.sales_id || selectedSale?.id}</h3>
                <p className="text-sm text-gray-500">Timestamp: {new Date(selectedSale?.sale_date).toLocaleString()}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Product</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-center">Qty</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-right">Price</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {saleItems.map((item, i) => (
                      <tr key={i}>
                        <td className="px-6 py-5">
                          <p className="font-bold text-gray-900 text-sm">{item.product_name}</p>
                          <p className="text-[10px] text-gray-400">ID: {item.product_id}</p>
                        </td>
                        <td className="px-6 py-5 text-center font-bold text-gray-700 text-sm">{item.quantity}</td>
                        <td className="px-6 py-5 text-right text-gray-700 text-sm">${(item.unit_price || 0).toFixed(2)}</td>
                        <td className="px-6 py-5 text-right font-bold text-blue-700 text-sm">${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50/50 font-bold">
                    <tr>
                      <td colSpan="3" className="px-6 py-2 text-right text-gray-500 text-sm">Net Amount (Excl. VAT):</td>
                      <td className="px-6 py-2 text-right text-gray-700 text-sm">
                        ${((selectedSale?.total_amount || 0) - (selectedSale?.total_tax || 0)).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="px-6 py-2 text-right text-gray-500 text-sm">VAT (12% Included):</td>
                      <td className="px-6 py-2 text-right text-gray-700 text-sm">
                        ${(selectedSale?.total_tax || 0).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-right text-gray-600">Grand Total:</td>
                      <td className="px-6 py-4 text-right text-blue-700 text-lg">
                        ${(selectedSale?.total_amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Details Modal */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Refund Details: {selectedRefund?.refund_id}</h3>
                <p className="text-sm text-gray-500">Sale ID: {selectedRefund?.sale_id}</p>
              </div>
              <button onClick={() => setIsRefundModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Product</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-center">Qty Refunded</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase text-right">Refund Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {refundItems.map((item, i) => (
                      <tr key={i}>
                        <td className="px-6 py-5">
                          <p className="font-bold text-gray-900 text-sm">{item.product_name}</p>
                          <p className="text-[10px] text-gray-400">ID: {item.product_id}</p>
                        </td>
                        <td className="px-6 py-5 text-center font-bold text-red-600 text-sm">{item.quantity_refunded}</td>
                        <td className="px-6 py-5 text-right font-bold text-red-700 text-sm">-${(item.subtotal || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50/50 font-bold">
                    <tr>
                      <td colSpan="2" className="px-6 py-4 text-right text-gray-600">Total Refunded:</td>
                      <td className="px-6 py-4 text-right text-red-700 text-lg">-${(selectedRefund?.total_refund_amount || 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
