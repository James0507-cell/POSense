'use client';

import React from 'react';

export default function InventoryStatus({ inventoryData, metrics }) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Metrics Cards */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Total Stocks', value: metrics.totalStocks, icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: 'blue' },
          { label: 'Low Stock Alert', value: metrics.lowStock, icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'orange' },
          { label: 'Out of Stock', value: metrics.outOfStock, icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', color: 'red' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-5">
              <div className={`p-3 rounded-2xl bg-${stat.color}-50 group-hover:bg-${stat.color}-100 transition-colors`}>
                <svg className={`w-6 h-6 text-${stat.color}-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                </svg>
              </div>
            </div>
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Inventory List</h4>
          <button className="bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-100">
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
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap text-right">Quantity</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap text-right">Threshold</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Updated By</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Last Updated</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {inventoryData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-5 font-bold text-blue-700 text-sm whitespace-nowrap">{item.id}</td>
                  <td className="px-6 py-5 font-medium text-gray-700 text-sm whitespace-nowrap">{item.productId}</td>
                  <td className="px-6 py-5 text-gray-700 text-sm whitespace-nowrap">{item.location}</td>
                  <td className="px-6 py-5 text-right">
                    <span className={`font-bold text-sm ${item.quantity <= item.threshold ? 'text-red-600' : 'text-gray-900'}`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-medium text-gray-500 text-sm">{item.threshold}</td>
                  <td className="px-6 py-5 text-gray-700 text-sm">{item.updatedBy}</td>
                  <td className="px-6 py-5 text-gray-400 text-xs whitespace-nowrap">{item.lastUpdated}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Update Stock"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
