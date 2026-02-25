import { NextResponse } from 'next/server';
import { supabase } from '../../dbManager.js';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit')) || 50;
        const offset = parseInt(searchParams.get('offset')) || 0;

        const { data, error, count } = await supabase
            .from('v_audit_activity')
            .select('*', { count: 'exact' })
            .order('changed_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return NextResponse.json({
            data: data || [],
            count: count || 0
        });
    } catch (error) {
        console.error("Supabase error in GET /api/audit:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
