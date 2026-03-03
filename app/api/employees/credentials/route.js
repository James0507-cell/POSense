import { NextResponse } from 'next/server';
import { supabase } from '../../../dbManager.js';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');

        if (!employeeId) {
            return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('employee_credentials')
            .select('credential_id, employee_id, username, password_hash, last_login')
            .eq('employee_id', employeeId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows found
        return NextResponse.json(data || {});
    } catch (error) {
        console.error("GET Credentials error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { employee_id, username, password, updated_by } = body;

        const updates = {
            username,
            updated_by
        };
        
        if (password) {
            updates.password_hash = password;
        }

        const { data, error } = await supabase
            .from('employee_credentials')
            .update(updates)
            .eq('employee_id', employee_id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error("PUT Credentials error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
