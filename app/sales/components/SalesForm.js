'use client';

import React, { useState } from 'react';

export default function SalesForm({ sale, paymentTypes = [], onClose, onSuccess }) {
  const [paymentType, setPaymentType] = useState(sale?.payment_type || 'Cash');
  const [status, setStatus] = useState(sale?.status || 'Confirmed');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const saleId = sale['sales id'] || sale.sales_id || sale.id;

    try {
      const response = await fetch('/api/sales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sales_id: saleId,
          payment_type: paymentType,
          status: status,
          updated_by: sessionStorage.getItem('first_name') + ' ' + sessionStorage.getItem('last_name') || 'Admin'
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update sale");
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("An error occurred while updating the sale");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">
            Update Sale #{sale['sales id'] || sale.sales_id || sale.id}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Payment Type</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all cursor-pointer"
            >
              {paymentTypes.length > 0 ? (
                paymentTypes.map((type, idx) => {
                  const val = type.payment_name || type.name || type.type || 'Unknown';
                  const id = type.payment_type_id || type.id || idx;
                  return (
                    <option key={id} value={val}>
                      {val}
                    </option>
                  );
                })
              ) : (
                <option value={paymentType}>{paymentType}</option>
              )}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all cursor-pointer"
            >
              <option value="Confirmed">Confirmed</option>
              <option value="Refunded">Refunded</option>
            </select>
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
              disabled={isSubmitting}
              className="flex-1 px-6 py-3.5 bg-blue-700 text-white rounded-2xl text-sm font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
