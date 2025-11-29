import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://fhboambxnmswtxalllnn.supabase.co';
const supabaseKey = process.env.SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('Checking if creator_bonificaciones exists...');
    const { data, error } = await supabase
        .from('creator_bonificaciones')
        .select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Error checking table:', error);
    } else {
        console.log('Table exists. Record count:', data); // data is null for head:true with count, count is in property count usually? No, head:true returns null data. count is in count property.
        // Actually supabase-js v2 returns count in the object returned by select(), but here we destructure data and error.
        // Let's just try to select 1 record.
    }

    const { count } = await supabase
        .from('creator_bonificaciones')
        .select('*', { count: 'exact', head: true });

    console.log('Count result:', count);
}

checkTable();
