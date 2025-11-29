require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllDates() {
    console.log('Verificando creator_daily_stats para todas las fechas...\n');

    // Get all records grouped by date
    const { data, error } = await supabase
        .from('creator_daily_stats')
        .select('fecha, creator_id')
        .order('fecha', { ascending: false });

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('❌ No hay registros en creator_daily_stats');
        return;
    }

    // Group by date
    const byDate = {};
    data.forEach(r => {
        const fecha = r.fecha;
        byDate[fecha] = (byDate[fecha] || 0) + 1;
    });

    console.log('📅 Registros por fecha:');
    Object.entries(byDate)
        .sort(([a], [b]) => b.localeCompare(a))
        .forEach(([fecha, count]) => {
            console.log(`   ${fecha}: ${count} registros`);
        });

    console.log(`\n📊 Total de registros: ${data.length}`);
}

checkAllDates();
