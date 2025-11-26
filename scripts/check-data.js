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

async function checkData() {
    console.log('🔍 Verificando datos...\n');

    // Ver top 3 creadores
    const { data: topCreators } = await supabase
        .from('creators')
        .select('id, nombre, tiktok_username, diamantes, dias_live, horas_live')
        .order('diamantes', { ascending: false })
        .limit(3);

    console.log('📊 Top 3 creadores en tabla "creators":');
    topCreators?.forEach((c, i) => {
        console.log(`${i + 1}. ${c.tiktok_username || c.nombre}`);
        console.log(`   Diamantes: ${c.diamantes?.toLocaleString()}`);
        console.log(`   Días: ${c.dias_live}, Horas: ${c.horas_live}\n`);
    });

    // Ver datos de daily_stats
    const { data: dailyStats, count } = await supabase
        .from('creator_daily_stats')
        .select('*', { count: 'exact' })
        .gte('fecha', '2025-11-01')
        .limit(5);

    console.log(`\n📅 Registros en creator_daily_stats (Nov 2025): ${count || 0}`);
    if (dailyStats && dailyStats.length > 0) {
        console.log('Primeros 5:');
        dailyStats.forEach(s => {
            console.log(`  - ${s.creator_username}: ${s.diamantes?.toLocaleString()} 💎 (${s.fecha})`);
        });
    }

    // Ver bonificaciones
    const { data: bonif, count: bonifCount } = await supabase
        .from('creator_bonificaciones')
        .select('*', { count: 'exact' })
        .eq('mes_referencia', '2025-11-01')
        .limit(3);

    console.log(`\n💰 Bonificaciones (Nov 2025): ${bonifCount || 0}`);
    if (bonif && bonif.length > 0) {
        bonif.forEach(b => {
            console.log(`  - Creator ${b.creator_id}: ${b.diam_live_mes?.toLocaleString()} 💎`);
        });
    }
}

checkData().catch(console.error);
