import { NextResponse } from 'next/server';
import { supabase } from '../../../dbManager.js';

export async function GET() {
    try {
        console.log("Top Products API: Querying view top_selling_products...");

        const { data, error } = await supabase
            .from('top_selling_products')
            .select('*')
            .limit(5);

        if (error) {
            console.error("Top Products API: Error querying view:", error);
            return NextResponse.json({ error: "Failed to fetch top products from view" }, { status: 500 });
        }

        // Map the view attributes to the format expected by the frontend
        // view attributes: product_id, name, total_amount_sold
        const mappedData = (data || []).map(item => ({
            product_id: item.product_id,
            name: item.name,
            quantity: '-', // View doesn't provide total quantity
            revenue: Number(item.total_amount_sold || 0)
        }));

        return NextResponse.json(mappedData);

    } catch (error) {
        console.error("Top Products API: Critical failure:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
