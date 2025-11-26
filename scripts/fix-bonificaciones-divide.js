import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mpseoscrzpnequwvzokn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wc2Vvc2NyenBuZXF1d3Z6b2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTU3NjEsImV4cCI6MjA3NjY3MTc2MX0.NUybwyRjZHPCbmu4kyFG7syNeoabertFIvIEQMddsL8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBonificaciones() {
    console.log('🔧 Corrigiendo bonificaciones (dividiendo entre 2)...\n');

    // Obtener todas las bonificaciones
    const { data: bonificaciones } = await supabase
        .from('creator_bonificaciones')
        .select('*');

    if (!bonificaciones || bonificaciones.length === 0) {
        console.error('❌ No hay bonificaciones para corregir');
        return;
    }

    console.log(`📊 Encontradas ${bonificaciones.length} bonificaciones\n`);

    // Dividir diamantes entre 2 (porque están duplicados)
    const corrected = bonificaciones.map(b => ({
        ...b,
        diam_live_mes: Math.round((b.diam_live_mes || 0) / 2)
    }));

    // Mostrar antes y después
    console.log('Top 5 ANTES vs DESPUÉS:\n');
    const top5 = bonificaciones
        .sort((a, b) => (b.diam_live_mes || 0) - (a.diam_live_mes || 0))
        .slice(0, 5);

    top5.forEach((b, i) => {
        const after = Math.round((b.diam_live_mes || 0) / 2);
        console.log(`${i + 1}. ${b.diam_live_mes?.toLocaleString()} 💎 → ${after.toLocaleString()} 💎`);
    });

    console.log('\n💾 Actualizando...\n');

    // Actualizar
    const { error } = await supabase
        .from('creator_bonificaciones')
        .upsert(corrected, { onConflict: 'creator_id,mes_referencia' });

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log('✅ ¡Bonificaciones corregidas!');
        console.log('\n🔄 Recarga la página para ver los cambios');
    }
}

fixBonificaciones().catch(console.error);
