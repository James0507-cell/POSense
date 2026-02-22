import { NextResponse } from 'next/server';
import { supabase } from '../../../dbManager.js';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const refundId = searchParams.get('refundId');
        
        if (!refundId) {
            return NextResponse.json({ error: "Refund ID is required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('refund_items')
            .select(`
                *,
                sales_items:sale_item_id (
                    product_id,
                    products:product_id ( name, barcode )
                )
            `)
            .eq('refund_id', parseInt(refundId));

        if (error) throw error;

        const mappedData = data.map(item => ({
            ...item,
            product_name: item.sales_items?.products?.name || 'N/A',
            product_barcode: item.sales_items?.products?.barcode || 'N/A',
            product_id: item.sales_items?.product_id
        }));

        return NextResponse.json(mappedData);
    } catch (error) {
        console.error("Supabase error in GET /api/refunds/items:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { refund_id, items } = body;

        if (!refund_id || !items || !Array.isArray(items)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const payload = items.map(item => ({
            refund_id: parseInt(refund_id),
            sale_item_id: parseInt(item.sale_item_id),
            quantity_refunded: parseInt(item.quantity_refunded),
            price_per_unit: parseFloat(item.price_per_unit),
            subtotal: parseFloat(item.subtotal)
        }));

        const { error } = await supabase.from('refund_items').insert(payload);
        if (error) throw error;

        return NextResponse.json({ message: "Refund items recorded successfully" });
    } catch (error) {
        console.error("Supabase error in POST /api/refunds/items:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
