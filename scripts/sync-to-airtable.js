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
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Necesitarás agregar estas variables a tu .env:
// AIRTABLE_API_KEY=tu_api_key_aqui
// AIRTABLE_BASE_ID=tu_base_id_aqui
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Faltan credenciales de Supabase en .env');
    process.exit(1);
}

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('❌ Faltan credenciales de Airtable en .env');
    console.log('\n📝 Agrega a tu .env:');
    console.log('AIRTABLE_API_KEY=tu_api_key');
    console.log('AIRTABLE_BASE_ID=tu_base_id');
    console.log('\n🔗 Obtén tu API key en: https://airtable.com/create/tokens');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const airtable = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// Nombres de las tablas en Airtable
const TABLES = {
    CREADORES: 'Creadores',
    MANAGERS: 'Managers',
    INCENTIVOS: 'Incentivos'
};

// ============================================================================
// FUNCIONES DE TRANSFORMACIÓN
// ============================================================================

/**
 * Determina el segmento basado en el nivel de graduación
 */
function getSegmento(nivel) {
    if (!nivel) return '🌱 Incubadora';

    const nivelNum = parseInt(nivel.replace('G', ''));
    if (nivelNum <= 6) return '🌱 Incubadora';
    if (nivelNum <= 8) return '📈 Profesionalización';
    return '⭐ Élite';
}

/**
 * Calcula el monto del bono de graduación según el hito
 */
function getMontoBonoGraduacion(hito) {
    const montos = {
        'M0.5': 15,
        'M1': 25,
        'M1R': 35,
        'M2': 50,
        'M3': 100,
        'M4': 200,
        'M5': 400
    };
    return montos[hito] || 0;
}

/**
 * Transforma datos de Supabase al formato de Airtable
 */
function transformCreadorData(creator, bonificacion) {
    const nivel = creator.graduacion || 'G0';
    const segmento = getSegmento(nivel);

    // Datos del mes actual
    const diamondsMTD = bonificacion?.diam_live_mes || 0;
    const horasMTD = bonificacion?.horas_live_mes || 0;
    const diasMTD = bonificacion?.dias_live_mes || 0;

    // Datos del mes anterior
    const diamondsAnterior = creator.last_month_diamantes || 0;

    // Motor 1: Graduación
    const cumpleDias = diasMTD >= 7;
    const cumpleHoras = horasMTD >= 15;
    const elegibleGraduacion = segmento === '🌱 Incubadora' && cumpleDias && cumpleHoras;

    // Determinar hito alcanzado (esto debería venir de tu lógica de graduación)
    let hitoAlcanzado = '';
    if (diamondsMTD >= 1000000) hitoAlcanzado = 'M5';
    else if (diamondsMTD >= 500000) hitoAlcanzado = 'M4';
    else if (diamondsMTD >= 300000) hitoAlcanzado = 'M3';
    else if (diamondsMTD >= 100000) hitoAlcanzado = 'M2';
    else if (diamondsMTD >= 50000) hitoAlcanzado = 'M1';
    else if (diamondsMTD >= 25000) hitoAlcanzado = 'M0.5';

    // Motor 2: Actividad (solo para G7-G8)
    const metaDias = 22;
    const metaHoras = 80;
    const progresoDias = diasMTD / metaDias;
    const progresoHoras = horasMTD / metaHoras;

    let estadoActividad = 'N/A';
    if (segmento === '📈 Profesionalización') {
        if (progresoDias >= 0.8 && progresoHoras >= 0.8) {
            estadoActividad = '🟢 Verde';
        } else if (progresoDias >= 0.5 || progresoHoras >= 0.5) {
            estadoActividad = '🟡 Amarillo';
        } else {
            estadoActividad = '🔴 Rojo';
        }
    }

    // Motor 3: Crecimiento (G9+)
    const crecimientoPct = diamondsAnterior > 0
        ? (diamondsMTD - diamondsAnterior) / diamondsAnterior
        : 0;
    const metaCrecimiento = 0.20; // 20%
    const elegibleIncremental = segmento === '⭐ Élite' && crecimientoPct >= (0.70 * metaCrecimiento);

    // Score de prioridad (0-100)
    let scorePrioridad = 0;
    if (segmento === '🌱 Incubadora' && diamondsMTD >= 0.8 * 150000) {
        scorePrioridad = 40;
    } else if (segmento === '📈 Profesionalización' && progresoHoras >= 0.6) {
        scorePrioridad = 30;
    } else if (segmento === '⭐ Élite' && crecimientoPct > 0.3) {
        scorePrioridad = 30;
    }

    return {
        'Creator ID': creator.id,
        'Nombre': creator.nombre,
        'Username TikTok': creator.tiktok_username || '',
        'Manager': creator.manager || 'Sin asignar',
        'Fecha Ingreso': creator.created_at ? new Date(creator.created_at).toISOString().split('T')[0] : null,
        'Días en Agencia': creator.dias_en_agencia || 0,
        'Nivel Actual': nivel,
        // Métricas MTD
        'Diamonds MTD': diamondsMTD,
        'Diamonds Mes Anterior': diamondsAnterior,
        'Horas Live MTD': horasMTD,
        'Días Live MTD': diasMTD,
        'Followers Nuevos': creator.new_followers || 0,
        'Streams': creator.live_streams || 0,
        // Motor 1
        'Cumple Días Mínimos': cumpleDias,
        'Cumple Horas Mínimas': cumpleHoras,
        'Elegible Bono Graduación': elegibleGraduacion,
        'Hito Alcanzado': hitoAlcanzado,
        // Motor 2
        'Meta Días': metaDias,
        'Meta Horas': metaHoras,
        // Motor 3
        'Meta Crecimiento %': metaCrecimiento,
        'Score Prioridad': scorePrioridad
    };
}

