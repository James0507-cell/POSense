import { NextResponse } from 'next/server';
import { supabase } from '../../dbManager.js';

export async function GET() {
    try {
        // Attempt to fetch from sales table
        // We assume the table has columns: sales_id, sale_date, employee_id, payment_type, total_amount, total_tax, status, updated_by
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .order('sale_date', { ascending: false });

        if (error) {
            // If table doesn't exist or other error, return empty array for now
            console.warn("Supabase warning/error in GET /api/sales:", error.message);
            return NextResponse.json([]);
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error("Supabase error in GET /api/sales:", error);
        // Return empty array instead of 500 to keep UI functional during development
        return NextResponse.json([]);
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { employee_id, payment_type, total_amount, total_tax, status, created_by } = body;
        
        const { data, error } = await supabase
            .from('sales')
            .insert([
                { 
                    sale_date: new Date().toISOString(),
                    employee_id, 
                    payment_type, 
                    total_amount: Number(total_amount), 
                    total_tax: Number(total_tax), 
                    status: status || 'Completed',
                    created_by,
                    updated_by: created_by
                }
            ])
            .select('sales_id');

        if (error) throw error;
        
        return NextResponse.json({ 
            message: "Sale record created successfully", 
            id: data[0].sales_id 
        });
    } catch (error) {
        console.error("Supabase error in POST /api/sales:", error);
        return NextResponse.json({ error: "Failed to create sale record" }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { sales_id, payment_type, status, updated_by } = body;

        if (!sales_id) {
            return NextResponse.json({ error: "Sales ID is required" }, { status: 400 });
        }

        // Try updating by sales_id or id
        const { data, error } = await supabase
            .from('sales')
            .update({ 
                payment_type, 
                status, 
                updated_by, 
                last_updated: new Date().toISOString() 
            })
            .or(`sales_id.eq.${sales_id},id.eq.${sales_id}`)
            .select();

        if (error) {
            // Fallback if 'or' query fails on some configurations
            const { data: data2, error: error2 } = await supabase
                .from('sales')
                .update({ 
                    payment_type, 
                    status, 
                    updated_by, 
                    last_updated: new Date().toISOString() 
                })
                .eq('sales_id', sales_id)
                .select();
            
            if (error2) throw error2;
        }
        
        return NextResponse.json({ message: "Sale updated successfully" });
    } catch (error) {
        console.error("Supabase error in PUT /api/sales:", error);
        return NextResponse.json({ error: "Failed to update sale" }, { status: 500 });
    }
}
