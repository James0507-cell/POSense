import { NextResponse } from 'next/server';
import { supabase } from '../../../dbManager.js';

export async function GET() {
    try {
        console.log("Top Categories API: Calculating from base tables excluding refunded sales...");

        // Fetch top 5 selling categories by quantity, excluding 'Refunded' sales
        const { data, error } = await supabase
            .from('sales_items')
            .select(`
                quantity,
                refunded_quantity,
                unit_price,
                tax_amount,
                products ( category ),
                sales!inner ( status )
            `)
            .neq('sales.status', 'Refunded')
            .limit(100); // Get enough to aggregate

        if (error) {
            console.error("Top Categories API: Error fetching data:", error);
            return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
        }

        // Aggregate by category
        const aggregation = (data || []).reduce((acc, item) => {
            const catName = item.products?.category || 'Uncategorized';
            const activeQty = (item.quantity || 0) - (item.refunded_quantity || 0);
            
            // Skip if no quantity was actually sold (or all refunded)
            if (activeQty <= 0) return acc;

            if (!acc[catName]) {
                acc[catName] = {
                    name: catName,
                    quantity: 0,
                    revenue: 0
                };
            }
            
            acc[catName].quantity += activeQty;
            acc[catName].revenue += (activeQty * (item.unit_price || 0)) + (item.tax_amount || 0);
            
            return acc;
        }, {});

        // Convert to array and sort by quantity desc
        const mappedData = Object.values(aggregation)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        // Calculate actual percentages relative to total shown
        const displayTotal = mappedData.reduce((sum, item) => sum + item.quantity, 0);
        const finalData = mappedData.map(item => ({
            ...item,
            percentage: displayTotal > 0 ? Math.round((item.quantity / displayTotal) * 100) : 0
        }));

        return NextResponse.json(finalData);

    } catch (error) {
        console.error("Top Categories API: Critical failure:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
