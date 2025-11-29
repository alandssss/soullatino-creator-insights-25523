require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTables() {
    console.log('Verificando todas las tablas relevantes...\n');

    // Check creator_live_daily
    const { count: dailyCount } = await supabase
        .from('creator_live_daily')
        .select('*', { count: 'exact', head: true })
        .gte('fecha', '2025-11-01')
        .lt('fecha', '2025-12-01');

    console.log(`📊 creator_live_daily (Nov 2025): ${dailyCount} registros`);

    // Check creators
    const { count: creatorsCount } = await supabase
        .from('creators')
        .select('*', { count: 'exact', head: true });

    console.log(`👥 creators (total): ${creatorsCount} registros`);

    // Check creator_bonificaciones
    const { count: bonifCount } = await supabase
        .from('creator_bonificaciones')
        .select('*', { count: 'exact', head: true })
        .eq('mes_referencia', '2025-11-01');

    console.log(`💰 creator_bonificaciones (Nov 2025): ${bonifCount} registros`);

    // Check if there are any bonificaciones at all
    const { count: allBonifCount } = await supabase
        .from('creator_bonificaciones')
        .select('*', { count: 'exact', head: true });

    console.log(`💰 creator_bonificaciones (todos los meses): ${allBonifCount} registros`);

    // List all distinct mes_referencia values
    const { data: months } = await supabase
        .from('creator_bonificaciones')
        .select('mes_referencia')
        .order('mes_referencia', { ascending: false });

    if (months && months.length > 0) {
        const uniqueMonths = [...new Set(months.map(m => m.mes_referencia))];
        console.log('\n📅 Meses disponibles en creator_bonificaciones:');
        uniqueMonths.forEach(month => console.log(`   - ${month}`));
    }
}

checkAllTables();
