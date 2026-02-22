import { NextResponse } from 'next/server';
import { supabase } from '../../../dbManager.js';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const limit = parseInt(searchParams.get('limit') || '100');

        // We assume 'confirmed_sales' view exists and has sale_id, sale_date, amount_paid
        let query = supabase
            .from('confirmed_sales')
            .select('sale_id, sale_date, amount_paid')
            .order('sale_date', { ascending: false })
            .limit(limit);

        const { data, error } = await query;

        if (error) {
            console.error("Supabase error in GET /api/sales/confirmed:", error);
            // Fallback if confirmed_sales doesn't exist? No, the user said it's there.
            return NextResponse.json({ error: "Failed to fetch confirmed sales" }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error("Supabase error in GET /api/sales/confirmed:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
