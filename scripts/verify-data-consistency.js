import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyData() {
    console.log('🔍 VERIFICANDO INCONSISTENCIAS DE DATOS\n');

    const mesRef = '2025-11-01';
    const hoy = new Date().toISOString().split('T')[0];

    // 1. Verificar creator_bonificaciones
    console.log('📊 1. DATOS EN creator_bonificaciones (Nov 2025):');
    const { data: bonif, error: bonifError } = await supabase
        .from('creator_bonificaciones')
        .select('creator_id, diam_live_mes, horas_live_mes, dias_live_mes')
        .eq('mes_referencia', mesRef)
        .order('diam_live_mes', { ascending: false })
        .limit(5);

    if (bonifError) {
        console.log('❌ Error:', bonifError.message);
    } else if (bonif && bonif.length > 0) {
        console.log(`✅ ${bonif.length} registros encontrados\n`);
        bonif.forEach((b, i) => {
            console.log(`${i + 1}. Creator ${b.creator_id.substring(0, 8)}...`);
            console.log(`   💎 Diamantes: ${b.diam_live_mes?.toLocaleString() || 0}`);
            console.log(`   ⏰ Horas: ${b.horas_live_mes || 0}`);
            console.log(`   📅 Días: ${b.dias_live_mes || 0}\n`);
        });
    } else {
        console.log('⚠️ No hay datos en creator_bonificaciones para noviembre 2025\n');
    }

    // 2. Verificar creator_daily_stats
    console.log('\n📊 2. DATOS EN creator_daily_stats (Hoy):');
    const { data: daily, error: dailyError } = await supabase
        .from('creator_daily_stats')
        .select('creator_id, diamantes, duracion_live_horas, dias_validos_live, fecha')
        .eq('fecha', hoy)
        .order('diamantes', { ascending: false })
        .limit(5);

    if (dailyError) {
        console.log('❌ Error:', dailyError.message);
    } else if (daily && daily.length > 0) {
        console.log(`✅ ${daily.length} registros encontrados para ${hoy}\n`);
        daily.forEach((d, i) => {
            console.log(`${i + 1}. Creator ${d.creator_id.substring(0, 8)}...`);
            console.log(`   💎 Diamantes: ${d.diamantes?.toLocaleString() || 0}`);
            console.log(`   ⏰ Horas: ${d.duracion_live_horas || 0}`);
            console.log(`   📅 Días válidos: ${d.dias_validos_live || 0}\n`);
        });
    } else {
        console.log(`⚠️ No hay datos en creator_daily_stats para ${hoy}\n`);
    }

    // 3. Comparar un creador específico
    if (bonif && bonif.length > 0 && daily && daily.length > 0) {
        const creatorId = bonif[0].creator_id;

        console.log('\n📊 3. COMPARACIÓN DETALLADA (Top creator):');
        console.log(`Creator ID: ${creatorId}\n`);

        // Obtener todos los daily_stats del mes
        const { data: statsDelMes } = await supabase
            .from('creator_daily_stats')
            .select('fecha, diamantes, duracion_live_horas, dias_validos_live')
            .eq('creator_id', creatorId)
            .gte('fecha', '2025-11-01')
            .lte('fecha', '2025-11-30')
            .order('fecha');

        if (statsDelMes && statsDelMes.length > 0) {
            console.log(`Registros diarios encontrados: ${statsDelMes.length}`);
            console.log('\nÚltimos 5 días:');
            statsDelMes.slice(-5).forEach(s => {
                console.log(`  ${s.fecha}: 💎${s.diamantes?.toLocaleString() || 0} | ⏰${s.duracion_live_horas || 0}h | días=${s.dias_validos_live || 0}`);
            });

            // Calcular manualmente
            const maxDiamantes = Math.max(...statsDelMes.map(s => s.diamantes || 0));
            const maxHoras = Math.max(...statsDelMes.map(s => s.duracion_live_horas || 0));
            const diasUnicos = new Set(statsDelMes.filter(s => (s.diamantes || 0) > 0 || (s.duracion_live_horas || 0) >= 1).map(s => s.fecha)).size;

            console.log('\n📊 Cálculo manual (usando MAX para MTD):');
            console.log(`   💎 Max Diamantes: ${maxDiamantes.toLocaleString()}`);
            console.log(`   ⏰ Max Horas: ${maxHoras}`);
            console.log(`   📅 Días únicos: ${diasUnicos}`);

            const bonifData = bonif.find(b => b.creator_id === creatorId);
            if (bonifData) {
                console.log('\n📊 Datos en creator_bonificaciones:');
                console.log(`   💎 Diamantes: ${bonifData.diam_live_mes?.toLocaleString() || 0}`);
                console.log(`   ⏰ Horas: ${bonifData.horas_live_mes || 0}`);
                console.log(`   📅 Días: ${bonifData.dias_live_mes || 0}`);

                console.log('\n🔍 COMPARACIÓN:');
                const diamMatch = maxDiamantes === (bonifData.diam_live_mes || 0);
                const horasMatch = Math.abs(maxHoras - (bonifData.horas_live_mes || 0)) < 0.01;
                const diasMatch = diasUnicos === (bonifData.dias_live_mes || 0);

                console.log(`   Diamantes: ${diamMatch ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
                console.log(`   Horas: ${horasMatch ? '✅ CORRECTO' : '❌ INCORRECTO'}`);
                console.log(`   Días: ${diasMatch ? '✅ CORRECTO' : '❌ INCORRECTO'}`);

                if (!diamMatch || !horasMatch || !diasMatch) {
                    console.log('\n⚠️ INCONSISTENCIA DETECTADA!');
                    console.log('Posibles causas:');
                    if (!horasMatch) console.log('  - Las horas no coinciden (probablemente sumando en lugar de MAX)');
                    if (!diamMatch) console.log('  - Los diamantes no coinciden');
                    if (!diasMatch) console.log('  - El conteo de días no coincide');
                }
            }
        }
    }
}

verifyData().catch(console.error);
