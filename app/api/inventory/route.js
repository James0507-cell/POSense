import { NextResponse } from 'next/server';
import { supabase } from '../../dbManager.js';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('inventory')
            .select(`
                *,
                product:products(name)
            `)
            .order('last_updated', { ascending: false });

        if (error) throw error;

        // Map product name to product_name key
        const inventory = data.map(item => ({
            ...item,
            product_name: item.product?.name || null
        }));

        return NextResponse.json(inventory);
    } catch (error) {
        console.error("Supabase error in GET /api/inventory:", error);
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
        
        const { data, error } = await supabase
            .from('inventory')
            .insert([
                { 
                    product_id, 
                    location, 
                    quantity: Number(quantity), 
                    minimum: Number(minimum), 
                    maximum: Number(maximum), 
                    created_by,
                    last_updated: new Date().toISOString()
                }
            ])
            .select('inventory_id');

        if (error) throw error;
        
        return NextResponse.json({ 
            message: "Inventory record created successfully", 
            id: data[0].inventory_id 
        });
    } catch (error) {
        console.error("Supabase error in POST /api/inventory:", error);
        return NextResponse.json({ error: "Failed to create inventory record" }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { inventory_id, product_id, location, quantity, minimum, maximum, updated_by } = body;

        const { data, error } = await supabase
            .from('inventory')
            .update({ 
                product_id, 
                location, 
                quantity: Number(quantity), 
                minimum: Number(minimum), 
                maximum: Number(maximum), 
                updated_by, 
                last_updated: new Date().toISOString() 
            })
            .eq('inventory_id', inventory_id)
            .select();

        if (error) throw error;
        
        return NextResponse.json({ message: "Inventory record updated successfully" });
    } catch (error) {
        console.error("Supabase error in PUT /api/inventory:", error);
        return NextResponse.json({ error: "Failed to update inventory record" }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) throw new Error("Inventory ID is required");

        const { error } = await supabase
            .from('inventory')
            .delete()
            .eq('inventory_id', id);

        if (error) throw error;

        return NextResponse.json({ message: "Inventory record deleted successfully" });
    } catch (error) {
        console.error("Supabase error in DELETE /api/inventory:", error);
        return NextResponse.json({ error: "Failed to delete inventory record" }, { status: 500 });
    }
}
