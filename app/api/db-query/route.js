import { NextResponse } from 'next/server';
import { displayRecords } from '../../dbManager.js';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        
        if (!query) {
            return NextResponse.json({ error: "No query provided" }, { status: 400 });
        }

        // Basic security: only allow SELECT queries
        if (!query.trim().toLowerCase().startsWith('select')) {
            return NextResponse.json({ error: "Only SELECT queries are allowed via this endpoint" }, { status: 403 });
        }

        const result = await displayRecords(query);
        return NextResponse.json(result);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Database query failed" }, { status: 500 });
    }
}