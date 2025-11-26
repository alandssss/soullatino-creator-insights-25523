import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mpseoscrzpnequwvzokn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wc2Vvc2NyenBuZXF1d3Z6b2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTU3NjEsImV4cCI6MjA3NjY3MTc2MX0.NUybwyRjZHPCbmu4kyFG7syNeoabertFIvIEQMddsL8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function recalculateWithMaxLogic() {
    console.log('🔄 Recalculando bonificaciones con lógica MAX correcta...\n');

    // Obtener todos los creadores
    const { data: creators } = await supabase
        .from('creators')
        .select('id');

    if (!creators) {
        console.error('❌ No se pudieron obtener creadores');
        return;
    }

    console.log(`📊 Procesando ${creators.length} creadores...\n`);

    // Obtener datos de daily_stats
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];

    const { data: dailyStats } = await supabase
        .from('creator_daily_stats')
        .select('creator_id, diamantes, duracion_live_horas, fecha')
        .gte('fecha', firstDayOfMonth);

    if (!dailyStats || dailyStats.length === 0) {
        console.error('❌ No hay datos en creator_daily_stats para este mes');
        return;
    }

    console.log(`📅 Encontrados ${dailyStats.length} registros diarios\n`);

    // Agrupar por creator_id usando MAX para diamantes
    const statsMap = new Map();

    dailyStats.forEach(stat => {
        if (!statsMap.has(stat.creator_id)) {
            statsMap.set(stat.creator_id, {
                diam_live_mes: 0,
                horas_live_mes: 0,
                dias_live_mes: new Set()
            });
        }
        const current = statsMap.get(stat.creator_id);

        // ✅ USAR MAX para diamantes (no sumar)
        current.diam_live_mes = Math.max(current.diam_live_mes, stat.diamantes || 0);

        // Sumar horas
        current.horas_live_mes += stat.duracion_live_horas || 0;

        // Contar días únicos
        if ((stat.diamantes || 0) > 0 || (stat.duracion_live_horas || 0) >= 1.0) {
            current.dias_live_mes.add(stat.fecha);
        }
    });

    // Convertir a array para upsert
    const bonificaciones = [];
    statsMap.forEach((stats, creatorId) => {
        bonificaciones.push({
            creator_id: creatorId,
            mes_referencia: firstDayOfMonth,
            diam_live_mes: stats.diam_live_mes,
            horas_live_mes: stats.horas_live_mes,
            dias_live_mes: stats.dias_live_mes.size,
            fecha_calculo: new Date().toISOString().split('T')[0]
        });
    });

    console.log(`💾 Guardando ${bonificaciones.length} bonificaciones...\n`);

    // Upsert
    const { error } = await supabase
        .from('creator_bonificaciones')
        .upsert(bonificaciones, { onConflict: 'creator_id,mes_referencia' });

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log('✅ ¡Bonificaciones recalculadas correctamente!');
        console.log('\nTop 3 valores:');
        const top3 = bonificaciones
            .sort((a, b) => b.diam_live_mes - a.diam_live_mes)
            .slice(0, 3);

        top3.forEach((b, i) => {
            console.log(`${i + 1}. ${b.diam_live_mes.toLocaleString()} 💎 (${b.dias_live_mes}d, ${b.horas_live_mes.toFixed(1)}h)`);
        });
    }
}

recalculateWithMaxLogic().catch(console.error);
