import { NextResponse } from 'next/server';
import { supabase } from '../../dbManager.js';

export async function POST(request) {
    try {
        const { username, passwordHash } = await request.json();
        
        // Fetch credential with associated employee details
        const { data: credentials, error } = await supabase
            .from('employee_credentials')
            .select(`
                credential_id,
                employee_id,
                employees:employees!employee_credentials_employee_id_fkey(first_name, last_name, email)
            `)
            .eq('username', username)
            .eq('password_hash', passwordHash);

        if (error) throw error;
        
        if (!credentials || credentials.length === 0) {
            return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
        }
        
        // Map data to match the expected format
        const employees = credentials.map(ec => ({
            credential_id: ec.credential_id,
            employee_id: ec.employee_id,
            first_name: ec.employees?.first_name,
            last_name: ec.employees?.last_name,
            email: ec.employees?.email
        }));
        
        return NextResponse.json(employees);
    } catch (error) {
        console.error("Supabase login error:", error);
        return NextResponse.json(
            { error: "Failed to authenticate employee" },
            { status: 500 }
        );
    }
}
