'use client';

import React, { useState } from 'react';
import SaleForm from './SaleForm';

export default function SalesHistory({ salesData, products = [], paymentTypes = [], onUpdate, onNewSale }) {
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleItems, setSaleItems] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit State
  const [editingSale, setEditingSale] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortOrder, setSortOrder] = useState('date-desc');

  const handleEdit = (sale) => {
    setEditingSale(sale);
    setIsFormOpen(true);
  };

  const handleViewDetails = async (sale) => {
    setSelectedSale(sale);
    setIsModalOpen(true);
    setIsLoadingItems(true);
    
    // Log the entire sale object to see its keys for debugging
    console.log("Viewing sale object:", sale);
    
    // Use robust dynamic ID detection (matching the table row logic)
    const idKey = Object.keys(sale).find(key => 
      (key.toLowerCase() === 'sales_id' || 
       key.toLowerCase() === 'sales id' || 
       key.toLowerCase() === 'id' || 
       key.toLowerCase().includes('id')) && 
      sale[key] !== null
    );
    
    const currentId = idKey ? sale[idKey] : null;
    console.log("Detected ID for fetch:", currentId, "using key:", idKey);
    
    if (currentId === null || currentId === undefined) {
      console.error("Could not find a valid ID in the sale object! Available keys:", Object.keys(sale));
      setSaleItems([]);
      setIsLoadingItems(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/sales/items?saleId=${currentId}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Sale items received:", data);
        setSaleItems(data);
      } else {
        console.error("API response not OK:", response.status);
        setSaleItems([]);
      }
    } catch (error) {
      console.error("Error fetching sale items:", error);
      setSaleItems([]);
    } finally {
      setIsLoadingItems(false);
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
    
    const matchesDateFrom = !dateFrom || saleDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || saleDate <= new Date(dateTo);
    
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
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics Calculation based on current month of the YEAR (not filtered)
  // Or should it be based on filtered data? Inventory metrics were based on full data.
  // User asked "just like the one on products and inventory". 
  // Inventory cards use 'metrics' prop which is passed from page.js (calculated from full inventoryData).
  // However, for Sales, "Total Revenue This Month" usually refers to the CURRENT real-world month.
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthSales = salesData.filter(sale => {
    const saleDate = new Date(sale.sale_date);
    return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
  });

  const totalRevenue = thisMonthSales.reduce((acc, sale) => acc + (sale.total_amount || 0), 0);
  const totalSalesCount = thisMonthSales.length;
  const averageSale = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

  const stats = [
    { label: 'Total Revenue This Month', value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-blue-700', bg: 'bg-blue-50' },
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
          {/* Search */}
          <div className="relative lg:col-span-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by ID, Employee, or Payment Type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
            />
          </div>

          {/* Date Range */}
          <div className="flex gap-2 lg:col-span-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
            />
          </div>

          {/* Amount Range */}
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min $"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
            />
            <input
              type="number"
              placeholder="Max $"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
            />
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Amount: High to Low</option>
              <option value="amount-asc">Amount: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)] tracking-tight">Sales List</h4>
            <p className="text-sm text-gray-500 font-medium">History of all transactions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onNewSale}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 text-white rounded-xl text-sm font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New Sale
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Sales ID</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Sale Timestamp</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Employee ID</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Payment Type</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Total Amount</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Total Tax</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Updated By</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale, i) => {
                  // Debug log for the first item to check the structure
                  if (i === 0) console.log("Sample sale record structure:", sale);

                  // Find the ID dynamically
                  const idKey = Object.keys(sale).find(key => 
                    (key.toLowerCase() === 'sales_id' || 
                     key.toLowerCase() === 'sales id' || 
                     key.toLowerCase() === 'id' || 
                     key.toLowerCase().includes('id')) && 
                    sale[key] !== null
                  );
                  
                  const dbId = idKey ? sale[idKey] : 'N/A';
                  
                  return (
                    <tr key={(dbId || i) + '-' + i} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-8 py-5 font-bold text-gray-900 text-sm">{dbId}</td>
                      <td className="px-8 py-5 text-gray-700 text-sm font-medium">
                      {sale.sale_date ? new Date(sale.sale_date).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-8 py-5 text-gray-600 text-sm">{sale.employee_id || 'EMP-001'}</td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                        {sale.payment_type || 'Cash'}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-bold text-gray-900 text-sm">
                      ${(sale.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-8 py-5 text-gray-500 text-sm">
                      ${(sale.total_tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                        sale.status?.toLowerCase() === 'confirmed' ? 'bg-green-100 text-green-700' : 
                        sale.status?.toLowerCase() === 'refunded' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {sale.status ? sale.status.charAt(0).toUpperCase() + sale.status.slice(1).toLowerCase() : 'Confirmed'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-gray-500 text-xs font-medium">{sale.updated_by || 'Admin'}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => handleViewDetails(sale)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleEdit(sale)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Update Sale"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="px-8 py-10 text-center text-gray-500 font-medium">
                    No sales records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Form Modal */}
      {isFormOpen && (
        <SaleForm 
          sale={editingSale} 
          products={products}
          paymentTypes={paymentTypes}
          onClose={() => setIsFormOpen(false)} 
          onSuccess={onUpdate} 
        />
      )}

      {/* Sale Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scale-up">
            {/* Modal Header */}
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">
                  Sale Details: {selectedSale?.['sales id'] || selectedSale?.sales_id || selectedSale?.id}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  Timestamp: {selectedSale?.sale_date ? new Date(selectedSale.sale_date).toLocaleString() : 'N/A'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Sale Info Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-6 bg-gray-50 rounded-2xl">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Employee</p>
                  <p className="text-sm font-bold text-gray-900">{selectedSale?.employee_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Payment</p>
                  <p className="text-sm font-bold text-gray-900">{selectedSale?.payment_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Status</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                    selectedSale?.status?.toLowerCase() === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedSale?.status ? selectedSale.status.charAt(0).toUpperCase() + selectedSale.status.slice(1).toLowerCase() : 'N/A'}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total Amount</p>
                  <p className="text-sm font-bold text-blue-700">${(selectedSale?.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Sale Items</h4>
                {isLoadingItems ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700"></div>
                    <p className="text-sm text-gray-500 font-medium">Loading items...</p>
                  </div>
                ) : saleItems.length > 0 ? (
                  <div className="border border-gray-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50">
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product Information</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Quantity</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Unit Price</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Tax Amount</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {saleItems.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-5">
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900 text-sm">{item.product_name || 'N/A'}</span>
                                <div className="flex gap-3 mt-1">
                                  <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">ID: {item.product_id || item.product_id}</span>
                                  <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">Barcode: {item.product_barcode || 'N/A'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center font-bold text-gray-700 text-sm">
                              {item.quantity - item.refunded_quantity}
                              {item.refunded_quantity > 0 && (
                                <span className="block text-[10px] text-red-500 font-medium mt-0.5">(-{item.refunded_quantity} returned)</span>
                              )}
                            </td>
                            <td className="px-6 py-5 text-right font-medium text-gray-700 text-sm">${(item.unit_price || item['unit price'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="px-6 py-5 text-right font-medium text-gray-500 text-sm">${(item.tax_amount || item['tax amount'] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="px-6 py-5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                                item.status?.toLowerCase() === 'refunded' ? 'bg-red-100 text-red-700' : 
                                item.status?.toLowerCase() === 'partially_refunded' ? 'bg-orange-100 text-orange-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {(item.status || 'confirmed').replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right font-bold text-blue-700 text-sm">
                              ${((item.quantity - item.refunded_quantity) * (item.unit_price || item['unit price'] || 0) + (item.tax_amount || item['tax amount'] || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50/50 font-bold">
                        <tr>
                          <td colSpan="4" className="px-6 py-4 text-right text-gray-600">Grand Total:</td>
                          <td className="px-6 py-4 text-right text-blue-700 text-lg">
                            ${(selectedSale?.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-2xl py-12 text-center">
                    <p className="text-gray-500 font-medium">No items found for this sale.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-gray-100 flex justify-end bg-gray-50/30">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
