'use client';

import React, { useState, useEffect } from 'react';

export default function ExpenseForm({ expense, categories, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    category_id: '',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    created_by: '',
  });
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentEmployeeId = typeof window !== 'undefined' ? sessionStorage.getItem('employee_id') : '';

    if (expense) {
      setFormData({
        expense_id: expense.expense_id,
        category_id: expense.category_id || '',
        description: expense.description || '',
        amount: expense.amount || '',
        expense_date: expense.expense_date ? new Date(expense.expense_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        updated_by: currentEmployeeId,
      });
      fetchExpenseItems(expense.expense_id);
    } else {
      setFormData(prev => ({ ...prev, created_by: currentEmployeeId }));
      setItems([]);
    }
  }, [expense]);

  const fetchExpenseItems = async (id) => {
    try {
      const res = await fetch(`/api/expenses/items?expense_id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.map(item => ({
          item_name: item.item_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })));
      }
    } catch (error) {
      console.error("Error fetching expense items:", error);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { item_name: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    
    // Recalculate total amount from remaining items
    const newTotal = newItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
    setFormData(prev => ({ ...prev, amount: newTotal.toFixed(2) }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);

    // Recalculate total amount from items
    const newTotal = newItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
    setFormData(prev => ({ ...prev, amount: newTotal.toFixed(2) }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const method = expense ? 'PUT' : 'POST';
    
    try {
      const response = await fetch('/api/expenses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, items }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await response.json();
        alert(err.error || "Failed to save expense");
      }
    } catch (error) {
      console.error("Error saving expense:", error);
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
              {expense ? 'Edit Expense' : 'Add New Expense'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">Enter expense details and itemized list</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-10rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Category</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                ))}
              </select>
            </div>

            {/* Expense Date */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Expense Date</label>
              <input
                type="date"
                name="expense_date"
                value={formData.expense_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="e.g. Office Supplies for Q1"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
              />
            </div>
          </div>

          {/* Expense Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="text-md font-bold text-gray-800">Itemized Details</h4>
              <button 
                type="button" 
                onClick={handleAddItem}
                className="text-sm font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-end bg-gray-50 p-3 rounded-2xl relative group">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Item Name</label>
                    <input
                      type="text"
                      value={item.item_name}
                      onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                      required
                      placeholder="Item name"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-blue-700 outline-none transition-all"
                    />
                  </div>
                  <div className="w-20 space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Qty</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      required
                      min="1"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-blue-700 outline-none transition-all"
                    />
                  </div>
                  <div className="w-32 space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      required
                      min="0"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-blue-700 outline-none transition-all"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveItem(index)}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center py-4 text-gray-400 text-sm italic">
                  No items added. The total amount will be entered manually.
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2 border-t border-gray-100 pt-6">
            <label className="text-sm font-bold text-gray-700 ml-1">Total Amount ($)</label>
            <input
              type="number"
              step="0.01"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              readOnly={items.length > 0}
              placeholder="0.00"
              className={`w-full px-4 py-3 ${items.length > 0 ? 'bg-gray-100' : 'bg-gray-50'} border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all font-bold text-blue-700`}
            />
            {items.length > 0 && <p className="text-[10px] text-gray-400 ml-1 italic">* Calculated from items above</p>}
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
              {expense ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
