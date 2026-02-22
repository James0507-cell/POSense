import { NextResponse } from 'next/server';
import { supabase } from '../../dbManager.js';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('expense_categories')
            .select('*')
            .order('category_name', { ascending: true });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Supabase error in GET /api/expense-categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch expense categories" },
            { status: 500 }
        );
    }
}
