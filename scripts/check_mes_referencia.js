
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fhboambxnmswtxalllnn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkMesReferencia() {
    console.log('Checking creator_bonificaciones...');

    const { data: bonif, error: bonifError } = await supabase
        .from('creator_bonificaciones')
        .select('mes_referencia, creator_id')
        .limit(5);

    if (bonifError) {
        console.error('Error:', bonifError);
    } else {
        console.log('creator_bonificaciones sample:', JSON.stringify(bonif, null, 2));
    }

    // Check creators table
    const { data: creators, error: creatorsError } = await supabase
        .from('creators')
        .select('creator_id, nombre')
        .limit(5);

    if (creatorsError) {
        console.error('Creators error:', creatorsError);
    } else {
        console.log('Creators sample:', JSON.stringify(creators, null, 2));
    }

    // Check all tables count
    const tables = ['creators', 'creator_bonificaciones', 'creator_daily_stats', 'creator_recommendations'];
    for (const table of tables) {
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
        console.log(`${table}: ${count} records`);
    }
}

checkMesReferencia();