// ============================================================================
// FUNCIONES DE SINCRONIZACIÓN
// ============================================================================

/**
 * Sincroniza creadores desde Supabase a Airtable
 */
async function syncCreadores() {
    console.log('\n📊 Sincronizando Creadores...');

    try {
        // 1. Obtener datos de Supabase
        const { data: creators, error: creatorsError } = await supabase
            .from('creators')
            .select('*')
            .order('nombre');

        if (creatorsError) throw creatorsError;

        // 2. Obtener bonificaciones del mes actual
        const mesRef = new Date().toISOString().slice(0, 7) + '-01';
        const { data: bonificaciones, error: bonifError } = await supabase
            .from('creator_bonificaciones')
            .select('*')
            .eq('mes_referencia', mesRef);

        if (bonifError) throw bonifError;

        // Crear mapa de bonificaciones por creator_id
        const bonifMap = new Map(
            (bonificaciones || []).map(b => [b.creator_id, b])
        );

        console.log(`   ✓ ${creators.length} creadores encontrados en Supabase`);

        // 3. Transformar y preparar datos
        const records = creators.map(creator => {
            const bonif = bonifMap.get(creator.id);
            return {
                fields: transformCreadorData(creator, bonif)
            };
        });

        // 4. Obtener registros existentes en Airtable
        console.log('   → Obteniendo registros existentes de Airtable...');
        const existingRecords = await airtable(TABLES.CREADORES)
            .select({ fields: ['Creator ID'] })
            .all();

        const existingMap = new Map(
            existingRecords.map(r => [r.fields['Creator ID'], r.id])
        );

        console.log(`   ✓ ${existingRecords.length} registros existentes en Airtable`);

        // 5. Separar en crear vs actualizar
        const toCreate = [];
        const toUpdate = [];

        for (const record of records) {
            const creatorId = record.fields['Creator ID'];
            const airtableId = existingMap.get(creatorId);

            if (airtableId) {
                toUpdate.push({
                    id: airtableId,
                    fields: record.fields
                });
            } else {
                toCreate.push(record);
            }
        }

        console.log(`   → ${toCreate.length} nuevos, ${toUpdate.length} a actualizar`);

        // 6. Crear nuevos registros (en lotes de 10)
        if (toCreate.length > 0) {
            console.log('   → Creando nuevos registros...');
            for (let i = 0; i < toCreate.length; i += 10) {
                const batch = toCreate.slice(i, i + 10);
                await airtable(TABLES.CREADORES).create(batch);
                console.log(`      ✓ Creados ${Math.min(i + 10, toCreate.length)}/${toCreate.length}`);
            }
        }

        // 7. Actualizar registros existentes (en lotes de 10)
        if (toUpdate.length > 0) {
            console.log('   → Actualizando registros...');
            for (let i = 0; i < toUpdate.length; i += 10) {
                const batch = toUpdate.slice(i, i + 10);
                await airtable(TABLES.CREADORES).update(batch);
                console.log(`      ✓ Actualizados ${Math.min(i + 10, toUpdate.length)}/${toUpdate.length}`);
            }
        }

        console.log('   ✅ Creadores sincronizados exitosamente\n');

        return {
            total: creators.length,
            created: toCreate.length,
            updated: toUpdate.length
        };

    } catch (error) {
        console.error('   ❌ Error sincronizando creadores:', error.message);
        throw error;
    }
}

/**
 * Sincroniza managers (placeholder - se puede expandir)
 */
async function syncManagers() {
    console.log('📋 Sincronizando Managers...');
    console.log('   ℹ️  Los managers se actualizan automáticamente vía relaciones en Airtable');
    console.log('   ✅ Managers OK\n');
}

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================

async function main() {
    console.log('🚀 Iniciando sincronización Supabase → Airtable');
    console.log('⏰ ' + new Date().toLocaleString());
    console.log('━'.repeat(60));

    try {
        const results = {
            creadores: await syncCreadores(),
            managers: await syncManagers()
        };

        console.log('━'.repeat(60));
        console.log('✅ Sincronización completada exitosamente');
        console.log('\n📊 Resumen:');
        console.log(`   Creadores: ${results.creadores.total} total`);
        console.log(`   - Nuevos: ${results.creadores.created}`);
        console.log(`   - Actualizados: ${results.creadores.updated}`);
        console.log('\n🔗 Ver en Airtable: https://airtable.com/' + AIRTABLE_BASE_ID);

    } catch (error) {
        console.error('\n❌ Error en sincronización:', error);
        process.exit(1);
    }
}

// Ejecutar
main();
