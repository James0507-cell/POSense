import { NextResponse } from 'next/server';
import { supabase } from '../../dbManager.js';

export async function GET() {
    try {
        // Fetch products with their brand name and inventory quantities
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                brand:brands(name),
                inventory(quantity)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const products = data.map(p => ({
            ...p,
            brand: p.brand?.name || null,
            total_stock: p.inventory?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0
        }));

        return NextResponse.json(products);
    } catch (error) {
        console.error("Supabase error in GET /api/products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { brand_id, name, barcode, description, category, cost_price, selling_price, vat, created_by } = body;
        
        const { data, error } = await supabase
            .from('products')
            .insert([
                { 
                    brand_id, 
                    name, 
                    barcode, 
                    description, 
                    category, 
                    cost_price: Number(cost_price), 
                    selling_price: Number(selling_price), 
                    vat: Number(vat), 
                    created_by,
                    created_at: new Date().toISOString()
                }
            ])
            .select('product_id');

        if (error) throw error;
        
        return NextResponse.json({ 
            message: "Product created successfully", 
            id: data[0].product_id 
        });
    } catch (error) {
        console.error("Supabase error in POST /api/products:", error);
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { product_id, brand_id, name, barcode, description, category, cost_price, selling_price, vat, updated_by } = body;

        const { data, error } = await supabase
            .from('products')
            .update({ 
                brand_id, 
                name, 
                barcode, 
                description, 
                category, 
                cost_price: Number(cost_price), 
                selling_price: Number(selling_price), 
                vat: Number(vat), 
                updated_by, 
                updated_at: new Date().toISOString() 
            })
            .eq('product_id', product_id)
            .select();

        if (error) throw error;
        
        return NextResponse.json({ message: "Product updated successfully" });
    } catch (error) {
        console.error("Supabase error in PUT /api/products:", error);
        return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) throw new Error("Product ID is required");

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('product_id', id);

        if (error) throw error;

        return NextResponse.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Supabase error in DELETE /api/products:", error);
        return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }
}
