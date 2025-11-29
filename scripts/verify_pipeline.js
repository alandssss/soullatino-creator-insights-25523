// Script to verify the entire pipeline: Insert -> Calculate -> Sync
import { createClient } from '@supabase/supabase-js';

const PROJECT_REF = 'fhboambxnmswtxalllnn';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE';

const supabase = createClient(
    `https://${PROJECT_REF}.supabase.co`,
    SERVICE_ROLE_KEY
);

async function verifyPipeline() {
    console.log('=== 🚀 Starting Pipeline Verification ===\n');

    // 1. Check for existing data
    console.log('1. Checking for existing daily stats...');
    const today = new Date().toISOString().split('T')[0];
    const { count: statsCount } = await supabase
        .from('creator_daily_stats')
        .select('*', { count: 'exact', head: true });

    console.log(`   Found ${statsCount} total records in creator_daily_stats`);

    // 2. Insert test data if needed (or always to be sure)
    console.log('\n2. Inserting test record to ensure data exists...');
    const { data: creators } = await supabase.from('creators').select('id').limit(1);
    if (!creators || creators.length === 0) {
        console.error('❌ No creators found! Cannot test.');
        return;
    }
    const creatorId = creators[0].id;

    const testRecord = {
        creator_id: creatorId,
        fecha: today,
        diamantes: 50000, // Enough for some progress
        duracion_live_horas: 5,
        dias_validos_live: 1,
        nuevos_seguidores: 10
    };

    const { error: insertError } = await supabase
        .from('creator_daily_stats')
        .upsert(testRecord); // Upsert to avoid duplicates if running multiple times

    if (insertError) {
        console.error('❌ Insert failed:', insertError);
        return;
    }
    console.log('   ✅ Test record inserted/updated');

    // 3. Invoke Calculate Function
    console.log('\n3. Invoking calculate-bonificaciones-predictivo...');
    // Fix: Function expects YYYY-MM-01
    const mesRef = today.substring(0, 7) + '-01';
    const { data: calcData, error: calcError } = await supabase.functions.invoke(
        'calculate-bonificaciones-predictivo',
        { body: { mes_referencia: mesRef } }
    );

    if (calcError) {
        console.error('❌ Calculation failed:', calcError);
        if (calcError.context && typeof calcError.context.text === 'function') {
            try {
                const text = await calcError.context.text();
                console.error('   Error body:', text);
            } catch (e) { console.error('   Could not read error body'); }
        }
    } else {
        console.log('   ✅ Calculation success:', calcData);
    }

    // 4. Invoke Sync Function
    console.log('\n4. Invoking sync-to-airtable...');
    // Sync function expects YYYY-MM-01 to match database records
    const { data: syncData, error: syncError } = await supabase.functions.invoke(
        'sync-to-airtable',
        { body: { month: mesRef } }
    );

    if (syncError) {
        console.error('❌ Sync failed:', syncError);
        if (syncError.context && typeof syncError.context.text === 'function') {
            try {
                const text = await syncError.context.text();
                console.error('   Error body:', text);
            } catch (e) { console.error('   Could not read error body'); }
        }
    } else {
        console.log('   ✅ Sync success:', syncData);
    }

    console.log('\n=== 🏁 Verification Complete ===');
}

verifyPipeline();
