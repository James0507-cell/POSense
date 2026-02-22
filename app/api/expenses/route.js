import { NextResponse } from 'next/server';
import { supabase } from '../../dbManager.js';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('expenses')
            .select(`
                *,
                category:expense_categories(category_name)
            `)
            .order('expense_date', { ascending: false });

        if (error) throw error;

        const expenses = data.map(e => ({
            ...e,
            category_name: e.category?.category_name || 'Uncategorized'
        }));

        return NextResponse.json(expenses);
    } catch (error) {
        console.error("Supabase error in GET /api/expenses:", error);
        return NextResponse.json(
            { error: "Failed to fetch expenses" },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { category_id, description, amount, expense_date, created_by, items } = body;
        
        const { data: expenseData, error: expenseError } = await supabase
            .from('expenses')
            .insert([
                { 
                    category_id, 
                    description, 
                    amount: Number(amount), 
                    expense_date: expense_date || new Date().toISOString(), 
                    created_by,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ])
            .select('expense_id')
            .single();

        if (expenseError) throw expenseError;

        const expense_id = expenseData.expense_id;

        if (items && items.length > 0) {
            const itemsToInsert = items.map(item => ({
                expense_id,
                item_name: item.item_name,
                quantity: Number(item.quantity) || 1,
                unit_price: Number(item.unit_price) || 0,
            }));

            const { error: itemsError } = await supabase
                .from('expense_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;
        }
        
        return NextResponse.json({ 
            message: "Expense created successfully", 
            id: expense_id 
        });
    } catch (error) {
        console.error("Supabase error in POST /api/expenses:", error);
        return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { expense_id, category_id, description, amount, expense_date, updated_by, items } = body;

        const { error: expenseError } = await supabase
            .from('expenses')
            .update({ 
                category_id, 
                description, 
                amount: Number(amount), 
                expense_date, 
                updated_by, 
                updated_at: new Date().toISOString() 
            })
            .eq('expense_id', expense_id);

        if (expenseError) throw expenseError;

        if (items) {
            // Simple approach: delete existing items and insert new ones
            const { error: deleteError } = await supabase
                .from('expense_items')
                .delete()
                .eq('expense_id', expense_id);

            if (deleteError) throw deleteError;

            if (items.length > 0) {
                const itemsToInsert = items.map(item => ({
                    expense_id,
                    item_name: item.item_name,
                    quantity: Number(item.quantity) || 1,
                    unit_price: Number(item.unit_price) || 0,
                }));

                const { error: insertError } = await supabase
                    .from('expense_items')
                    .insert(itemsToInsert);

                if (insertError) throw insertError;
            }
        }
        
        return NextResponse.json({ message: "Expense updated successfully" });
    } catch (error) {
        console.error("Supabase error in PUT /api/expenses:", error);
        return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) throw new Error("Expense ID is required");

        // First delete expense items
        const { error: itemsError } = await supabase
            .from('expense_items')
            .delete()
            .eq('expense_id', id);

        if (itemsError) throw itemsError;

        // Then delete the expense
        const { error: expenseError } = await supabase
            .from('expenses')
            .delete()
            .eq('expense_id', id);

        if (expenseError) throw expenseError;

        return NextResponse.json({ message: "Expense deleted successfully" });
    } catch (error) {
        console.error("Supabase error in DELETE /api/expenses:", error);
        return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
    }
}
