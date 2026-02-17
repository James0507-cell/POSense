import { NextResponse } from 'next/server';
import { displayRecords, sqlManager } from '../../dbManager.js';

export async function GET() {
    try {
        const inventory = await displayRecords(`
            SELECT 
                i.*, 
                i.inventory_id,
                p.name as product_name 
            FROM inventory i
            LEFT JOIN products p ON i.product_id = p.product_id
            ORDER BY i.last_updated DESC
        `);
        return NextResponse.json(inventory);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to fetch inventory" },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { product_id, location, quantity, minimum, maximum, created_by } = body;
        
        const result = await sqlManager(
            "INSERT INTO inventory (product_id, location, quantity, minimum, maximum, created_by, last_updated) VALUES (?, ?, ?, ?, ?, ?, NOW())",
            [product_id, location, Number(quantity), Number(minimum), Number(maximum), created_by]
        );
        
        return NextResponse.json({ message: "Inventory record created successfully", id: result.insertId });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create inventory record" }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { inventory_id, product_id, location, quantity, minimum, maximum, updated_by } = body;

        await sqlManager(
            "UPDATE inventory SET product_id=?, location=?, quantity=?, minimum=?, maximum=?, updated_by=?, last_updated=NOW() WHERE inventory_id=?",
            [product_id, location, Number(quantity), Number(minimum), Number(maximum), updated_by, inventory_id]
        );
        
        return NextResponse.json({ message: "Inventory record updated successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update inventory record" }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        await sqlManager("DELETE FROM inventory WHERE inventory_id=?", [id]);
        return NextResponse.json({ message: "Inventory record deleted successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete inventory record" }, { status: 500 });
    }
}