// Test inserting data directly to see exact error
import { createClient } from '@supabase/supabase-js';

const PROJECT_REF = 'fhboambxnmswtxalllnn';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE';

const supabase = createClient(
    `https://${PROJECT_REF}.supabase.co`,
    SERVICE_ROLE_KEY
);

async function testDirectInsert() {
    console.log('=== Testing Direct INSERT to creator_daily_stats ===\n');

    // First, get a valid creator_id from the creators table
    const { data: creators, error: creatorsError } = await supabase
        .from('creators')
        .select('id, nombre')
        .limit(1);

    if (creatorsError || !creators || creators.length === 0) {
        console.error('Cannot get creator:', creatorsError);
        return;
    }

    const testCreatorId = creators[0].id;
    console.log('Using test creator:', creators[0].nombre, '(ID:', testCreatorId, ')\n');

    // Try to insert a test record
    const testRecord = {
        creator_id: testCreatorId,
        fecha: '2025-11-27',
        diamantes: 1000,
        duracion_live_horas: 10,
        dias_validos_live: 1,
        nuevos_seguidores: 50
    };

    console.log('Attempting INSERT with data:', testRecord, '\n');

    const { data: inserted, error: insertError } = await supabase
        .from('creator_daily_stats')
        .insert([testRecord])
        .select();

    if (insertError) {
        console.error('❌ INSERT FAILED!');
        console.error('Error:', insertError);
        console.error('\nError code:', insertError.code);
        console.error('Error details:', insertError.details);
        console.error('Error hint:', insertError.hint);
        console.error('Error message:', insertError.message);
    } else {
        console.log('✅ INSERT SUCCESS!');
        console.log('Inserted:', inserted);

        // Verify it's actually there
        const { data: verified, count } = await supabase
            .from('creator_daily_stats')
            .select('*', { count: 'exact' })
            .eq('creator_id', testCreatorId)
            .eq('fecha', '2025-11-27');

        console.log(`\nVerification: Found ${count} records`);
        if (count > 0) {
            console.log('Verified data:', verified[0]);
        }
    }
}

testDirectInsert();
