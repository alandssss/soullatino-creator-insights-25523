import { createClient } from '@supabase/supabase-js';

// Credenciales de Supabase
const supabaseUrl = 'https://mpseoscrzpnequwvzokn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wc2Vvc2NyenBuZXF1d3Z6b2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTU3NjEsImV4cCI6MjA3NjY3MTc2MX0.NUybwyRjZHPCbmu4kyFG7syNeoabertFIvIEQMddsL8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanCurrentMonthData() {
    console.log('🧹 Limpiando datos del mes actual...\n');

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];

    console.log(`📅 Mes: ${firstDayOfMonth}\n`);

    // 1. Eliminar creator_daily_stats
    console.log('1️⃣ Eliminando creator_daily_stats...');
    const { error: dailyError, count: dailyCount } = await supabase
        .from('creator_daily_stats')
        .delete({ count: 'exact' })
        .gte('fecha', firstDayOfMonth);

    if (dailyError) {
        console.error('❌ Error:', dailyError.message);
    } else {
        console.log(`✅ Eliminados ${dailyCount || 0} registros\n`);
    }

    // 2. Eliminar creator_bonificaciones
    console.log('2️⃣ Eliminando creator_bonificaciones...');
    const { error: bonifError, count: bonifCount } = await supabase
        .from('creator_bonificaciones')
        .delete({ count: 'exact' })
        .eq('mes_referencia', firstDayOfMonth);

    if (bonifError) {
        console.error('❌ Error:', bonifError.message);
    } else {
        console.log(`✅ Eliminados ${bonifCount || 0} registros\n`);
    }

    console.log('✅ ¡Listo! Ahora sube el Excel de nuevo.');
}

cleanCurrentMonthData().catch(console.error);
