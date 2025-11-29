
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fhboambxnmswtxalllnn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkData() {
    console.log('Checking for available data...');

    // Check creators count
    const { count: creatorsCount, error: creatorsError } = await supabase
        .from('creators')
        .select('*', { count: 'exact', head: true });

    if (creatorsError) {
        console.error('Error checking creators:', creatorsError);
    } else {
        console.log(`Creators count: ${creatorsCount}`);
    }

    // Check creator_bonificaciones
    const { count: bonifCount, error: bonifError } = await supabase
        .from('creator_bonificaciones')
        .select('*', { count: 'exact', head: true });

    if (bonifError) {
        console.error('Error checking creator_bonificaciones:', bonifError);
    } else {
        console.log(`Creator Bonificaciones count: ${bonifCount}`);
    }

    // Check daily stats again
    const { data, error } = await supabase
        .from('creator_daily_stats')
        .select('fecha')
        .order('fecha', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No data found in creator_daily_stats');
        return;
    }

    // Group by date
    const dates = {};
    data.forEach(row => {
        dates[row.fecha] = (dates[row.fecha] || 0) + 1;
    });

    console.log('Available dates:', dates);
}

checkData();
