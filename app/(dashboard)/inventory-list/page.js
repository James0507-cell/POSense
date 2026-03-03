'use client';

import React, { useState, useEffect, Suspense } from 'react';
import InventoryStatus from '../inventory/components/InventoryStatus';
import InventoryForm from '../inventory/components/InventoryForm';

function InventoryListContent() {
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setInventoryData(data);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  return (
    <div className="p-10 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-[family-name:var(--font-outfit)]">Stock Inventory List</h1>
        <p className="text-gray-500 font-medium mt-1">View and adjust current stock levels across all locations</p>
      </div>

      <div className="min-h-[600px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            <span className="ml-4 text-gray-500 font-medium">Loading inventory...</span>
          </div>
        ) : (
          <InventoryStatus 
            inventoryData={inventoryData} 
            hideMetrics={true}
            hideActions={true} 
            onEdit={handleEdit}
            onAdd={handleAddNew}
            onDelete={fetchInventory}
          />
        )}
      </div>

      {/* Inventory Form Modal */}
      {isFormOpen && (
        <InventoryForm 
          item={editingItem} 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={fetchInventory} 
        />
      )}
    </div>
  );
}

export default function InventoryListPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <InventoryListContent />
    </Suspense>
  );
}
