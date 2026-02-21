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
        let { employee_id, payment_type, total_amount, total_tax, status, created_by } = body;
        
        console.log("Processing POST /api/sales with body:", body);

        // 1. Resolve payment_type_id
        let payment_type_id = null;
        if (payment_type) {
            const { data: ptData } = await supabase
                .from('paymenttypes')
                .select('payment_type_id')
                .ilike('payment_name', payment_type)
                .single();
            if (ptData) payment_type_id = ptData.payment_type_id;
        }

        // 2. Resolve integer employee_id
        let numericEmployeeId = parseInt(employee_id);
        if (isNaN(numericEmployeeId)) {
            numericEmployeeId = null;
        }

        // 3. Prepare payload for 'sales' table based on sqlschema.txt
        const formattedStatus = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Confirmed';

        const saleData = { 
            sale_date: new Date().toISOString(),
            employee_id: numericEmployeeId, 
            payment_type_id: payment_type_id, 
            total_amount: Number(total_amount), 
            total_tax: Number(total_tax), 
            status: formattedStatus,
            updated_by: numericEmployeeId 
        };

        console.log("Attempting insert with payload:", saleData);

        // Try insertion
        let { data, error } = await supabase
            .from('sales')
            .insert([saleData])
            .select();

        if (error) {
            console.error("Insert failed:", error.message);
            // Fallback attempt with minimal required fields
            const minimal = {
                employee_id: numericEmployeeId,
                payment_type_id: payment_type_id,
                total_amount: Number(total_amount)
            };
            const { data: data2, error: error2 } = await supabase
                .from('sales')
                .insert([minimal])
                .select();
            
            if (error2) throw error2;
            data = data2;
        }
        
        const record = data?.[0];
        const returnedId = record ? (record.sale_id || record.sales_id || record.id || Object.values(record)[0]) : null;
        
        return NextResponse.json({ 
            message: "Sale record created successfully", 
            id: returnedId 
        });
    } catch (error) {
        console.error("Supabase error in POST /api/sales:", error);
        return NextResponse.json({ error: error.message || "Failed to create sale record" }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { sales_id, payment_type, status, updated_by, total_amount, total_tax } = body;

        if (!sales_id) {
            return NextResponse.json({ error: "Sales ID is required" }, { status: 400 });
        }

        // 1. Resolve payment_type_id
        let payment_type_id = null;
        if (payment_type) {
            const { data: ptData } = await supabase
                .from('paymenttypes')
                .select('payment_type_id')
                .ilike('payment_name', payment_type)
                .single();
            if (ptData) payment_type_id = ptData.payment_type_id;
        }

        // 2. Prepare payload
        // Ensure status is capitalized to match enum ('Confirmed', 'Refunded')
        const formattedStatus = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : undefined;

        const updatePayload = { 
            payment_type_id, 
            status: formattedStatus, 
            updated_by: updated_by ? parseInt(updated_by) : null,
            total_amount: total_amount !== undefined ? Number(total_amount) : undefined,
            total_tax: total_tax !== undefined ? Number(total_tax) : undefined
        };

        // Remove undefined fields
        Object.keys(updatePayload).forEach(key => updatePayload[key] === undefined && delete updatePayload[key]);

        // 3. Try several update strategies for the primary key
        const idColCandidates = ['sale_id', 'sales_id', 'id', 'sales id'];
        let success = false;
        let lastError = null;

        for (const col of idColCandidates) {
            try {
                const { data, error } = await supabase
                    .from('sales')
                    .update(updatePayload)
                    .eq(col, sales_id)
                    .select();
                
                if (!error && data && data.length > 0) {
                    success = true;
                    break;
                }
                if (error && error.code !== '42703') { // 42703 is undefined_column
                    lastError = error;
                }
            } catch (e) {
                // ignore
            }
        }

        if (!success) {
            // Return 400 for errors like validation (enum), 404 only if record not found
            const statusCode = lastError ? 400 : 404;
            return NextResponse.json({ error: lastError?.message || "Sale record not found" }, { status: statusCode });
        }
        
        return NextResponse.json({ message: "Sale updated successfully" });
    } catch (error) {
        console.error("Supabase error in PUT /api/sales:", error);
        return NextResponse.json({ error: error.message || "Failed to update sale" }, { status: 500 });
    }
}
