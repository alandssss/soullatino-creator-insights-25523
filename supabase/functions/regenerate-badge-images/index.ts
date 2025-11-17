import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimit } from "../_shared/rate-limit.ts";
import { withCORS, handleCORSPreflight } from "../_shared/cors.ts";

serve(async (req) => {
  const origin = req.headers.get("origin");
  console.log('[regenerate-badge-images] === INICIO ===');
  
  if (req.method === 'OPTIONS') {
    return handleCORSPreflight(origin);
  }

  // Rate limiting: 10 req/min (proceso pesado)
  const rl = await rateLimit(req, { key: "regenerate-badge-images", limitPerMin: 10 });
  if (!rl.ok) return withCORS(rl.response!, origin);

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('[regenerate-badge-images] NO auth header');
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
    console.log('[regenerate-badge-images] User verificado:', user?.id, 'Error:', userError);
    
    if (userError || !user) {
      console.error('[regenerate-badge-images] Token inválido:', userError);
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
    
    console.log('[regenerate-badge-images] Rol del usuario:', roleData?.role);

    if (!roleData || !['admin', 'manager'].includes(roleData.role)) {
      console.error('[regenerate-badge-images] Permisos insuficientes:', roleData?.role);
      return withCORS(
        new Response(JSON.stringify({ error: 'Requiere rol admin o manager' }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }),
        origin
      );
    }

    console.log('[regenerate-badge-images] Usuario autorizado, buscando badges sin imagen...');

    // Buscar badges sin image_url
    const { data: badgesWithoutImage, error: fetchError } = await supabase
      .from('creator_badges')
      .select('id, badge_tipo, badge_nivel, titulo, descripcion')
      .is('image_url', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[regenerate-badge-images] Error fetching badges:', fetchError);
      return withCORS(
        new Response(
          JSON.stringify({ error: fetchError.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      );
    }

    if (!badgesWithoutImage || badgesWithoutImage.length === 0) {
      console.log('[regenerate-badge-images] No hay badges sin imagen');
      return withCORS(
        new Response(
          JSON.stringify({ 
            success: true, 
            message: 'No hay badges sin imagen para regenerar',
            processed: 0,
            succeeded: 0,
            failed: 0
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        origin
      );
    }

    console.log(`[regenerate-badge-images] Encontrados ${badgesWithoutImage.length} badges sin imagen`);

    const results = {
      processed: badgesWithoutImage.length,
      succeeded: 0,
      failed: 0,
      errors: [] as Array<{ badge_id: string; error: string }>
    };

    // Procesar cada badge
    for (const badge of badgesWithoutImage) {
      try {
        console.log(`[regenerate-badge-images] Generando imagen para badge ${badge.id} (${badge.badge_tipo})`);

        // Llamar a generate-badge-image
        const { data: imageData, error: imageError } = await supabase.functions.invoke(
          'generate-badge-image',
          {
            body: {
              badge_tipo: badge.badge_tipo,
              nivel: badge.badge_nivel,
              titulo: badge.titulo,
              descripcion: badge.descripcion
            }
          }
        );

        if (imageError || !imageData?.image_url) {
          console.error(`[regenerate-badge-images] Error generando imagen para badge ${badge.id}:`, imageError);
          results.failed++;
          results.errors.push({
            badge_id: badge.id,
            error: imageError?.message || 'No se recibió image_url'
          });
          continue;
        }

        // Actualizar badge con la nueva imagen
        const { error: updateError } = await supabase
          .from('creator_badges')
          .update({ image_url: imageData.image_url })
          .eq('id', badge.id);

        if (updateError) {
          console.error(`[regenerate-badge-images] Error actualizando badge ${badge.id}:`, updateError);
          results.failed++;
          results.errors.push({
            badge_id: badge.id,
            error: updateError.message
          });
          continue;
        }

        console.log(`[regenerate-badge-images] ✅ Badge ${badge.id} actualizado exitosamente`);
        results.succeeded++;

        // Pequeña pausa entre llamadas para evitar rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`[regenerate-badge-images] Error procesando badge ${badge.id}:`, error);
        results.failed++;
        results.errors.push({
          badge_id: badge.id,
          error: error?.message || 'Error desconocido'
        });
      }
    }

    console.log('[regenerate-badge-images] Proceso completado:', results);

    return withCORS(
      new Response(
        JSON.stringify({
          success: true,
          message: `Regeneración completada: ${results.succeeded} exitosos, ${results.failed} fallidos`,
          ...results
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
      origin
    );

  } catch (error: any) {
    console.error('[regenerate-badge-images] Error:', error);
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
