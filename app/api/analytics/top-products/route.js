import { NextResponse } from 'next/server';
import { supabase } from '../../../dbManager.js';

export async function GET() {
    try {
        console.log("Top Products API: Calculating from base tables excluding refunded sales...");

        // Fetch top 5 selling products by quantity, excluding 'Refunded' sales
        const { data, error } = await supabase
            .from('sales_items')
            .select(`
                product_id,
                quantity,
                refunded_quantity,
                unit_price,
                tax_amount,
                products ( name ),
                sales!inner ( status )
            `)
            .neq('sales.status', 'Refunded')
            .limit(100); // Get enough to aggregate

        if (error) {
            console.error("Top Products API: Error fetching data:", error);
            return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
        }

        // Aggregate by product
        const aggregation = (data || []).reduce((acc, item) => {
            const pid = item.product_id;
            const productName = item.products?.name || 'Unknown Product';
            const activeQty = (item.quantity || 0) - (item.refunded_quantity || 0);
            
            // Skip if no quantity was actually sold (or all refunded)
            if (activeQty <= 0) return acc;

            if (!acc[pid]) {
                acc[pid] = {
                    product_id: pid,
                    name: productName,
                    quantity: 0,
                    revenue: 0
                };
            }
            
            acc[pid].quantity += activeQty;
            acc[pid].revenue += (activeQty * (item.unit_price || 0)) + (item.tax_amount || 0);
            
            return acc;
        }, {});

        // Convert to array, sort by quantity desc, and limit to 5
        const mappedData = Object.values(aggregation)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        console.log(`Top Products API: Returning ${mappedData.length} products.`);
        return NextResponse.json(mappedData);

    } catch (error) {
        console.error("Top Products API: Critical failure:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
