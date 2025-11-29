require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDailyStats() {
    console.log('Verificando creator_daily_stats...\n');

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chihuahua' });
    console.log(`Fecha de hoy: ${today}\n`);

    const { count, error } = await supabase
        .from('creator_daily_stats')
        .select('*', { count: 'exact', head: true })
        .eq('fecha', today);

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log(`📊 Total de registros para hoy (${today}): ${count}`);

    if (count && count > 0) {
        const { data } = await supabase
            .from('creator_daily_stats')
            .select('creator_id, diamantes, duracion_live_horas, dias_validos_live')
            .eq('fecha', today)
            .limit(5);

        console.log('\n📋 Primeros 5 registros:');
        data?.forEach((r, i) => {
            console.log(`   ${i + 1}. Creator: ${r.creator_id?.substring(0, 8)}..., Diamantes: ${r.diamantes}, Horas: ${r.duracion_live_horas}`);
        });
    }
}

checkDailyStats();
