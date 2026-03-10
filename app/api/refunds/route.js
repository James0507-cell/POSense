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
        const { sale_id, refund_type, total_refund_amount, processed_by, items } = body;

        // If items are provided, we should do an atomic operation
        // Since Supabase JS client doesn't support multi-table transactions easily in one call,
        // we can use a stored procedure (RPC) or just handle the error carefully.
        // For now, let's keep it robust by checking if items are present.
        
        const { data: refundData, error: refundError } = await supabase
            .from('refunds')
            .insert([{
                sale_id: parseInt(sale_id),
                refund_type,
                total_refund_amount: parseFloat(total_refund_amount),
                processed_by: parseInt(processed_by)
            }])
            .select();

        if (refundError) throw refundError;
        const newRefund = refundData[0];

        // If items were passed in the same request, insert them now
        if (items && Array.isArray(items) && items.length > 0) {
            const itemsPayload = items.map(item => ({
                refund_id: newRefund.refund_id,
                sale_item_id: parseInt(item.sale_item_id),
                quantity_refunded: parseInt(item.quantity_refunded),
                price_per_unit: parseFloat(item.price_per_unit),
                subtotal: parseFloat(item.subtotal)
            }));

            const { error: itemsError } = await supabase
                .from('refund_items')
                .insert(itemsPayload);

            if (itemsError) {
                // If items fail, we should ideally delete the refund record to keep it atomic
                await supabase.from('refunds').delete().eq('refund_id', newRefund.refund_id);
                throw itemsError;
            }
        }

        return NextResponse.json(newRefund);
    } catch (error) {
        console.error("Supabase error in POST /api/refunds:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
