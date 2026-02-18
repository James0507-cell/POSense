import { NextResponse } from 'next/server';
import { supabase } from '../../dbManager.js';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        
        if (!query) {
            return NextResponse.json({ error: "No query provided" }, { status: 400 });
        }

        const lowerQuery = query.trim().toLowerCase();

        // Basic security: only allow SELECT queries
        if (!lowerQuery.startsWith('select')) {
            return NextResponse.json({ error: "Only SELECT queries are allowed via this endpoint" }, { status: 403 });
        }

        let result;

        // Handle specific queries used in the frontend
        if (lowerQuery.includes('from brands')) {
            const { data, error } = await supabase.from('brands').select('brand_id, name');
            if (error) throw error;
            result = data;
        } else if (lowerQuery.includes('from products')) {
            const { data, error } = await supabase.from('products').select('product_id, name');
            if (error) throw error;
            result = data;
        } else {
            // Fallback for other select queries (might be limited)
            // For a production app, you should create specific endpoints.
            return NextResponse.json({ error: "Query not supported in migration. Please create a specific endpoint." }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Supabase error in db-query route:", error);
        return NextResponse.json({ error: "Database query failed" }, { status: 500 });
    }
}
