import { NextResponse } from 'next/server';
import { supabase } from '../../dbManager.js';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('refunds')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data || []);
    } catch (error) {
        console.error("Supabase error in GET /api/refunds:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { sale_id, refund_type, total_refund_amount, processed_by, approved_by } = body;

        const { data, error } = await supabase
            .from('refunds')
            .insert([{
                sale_id: parseInt(sale_id),
                refund_type,
                total_refund_amount: parseFloat(total_refund_amount),
                processed_by: parseInt(processed_by),
                approved_by: approved_by ? parseInt(approved_by) : null
            }])
            .select();

        if (error) throw error;
        return NextResponse.json(data[0]);
    } catch (error) {
        console.error("Supabase error in POST /api/refunds:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
