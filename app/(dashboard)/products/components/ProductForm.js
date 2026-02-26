'use client';

import React, { useState, useEffect } from 'react';

export default function ProductForm({ product, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    brand_id: '',
    name: '',
    barcode: '',
    description: '',
    category: '',
    cost_price: '',
    selling_price: '',
    vat: '0',
    created_by: '',
  });

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentEmployeeId = typeof window !== 'undefined' ? sessionStorage.getItem('employee_id') : '';

    // Fetch brands for the dropdown
    async function fetchBrands() {
        try {
            const response = await fetch('/api/db-query?q=SELECT brand_id, name FROM brands');
            if (response.ok) {
                const data = await response.json();
                setBrands(data);
            }
        } catch (error) {
            console.error("Failed to fetch brands:", error);
        }
    }
    fetchBrands();

    if (product) {
      setFormData({
        product_id: product.product_id,
        brand_id: product.brand_id || '',
        name: product.name || '',
        barcode: product.barcode || '',
        description: product.description || '',
        category: product.category || '',
        cost_price: product.cost_price || '',
        selling_price: product.selling_price || '',
        vat: product.vat || '0',
        updated_by: currentEmployeeId,
      });
    } else {
      setFormData(prev => ({ ...prev, created_by: currentEmployeeId }));
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-calculate VAT (12%) when selling price changes
    if (name === 'selling_price') {
      const calculatedVat = (parseFloat(value) || 0) * 0.12;
      setFormData(prev => ({ 
        ...prev, 
        selling_price: value, 
        vat: calculatedVat.toFixed(2)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

        const method = product ? 'PUT' : 'POST';
        console.log("Submitting form with data:", formData);
        
        try {      const response = await fetch('/api/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await response.json();
        alert(err.error || "Failed to save product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      ></div>
      
      {/* Modal Card */}
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 ease-out border border-gray-100 flex flex-col">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">
              {product ? 'Edit Product' : 'Add New Product'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">Enter product specifications and pricing</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-10rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Brand Selection */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Brand</label>
              <select
                name="brand_id"
                value={formData.brand_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
              >
                <option value="">Select Brand</option>
                {brands.map(brand => (
                  <option key={brand.brand_id} value={brand.brand_id}>{brand.name}</option>
                ))}
              </select>
            </div>

            {/* Product Name */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Product Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Smart Camera Pro"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
              />
            </div>

            {/* Barcode */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Barcode / SKU</label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                placeholder="Scan or enter barcode"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all font-mono"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. Electronics"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
              />
            </div>

            {/* Cost Price */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Cost Price ($)</label>
              <input
                type="number"
                step="0.01"
                name="cost_price"
                value={formData.cost_price}
                onChange={handleChange}
                required
                placeholder="0.00"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
              />
            </div>

            {/* Selling Price */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Selling Price (VAT Inclusive) ($)</label>
              <input
                type="number"
                step="0.01"
                name="selling_price"
                value={formData.selling_price}
                onChange={handleChange}
                required
                placeholder="0.00"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
              />
            </div>

            {/* VAT (Calculated) */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">VAT Component (12%)</label>
              <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 font-bold">
                ${formData.vat}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Provide product details..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all resize-none"
            ></textarea>
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
              {product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
