import { NextResponse } from 'next/server';
import { supabase } from '../../dbManager.js';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const includeAdmin = searchParams.get('includeAdmin') === 'true';

        let query = supabase
            .from('employees')
            .select('*');

        if (!includeAdmin) {
            query = query.or('role.neq.Admin,role.is.null');
        }

        const { data, error } = await query.order('last_name', { ascending: true });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error("GET Employees error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { employee, credentials } = await request.json();
        
        // 1. Create Employee
        const { data: newEmployee, error: empError } = await supabase
            .from('employees')
            .insert([{
                first_name: employee.first_name,
                middle_name: employee.middle_name,
                last_name: employee.last_name,
                email: employee.email,
                contact_number: employee.contact_number,
                hire_date: employee.hire_date || new Date().toISOString().split('T')[0],
                role: employee.role,
                status: employee.status || 'Active',
                created_by: employee.created_by || null
            }])
            .select()
            .single();

        if (empError) throw empError;

        // 2. Create Credentials
        if (credentials && credentials.username && credentials.password) {
            const { error: credError } = await supabase
                .from('employee_credentials')
                .insert([{
                    employee_id: newEmployee.employee_id,
                    username: credentials.username,
                    password_hash: credentials.password, // Following project convention of plain text for now
                    created_by: employee.created_by || null
                }]);

            if (credError) {
                // Rollback employee creation if credentials fail (manual since no transaction support in this setup easily)
                await supabase.from('employees').delete().eq('employee_id', newEmployee.employee_id);
                throw credError;
            }
        }

        return NextResponse.json(newEmployee);
    } catch (error) {
        console.error("POST Employee error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { employee_id, ...updates } = body;

        const { data, error } = await supabase
            .from('employees')
            .update({
                ...updates,
                updated_by: updates.updated_by || null
            })
            .eq('employee_id', employee_id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error) {
        console.error("PUT Employee error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
