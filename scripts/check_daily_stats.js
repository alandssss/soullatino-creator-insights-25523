
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fhboambxnmswtxalllnn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkDailyStats() {
    console.log('Checking creator_daily_stats...');

    // Check for today's data
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chihuahua' });
    console.log('Today:', today);

    const { data, error, count } = await supabase
        .from('creator_daily_stats')
        .select('*', { count: 'exact' })
        .eq('fecha', today);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${count} records for ${today}`);
    if (data && data.length > 0) {
        console.log('Sample records:', JSON.stringify(data.slice(0, 3), null, 2));
    }

    // Check all dates
    const { data: allDates } = await supabase
        .from('creator_daily_stats')
        .select('fecha')
        .order('fecha', { ascending: false })
        .limit(10);

    console.log('Recent dates:', allDates?.map(d => d.fecha));
}

checkDailyStats();
