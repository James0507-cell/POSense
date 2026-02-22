import { NextResponse } from 'next/server';
import { supabase } from '../../../dbManager.js';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const expense_id = searchParams.get('expense_id');
        
        if (!expense_id) {
            return NextResponse.json({ error: "Expense ID is required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('expense_items')
            .select('*')
            .eq('expense_id', expense_id);

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Supabase error in GET /api/expenses/items:", error);
        return NextResponse.json(
            { error: "Failed to fetch expense items" },
            { status: 500 }
        );
    }
}
