import { NextResponse } from 'next/server';
import { supabase } from '../../dbManager.js';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('paymenttypes')
            .select('*')
            .order('payment_name', { ascending: true });

        if (error) throw error;
        return NextResponse.json(data || []);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { payment_name, description, status } = body;
        const { data, error } = await supabase
            .from('paymenttypes')
            .insert([{ payment_name, description, status: status || 'Active' }])
            .select();

        if (error) throw error;
        return NextResponse.json(data[0]);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { payment_type_id, payment_name, description, status } = body;
        const { data, error } = await supabase
            .from('paymenttypes')
            .update({ payment_name, description, status })
            .eq('payment_type_id', payment_type_id)
            .select();

        if (error) throw error;
        return NextResponse.json(data[0]);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const { error } = await supabase
            .from('paymenttypes')
            .delete()
            .eq('payment_type_id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
