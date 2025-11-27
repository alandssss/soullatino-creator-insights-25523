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

async function checkAllTables() {
    console.log('🔍 VERIFICACIÓN COMPLETA DE TODAS LAS TABLAS\n');
    console.log('='.repeat(60) + '\n');

    // 1. Verificar creator_daily_stats
    const { data: dailyStats, count: dailyCount } = await supabase
        .from('creator_daily_stats')
        .select('*', { count: 'exact' })
        .order('fecha', { ascending: false })
        .limit(5);

    console.log('1️⃣ CREATOR_DAILY_STATS:');
    console.log(`   Total: ${dailyCount || 0} registros`);
    if (dailyStats && dailyStats.length > 0) {
        console.log('   Últimos 5:');
        dailyStats.forEach(s => {
            console.log(`      ${s.fecha}: ${s.diamantes?.toLocaleString()} 💎 (creator: ${s.creator_id?.substring(0, 8)}...)`);
        });
    }
    console.log('');

    // 2. Verificar creator_bonificaciones
    const { data: bonif, count: bonifCount } = await supabase
        .from('creator_bonificaciones')
        .select('*', { count: 'exact' })
        .order('diam_live_mes', { ascending: false })
        .limit(5);

    console.log('2️⃣ CREATOR_BONIFICACIONES:');
    console.log(`   Total: ${bonifCount || 0} registros`);
    if (bonif && bonif.length > 0) {
        console.log('   Top 5:');
        bonif.forEach((b, i) => {
            console.log(`      ${i + 1}. ${b.diam_live_mes?.toLocaleString()} 💎 (mes: ${b.mes_referencia})`);
        });
    }
    console.log('');

    // 3. Verificar tabla creators
    const { data: creatorsData, count: creatorsCount } = await supabase
        .from('creators')
        .select('id, nombre, tiktok_username, diamantes, dias_live, horas_live', { count: 'exact' })
        .order('diamantes', { ascending: false, nullsFirst: false })
        .limit(5);

    console.log('3️⃣ CREATORS (tabla principal):');
    console.log(`   Total: ${creatorsCount || 0} creadores`);
    if (creatorsData && creatorsData.length > 0) {
        console.log('   Top 5 por diamantes:');
        creatorsData.forEach((c, i) => {
            console.log(`      ${i + 1}. ${c.tiktok_username || c.nombre}`);
            console.log(`         💎 ${c.diamantes?.toLocaleString() || 0} | 📅 ${c.dias_live || 0}d | ⏰ ${c.horas_live || 0}h`);
        });
    }
    console.log('');

    console.log('='.repeat(60));
    console.log('\n📋 CONCLUSIÓN:');
    if (dailyCount === 0 && bonifCount === 0) {
        console.log('   ❌ NO HAY DATOS en daily_stats ni bonificaciones');
        console.log('   ⚠️  El Excel NO se está procesando correctamente');
        console.log('   ✅ Los valores que ves (6.5M) son CACHÉ del navegador');
    } else {
        console.log('   ✅ HAY DATOS - el problema es otro');
    }
}

checkAllTables().catch(console.error);
