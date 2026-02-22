import { NextResponse } from 'next/server';
import { supabase } from '../../../dbManager.js';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '30'; // Default to last 30 days
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(range));
        startDate.setHours(0, 0, 0, 0);

        // Fetch income (confirmed sales)
        const { data: sales, error: salesError } = await supabase
            .from('confirmed_sales')
            .select('sale_date, amount_paid')
            .gte('sale_date', startDate.toISOString());

        if (salesError) throw salesError;

        // Fetch expenses
        const { data: expenses, error: expensesError } = await supabase
            .from('expenses')
            .select('expense_date, amount')
            .gte('expense_date', startDate.toISOString());

        if (expensesError) throw expensesError;

        // Grouping logic (frontend will use this for different time scales)
        return NextResponse.json({
            sales: sales || [],
            expenses: expenses || []
        });

    } catch (error) {
        console.error("API error in GET /api/analytics/cashflow:", error);
        return NextResponse.json({ error: "Failed to fetch cashflow data" }, { status: 500 });
    }
}
