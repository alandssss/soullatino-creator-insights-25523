// ============= SUPABASE EDGE FUNCTION: upload-excel-recommendations =============
// 
// CORRECCIÓN (2025-11-26): Este function ahora inserta TODOS los datos del Excel:
// - Diamantes (valores MTD acumulativos)
// - Horas (valores MTD acumulativos) ← CORREGIDO
// - Días válidos (1 si hubo actividad ese día)
// 
// El Excel de TikTok contiene valores Month-To-Date (MTD) acumulativos, no deltas diarios.
// Por lo tanto, usamos Math.max() en calculate-bonificaciones para obtener el valor más reciente.
// 
// Flujo correcto:
// 1. Este function inserta diamantes y horas MTD del Excel
// 2. calculate-bonificaciones usa MAX para obtener el valor más reciente del mes
// 3. Frontend lee de creator_bonificaciones para mostrar datos correctos
// 
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
import { rateLimit } from "../_shared/rate-limit.ts";
import { withCORS, handleCORSPreflight } from "../_shared/cors.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");
  console.log('[upload-excel] === INICIO ===');

  if (req.method === 'OPTIONS') {
    return handleCORSPreflight(origin);
  }

  // Rate limiting: 30 req/min (upload pesado pero menos estricto para admins)
  const rl = await rateLimit(req, { key: "upload-excel-recommendations", limitPerMin: 30 });
  if (!rl.ok) return withCORS(rl.response!, origin);

  try {
    // Reactivar autenticación y verificación de rol
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('[upload-excel] NO auth header');
      return withCORS(
        new Response(JSON.stringify({ error: 'No autorizado - Token requerido' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }),
        origin
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAuth = createClient(supabaseUrl, supabaseKey);

    // Verificar usuario autenticado
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    console.log('[upload-excel] User verificado:', user?.id, 'Error:', userError);

    if (userError || !user) {
      console.error('[upload-excel] Token inválido:', userError);
      return withCORS(
        new Response(JSON.stringify({ error: 'Token inválido' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }),
        origin
      );
    }

    // Verificar rol admin/manager
    const { data: roleData } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    console.log('[upload-excel] Rol del usuario:', roleData?.role);

    if (!roleData || !['admin', 'manager'].includes(roleData.role)) {
      console.error('[upload-excel] Permisos insuficientes:', roleData?.role);
      return withCORS(
        new Response(JSON.stringify({ error: 'Requiere rol admin o manager' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }),
        origin
      );
    }

    // Initialize Supabase client with Service Role Key for database operations
    // supabaseUrl and supabaseKey are already declared above
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[upload-excel] Auth checks bypassed for emergency fix');

    console.log('[upload-excel] Usuario autorizado, procesando archivo...');

    // Obtener datos del form
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('No file uploaded');
    }

    console.log('[STEP 1] ===  Processing file:', file.name, 'Size:', file.size, 'bytes');

    // Leer el archivo Excel
    const fileBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(fileBuffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    console.log('[STEP 2] === Excel parsed. Rows found:', rawData.length);

    // Función para parsear horas en diferentes formatos
    function parseHours(input: any): number {
      if (!input) return 0;

      const str = String(input).trim();

      // Formato: "125h 8min 10s"
      const hmsMatch = str.match(/(\d+)h\s*(\d+)?min\s*(\d+)?s?/i);
      if (hmsMatch) {
        const hours = parseInt(hmsMatch[1] || '0');
        const mins = parseInt(hmsMatch[2] || '0');
        const secs = parseInt(hmsMatch[3] || '0');
        return hours + (mins / 60) + (secs / 3600);
      }

      // Formato: "8:30:00" o "8:30"
      const timeMatch = str.match(/^(\d+):(\d+)(?::(\d+))?$/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const mins = parseInt(timeMatch[2]);
        const secs = parseInt(timeMatch[3] || '0');
        return hours + (mins / 60) + (secs / 3600);
      }

      // Formato: "90min"
      const minsMatch = str.match(/(\d+)\s*min/i);
      if (minsMatch) {
        return parseInt(minsMatch[1]) / 60;
      }

      // Número simple
      const numMatch = str.replace(/,/g, '');
      const num = parseFloat(numMatch);
      return isNaN(num) ? 0 : num;
    }

    // Función para parsear números con comas
    function parseNumber(input: any): number {
      if (!input) return 0;
      const str = String(input).replace(/,/g, '');
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    }

    // Función para normalizar nombres de columnas
    const normalize = (s: string) =>
      s.normalize('NFKC').trim().toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
        .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n');

    // Validar que el Excel tenga columnas reconocibles
    if (rawData.length > 0) {
      const firstRow = rawData[0] as Record<string, any>;
      const headers = Object.keys(firstRow).map(normalize);
      console.log('[DEBUG] Excel columns found:', Object.keys(firstRow));
      console.log('[DEBUG] Normalized headers:', headers);

      const hasNameColumn = headers.some(h =>
        ['nombre', 'creador', 'usuario', 'username', 'creator name', 'name', 'tiktok', 'tiktok username', 'nombre de usuario del creador', 'creators username', 'id del creador', 'creator id'].includes(h)
      );

      if (!hasNameColumn) {
        return withCORS(
          new Response(
            JSON.stringify({
              error: 'excel_sin_nombre',
              message: 'El Excel debe contener una columna de nombre de usuario',
              detalles: 'Columnas esperadas: "Nombre de usuario del creador", "Username", "Creador", "TikTok", etc.',
              columnas_encontradas: Object.keys(firstRow).slice(0, 10),
              columnas_normalizadas: headers.slice(0, 10),
              aliases_buscados: ['nombre', 'usuario', 'username', 'nombre de usuario del creador', 'tiktok', 'creator name']
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          ),
          origin
        );
      }
    }

    const alias: Record<string, string> = {
      // Nombres de usuario (AMPLIADO - TikTok español/inglés)
      'nombre': 'creator_username',
      'name': 'creator_username',
      'creador': 'creator_username',
      'usuario': 'creator_username',
      'username': 'creator_username',
      'creator name': 'creator_username',
      'handle': 'creator_username',
      '@': 'creator_username',
      'tiktok': 'creator_username',
      'tiktok username': 'creator_username',
      'nombre de usuario del creador': 'creator_username',
      'creators username': 'creator_username',
      "creator's username": 'creator_username', // Con apóstrofe (Excel real)
      'creator s username': 'creator_username', // Con espacio
      'creatorusername': 'creator_username', // Sin espacios
      'id del creador': 'creator_username',
      'creator id': 'creator_username',

      // Teléfonos
      'telefono': 'phone_e164',
      'tel': 'phone_e164',
      'phone': 'phone_e164',
      'celular': 'phone_e164',

      // Días (AMPLIADO - TikTok español completo)
      'dias en live': 'dias_actuales',
      'dias': 'dias_actuales',
      'days': 'dias_actuales',
      'days live': 'dias_actuales',
      'dias live': 'dias_actuales',
      'dias validos de emisiones live': 'dias_actuales',
      'valid go live days': 'dias_actuales', // ✅ Columna exacta del Excel
      'dias validos de emisiones live del mes pasado': 'dias_actuales',
      'valid go live days last month': 'dias_actuales',

      // Horas (AMPLIADO - TikTok español completo)
      'duracion live': 'horas_actuales',
      'horas': 'horas_actuales',
      'hours': 'horas_actuales',
      'live hours': 'horas_actuales',
      'live duration': 'horas_actuales', // Columna "LIVE duration" del Excel real
      'tiempo': 'horas_actuales',
      'duracion de live': 'horas_actuales',
      'duracion de emisiones live (en horas) durante el ultimo mes': 'horas_actuales',
      'live duration (hours) last month': 'horas_actuales',

      // Diamantes
      'diamantes': 'diamantes_actuales',
      'diamonds': 'diamantes_actuales',
      'diam': 'diamantes_actuales',

      // Estado de graduación
      'estado de graduacion': 'estado_graduacion',
      'graduation': 'estado_graduacion',
      'graduacion': 'estado_graduacion',
      'estado': 'estado_graduacion',
      'graduation status': 'estado_graduacion',

      // Manager/Agente (AMPLIADO)
      'manager': 'manager',
      'agente': 'manager',
      'creator network manager': 'manager',

      // Grupo
      'grupo': 'grupo',
      'group': 'grupo',

      // Nuevos seguidores
      'nuevos seguidores': 'nuevos_seguidores',
      'new followers': 'nuevos_seguidores',
      'nuevos seguidores en el ultimo mes': 'nuevos_seguidores',
      'new followers last month': 'nuevos_seguidores',

      // Emisiones/Partidas
      'emisiones live': 'emisiones_live',
      'live streams': 'emisiones_live',
      'emisiones live en el ultimo mes': 'emisiones_live',
      'live streams last month': 'emisiones_live',
      'partidas': 'partidas',
      'matches': 'partidas',
      'diamantes de partidas': 'diamantes_partidas'
    };

    // Fecha de referencia (hoy en America/Chihuahua)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chihuahua' });

    // Mapear y normalizar datos (sin asignar IDs aún)
    const mapped = (rawData as any[]).map((row, index) => {
      const out: any = {};
      for (const key of Object.keys(row)) {
        const normalizedKey = alias[normalize(key)] ?? key.trim();
        out[normalizedKey] = row[key];
      }

      // Log detallado para debugging (solo primera fila)
      if (index === 0) {
        console.log('[DEBUG] First row raw columns:', Object.keys(row));
        console.log('[DEBUG] First row normalized out:', JSON.stringify(out, null, 2));
      }

      // Buscar username de forma flexible
      const username = String(
        out.creator_username ??
        out.nombre ??
        out.Nombre ??
        out.creador ??
        out.usuario ??
        out.username ??
        ''
      ).trim();

      if (!username) {
        if (index === 0) console.log('[DEBUG] No username found in first row');
        return null as any;
      }

      if (index === 0) console.log('[DEBUG] Username found:', username);

      return {
        creator_username: username,
        phone_e164: String(out.phone_e164 ?? '').trim() || null,
        dias_actuales: parseNumber(out.dias_actuales),
        horas_actuales: parseHours(out.horas_actuales),
        diamantes_actuales: parseNumber(out.diamantes_actuales),
        estado_graduacion: String(out.estado_graduacion ?? '').trim() || null,
        manager: String(out.manager ?? '').trim() || null,
        grupo: String(out.grupo ?? '').trim() || null,
        fecha: today,
      } as const;
    }).filter(Boolean) as Array<{
      creator_username: string;
      phone_e164: string | null;
      dias_actuales: number;
      horas_actuales: number;
      diamantes_actuales: number;
      estado_graduacion: string | null;
      manager: string | null;
      grupo: string | null;
      fecha: string;
    }>;

    console.log('[STEP 3] === Mapped rows:', mapped.length, 'out of', rawData.length);

    if (!mapped.length) {
      const sampleRow = rawData[0] || {};
      return withCORS(
        new Response(
          JSON.stringify({
            error: 'Sin filas válidas después de normalizar',
            hint: 'Verifica que el Excel tenga columnas: Nombre, Dias, Horas, Diamantes',
            columns_found: Object.keys(sampleRow),
            expected_columns: ['Nombre/Usuario', 'Dias en Live', 'Horas', 'Diamantes'],
            debug_info: 'Revisa los logs para ver qué columnas fueron detectadas'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, must-revalidate' }
          }
        ),
        origin
      );
    }

    // Resolver creator_id reales desde tabla creators (por username o teléfono)
    const usernames = Array.from(new Set(mapped.map(r => r.creator_username.replace(/^@/, '').toLowerCase())));
    const phones = Array.from(new Set(mapped.map(r => r.phone_e164).filter((p): p is string => !!p)));

    const { data: creatorsByUser, error: creatorsByUserError } = await supabase
      .from('creators')
      .select('id, tiktok_username, telefono');

    if (creatorsByUserError) {
      console.error('[upload-excel-recommendations] Error fetching creators:', creatorsByUserError);
      return withCORS(
        new Response(
          JSON.stringify({ error: creatorsByUserError.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      );
    }

    const byUsername = new Map<string, string>();
    const byPhone = new Map<string, string>();
    (creatorsByUser || []).forEach(c => {
      if (c.tiktok_username) byUsername.set(String(c.tiktok_username).toLowerCase(), c.id);
      if (c.telefono) byPhone.set(String(c.telefono), c.id);
    });

    // Actualizar campos adicionales de creators (estado_graduacion, manager, grupo)
    for (const r of mapped) {
      const keyU = r.creator_username.replace(/^@/, '').toLowerCase();
      const creatorId = byUsername.get(keyU) || (r.phone_e164 ? byPhone.get(r.phone_e164) : undefined);

      if (creatorId && (r.estado_graduacion || r.manager || r.grupo)) {
        const updateData: any = {};
        if (r.estado_graduacion) updateData.estado_graduacion = r.estado_graduacion;
        if (r.manager) updateData.manager = r.manager;
        if (r.grupo) updateData.grupo = r.grupo;

        const { error: updateErr } = await supabase
          .from('creators')
          .update(updateData)
          .eq('id', creatorId);

        if (updateErr) {
          console.warn(`[upload-excel-recommendations] Warning updating creator ${r.creator_username}:`, updateErr);
        }
      }
    }

    // Sanitizar username para usar como creator_id
    const sanitizeUsername = (u: string): string =>
      u.trim().toLowerCase().replace(/[^a-z0-9_\.]/g, '_').substring(0, 50);

    // Detectar faltantes y crear creadores mínimos (DEDUPLICAR por username)
    const missingMap = new Map<string, { username: string; phone: string | null }>();
    let totalMissingOccurrences = 0;

    for (const r of mapped) {
      const keyU = r.creator_username.replace(/^@/, '').toLowerCase();
      const foundId = byUsername.get(keyU) || (r.phone_e164 ? byPhone.get(r.phone_e164) : undefined);

      if (!foundId) {
        totalMissingOccurrences++;
        // Solo agregar si no existe O si el teléfono actual es mejor (no vacío vs vacío)
        const existing = missingMap.get(keyU);
        if (!existing || (!existing.phone && r.phone_e164)) {
          missingMap.set(keyU, { username: keyU, phone: r.phone_e164 });
        }
      }
    }

    const missing = Array.from(missingMap.values());

    // Log si hubo deduplicación
    if (totalMissingOccurrences > missing.length) {
      console.log(
        `[upload-excel-recommendations] ⚠️ Deduplicados ${totalMissingOccurrences - missing.length} creadores repetidos en Excel (${totalMissingOccurrences} ocurrencias → ${missing.length} únicos)`
      );
    }

    let creatorsCreated = 0;
    let created: any[] | null = null;
    let createErr: any = null;

    if (missing.length) {
      console.log(`[upload-excel-recommendations] Creando/actualizando ${missing.length} creadores únicos faltantes`);

      const toCreate = missing.map(m => ({
        nombre: m.username,
        tiktok_username: m.username,
        telefono: m.phone,
        creator_id: sanitizeUsername(m.username) // campo requerido (texto sanitizado)
      }));

      // Usar INSERT porque upsert falla sin constraint único en creator_id
      const result = await supabase
        .from('creators')
        .insert(toCreate)
        .select('id, tiktok_username, telefono');

      created = result.data;
      createErr = result.error;

      if (createErr) {
        console.error('[upload-excel-recommendations] Error creating/updating creators:', createErr);
        return withCORS(
          new Response(
            JSON.stringify({ error: createErr.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          ),
          origin
        );
      }

      creatorsCreated = created?.length || 0;
      console.log('[STEP 4] === Creators created/updated:', creatorsCreated);

      (created || []).forEach(c => {
        if (c.tiktok_username) byUsername.set(String(c.tiktok_username).toLowerCase(), c.id);
        if (c.telefono) byPhone.set(String(c.telefono), c.id);
      });
    }

    // Construir filas finales para daily_stats + track no-match
    const noMatch: any[] = [];  // ⭐ Track Excel rows without matching creator

    const dailyRows = mapped.map(r => {
      const keyU = r.creator_username.replace(/^@/, '').toLowerCase();
      const creatorId = byUsername.get(keyU) || (r.phone_e164 ? byPhone.get(r.phone_e164) : undefined);

      if (!creatorId) {
        console.warn(`[upload-excel-recommendations] No creator found for username "${r.creator_username}" phone "${r.phone_e164}"`);
        noMatch.push({
          username: r.creator_username,
          phone: r.phone_e164,
          diamantes: r.diamantes_actuales
        });
        return null;
      }

      // ✅ CORRECCIÓN CRÍTICA: Usar horas reales del Excel (son valores MTD acumulativos)
      // El Excel contiene valores Month-To-Date, no deltas diarios
      // ✅ CORRECCIÓN CRÍTICA 2: Usar días válidos reales del Excel (columna "Valid go LIVE days")
      const diasValidos = r.dias_actuales ?? 0;

      return {
        creator_id: creatorId,
        fecha: today,
        diamantes: r.diamantes_actuales, // MTD acumulativo
        duracion_live_horas: r.horas_actuales, // MTD acumulativo (CORREGIDO)
        dias_validos_live: diasValidos, // ✅ Usar valor directo del Excel
        creator_username: r.creator_username,
        phone_e164: r.phone_e164
      };
    }).filter(Boolean) as any[];

    // ✅ Deduplicar por (creator_id, fecha) - conservar última ocurrencia
    const dailyRowsMap = new Map<string, any>();
    for (const row of dailyRows) {
      const key = `${row.creator_id}_${row.fecha}`;
      dailyRowsMap.set(key, row); // Última ocurrencia sobreescribe anteriores
    }
    const dailyRowsDeduped = Array.from(dailyRowsMap.values());

    // Log de deduplicación
    const duplicatesCount = dailyRows.length - dailyRowsDeduped.length;
    if (duplicatesCount > 0) {
      console.warn(`[upload-excel-recommendations] ⚠️ Found ${duplicatesCount} duplicate rows in Excel - kept last occurrence`);
    }
    console.log('[STEP 5] === Daily rows prepared:', dailyRowsDeduped.length, '( deduplicated from', dailyRows.length, ')');

    if (!dailyRowsDeduped.length) {
      return withCORS(
        new Response(
          JSON.stringify({ error: 'No se pudieron resolver creadores para las filas cargadas' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      );
    }

    // @snapshot: Delete ALL records for this date to replace complete snapshot
    console.log('[STEP 6] === Deleting existing records for date:', today);
    const { data: deletedData, error: delErr } = await supabase
      .from('creator_daily_stats')
      .delete()
      .eq('fecha', today)
      .select();

    if (delErr) {
      console.error('[STEP 6] ERROR during DELETE:', delErr);
      throw new Error(`Failed to delete existing records: ${delErr.message}`);
    }
    console.log('[STEP 6] Successfully deleted', deletedData?.length || 0, 'existing records');

    // @compat: Use INSERT instead of UPSERT to avoid silent failures
    console.log('[STEP 7] === Inserting', dailyRowsDeduped.length, 'records into creator_daily_stats');
    console.log('[STEP 7] Sample record:', dailyRowsDeduped[0]);

    const { data: insertedData, error: insertErr } = await supabase
      .from('creator_daily_stats')
      .insert(dailyRowsDeduped)
      .select();

    if (insertErr) {
      console.error('[STEP 7] ❌ INSERT ERROR:', insertErr);
      console.error('[STEP 7] Error details:', JSON.stringify(insertErr, null, 2));
      return withCORS(
        new Response(
          JSON.stringify({
            error: `Failed to insert data: ${insertErr.message}`,
            code: insertErr.code,
            details: insertErr.details
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      );
    }

    console.log('[STEP 7] ✅ INSERT completed. Returned rows:', insertedData?.length || 0);
    if (insertedData && insertedData.length > 0) {
      console.log('[STEP 7] Sample inserted record:', insertedData[0]);
    }

    // ✅ VALIDACIÓN POST-INSERT: Verificar que los datos realmente se guardaron
    console.log('[STEP 8] === Verifying data persistence...');
    const { data: verifyData, error: verifyError, count: verifyCount } = await supabase
      .from('creator_daily_stats')
      .select('*', { count: 'exact' })
      .eq('fecha', today);

    if (verifyError) {
      console.error('[STEP 8] ❌ VERIFICATION ERROR:', verifyError);
    } else {
      console.log('[STEP 8] ✅ VERIFIED:', verifyCount, 'records in DB for', today);
      if (verifyData && verifyData.length > 0) {
        console.log('[STEP 8] Sample verified record:', verifyData[0]);
      }
    }

    // ⚠️ CRITICAL: Si no hay datos después del insert, fallar explícitamente
    if (!verifyCount || verifyCount === 0) {
      console.error('[STEP 8] ❌❌❌ CRITICAL FAILURE: INSERT succeeded but verification found 0 records!');
      console.error('[STEP 8] This should be IMPOSSIBLE. Check RLS policies or database triggers.');
      return withCORS(
        new Response(
          JSON.stringify({
            error: 'CRITICAL: Data persistence failed - INSERT succeeded but 0 records in DB',
            debug: {
              inserted: insertedData?.length || 0,
              verified: verifyCount || 0,
              date: today,
              hint: 'Possible RLS policy blocking reads or cascade delete triggered'
            }
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      );
    }

    console.log('[STEP 8] ✅✅✅ SUCCESS: Verified', verifyCount, 'records persisted to database');

    // Refrescar la vista materializada
    console.log('[upload-excel-recommendations] Refreshing materialized view...');
    const { error: refreshError } = await supabase.rpc('refresh_recommendations_today');

    if (refreshError) {
      console.error('[upload-excel-recommendations] Error refreshing view:', refreshError);
    }

    // ✅ CRITICAL FIX: Call calculate-bonificaciones-predictivo to populate creator_bonificaciones
    console.log('[upload-excel-recommendations] Calculating bonificaciones for current month...');
    const currentMonth = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chihuahua' }).substring(0, 7) + '-01'; // YYYY-MM-01

    const { data: bonifData, error: bonifError } = await supabase.functions.invoke('calculate-bonificaciones-predictivo', {
      body: { mes_referencia: currentMonth }
    });

    if (bonifError) {
      console.error('[upload-excel-recommendations] Error calculating bonificaciones:', bonifError);
      // Don't fail the entire upload, just warn
    } else {
      console.log('[upload-excel-recommendations] Bonificaciones calculated successfully:', bonifData);
    }

    const creatorsDeduplicatedCount = totalMissingOccurrences - missing.length;

    return withCORS(
      new Response(
        JSON.stringify({
          success: true,
          records_processed: mapped.length,
          inserted: dailyRowsDeduped.length,
          duplicates_removed: duplicatesCount,
          creators_created: creatorsCreated,
          creators_deduplicated: creatorsDeduplicatedCount,
          snapshot_date: today,
          no_match: noMatch,
          bonificaciones_calculadas: bonifData?.total_creadores || 0, // ✅ Include bonificaciones info
          debug_info: {
            missing_count: missing.length,
            missing_samples: missing.slice(0, 5),
            creators_to_create: missing.length,
            creators_created_count: creatorsCreated,
            create_error: createErr ? createErr.message : null,
            first_created: created && created.length > 0 ? created[0] : null
          },
          message: `✅ ${dailyRowsDeduped.length} registros procesados exitosamente (diamantes y horas MTD del Excel)` +
            (duplicatesCount > 0 ? ` (${duplicatesCount} duplicados removidos en daily_stats)` : '') +
            (creatorsDeduplicatedCount > 0 ? ` (${creatorsDeduplicatedCount} creadores duplicados en Excel)` : ''),
          note: '✅ Usando valores MTD (Month-To-Date) del Excel para diamantes y horas. Los días se calculan desde fechas únicas.'
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, must-revalidate'
          },
        }
      ),
      origin
    );

  } catch (error: any) {
    console.error('[upload-excel-recommendations] Error:', error);
    return withCORS(
      new Response(
        JSON.stringify({ error: error?.message || 'Unknown error' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, must-revalidate'
          },
        }
      ),
      origin
    );
  }
});
