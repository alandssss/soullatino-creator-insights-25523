const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fhboambxnmswtxalllnn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('Verificando datos en la base de datos...\n');

    // 1. Check creator_bonificaciones
    const { data: bonif, error: bonifErr, count: bonifCount } = await supabase
        .from('creator_bonificaciones')
        .select('*', { count: 'exact', head: false })
        .limit(5);

    console.log(`📊 creator_bonificaciones: ${bonifCount} registros`);
    if (bonif && bonif.length > 0) {
        console.log('Ejemplo:', bonif[0]);
    }

    // 2. Check creator_daily_stats
    const { data: stats, error: statsErr, count: statsCount } = await supabase
        .from('creator_daily_stats')
        .select('*', { count: 'exact', head: false })
        .order('fecha', { ascending: false })
        .limit(5);

    console.log(`\n📈 creator_daily_stats: ${statsCount} registros`);
    if (stats && stats.length > 0) {
        console.log('Última fecha:', stats[0].fecha);
        console.log('Ejemplo:', stats[0]);
    }

    // 3. Check creators
    const { data: creators, error: creatorsErr, count: creatorsCount } = await supabase
        .from('creators')
        .select('*', { count: 'exact', head: false })
        .limit(5);

    console.log(`\n👥 creators: ${creatorsCount} registros`);
    if (creators && creators.length > 0) {
        console.log('Ejemplo:', creators[0]);
    }
}

checkData().catch(console.error);
