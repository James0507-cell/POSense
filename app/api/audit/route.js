import { NextResponse } from 'next/server';
import { supabase } from '../../dbManager.js';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        
        const id = searchParams.get('id');
        if (id) {
            const { data, error } = await supabase
                .from('v_audit_activity')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return NextResponse.json(data);
        }

        const limit = parseInt(searchParams.get('limit')) || 50;
        const offset = parseInt(searchParams.get('offset')) || 0;
        const searchTerm = searchParams.get('search');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const actionType = searchParams.get('actionType');

        let query = supabase
            .from('v_audit_activity')
            .select('id, table_name, record_id, action_type, actor_name, changed_at', { count: 'exact' });

        if (searchTerm) {
            query = query.or(`actor_name.ilike.%${searchTerm}%,table_name.ilike.%${searchTerm}%,record_id.ilike.%${searchTerm}%`);
        }
        if (dateFrom) {
            query = query.gte('changed_at', `${dateFrom}T00:00:00`);
        }
        if (dateTo) {
            query = query.lte('changed_at', `${dateTo}T23:59:59`);
        }
        if (actionType && actionType !== 'all') {
            query = query.eq('action_type', actionType);
        }

        const { data, error, count } = await query
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
