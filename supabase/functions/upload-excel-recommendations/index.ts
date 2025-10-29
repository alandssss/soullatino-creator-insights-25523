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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
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
    const { data: roleData } = await supabase
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

    console.log('[upload-excel] Usuario autorizado, procesando archivo...');

    // Obtener datos del form
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('No file uploaded');
    }

    console.log(`[upload-excel-recommendations] Processing file: ${file.name}`);

    // Leer el archivo Excel
    const fileBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(fileBuffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    console.log(`[upload-excel-recommendations] Found ${rawData.length} rows`);

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
      'valid go live days': 'dias_actuales',
      'dias validos de emisiones live del mes pasado': 'dias_actuales',
      'valid go live days last month': 'dias_actuales',
      
      // Horas (AMPLIADO - TikTok español completo)
      'duracion live': 'horas_actuales',
      'horas': 'horas_actuales',
      'hours': 'horas_actuales',
      'live hours': 'horas_actuales',
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

    console.log(`[upload-excel-recommendations] Mapped ${mapped.length} valid rows`);

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

    // Detectar faltantes y crear creadores mínimos
    const missing: Array<{ username: string; phone: string | null; }>= [];
    for (const r of mapped) {
      const keyU = r.creator_username.replace(/^@/, '').toLowerCase();
      const foundId = byUsername.get(keyU) || (r.phone_e164 ? byPhone.get(r.phone_e164) : undefined);
      if (!foundId) missing.push({ username: keyU, phone: r.phone_e164 });
    }

    if (missing.length) {
      const toCreate = missing.map(m => ({
        nombre: m.username,
        tiktok_username: m.username,
        telefono: m.phone,
        creator_id: m.username // campo requerido (texto)
      }));

      const { data: created, error: createErr } = await supabase
        .from('creators')
        .insert(toCreate)
        .select('id, tiktok_username, telefono');

      if (createErr) {
        console.error('[upload-excel-recommendations] Error creating creators:', createErr);
        return withCORS(
          new Response(
            JSON.stringify({ error: createErr.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          ),
          origin
        );
      }

      (created || []).forEach(c => {
        if (c.tiktok_username) byUsername.set(String(c.tiktok_username).toLowerCase(), c.id);
        if (c.telefono) byPhone.set(String(c.telefono), c.id);
      });
    }

    // Construir filas finales para daily_stats
    const dailyRows = mapped.map(r => {
      const keyU = r.creator_username.replace(/^@/, '').toLowerCase();
      const creatorId = byUsername.get(keyU) || (r.phone_e164 ? byPhone.get(r.phone_e164) : undefined);
      if (!creatorId) return null;
      return {
        creator_id: creatorId,
        fecha: today,
        diamantes: r.diamantes_actuales,
        duracion_live_horas: r.horas_actuales,
        dias_validos_live: r.dias_actuales,
        creator_username: r.creator_username,
        phone_e164: r.phone_e164
      };
    }).filter(Boolean) as any[];

    if (!dailyRows.length) {
      return withCORS(
        new Response(
          JSON.stringify({ error: 'No se pudieron resolver creadores para las filas cargadas' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      );
    }

    // Reemplazar datos del día para evitar duplicados
    const creatorIds = Array.from(new Set(dailyRows.map(r => r.creator_id)));
    const { error: delErr } = await supabase
      .from('creator_daily_stats')
      .delete()
      .eq('fecha', today)
      .in('creator_id', creatorIds);

    if (delErr) {
      console.warn('[upload-excel-recommendations] Warning deleting existing rows:', delErr);
    }

    // @compat: Upsert para idempotencia - evita duplicados si se reprocesa el mismo día
    const { error: insertErr } = await supabase
      .from('creator_daily_stats')
      .upsert(dailyRows, { onConflict: 'creator_id,fecha' });

    if (insertErr) {
      console.error('[upload-excel-recommendations] Insert error:', insertErr);
      return withCORS(
        new Response(
          JSON.stringify({ error: insertErr.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      );
    }

    console.log(`[upload-excel-recommendations] Upserted ${mapped.length} records`);

    // Refrescar la vista materializada
    console.log('[upload-excel-recommendations] Refreshing materialized view...');
    const { error: refreshError } = await supabase.rpc('refresh_recommendations_today');

    if (refreshError) {
      console.error('[upload-excel-recommendations] Error refreshing view:', refreshError);
    }

    return withCORS(
      new Response(
        JSON.stringify({
          success: true,
          records_processed: mapped.length
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
