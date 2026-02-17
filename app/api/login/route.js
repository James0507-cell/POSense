import { NextResponse } from 'next/server';
import { displayRecords } from '../../dbManager.js';

export async function POST(request) {
    try {
        const { username, passwordHash} = await request.json();
        const employees = await displayRecords( "select ec.credential_id, ec.employee_id, (select first_name from employees where employee_id = ec.employee_id) as first_name, (select last_name from employees where employee_id = ec.employee_id) as last_name, (select email from employees where employee_id = ec.employee_id) as email from employee_credentials ec where username = ? and password_hash = ?" , [username, passwordHash]);
        
        if (employees.length === 0) {
            return NextResponse.json({error: "Invalid username or password"}, {status: 401});
        }
        
        return NextResponse.json(employees);
    }
    catch (error) {
        console.error(error);
        return NextResponse.json(
            {error: "Failed to fetch employees"},
            {status: 500});
    }
}

