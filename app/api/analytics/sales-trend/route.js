import { NextResponse } from 'next/server';
import { supabase } from '../../../dbManager.js';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '7');

        const startDate = new Date();
        startDate.setUTCDate(startDate.getUTCDate() - days + 1);
        startDate.setUTCHours(0, 0, 0, 0);

        const { data, error } = await supabase
            .from('confirmed_sales')
            .select('sale_date, amount_paid')
            .gte('sale_date', startDate.toISOString())
            .order('sale_date', { ascending: true });

        if (error) {
            console.error("Supabase error fetching confirmed_sales:", error);
            return NextResponse.json({ error: "Failed to fetch sales trend data" }, { status: 500 });
        }

        // Aggregate data by day (using UTC for consistency)
        const dailyData = {};
        for (let i = 0; i < days; i++) {
            const d = new Date(startDate);
            d.setUTCDate(startDate.getUTCDate() + i);
            dailyData[d.toISOString().split('T')[0]] = 0; // Use YYYY-MM-DD for key
        }

        (data || []).forEach(sale => {
            const saleDate = new Date(sale.sale_date).toISOString().split('T')[0]; // Use YYYY-MM-DD for key
            if (dailyData.hasOwnProperty(saleDate)) {
                dailyData[saleDate] += (sale.amount_paid || 0);
            }
        });

        // Prepare labels and data for the chart
        const labels = Object.keys(dailyData).map(dateStr => new Date(dateStr + 'T00:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        const chartData = Object.values(dailyData);

        return NextResponse.json({ labels, data: chartData });

    } catch (error) {
        console.error("API error in GET /api/analytics/sales-trend:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
