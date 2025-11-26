import { createClient } from '@supabase/supabase-js';
import Airtable from 'airtable';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Usamos la key pública para lectura, si necesitamos escritura role service role sería mejor pero para esto basta
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = 'DailyMetrics';

if (!SUPABASE_URL || !SUPABASE_KEY || !AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('❌ Faltan credenciales en .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const airtable = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// ============================================================================
// UTILS
// ============================================================================

function getYesterday(dateString) {
    const date = dateString ? new Date(dateString) : new Date();
    if (!dateString) date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
}

function getDayBefore(dateString) {
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
}

// ============================================================================
// MAIN LOGIC
// ============================================================================

async function syncDailyMetrics() {
    // 1. Determinar fecha objetivo (ayer por defecto)
    const args = process.argv.slice(2);
    const dateArg = args.find(arg => arg.startsWith('--date='));
    const targetDate = dateArg ? dateArg.split('=')[1] : getYesterday();

    console.log(`🚀 Iniciando sincronización diaria para: ${targetDate}`);

    try {
        // 2. Obtener creadores
        const { data: creators, error: creatorsError } = await supabase
            .from('creators')
            .select('id, nombre, tiktok_username, manager, graduacion');

        if (creatorsError) throw creatorsError;

        const creatorsMap = new Map(creators.map(c => [c.id, c]));
        console.log(`   ✓ ${creators.length} creadores activos`);

        // 3. Obtener stats del día objetivo (MTD acumulado)
        const { data: statsToday, error: statsError } = await supabase
            .from('creator_daily_stats')
            .select('*')
            .eq('fecha', targetDate);

        if (statsError) throw statsError;

        // 4. Obtener stats del día anterior (para calcular deltas)
        // Si es día 1 del mes, el delta es el valor del día 1 (asumiendo reset)
        const isFirstDay = targetDate.endsWith('-01');
        let statsYesterday = [];

        if (!isFirstDay) {
            const prevDate = getDayBefore(targetDate);
            const { data: prevStats, error: prevError } = await supabase
                .from('creator_daily_stats')
                .select('*')
                .eq('fecha', prevDate);

            if (prevError) throw prevError;
            statsYesterday = prevStats || [];
        }

        const statsYesterdayMap = new Map(statsYesterday.map(s => [s.creator_id, s]));

        // 5. Procesar registros
        const recordsToUpsert = [];

        for (const stat of statsToday) {
            const creator = creatorsMap.get(stat.creator_id);
            if (!creator) continue;

            const prevStat = statsYesterdayMap.get(stat.creator_id) || { diamantes: 0, duracion_live_horas: 0 };

            // Calcular deltas (evitar negativos si hay reinicios raros)
            const diamondsDaily = Math.max(0, (stat.diamantes || 0) - (prevStat.diamantes || 0));
            const hoursDaily = Math.max(0, (stat.duracion_live_horas || 0) - (prevStat.duracion_live_horas || 0));

            // Si es día 1, tomamos el valor absoluto del día
            const finalDiamonds = isFirstDay ? (stat.diamantes || 0) : diamondsDaily;
            const finalHours = isFirstDay ? (stat.duracion_live_horas || 0) : hoursDaily;

            // Solo enviar si hubo actividad o si queremos registro de todos
            // Para no saturar Airtable, enviamos si hubo live o diamantes > 0
            if (finalDiamonds > 0 || finalHours > 0) {
                recordsToUpsert.push({
                    fields: {
                        'ID Combinado': `${stat.creator_id}-${targetDate}`, // Clave única
                        'Creator ID': stat.creator_id,
                        'Fecha': targetDate,
                        'Nombre': creator.nombre,
                        'Username': creator.tiktok_username,
                        'Manager': creator.manager || 'Sin Asignar',
                        'Nivel': creator.graduacion || 'G0',
                        'Diamonds Dia': finalDiamonds,
                        'Horas Live Dia': finalHours,
                        'Hizo Live': finalHours > 0 || finalDiamonds > 0 ? true : false
                    }
                });
            }
        }

        console.log(`   → ${recordsToUpsert.length} registros con actividad para sincronizar`);

        // 6. Enviar a Airtable (Batch Upsert)
        // Nota: Airtable API estándar no tiene upsert nativo fácil en JS SDK sin lógica extra,
        // pero podemos usar create typecast o buscar primero.
        // Para eficiencia en este script simple, usaremos un enfoque de "Buscar y Actualizar o Crear"
        // O mejor, si la tabla tiene un campo Primary Key configurado, podemos intentar simplificar.
        // Asumiremos que el usuario configurará 'ID Combinado' como campo primario o único.

        // Estrategia robusta: Leer todos los records del día en Airtable y actualizar/crear
        const existingRecords = await airtable(TABLE_NAME)
            .select({
                filterByFormula: `{Fecha} = '${targetDate}'`
            })
            .all();

        const existingMap = new Map(existingRecords.map(r => [r.fields['ID Combinado'], r.id]));

        const toCreate = [];
        const toUpdate = [];

        for (const record of recordsToUpsert) {
            const key = record.fields['ID Combinado'];
            const existingId = existingMap.get(key);

            if (existingId) {
                toUpdate.push({ id: existingId, fields: record.fields });
            } else {
                toCreate.push(record);
            }
        }

        // Ejecutar lotes
        if (toCreate.length > 0) {
            console.log(`   → Creando ${toCreate.length} nuevos registros...`);
            for (let i = 0; i < toCreate.length; i += 10) {
                await airtable(TABLE_NAME).create(toCreate.slice(i, i + 10));
            }
        }

        if (toUpdate.length > 0) {
            console.log(`   → Actualizando ${toUpdate.length} registros existentes...`);
            for (let i = 0; i < toUpdate.length; i += 10) {
                await airtable(TABLE_NAME).update(toUpdate.slice(i, i + 10));
            }
        }

        console.log('✅ Sincronización diaria completada');

    } catch (error) {
        console.error('❌ Error en sincronización diaria:', error);
        process.exit(1);
    }
}

syncDailyMetrics();
