'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function SaleForm({ sale = null, products = [], paymentTypes = [], onClose, onSuccess }) {
  const [cart, setCart] = useState([]);
  const [removedItems, setRemovedItems] = useState([]);
  const [paymentType, setPaymentType] = useState(sale?.payment_type || 'Cash');
  const [status, setStatus] = useState(sale?.status || 'Confirmed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  
  const lastScannedRef = useRef({ code: '', time: 0 });

  const getSaleId = (obj) => {
    if (!obj) return null;
    return obj.sale_id || obj.sales_id || obj.id || obj['sales id'];
  };

  const saleId = getSaleId(sale);

  // Fetch items if editing
  useEffect(() => {
    if (saleId) {
      const fetchItems = async () => {
        setIsLoadingItems(true);
        try {
          const response = await fetch(`/api/sales/items?saleId=${saleId}`);
          if (response.ok) {
            const data = await response.json();
            // Map items to cart format
            // Cart quantity shows the ACTIVE quantity (Original - Refunded)
            const activeItems = data.map(item => ({
              sales_item_id: item.sales_item_id,
              product_id: item.product_id,
              name: item.product_name || 'Unknown',
              unit_price: item.unit_price || 0,
              tax_rate: 0.12,
              quantity: item.quantity - item.refunded_quantity, // Current items in hand
              total_bought: item.quantity, // Original total from DB
              tax_amount: item.tax_amount || 0
            }));
            
            // Only load items that aren't fully refunded into the active cart
            setCart(activeItems.filter(item => item.quantity > 0));
          }
        } catch (error) {
          console.error("Error fetching sale items:", error);
        } finally {
          setIsLoadingItems(false);
        }
      };
      fetchItems();
    }
  }, [saleId]);

  // Barcode Scanner Logic
  useEffect(() => {
    let scanner = null;
    if (showScanner) {
      const timer = setTimeout(() => {
        try {
          scanner = new Html5QrcodeScanner("reader", { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          }, false);
          
          scanner.render((decodedText) => {
            const now = Date.now();
            if (decodedText === lastScannedRef.current.code && (now - lastScannedRef.current.time) < 2000) return;
            lastScannedRef.current = { code: decodedText, time: now };

            const product = products.find(p => p.barcode === decodedText);
            if (product) addToCart(product);
          }, () => {});
        } catch (err) {
          console.error("Scanner initialization failed:", err);
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner.clear().catch(e => console.error("Scanner clear failed", e));
        }
      };
    }
  }, [showScanner, products]);

  const addToCart = (product) => {
    if (!product) return;
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.product_id);
      if (existing) {
        return prev.map(item => item.product_id === product.product_id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, {
        product_id: product.product_id,
        name: product.name,
        unit_price: product.selling_price || product.price || 0,
        tax_rate: product.tax_rate || 0.12,
        quantity: 1,
        total_bought: 1 // For new items, total is initial
      }];
    });
    setSearchTerm('');
    setSelectedProductId('');
  };

  const removeFromCart = (pid) => {
    const itemToRemove = cart.find(item => item.product_id === pid);
    if (itemToRemove?.sales_item_id) {
      setRemovedItems(prev => [...prev, itemToRemove]);
    }
    setCart(prev => prev.filter(item => item.product_id !== pid));
  };
  
  const updateQuantity = (pid, delta) => setCart(prev => prev.map(item => {
    if (item.product_id === pid) return { ...item, quantity: Math.max(1, item.quantity + delta) };
    return item;
  }));

  const subtotal = cart.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
  const tax = cart.reduce((acc, item) => acc + (item.unit_price * item.quantity * item.tax_rate), 0);
  const total = subtotal + tax;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Entire sale marked as Refunded if cart empty during edit
    const finalSaleStatus = (saleId && cart.length === 0) ? 'Refunded' : status;
    const employeeId = parseInt(sessionStorage.getItem('employee_id')) || null;

    try {
      const method = saleId ? 'PUT' : 'POST';
      const saleResponse = await fetch('/api/sales', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sales_id: saleId,
          employee_id: employeeId,
          payment_type: paymentType,
          total_amount: saleId ? (sale.total_amount || 0) : total,
          total_tax: saleId ? (sale.total_tax || 0) : tax,
          status: finalSaleStatus,
          updated_by: employeeId
        }),
      });

      if (!saleResponse.ok) {
        const err = await saleResponse.json();
        throw new Error(err.error || "Failed to process sale");
      }

      const result = await saleResponse.json();
      const currentSaleId = saleId || result.id;

      if (currentSaleId) {
        // 1. Process items in the current cart
        for (const item of cart) {
          const currentInCart = item.quantity;
          const previouslyTotal = item.total_bought || 0;
          
          let newTotalQuantity;
          let newRefundedQuantity;

          if (currentInCart > previouslyTotal) {
            // If user INCREASED quantity, we update the main quantity column
            newTotalQuantity = currentInCart;
            newRefundedQuantity = 0; 
          } else {
            // If user DECREASED or kept quantity same, we keep the peak 'quantity' 
            // and set the 'refunded_quantity' difference
            newTotalQuantity = previouslyTotal;
            newRefundedQuantity = previouslyTotal - currentInCart;
          }
          
          const payload = {
            sale_id: currentSaleId,
            product_id: item.product_id,
            quantity: newTotalQuantity, 
            unit_price: item.unit_price,
            tax_amount: item.unit_price * currentInCart * item.tax_rate,
            refunded_quantity: newRefundedQuantity,
            status: newRefundedQuantity === 0 ? 'confirmed' : (newRefundedQuantity < newTotalQuantity ? 'partially_refunded' : 'refunded')
          };

          if (item.sales_item_id) {
            await fetch('/api/sales/items', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...payload, sales_item_id: item.sales_item_id })
            });
          } else {
            await fetch('/api/sales/items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
          }
        }

        // 2. Process items removed from the cart (Full Refund for that item)
        for (const item of removedItems) {
          await fetch('/api/sales/items', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sales_item_id: item.sales_item_id,
              quantity: item.total_bought, // Keep original total
              tax_amount: item.tax_amount, // Preserve original tax amount
              refunded_quantity: item.total_bought, // Mark all as refunded
              status: 'refunded'
            })
          });
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl animate-scale-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-3xl">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">
              {saleId ? `Update Sale #${saleId}` : 'New Sale'}
            </h3>
            <p className="text-sm text-gray-500 font-medium">
              {saleId ? 'Modify transaction items and details' : 'Create a new transaction'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {isLoadingItems ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            <p className="text-gray-500 font-medium">Loading sale items...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col md:flex-row gap-8">
            {/* Left Column: Tools */}
            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Product Selection</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search name or barcode..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-700/10 focus:border-blue-700 outline-none transition-all"
                    />
                    {searchTerm && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 max-h-60 overflow-y-auto">
                        {filteredProducts.map(p => (
                          <button
                            key={p.product_id}
                            onClick={() => addToCart(p)}
                            className="w-full px-5 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-none"
                          >
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                              <p className="text-xs text-gray-400">Barcode: {p.barcode || 'N/A'}</p>
                            </div>
                            <p className="font-bold text-blue-700 text-sm">${(p.selling_price || p.price || 0).toFixed(2)}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setShowScanner(!showScanner)}
                    className={`p-3.5 rounded-2xl border transition-all ${showScanner ? 'bg-red-50 border-red-200 text-red-600' : 'bg-blue-50 border-blue-200 text-blue-700'}`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                  </button>
                </div>
                {showScanner && (
                  <div className="border-2 border-dashed border-gray-200 rounded-3xl p-4 bg-gray-50 overflow-hidden">
                    <div id="reader" style={{ width: '100%', minHeight: '300px' }} className="rounded-2xl"></div>
                  </div>
                )}
              </div>

              <div className={`grid ${saleId ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Payment Method</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all"
                  >
                    {paymentTypes.map((type, idx) => (
                      <option key={type.payment_type_id || idx} value={type.payment_name || type.name}>{type.payment_name || type.name}</option>
                    ))}
                  </select>
                </div>
                {saleId && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Sale Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all"
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Manual Entry</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    const p = products.find(prod => String(prod.product_id) === e.target.value);
                    if (p) addToCart(p);
                  }}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700 transition-all"
                >
                  <option value="">Quick select...</option>
                  {products.map(p => (
                    <option key={p.product_id} value={p.product_id}>{p.name} - ${Number(p.selling_price || 0).toFixed(2)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column: Cart Summary */}
            <div className="flex-1 flex flex-col bg-gray-50 rounded-3xl p-6 space-y-6">
              <h4 className="text-lg font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Cart Items</h4>
              <div className="flex-1 min-h-[300px] space-y-3 overflow-y-auto pr-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                    <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    <p className="text-sm font-medium">{saleId ? "Remove all items to mark as Refunded" : "Cart is empty"}</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.product_id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between animate-fade-in">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">${Number(item.unit_price).toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-gray-50 rounded-xl p-1">
                          <button type="button" onClick={() => updateQuantity(item.product_id, -1)} className="p-1 hover:bg-white rounded-lg transition-colors text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.product_id, 1)} className="p-1 hover:bg-white rounded-lg transition-colors text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                          </button>
                        </div>
                        <button type="button" onClick={() => removeFromCart(item.product_id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-gray-200 pt-6 space-y-3">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tax (12%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                  <span className="text-base font-bold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-blue-700">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={onClose} className="flex-1 px-6 py-4 border border-gray-200 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-100 transition-all">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || (!saleId && cart.length === 0)}
                  className="flex-1 px-6 py-4 bg-blue-700 text-white rounded-2xl text-sm font-bold hover:bg-blue-800 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : (saleId && cart.length === 0 ? 'Confirm Refund' : 'Confirm Sale')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
