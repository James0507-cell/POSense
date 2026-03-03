'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SalesHistory from '../sales/components/SalesHistory';

function SalesRecordsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const viewParam = searchParams.get('view');

  const [salesData, setSalesData] = useState([]);
  const [refundsData, setRefundsData] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to map payment IDs to Names
  const enrichSalesData = (sales, types) => {
    return sales.map(sale => {
      const ptId = sale.payment_type_id || sale.payment_type;
      if (ptId !== undefined && ptId !== null) {
        const match = types.find(t => 
          String(t.payment_type_id) === String(ptId) || 
          String(t.id) === String(ptId)
        );
        if (match) {
          return { ...sale, payment_type: match.payment_name || match.name };
        }
      }
      return sale;
    });
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [salesRes, refundsRes, typesRes, productsRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/refunds'),
        fetch('/api/payment-types'),
        fetch('/api/products')
      ]);

      if (salesRes.ok && refundsRes.ok && typesRes.ok && productsRes.ok) {
        const sales = await salesRes.json();
        const refunds = await refundsRes.json();
        const types = await typesRes.json();
        const productData = await productsRes.json();
        
        setPaymentTypes(types);
        setProducts(productData);
        setRefundsData(refunds);
        setSalesData(enrichSalesData(sales, types));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="p-10 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Sales & Refund Records</h1>
          <p className="text-gray-500 font-medium mt-1">Manage and track all transaction history and refund claims</p>
        </div>
      </div>

      <div className="min-h-[600px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            <span className="ml-4 text-gray-500 font-medium">Loading records...</span>
          </div>
        ) : (
          <SalesHistory 
            salesData={salesData} 
            refundsData={refundsData}
            products={products}
            paymentTypes={paymentTypes}
            onUpdate={fetchAllData}
            onNewSale={() => router.push('/sales?tab=standard')}
            initialView={viewParam}
            hideMetrics={true}
          />
        )}
      </div>
    </div>
  );
}

export default function SalesRecordsPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <SalesRecordsContent />
    </Suspense>
  );
}
