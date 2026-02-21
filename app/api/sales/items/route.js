import { NextResponse } from 'next/server';
import { supabase } from '../../../dbManager.js';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const saleId = searchParams.get('saleId');
        
        if (!saleId) {
            console.error("GET /api/sales/items: Missing saleId parameter");
            return NextResponse.json({ error: "Sale ID is required" }, { status: 400 });
        }

        const numericSaleId = parseInt(saleId);
        console.log(`Searching for sales items for saleId: ${saleId} (numeric: ${numericSaleId})`);

        // We will try several table and column combinations to find the items
        // as requested by the user: select from sales_items where sale_id = [the id from row]
        
        let items = [];
        let successInfo = "";

        const attempts = [
            { table: 'sales_items', col: 'sale_id', val: numericSaleId },
            { table: 'sales_items', col: 'sales_id', val: numericSaleId },
            { table: 'sales_items', col: 'sale_id', val: saleId }, // as string
            { table: 'sales_item', col: 'sale_id', val: numericSaleId },
            { table: 'sales_item', col: 'sales_id', val: numericSaleId },
            { table: 'sales_items', col: 'id', val: numericSaleId },
            { table: 'sales_items', col: 'sales_items_id', val: numericSaleId }
        ];

        for (const attempt of attempts) {
            try {
                const { data, error } = await supabase
                    .from(attempt.table)
                    .select('*')
                    .eq(attempt.col, attempt.val);

                if (!error && data && data.length > 0) {
                    items = data;
                    successInfo = `Found ${data.length} items in ${attempt.table} using ${attempt.col}=${attempt.val}`;
                    console.log(successInfo);
                    break;
                } else if (error && error.code !== '42P01') { // 42P01 is undefined_table, which is expected for some attempts
                    console.log(`Attempt on ${attempt.table}.${attempt.col} returned error:`, error.message);
                }
            } catch (e) {
                // ignore
            }
        }

        if (items.length === 0) {
            console.warn(`Final check: No items found for saleId ${saleId} in any expected table/column.`);
            return NextResponse.json([]);
        }

        // Fetch product details for the items found
        const productIds = [...new Set(items.map(item => item.product_id || item.productId || item['product id']))];
        console.log(`Fetching products for IDs: ${productIds.join(', ')}`);
        
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('product_id, name, barcode')
            .in('product_id', productIds);

        const productMap = (products || []).reduce((acc, p) => {
            acc[p.product_id] = p;
            return acc;
        }, {});

        // Map everything back to a consistent format for the UI
        const mappedData = items.map(item => {
            const pid = item.product_id || item.productId || item['product id'];
            const product = productMap[pid] || {};
            
            // Extract values using various possible keys
            const quantity = item.quantity ?? item.qty ?? item['quantity'] ?? 0;
            const unit_price = item.unit_price ?? item['unit price'] ?? item.price ?? item['unit_price'] ?? 0;
            const tax_amount = item.tax_amount ?? item['tax amount'] ?? item.tax ?? item['tax_amount'] ?? 0;

            return {
                ...item,
                quantity: Number(quantity),
                unit_price: Number(unit_price),
                tax_amount: Number(tax_amount),
                product_name: product.name || 'Unknown Product',
                product_barcode: product.barcode || 'N/A',
                product_id: pid,
                _debug_source: successInfo
            };
        });

        return NextResponse.json(mappedData);
    } catch (error) {
        console.error("Unexpected error in GET /api/sales/items:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
