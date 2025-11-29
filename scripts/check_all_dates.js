// Check all dates in creator_daily_stats to see if data was inserted with different date
import { createClient } from '@supabase/supabase-js';

const PROJECT_REF = 'fhboambxnmswtxalllnn';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE';

const supabase = createClient(
    `https://${PROJECT_REF}.supabase.co`,
    SERVICE_ROLE_KEY
);

async function checkAllDates() {
    console.log('=== Checking ALL dates in creator_daily_stats ===\n');

    // Get all distinct dates
    const { data: allStats, error } = await supabase
        .from('creator_daily_stats')
        .select('fecha')
        .order('fecha', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!allStats || allStats.length === 0) {
        console.log('❌ Table is COMPLETELY EMPTY - no data at all!');
        console.log('\nThis confirms the INSERT is failing completely.');
        console.log('\nLet me check the logs of the upload function...');
        return;
    }

    // Get unique dates
    const uniqueDates = [...new Set(allStats.map(s => s.fecha))];
    console.log('Found data for these dates:', uniqueDates);

    // Count for each date
    for (const fecha of uniqueDates) {
        const { count } = await supabase
            .from('creator_daily_stats')
            .select('*', { count: 'exact', head: true })
            .eq('fecha', fecha);

        console.log(`  ${fecha}: ${count} records`);
    }

    //Check what the upload function would calculate as "today"
    console.log('\n=== Checking timezone calculations ===');
    const utcNow = new Date();
    const chihuahua = utcNow.toLocaleDateString('en-CA', { timeZone: 'America/Chihuahua' });
    console.log('UTC now:', utcNow.toISOString());
    console.log('America/Chihuahua today:', chihuahua);
    console.log('Node default today:', new Date().toISOString().split('T')[0]);
}

checkAllDates();
