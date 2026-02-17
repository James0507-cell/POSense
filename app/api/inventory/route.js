import { NextResponse } from 'next/server';
import { displayRecords } from '../../dbManager.js';

export async function GET() {
    try {
        const inventory = await displayRecords("SELECT * FROM inventory");
        return NextResponse.json(inventory);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to fetch inventory" },
            { status: 500 }
        );
    }
}