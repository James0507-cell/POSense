'use client';

import React, { useState, useMemo } from 'react';

export default function KioskOrderForm({ products, onAddToCart }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Group products by category and then by brand
  const categorizedProducts = useMemo(() => {
    const groups = {};
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = {};
      
      const brand = p.brand || 'No Brand';
      if (!groups[cat][brand]) groups[cat][brand] = [];
      
      groups[cat][brand].push(p);
    });
    return groups;
  }, [products]);

  const categories = ['All', ...Object.keys(categorizedProducts).sort()];

  const displayedProducts = useMemo(() => {
    if (selectedCategory === 'All') return categorizedProducts;
    return { [selectedCategory]: categorizedProducts[selectedCategory] };
  }, [categorizedProducts, selectedCategory]);

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat 
                ? 'bg-blue-700 text-white shadow-lg shadow-blue-100' 
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-8 min-h-[400px]">
        {Object.entries(displayedProducts).map(([category, brands]) => (
          <div key={category} className="space-y-4">
            <h4 className="text-lg font-bold text-gray-900 border-l-4 border-blue-700 pl-3">
              {category}
            </h4>
            
            {Object.entries(brands).map(([brand, items]) => (
              <div key={brand} className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">{brand}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map(product => (
                    <button
                      key={product.product_id}
                      onClick={() => onAddToCart(product)}
                      className="group bg-white p-3 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50/50 transition-all text-left flex flex-col h-full"
                    >
                      <div className="aspect-square w-full mb-3 rounded-xl overflow-hidden bg-gray-50 relative">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold text-blue-700 shadow-sm border border-blue-50">
                          ${Number(product.selling_price || 0).toFixed(2)}
                        </div>
                      </div>
                      <h5 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-blue-700 transition-colors">{product.name}</h5>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{product.barcode || 'No SKU'}</p>
                      
                      <div className="mt-auto pt-3 flex items-center justify-end">
                         <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg group-hover:bg-blue-700 group-hover:text-white transition-all">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                           </svg>
                         </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
