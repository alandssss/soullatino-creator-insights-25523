/**
 * SCRIPT DE DIAGNÓSTICO COMPLETO
 * Verifica inconsistencias en los datos entre tablas
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Variables de entorno no encontradas');
    console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.error('   VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseKey ? '✓' : '✗');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosticar() {
    console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO\n');

    const mesRef = new Date().toISOString().slice(0, 7) + '-01';
    const hoy = new Date().toISOString().split('T')[0];

    // 1. Verificar creator_daily_stats
    console.log('📊 1. VERIFICANDO creator_daily_stats');
    console.log('=====================================');

    const { data: dailyStats, error: dailyError } = await supabase
        .from('creator_daily_stats')
        .select('*')
        .eq('fecha', hoy)
        .limit(5);

    if (dailyError) {
        console.error('❌ Error:', dailyError);
    } else {
        console.log(`✅ Registros encontrados: ${dailyStats?.length || 0}`);
        if (dailyStats && dailyStats.length > 0) {
            console.log('\n📋 Muestra de datos (primeros 3):');
            dailyStats.slice(0, 3).forEach((stat, i) => {
                console.log(`\n  Registro ${i + 1}:`);
                console.log(`    Creator ID: ${stat.creator_id}`);
                console.log(`    Fecha: ${stat.fecha}`);
                console.log(`    Diamantes: ${stat.diamantes}`);
                console.log(`    Horas: ${stat.duracion_live_horas}`);
                console.log(`    Días válidos: ${stat.dias_validos_live}`);
            });

            // Verificar si TODAS las horas son 0
            const todasHorasCero = dailyStats.every(s => (s.duracion_live_horas || 0) === 0);
            if (todasHorasCero) {
                console.log('\n  ⚠️  PROBLEMA DETECTADO: TODAS las horas son 0!');
            }
        }
    }

    // 2. Verificar creator_bonificaciones
    console.log('\n\n📊 2. VERIFICANDO creator_bonificaciones');
    console.log('=========================================');

    const { data: bonif, error: bonifError } = await supabase
        .from('creator_bonificaciones')
        .select('*')
        .eq('mes_referencia', mesRef)
        .limit(5);

    if (bonifError) {
        console.error('❌ Error:', bonifError);
    } else {
        console.log(`✅ Registros encontrados: ${bonif?.length || 0}`);
        if (bonif && bonif.length > 0) {
            console.log('\n📋 Muestra de datos (primeros 3):');
            bonif.slice(0, 3).forEach((b, i) => {
                console.log(`\n  Registro ${i + 1}:`);
                console.log(`    Creator ID: ${b.creator_id}`);
                console.log(`    Mes: ${b.mes_referencia}`);
                console.log(`    Días live mes: ${b.dias_live_mes}`);
                console.log(`    Horas live mes: ${b.horas_live_mes}`);
                console.log(`    Diamantes mes: ${b.diam_live_mes}`);
                console.log(`    Graduaciones: 100k=${b.grad_100k}, 300k=${b.grad_300k}, 500k=${b.grad_500k}, 1M=${b.grad_1m}`);
            });

            // Verificar si TODAS las horas son 0
            const todasHorasCero = bonif.every(b => (b.horas_live_mes || 0) === 0);
            if (todasHorasCero) {
                console.log('\n  ⚠️  PROBLEMA DETECTADO: TODAS las horas son 0!');
            }
        }
    }

    // 3. Comparar un creador específico
    console.log('\n\n📊 3. COMPARACIÓN DETALLADA (1 creador)');
    console.log('=========================================');

    if (dailyStats && dailyStats.length > 0 && bonif && bonif.length > 0) {
        const creatorId = dailyStats[0].creator_id;

        // Obtener todos los daily_stats del mes para este creador
        const primerDia = new Date(mesRef);
        const ultimoDia = new Date(primerDia.getFullYear(), primerDia.getMonth() + 1, 0);

        const { data: statsDelMes } = await supabase
            .from('creator_daily_stats')
            .select('*')
            .eq('creator_id', creatorId)
            .gte('fecha', primerDia.toISOString().split('T')[0])
            .lte('fecha', ultimoDia.toISOString().split('T')[0])
            .order('fecha');

        const { data: bonifDelCreador } = await supabase
            .from('creator_bonificaciones')
            .select('*')
            .eq('creator_id', creatorId)
            .eq('mes_referencia', mesRef)
            .single();

        console.log(`\n  Creator ID: ${creatorId}`);
        console.log(`\n  📅 Daily Stats del mes (${statsDelMes?.length || 0} registros):`);

        if (statsDelMes && statsDelMes.length > 0) {
            let totalHoras = 0;
            let maxDiamantes = 0;
            let diasConActividad = 0;

            statsDelMes.forEach(s => {
                totalHoras += s.duracion_live_horas || 0;
                maxDiamantes = Math.max(maxDiamantes, s.diamantes || 0);
                if ((s.diamantes || 0) > 0 || (s.duracion_live_horas || 0) >= 1) {
                    diasConActividad++;
                }
                console.log(`    ${s.fecha}: 💎${s.diamantes} | ⏰${s.duracion_live_horas}h | días_válidos=${s.dias_validos_live}`);
            });

            console.log(`\n  📊 Cálculo manual desde daily_stats:`);
            console.log(`    Total horas (SUM): ${totalHoras.toFixed(2)}h`);
            console.log(`    Max diamantes: ${maxDiamantes}`);
            console.log(`    Días con actividad: ${diasConActividad}`);

            if (bonifDelCreador) {
                console.log(`\n  📊 Datos en creator_bonificaciones:`);
                console.log(`    Horas live mes: ${bonifDelCreador.horas_live_mes}h`);
                console.log(`    Diamantes mes: ${bonifDelCreador.diam_live_mes}`);
                console.log(`    Días live mes: ${bonifDelCreador.dias_live_mes}`);

                // Comparar
                console.log(`\n  🔍 COMPARACIÓN:`);
                const horasMatch = Math.abs(totalHoras - (bonifDelCreador.horas_live_mes || 0)) < 0.01;
                const diamMatch = maxDiamantes === (bonifDelCreador.diam_live_mes || 0);
                const diasMatch = diasConActividad === (bonifDelCreador.dias_live_mes || 0);

                console.log(`    Horas: ${horasMatch ? '✅' : '❌'} (manual: ${totalHoras.toFixed(2)}, bonif: ${bonifDelCreador.horas_live_mes})`);
                console.log(`    Diamantes: ${diamMatch ? '✅' : '❌'} (manual: ${maxDiamantes}, bonif: ${bonifDelCreador.diam_live_mes})`);
                console.log(`    Días: ${diasMatch ? '✅' : '❌'} (manual: ${diasConActividad}, bonif: ${bonifDelCreador.dias_live_mes})`);

                if (!horasMatch || !diamMatch || !diasMatch) {
                    console.log('\n  ⚠️  INCONSISTENCIA DETECTADA!');
                }
            } else {
                console.log('\n  ❌ No se encontró registro en creator_bonificaciones para este creador');
            }
        }
    }

    // 4. Resumen de problemas
    console.log('\n\n📋 RESUMEN DE DIAGNÓSTICO');
    console.log('=========================');

    const problemas = [];

    if (dailyStats && dailyStats.every(s => (s.duracion_live_horas || 0) === 0)) {
        problemas.push('❌ CRÍTICO: Todas las horas en creator_daily_stats son 0');
    }

    if (bonif && bonif.every(b => (b.horas_live_mes || 0) === 0)) {
        problemas.push('❌ CRÍTICO: Todas las horas en creator_bonificaciones son 0');
    }

    if (problemas.length === 0) {
        console.log('✅ No se detectaron problemas críticos');
    } else {
        console.log('\n🚨 PROBLEMAS DETECTADOS:\n');
        problemas.forEach(p => console.log(`  ${p}`));
    }

    console.log('\n\n🔧 CAUSA RAÍZ PROBABLE:');
    console.log('  El archivo upload-excel-recommendations/index.ts');
    console.log('  está insertando duracion_live_horas: 0 en lugar de');
    console.log('  usar los datos del Excel (línea 496).');

    console.log('\n💡 SOLUCIÓN:');
    console.log('  Modificar upload-excel para que inserte las horas');
    console.log('  reales del Excel en duracion_live_horas.');
}

diagnosticar().catch(console.error);
