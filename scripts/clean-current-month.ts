import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Leer variables de entorno
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanCurrentMonthData() {
    console.log('🧹 Limpiando datos del mes actual...\n');

    // Obtener fecha del mes actual
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

    console.log(`📅 Rango: ${firstDayOfMonth} a ${lastDayOfMonth}\n`);

    // 1. Eliminar creator_daily_stats del mes actual
    console.log('1️⃣ Eliminando creator_daily_stats...');
    const { error: dailyError, count: dailyCount } = await supabase
        .from('creator_daily_stats')
        .delete({ count: 'exact' })
        .gte('fecha', firstDayOfMonth)
        .lte('fecha', lastDayOfMonth);

    if (dailyError) {
        console.error('❌ Error:', dailyError.message);
    } else {
        console.log(`✅ Eliminados ${dailyCount || 0} registros de creator_daily_stats\n`);
    }

    // 2. Eliminar creator_bonificaciones del mes actual
    console.log('2️⃣ Eliminando creator_bonificaciones...');
    const { error: bonifError, count: bonifCount } = await supabase
        .from('creator_bonificaciones')
        .delete({ count: 'exact' })
        .eq('mes_referencia', firstDayOfMonth);

    if (bonifError) {
        console.error('❌ Error:', bonifError.message);
    } else {
        console.log(`✅ Eliminados ${bonifCount || 0} registros de creator_bonificaciones\n`);
    }

    // 3. Verificar que se eliminaron
    console.log('3️⃣ Verificando...');
    const { count: remainingDaily } = await supabase
        .from('creator_daily_stats')
        .select('*', { count: 'exact', head: true })
        .gte('fecha', firstDayOfMonth)
        .lte('fecha', lastDayOfMonth);

    const { count: remainingBonif } = await supabase
        .from('creator_bonificaciones')
        .select('*', { count: 'exact', head: true })
        .eq('mes_referencia', firstDayOfMonth);

    console.log(`📊 Registros restantes:`);
    console.log(`   - creator_daily_stats: ${remainingDaily || 0}`);
    console.log(`   - creator_bonificaciones: ${remainingBonif || 0}\n`);

    if ((remainingDaily || 0) === 0 && (remainingBonif || 0) === 0) {
        console.log('✅ ¡Limpieza completada! Ahora puedes subir el Excel de nuevo.');
    } else {
        console.log('⚠️ Aún quedan registros. Puede que necesites permisos de admin.');
    }
}

cleanCurrentMonthData().catch(console.error);
