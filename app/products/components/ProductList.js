'use client';

import React, { useState } from 'react';

export default function ProductList({ products, onEdit, onDelete, onAdd }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortOrder, setSortOrder] = useState('date-desc');

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
        if (response.ok) {
          onDelete();
        } else {
          alert("Failed to delete product");
        }
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  const filteredProducts = products.filter((p) => {
    const name = p.name || '';
    const id = p.id || '';
    const brand = p.brand || '';
    const createdAt = p.created_at || p.createdAt || '';
    const sellingPrice = p.selling_price || p.sellingPrice || 0;

    const matchesSearch = 
      name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const productDate = new Date(createdAt);
    const matchesDateFrom = !dateFrom || productDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || productDate <= new Date(dateTo);
    
    const matchesMinPrice = !minPrice || sellingPrice >= parseFloat(minPrice);
    const matchesMaxPrice = !maxPrice || sellingPrice <= parseFloat(maxPrice);

    return matchesSearch && matchesDateFrom && matchesDateTo && matchesMinPrice && matchesMaxPrice;
  }).sort((a, b) => {
    const aCreatedAt = a.created_at || a.createdAt || '';
    const bCreatedAt = b.created_at || b.createdAt || '';
    const aSellingPrice = a.selling_price || a.sellingPrice || 0;
    const bSellingPrice = b.selling_price || b.sellingPrice || 0;

    if (sortOrder === 'date-desc') return new Date(bCreatedAt) - new Date(aCreatedAt);
    if (sortOrder === 'date-asc') return new Date(aCreatedAt) - new Date(bCreatedAt);
    if (sortOrder === 'price-desc') return bSellingPrice - aSellingPrice;
    if (sortOrder === 'price-asc') return aSellingPrice - bSellingPrice;
    return 0;
  });

  return (
    <div className="space-y-6">
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
              placeholder="Search by ID, name or brand..."
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

          {/* Price Range */}
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
            />
            <input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
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
              <option value="price-desc">Price: High to Low</option>
              <option value="price-asc">Price: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Product Inventory</h4>
          <button 
            onClick={onAdd}
            className="bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-100"
          >
            Add New Product
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Product ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Brand</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Barcode</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Description</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap text-right">Cost</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap text-right">Selling Price</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Tax</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Created By</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Updated By</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Date Added</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Last Updated</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((p, index) => (
                <tr key={p.product_id || p.id || index} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-5 font-bold text-blue-700 text-sm whitespace-nowrap">{p.product_id || p.id}</td>
                  <td className="px-6 py-5 font-medium text-gray-700 text-sm whitespace-nowrap">{p.brand}</td>
                  <td className="px-6 py-5 font-bold text-gray-900 text-sm whitespace-nowrap">{p.name}</td>
                  <td className="px-6 py-5 text-gray-500 text-xs font-mono whitespace-nowrap">{p.barcode}</td>
                  <td className="px-6 py-5 text-gray-500 text-xs max-w-xs truncate">{p.description}</td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-medium text-gray-700 text-sm">${Number(p.cost_price || p.costPrice || 0).toFixed(2)}</td>
                  <td className="px-6 py-5 text-right font-bold text-gray-900 text-sm">${Number(p.selling_price || p.sellingPrice || 0).toFixed(2)}</td>
                  <td className="px-6 py-5 text-gray-500 text-sm">{(Number(p.tax_rate || p.taxRate || 0) * 100).toFixed(0)}%</td>
                  <td className="px-6 py-5 text-gray-700 text-sm">{p.created_by || p.createdBy}</td>
                  <td className="px-6 py-5 text-gray-700 text-sm">{p.updated_by || p.updatedBy}</td>
                  <td className="px-6 py-5 text-gray-400 text-xs">{(p.created_at || p.createdAt || '').split(' ')[0]}</td>
                  <td className="px-6 py-5 text-gray-400 text-xs">{(p.updated_at || p.updatedAt || '').split(' ')[0]}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => onEdit(p)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Update Product"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(p.product_id || p.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Product"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="13" className="px-6 py-10 text-center text-gray-500 font-medium">
                    No products found matching your filters.
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
