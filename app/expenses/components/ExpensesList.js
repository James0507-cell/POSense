'use client';

import React, { useState, useMemo } from 'react';

export default function ExpensesList({ expenses, categories, onEdit, onDelete, onAdd }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewingItems, setViewingItems] = useState(null); // stores the expense being viewed
  const [expenseItems, setExpenseItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const stats = useMemo(() => {
    // ... (rest of stats logic remains same)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const todayExpenses = expenses.filter(e => {
        const d = new Date(e.expense_date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
    }).reduce((sum, e) => sum + Number(e.amount), 0);

    const monthExpenses = expenses.filter(e => {
        const d = new Date(e.expense_date);
        return d >= startOfMonth;
    }).reduce((sum, e) => sum + Number(e.amount), 0);

    const daysInMonthSoFar = today.getDate();
    const avgMonthExpenses = monthExpenses / (daysInMonthSoFar || 1);

    return { todayExpenses, monthExpenses, avgMonthExpenses };
  }, [expenses]);

  const handleViewItems = async (expense) => {
    setViewingItems(expense);
    setLoadingItems(true);
    try {
      const res = await fetch(`/api/expenses/items?expense_id=${expense.expense_id}`);
      if (res.ok) {
        const data = await res.json();
        setExpenseItems(data);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  const filteredExpenses = expenses.filter((e) => {
// ...
    const description = e.description || '';
    const categoryName = e.category_name || '';
    const expenseId = e.expense_id || '';
    
    const matchesSearch = 
      description.toLowerCase().includes(searchTerm.toLowerCase()) || 
      categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expenseId.toString().includes(searchTerm);
    
    const expenseDate = new Date(e.expense_date);
    const matchesDateFrom = !dateFrom || expenseDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || expenseDate <= new Date(dateTo);
    const matchesCategory = selectedCategory === 'all' || e.category_id.toString() === selectedCategory;

    return matchesSearch && matchesDateFrom && matchesDateTo && matchesCategory;
  });

  const handleExport = () => {
    if (filteredExpenses.length === 0) return;
    
    const headers = ['Expense ID', 'Category', 'Description', 'Amount', 'Expense Date', 'Created By', 'Created At', 'Updated By', 'Updated At'];
    const csvRows = [
      headers.join(','),
      ...filteredExpenses.map(e => [
        e.expense_id,
        `"${String(e.category_name || '').replace(/"/g, '""')}"`,
        `"${String(e.description || '').replace(/"/g, '""')}"`,
        e.amount,
        e.expense_date,
        e.created_by,
        e.created_at,
        e.updated_by,
        e.updated_at
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const parseCSV = (str) => {
        const arr = [];
        let quote = false;
        let col = "";
        let row = [];
        for (let c = 0; c < str.length; c++) {
          let char = str[c];
          let next = str[c+1];
          if (char === '"' && quote && next === '"') { col += char; c++; continue; }
          if (char === '"') { quote = !quote; continue; }
          if (char === ',' && !quote) { row.push(col); col = ""; continue; }
          if (char === '\r' && !quote) { continue; }
          if (char === '\n' && !quote) { row.push(col); arr.push(row); col = ""; row = []; continue; }
          col += char;
        }
        if (col || row.length) { row.push(col); arr.push(row); }
        return arr;
      };

      const rows = parseCSV(text);
      if (rows.length < 2) return;

      const expensesToImport = rows.slice(1).filter(row => row.length >= 4).map(row => {
        const catName = row[1];
        const category = categories.find(c => c.category_name.toLowerCase() === (catName || '').trim().toLowerCase());
        
        return {
          category_id: category ? category.category_id : null,
          description: (row[2] || '').trim(),
          amount: parseFloat(row[3]) || 0,
          expense_date: row[4] || new Date().toISOString(),
          created_by: sessionStorage.getItem('employee_id') || null
        };
      });

      const validExpenses = expensesToImport.filter(ex => ex.category_id !== null && ex.amount > 0);

      if (validExpenses.length === 0) {
        alert("No valid expense data found in CSV. Ensure category names match existing categories.");
        return;
      }

      if (confirm(`Import ${validExpenses.length} expenses?`)) {
        let successCount = 0;
        for (const expense of validExpenses) {
          try {
            const res = await fetch('/api/expenses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(expense)
            });
            if (res.ok) successCount++;
          } catch (error) {
            console.error("Error importing expense:", error);
          }
        }
        alert(`Successfully imported ${successCount} expenses.`);
        onAdd(); // Refresh
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-5">
                <div className="p-3 rounded-2xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                    <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Total Expenses Today</p>
            <p className="text-2xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">
                ${stats.todayExpenses.toFixed(2)}
            </p>
        </div>

        <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-5">
                <div className="p-3 rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                    <svg className="w-6 h-6 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            </div>
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Total Expenses This Month</p>
            <p className="text-2xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">
                ${stats.monthExpenses.toFixed(2)}
            </p>
        </div>

        <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-5">
                <div className="p-3 rounded-2xl bg-purple-50 group-hover:bg-purple-100 transition-colors">
                    <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
            </div>
            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Avg Expenses This Month</p>
            <p className="text-2xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">
                ${stats.avgMonthExpenses.toFixed(2)}
            </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by description or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
            />
          </div>

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

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <h4 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Expenses Records</h4>
          <div className="flex gap-3">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
            <label className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
              <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
            </label>
            <button 
              onClick={onAdd}
              className="bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-100"
            >
              Add New Expense
            </button>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Description</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Expense Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Created By</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Created At</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Updated By</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Updated At</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredExpenses.map((e, index) => (
                <tr key={e.expense_id || index} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-5 font-bold text-blue-700 text-sm">{e.expense_id}</td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                      {e.category_name}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-gray-700 text-sm max-w-xs truncate">{e.description}</td>
                  <td className="px-6 py-5 text-right font-bold text-gray-900 text-sm">${Number(e.amount).toFixed(2)}</td>
                  <td className="px-6 py-5 text-gray-500 text-xs">{new Date(e.expense_date).toLocaleDateString()}</td>
                  <td className="px-6 py-5 text-gray-700 text-sm">{e.created_by}</td>
                  <td className="px-6 py-5 text-gray-400 text-xs">{new Date(e.created_at).toLocaleString()}</td>
                  <td className="px-6 py-5 text-gray-700 text-sm">{e.updated_by || '-'}</td>
                  <td className="px-6 py-5 text-gray-400 text-xs">{e.updated_at ? new Date(e.updated_at).toLocaleString() : '-'}</td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleViewItems(e)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => onEdit(e)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => onDelete(e.expense_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan="10" className="px-6 py-10 text-center text-gray-500 font-medium">
                    No expenses found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Expense Items Modal */}
      {viewingItems && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setViewingItems(null)}></div>
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-gray-100 flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Expense Details #{viewingItems.expense_id}</h3>
                <p className="text-sm text-gray-500">{viewingItems.description}</p>
              </div>
              <button onClick={() => setViewingItems(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loadingItems ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-8 h-8 border-4 border-blue-700/20 border-t-blue-700 rounded-full animate-spin"></div>
                  <p className="mt-2 text-sm text-gray-500 font-medium">Loading items...</p>
                </div>
              ) : expenseItems.length > 0 ? (
                <div className="space-y-4">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="py-2 text-xs font-bold text-gray-400 uppercase">Item Name</th>
                        <th className="py-2 text-xs font-bold text-gray-400 uppercase text-center">Qty</th>
                        <th className="py-2 text-xs font-bold text-gray-400 uppercase text-right">Unit Price</th>
                        <th className="py-2 text-xs font-bold text-gray-400 uppercase text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {expenseItems.map((item, i) => (
                        <tr key={i}>
                          <td className="py-3 text-sm font-medium text-gray-800">{item.item_name}</td>
                          <td className="py-3 text-sm text-gray-600 text-center">{item.quantity}</td>
                          <td className="py-3 text-sm text-gray-600 text-right">${Number(item.unit_price).toFixed(2)}</td>
                          <td className="py-3 text-sm font-bold text-blue-700 text-right">
                            ${(item.quantity * item.unit_price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-100 font-bold">
                        <td colSpan="3" className="py-4 text-right text-gray-900">Total Amount:</td>
                        <td className="py-4 text-right text-blue-700 text-lg">${Number(viewingItems.amount).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 font-medium">No itemized details found for this expense.</p>
                  <p className="text-xs text-gray-400 mt-1">This expense was recorded with a single lump sum amount.</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setViewingItems(null)}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
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
