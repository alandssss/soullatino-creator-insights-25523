import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mpseoscrzpnequwvzokn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wc2Vvc2NyenBuZXF1d3Z6b2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTU3NjEsImV4cCI6MjA3NjY3MTc2MX0.NUybwyRjZHPCbmu4kyFG7syNeoabertFIvIEQMddsL8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findDataMonth() {
    console.log('🔍 Buscando en qué mes están los datos...\n');

    // Verificar todos los meses posibles
    const months = ['2025-10-01', '2025-11-01', '2025-12-01'];

    for (const month of months) {
        const { count: dailyCount } = await supabase
            .from('creator_daily_stats')
            .select('*', { count: 'exact', head: true })
            .gte('fecha', month)
            .lt('fecha', new Date(new Date(month).setMonth(new Date(month).getMonth() + 1)).toISOString().split('T')[0]);

        const { count: bonifCount } = await supabase
            .from('creator_bonificaciones')
            .select('*', { count: 'exact', head: true })
            .eq('mes_referencia', month);

        if (dailyCount || bonifCount) {
            console.log(`📅 ${month}:`);
            console.log(`   - creator_daily_stats: ${dailyCount || 0} registros`);
            console.log(`   - creator_bonificaciones: ${bonifCount || 0} registros\n`);

            // Mostrar top 3 de bonificaciones si existen
            if (bonifCount && bonifCount > 0) {
                const { data: topBonif } = await supabase
                    .from('creator_bonificaciones')
                    .select('creator_id, diam_live_mes, dias_live_mes, horas_live_mes')
                    .eq('mes_referencia', month)
                    .order('diam_live_mes', { ascending: false })
                    .limit(3);

                console.log('   Top 3 bonificaciones:');
                topBonif?.forEach((b, i) => {
                    console.log(`   ${i + 1}. ${b.diam_live_mes?.toLocaleString()} 💎, ${b.dias_live_mes}d, ${b.horas_live_mes?.toFixed(1)}h`);
                });
                console.log('');
            }
        }
    }
}

findDataMonth().catch(console.error);
