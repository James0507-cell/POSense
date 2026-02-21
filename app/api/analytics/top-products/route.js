import { NextResponse } from 'next/server';
import { supabase } from '../../../dbManager.js';

export async function GET() {
    try {
        console.log("Top Products API: Selecting from view_top_products_sold...");

        // Directly query the virtual table (view) you created
        const { data, error } = await supabase
            .from('view_top_products_sold')
            .select('*')
            .limit(5); // Get top 5 as before

        if (error) {
            console.error("Top Products API: Error querying view:", error);
            return NextResponse.json({ error: "Failed to fetch top products from view" }, { status: 500 });
        }

        // Map the view attributes to the format expected by the frontend
        // view attributes: product_id, product_name, total_quantity_sold, total_sales_amount, total_tax_amount
        const mappedData = (data || []).map(item => ({
            product_id: item.product_id,
            name: item.product_name,
            quantity: item.total_quantity_sold,
            revenue: Number(item.total_sales_amount || 0) + Number(item.total_tax_amount || 0)
        }));

        console.log(`Top Products API: Returning ${mappedData.length} products from view.`);
        return NextResponse.json(mappedData);

    } catch (error) {
        console.error("Top Products API: Critical failure:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
