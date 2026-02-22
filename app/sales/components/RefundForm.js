'use client';

import React, { useState } from 'react';

export default function RefundForm({ sale, items, onClose, onSuccess }) {
  const [refundQuantities, setRefundQuantities] = useState(
    items.reduce((acc, item) => ({ ...acc, [item.sales_item_id]: 0 }), {})
  );
  const [refundType, setRefundType] = useState('partial');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuantityChange = (itemId, val, max) => {
    const q = Math.min(Math.max(0, parseInt(val) || 0), max);
    setRefundQuantities(prev => ({ ...prev, [itemId]: q }));
  };

  const totalRefundAmount = items.reduce((acc, item) => {
    const qty = refundQuantities[item.sales_item_id] || 0;
    return acc + (qty * (item.unit_price || 0));
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalRefundAmount <= 0) {
      alert("Please select at least one item to refund.");
      return;
    }

    // Determine if this is a full or partial refund
    // It's a full refund if (already refunded + current refund) == original total for all items in the sale
    const isFull = items.every(item => 
      (item.already_refunded_quantity || 0) + (refundQuantities[item.sales_item_id] || 0) === item.quantity
    );
    const calculatedRefundType = isFull ? 'full' : 'partial';

    setIsSubmitting(true);
    const employeeId = parseInt(sessionStorage.getItem('employee_id')) || 1;

    try {
      // 1. Create Refund Record
      const refundRes = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale_id: sale.sale_id || sale.sales_id || sale.id,
          refund_type: calculatedRefundType,
          total_refund_amount: totalRefundAmount,
          processed_by: employeeId,
        }),
      });

      if (!refundRes.ok) throw new Error("Failed to create refund record");
      const refundRecord = await refundRes.json();

      // 2. Create Refund Items
      const refundItemsPayload = items
        .filter(item => refundQuantities[item.sales_item_id] > 0)
        .map(item => ({
          sale_item_id: item.sales_item_id,
          quantity_refunded: refundQuantities[item.sales_item_id],
          price_per_unit: item.unit_price,
          subtotal: refundQuantities[item.sales_item_id] * item.unit_price
        }));

      const itemsRes = await fetch('/api/refunds/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refund_id: refundRecord.refund_id,
          items: refundItemsPayload
        }),
      });

      if (!itemsRes.ok) throw new Error("Failed to record refunded items");

      alert("Refund processed successfully!");
      onSuccess();
    } catch (error) {
      console.error("Refund error:", error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl animate-scale-up flex flex-col max-h-[85vh]">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Process Refund</h3>
            <p className="text-sm text-gray-500">Select items and quantities to return</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => {
                setRefundType('full');
                const fullQs = {};
                items.forEach(item => {
                  const maxRefundable = (item.quantity || 0) - (item.already_refunded_quantity || 0);
                  fullQs[item.sales_item_id] = Math.max(0, maxRefundable);
                });
                setRefundQuantities(fullQs);
              }}
              className={`flex-1 py-3 px-4 rounded-2xl border-2 transition-all font-bold text-sm ${refundType === 'full' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
            >
              Full Refund (Remaining)
            </button>
            <button 
              type="button"
              onClick={() => setRefundType('partial')}
              className={`flex-1 py-3 px-4 rounded-2xl border-2 transition-all font-bold text-sm ${refundType === 'partial' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
            >
              Partial Refund
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Select Quantities</h4>
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Purchased</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Refunded</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Available</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">To Refund</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map(item => {
                    const maxRefundable = (item.quantity || 0) - (item.already_refunded_quantity || 0);
                    return (
                      <tr key={item.sales_item_id}>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                          <p className="text-xs text-gray-400">${item.unit_price.toFixed(2)} each</p>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-gray-700">{item.quantity}</td>
                        <td className="px-6 py-4 text-center text-red-500 font-bold">{item.already_refunded_quantity || 0}</td>
                        <td className="px-6 py-4 text-center text-green-600 font-bold">{maxRefundable}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <input 
                              type="number"
                              value={refundQuantities[item.sales_item_id]}
                              onChange={(e) => handleQuantityChange(item.sales_item_id, e.target.value, maxRefundable)}
                              disabled={maxRefundable <= 0}
                              className="w-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-center font-bold text-sm focus:ring-2 focus:ring-blue-700/10 outline-none disabled:opacity-50"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-blue-700">
                          ${((refundQuantities[item.sales_item_id] || 0) * item.unit_price).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </form>

        <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Refund Amount</p>
            <p className="text-3xl font-bold text-red-600">-${totalRefundAmount.toFixed(2)}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="px-8 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">Cancel</button>
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting || totalRefundAmount <= 0}
              className="px-10 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Refund'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
