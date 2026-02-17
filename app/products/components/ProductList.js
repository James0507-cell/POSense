'use client';

import React from 'react';

export default function ProductList({ products }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-gray-100 flex items-center justify-between">
        <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Product Inventory</h4>
        <button className="bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-100">
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
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-6 py-5 font-bold text-blue-700 text-sm whitespace-nowrap">{p.id}</td>
                <td className="px-6 py-5 font-medium text-gray-700 text-sm whitespace-nowrap">{p.brand}</td>
                <td className="px-6 py-5 font-bold text-gray-900 text-sm whitespace-nowrap">{p.name}</td>
                <td className="px-6 py-5 text-gray-500 text-xs font-mono whitespace-nowrap">{p.barcode}</td>
                <td className="px-6 py-5 text-gray-500 text-xs max-w-xs truncate">{p.description}</td>
                <td className="px-6 py-5">
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                    {p.category}
                  </span>
                </td>
                <td className="px-6 py-5 text-right font-medium text-gray-700 text-sm">${p.cost_price.toFixed(2)}</td>
                <td className="px-6 py-5 text-right font-bold text-gray-900 text-sm">${p.selling_price.toFixed(2)}</td>
                <td className="px-6 py-5 text-gray-500 text-sm">{(p.tax_rate * 100).toFixed(0)}%</td>
                <td className="px-6 py-5 text-gray-700 text-sm">{p.created_by}</td>
                <td className="px-6 py-5 text-gray-700 text-sm">{p.updated_by}</td>
                <td className="px-6 py-5 text-gray-400 text-xs">{p.created_at.split(' ')[0]}</td>
                <td className="px-6 py-5">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => console.log('Update', p.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Update Product"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => console.log('Delete', p.id)}
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
