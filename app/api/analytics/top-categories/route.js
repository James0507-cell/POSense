import { NextResponse } from 'next/server';
import { supabase } from '../../../dbManager.js';

export async function GET() {
    try {
        console.log("Top Categories API: Querying view top_selling_categories...");

        const { data, error } = await supabase
            .from('top_selling_categories')
            .select('*')
            .limit(5);

        if (error) {
            console.error("Top Categories API: Error querying view:", error);
            return NextResponse.json({ error: "Failed to fetch top categories" }, { status: 500 });
        }

        const mappedData = (data || []).map(cat => ({
            name: cat.category || 'Unspecified',
            quantity: Number(cat.total_quantity_sold || 0),
            revenue: Number(cat.total_amount_sold || 0)
        }));

        // Calculate actual percentages relative to total shown (based on Revenue)
        const displayTotalRevenue = mappedData.reduce((sum, item) => sum + item.revenue, 0);
        const finalData = mappedData.map(item => ({
            ...item,
            percentage: displayTotalRevenue > 0 ? Math.round((item.revenue / displayTotalRevenue) * 100) : 0
        }));

        return NextResponse.json(finalData);

    } catch (error) {
        console.error("Top Categories API: Critical failure:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
