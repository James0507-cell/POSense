import { NextResponse } from 'next/server';
import { displayRecords } from '../../dbManager';

export async function GET() {
    try {
        // Sample query - change 'products' to an actual table in your 'posense' DB
        const result = await displayRecords('SELECT 1 as connection_test');
        return NextResponse.json({ message: "Database connected successfully", data: result });
    } catch (error) {
        return NextResponse.json({ error: "Failed to connect to database", details: error.message }, { status: 500 });
    }
}
