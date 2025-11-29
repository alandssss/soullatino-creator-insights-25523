require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBonificaciones() {
    console.log('Verificando datos en creator_bonificaciones...\n');

    // Check for November 2025
    const { data, error, count } = await supabase
        .from('creator_bonificaciones')
        .select('*', { count: 'exact' })
        .eq('mes_referencia', '2025-11-01');

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log(`✅ Total de registros para noviembre 2025: ${count}`);

    if (data && data.length > 0) {
        console.log('\nPrimeros 3 registros:');
        data.slice(0, 3).forEach((record, i) => {
            console.log(`\n${i + 1}. Creator ID: ${record.creator_id}`);
            console.log(`   Diamantes MTD: ${record.diamantes_mtd}`);
            console.log(`   Horas MTD: ${record.horas_mtd}`);
            console.log(`   Días MTD: ${record.dias_mtd}`);
        });
    }
}

checkBonificaciones();
