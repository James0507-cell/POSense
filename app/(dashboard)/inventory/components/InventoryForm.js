'use client';

import React, { useState, useEffect } from 'react';

export default function InventoryForm({ item, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    product_id: '',
    location: '',
    quantity: '',
    minimum: '',
    maximum: '',
    created_by: '',
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentEmployeeId = typeof window !== 'undefined' ? sessionStorage.getItem('employee_id') : '';

    async function fetchProducts() {
        try {
            const response = await fetch('/api/db-query?q=SELECT product_id, name FROM products');
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            }
        } catch (error) {
            console.error("Failed to fetch products for inventory:", error);
        }
    }
    fetchProducts();

    if (item) {
      setFormData({
        inventory_id: item.inventory_id,
        product_id: item.product_id || '',
        location: item.location || '',
        quantity: item.quantity || '',
        minimum: item.minimum || '',
        maximum: item.maximum || '',
        updated_by: currentEmployeeId,
      });
    } else {
      setFormData(prev => ({ ...prev, created_by: currentEmployeeId }));
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const method = item ? 'PUT' : 'POST';
    
    try {
      const response = await fetch('/api/inventory', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await response.json();
        alert(err.error || "Failed to save inventory record");
      }
    } catch (error) {
      console.error("Error saving inventory:", error);
      alert("An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 ease-out border border-gray-100 flex flex-col">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">
              {item ? 'Adjust Stock' : 'Add Stock Entry'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">Manage product quantities across locations</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-10rem)]">
          <div className="space-y-4">
            {/* Product Selection */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Product</label>
              <select
                name="product_id"
                value={formData.product_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
              >
                <option value="">Select Product</option>
                {products.map(p => (
                  <option key={p.product_id} value={p.product_id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="e.g. Warehouse A, Aisle 4"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Quantity */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  placeholder="0"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                />
              </div>

              {/* Minimum */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Minimum</label>
                <input
                  type="number"
                  name="minimum"
                  value={formData.minimum}
                  onChange={handleChange}
                  required
                  placeholder="Low alert"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                />
              </div>

              {/* Maximum */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Maximum</label>
                <input
                  type="number"
                  name="maximum"
                  value={formData.maximum}
                  onChange={handleChange}
                  required
                  placeholder="Cap limit"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 border border-gray-200 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3.5 bg-blue-700 text-white rounded-2xl text-sm font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              {item ? 'Update Stock' : 'Add Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
