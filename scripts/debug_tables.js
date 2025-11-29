
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fhboambxnmswtxalllnn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkTableContent() {
    console.log('--- Creator Bonificaciones (Monthly) ---');
    const { data: bonif } = await supabase
        .from('creator_bonificaciones')
        .select('*')
        .limit(5);
    console.log(JSON.stringify(bonif, null, 2));

    console.log('\n--- Creator Daily Stats (Daily) ---');
    const { data: daily } = await supabase
        .from('creator_daily_stats')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(5);
    console.log(JSON.stringify(daily, null, 2));
}

checkTableContent();
