import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mpseoscrzpnequwvzokn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wc2Vvc2NyenBuZXF1d3Z6b2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTU3NjEsImV4cCI6MjA3NjY3MTc2MX0.NUybwyRjZHPCbmu4kyFG7syNeoabertFIvIEQMddsL8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fullDiagnosis() {
    console.log('🔍 DIAGNÓSTICO COMPLETO\n');
    console.log('='.repeat(50) + '\n');

    // 1. Verificar tabla creators
    console.log('1️⃣ TABLA CREATORS (Top 3):');
    const { data: topCreators } = await supabase
        .from('creators')
        .select('tiktok_username, nombre, diamantes, dias_live, horas_live')
        .order('diamantes', { ascending: false })
        .limit(3);

    topCreators?.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.tiktok_username || c.nombre}`);
        console.log(`      💎 ${c.diamantes?.toLocaleString()} | 📅 ${c.dias_live}d | ⏰ ${c.horas_live}h\n`);
    });

    // 2. Verificar creator_daily_stats (TODAS las fechas)
    console.log('\n2️⃣ CREATOR_DAILY_STATS (Todas las fechas):');
    const { data: allDates, count: totalCount } = await supabase
        .from('creator_daily_stats')
        .select('fecha, diamantes', { count: 'exact' })
        .order('fecha', { ascending: false })
        .limit(20);

    console.log(`   Total registros: ${totalCount || 0}`);
    if (allDates && allDates.length > 0) {
        console.log('   Últimas 20 fechas:');
        allDates.forEach(d => {
            console.log(`      ${d.fecha}: ${d.diamantes?.toLocaleString()} 💎`);
        });
    } else {
        console.log('   ❌ NO HAY DATOS EN ESTA TABLA');
    }

    // 3. Verificar creator_bonificaciones
    console.log('\n3️⃣ CREATOR_BONIFICACIONES:');
    const { data: allBonif } = await supabase
        .from('creator_bonificaciones')
        .select('mes_referencia, diam_live_mes')
        .order('diam_live_mes', { ascending: false })
        .limit(5);

    if (allBonif && allBonif.length > 0) {
        console.log('   Top 5:');
        allBonif.forEach((b, i) => {
            console.log(`      ${i + 1}. ${b.mes_referencia}: ${b.diam_live_mes?.toLocaleString()} 💎`);
        });
    } else {
        console.log('   ❌ NO HAY DATOS EN ESTA TABLA');
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n📋 CONCLUSIÓN:');
    console.log('   - Si creator_daily_stats está vacío: El Excel NO se está subiendo correctamente');
    console.log('   - Si creators tiene 6M: Los datos viejos siguen ahí');
    console.log('   - Solución: Necesitas subir el Excel DE NUEVO después del reset\n');
}

fullDiagnosis().catch(console.error);
