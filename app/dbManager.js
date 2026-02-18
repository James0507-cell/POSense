import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);


export async function displayRecords(tableName, queryOptions = {}) {
    let query = supabase.from(tableName).select(queryOptions.select || '*');
    
    if (queryOptions.order) {
        query = query.order(queryOptions.order.column, { ascending: queryOptions.order.ascending });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
}


export async function sqlManager(tableName, operation, data, match = {}) {
    let query;
    if (operation === 'INSERT') {
        query = supabase.from(tableName).insert(data).select();
    } else if (operation === 'UPDATE') {
        query = supabase.from(tableName).update(data).match(match).select();
    } else if (operation === 'DELETE') {
        query = supabase.from(tableName).delete().match(match);
    }
    
    const { data: result, error } = await query;
    if (error) throw error;
    return result;
}
