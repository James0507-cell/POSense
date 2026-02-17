'use client';

import React, { useState } from 'react';

export default function InventoryStatus({ inventoryData, metrics, onEdit, onDelete, onAdd }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minQty, setMinQty] = useState('');
  const [maxQty, setMaxQty] = useState('');
  const [sortOrder, setSortOrder] = useState('date-desc');

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this inventory record?")) {
      try {
        const response = await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' });
        if (response.ok) {
          onDelete();
        } else {
          alert("Failed to delete inventory record");
        }
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  const filteredInventory = inventoryData.filter((item) => {
    const productId = item.productId || item.product_id || '';
    const id = item.id || '';
    const location = item.location || '';
    const quantity = item.quantity || 0;
    const threshold = item.threshold || 0;
    const lastUpdated = item.lastUpdated || item.last_updated || '';

    const matchesSearch = 
      productId.toString().toLowerCase().includes(searchTerm.toLowerCase()) || 
      id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.toString().toLowerCase().includes(searchTerm.toLowerCase());
    
    const itemDate = new Date(lastUpdated);
    const matchesDateFrom = !dateFrom || itemDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || itemDate <= new Date(dateTo);
    
    const matchesMinQty = !minQty || quantity >= parseInt(minQty);
    const matchesMaxQty = !maxQty || quantity <= parseInt(maxQty);

    return matchesSearch && matchesDateFrom && matchesDateTo && matchesMinQty && matchesMaxQty;
  }).sort((a, b) => {
    const aLastUpdated = a.lastUpdated || a.last_updated || '';
    const bLastUpdated = b.lastUpdated || b.last_updated || '';
    const aQuantity = a.quantity || 0;
    const bQuantity = b.quantity || 0;

    if (sortOrder === 'date-desc') return new Date(bLastUpdated) - new Date(aLastUpdated);
    if (sortOrder === 'date-asc') return new Date(aLastUpdated) - new Date(bLastUpdated);
    if (sortOrder === 'qty-desc') return bQuantity - aQuantity;
    if (sortOrder === 'qty-asc') return aQuantity - bQuantity;
    return 0;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Total Stocks', value: metrics.totalStocks, icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', bgColor: 'bg-blue-50', hoverBg: 'group-hover:bg-blue-100', textColor: 'text-blue-700' },
          { label: 'Low Stock Alert', value: metrics.lowStock, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', bgColor: 'bg-orange-50', hoverBg: 'group-hover:bg-orange-100', textColor: 'text-orange-700' },
          { label: 'Out of Stock', value: metrics.outOfStock, icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', bgColor: 'bg-red-50', hoverBg: 'group-hover:bg-red-100', textColor: 'text-red-700' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-5">
              <div className={`p-3 rounded-2xl ${stat.bgColor} ${stat.hoverBg} transition-colors`}>
                <svg className={`w-6 h-6 ${stat.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">{stat.value}</p>
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
              placeholder="Search by ID, Product ID or Location..."
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

          {/* Quantity Range */}
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min Qty"
              value={minQty}
              onChange={(e) => setMinQty(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
            />
            <input
              type="number"
              placeholder="Max Qty"
              value={maxQty}
              onChange={(e) => setMaxQty(e.target.value)}
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
              <option value="qty-desc">Qty: High to Low</option>
              <option value="qty-asc">Qty: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Inventory List</h4>
          <button 
            onClick={onAdd}
            className="bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-100"
          >
            Adjust Stock
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Inventory ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Product ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Location</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap text-right">Minimum</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap text-right">Threshold</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap text-right">Quantity</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Created By</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Date Added</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Updated By</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Last Updated</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredInventory.map((item, index) => (
                <tr key={item.inventory_id || item.id || index} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-5 font-bold text-blue-700 text-sm whitespace-nowrap">{item.inventory_id || item.id}</td>
                  <td className="px-6 py-5 font-medium text-gray-700 text-sm whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{item.product_name || 'N/A'}</span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-tighter">{item.product_id || item.productId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-gray-700 text-sm whitespace-nowrap">{item.location}</td>
                  <td className="px-6 py-5 text-right font-medium text-gray-500 text-sm">{item.minimum}</td>
                  <td className="px-6 py-5 text-right font-medium text-gray-500 text-sm">{item.maximum}</td>
                  <td className="px-6 py-5 text-right">
                    <span className={`font-bold text-sm ${(item.quantity || 0) <= (item.minimum || item.threshold || 0) ? 'text-red-600' : 'text-gray-900'}`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-gray-700 text-sm">{item.createdBy || item.created_by}</td>
                  <td className="px-6 py-5 text-gray-400 text-xs whitespace-nowrap">{(item.createdAt || item.created_at || '').split(' ')[0]}</td>
                  <td className="px-6 py-5 text-gray-700 text-sm">{item.updatedBy || item.updated_by}</td>
                  <td className="px-6 py-5 text-gray-400 text-xs whitespace-nowrap">{item.lastUpdated || item.last_updated}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => onEdit(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Update Stock"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(item.inventory_id || item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Entry"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-6 py-10 text-center text-gray-500 font-medium">
                    No inventory records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
