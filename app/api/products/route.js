import { NextResponse } from 'next/server';
import { displayRecords, sqlManager } from '../../dbManager.js';

export async function GET() {
    try {
        const products = await displayRecords(`
            SELECT 
                p.product_id, 
                (select name from brands where brand_id = p.brand_id) as brand, 
                p.brand_id, 
                name, 
                barcode, 
                description, 
                category, 
                cost_price, 
                selling_price, 
                tax_rate, 
                created_at, 
                created_by, 
                updated_at, 
                updated_by,
                (SELECT SUM(quantity) FROM inventory WHERE product_id = p.product_id) as total_stock
            FROM products p 
            ORDER BY created_at DESC
        `);
        return NextResponse.json(products);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        console.log("POST Body received:", body);
        const { brand_id, name, barcode, description, category, cost_price, selling_price, tax_rate, created_by } = body;
        
        const result = await sqlManager(
            "INSERT INTO products (brand_id, name, barcode, description, category, cost_price, selling_price, tax_rate, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
            [brand_id, name, barcode, description, category, Number(cost_price), Number(selling_price), Number(tax_rate), created_by]
        );
        
        return NextResponse.json({ message: "Product created successfully", id: result.insertId });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        console.log("PUT Body received:", body);
        const { product_id, brand_id, name, barcode, description, category, cost_price, selling_price, tax_rate, updated_by } = body;

        await sqlManager(
            "UPDATE products SET brand_id=?, name=?, barcode=?, description=?, category=?, cost_price=?, selling_price=?, tax_rate=?, updated_by=?, updated_at=NOW() WHERE product_id=?",
            [brand_id, name, barcode, description, category, Number(cost_price), Number(selling_price), Number(tax_rate), updated_by, product_id]
        );
        
        return NextResponse.json({ message: "Product updated successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        await sqlManager("DELETE FROM products WHERE product_id=?", [id]);
        return NextResponse.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }
}