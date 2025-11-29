require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllBonificaciones() {
    console.log('Verificando TODAS las bonificaciones...\n');

    // Check total count
    const { count: totalCount } = await supabase
        .from('creator_bonificaciones')
        .select('*', { count: 'exact', head: true });

    console.log(`📊 Total de bonificaciones: ${totalCount}`);

    // Get all distinct mes_referencia values
    const { data: allData } = await supabase
        .from('creator_bonificaciones')
        .select('mes_referencia, creator_id')
        .order('mes_referencia', { ascending: false })
        .limit(500);

    if (allData && allData.length > 0) {
        const monthCounts = {};
        allData.forEach(record => {
            const month = record.mes_referencia;
            monthCounts[month] = (monthCounts[month] || 0) + 1;
        });

        console.log('\n📅 Registros por mes:');
        Object.entries(monthCounts)
            .sort(([a], [b]) => b.localeCompare(a))
            .forEach(([month, count]) => {
                console.log(`   ${month}: ${count} registros`);
            });
    }

    // Show sample records
    const { data: samples } = await supabase
        .from('creator_bonificaciones')
        .select('mes_referencia, creator_id, diamantes_mtd, horas_mtd')
        .limit(5);

    if (samples && samples.length > 0) {
        console.log('\n📋 Primeros 5 registros:');
        samples.forEach((record, i) => {
            console.log(`   ${i + 1}. Mes: ${record.mes_referencia}, Creator: ${record.creator_id?.substring(0, 8)}..., Diamantes: ${record.diamantes_mtd}`);
        });
    }
}

checkAllBonificaciones();
