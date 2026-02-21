import { NextResponse } from 'next/server';
import { supabase } from '../../dbManager.js';

export async function GET() {
    try {
        console.log("Fetching all columns from paymenttype table...");
        const { data, error } = await supabase
            .from('paymenttypes')
            .select('*');

        if (error) {
            console.error("Supabase error in GET /api/payment-types:", error);
            return NextResponse.json([]);
        }

        console.log("Payment types retrieved from DB:", data);
        
        return NextResponse.json(data || []);
    } catch (error) {
        console.error("Unexpected error in GET /api/payment-types:", error);
        return NextResponse.json([]);
    }
}
