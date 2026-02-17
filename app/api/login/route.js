import { NextResponse } from 'next/server';
import { displayRecords } from '../../dbManager.js';

export async function POST(request) {
    try {
        const { username, passwordHash} = await request.json();
        const employees = await displayRecords( "select * from employee_credentials where username = ? and password_hash = ?" , [username, passwordHash]);
        
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

