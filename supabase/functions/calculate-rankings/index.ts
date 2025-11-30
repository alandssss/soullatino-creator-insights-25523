import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface BadgeDefinition {
  tipo: string;
  nivel?: string;
  titulo: string;
  descripcion: string;
  icono: string;
  condition: (creator: any, stats: any) => boolean;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Badges de diamantes
  { tipo: 'diamante_50k', titulo: '💎 Diamante 50K', descripcion: 'Alcanzaste 50,000 diamantes en un mes', icono: '💎', condition: (c, s) => s.diamantes_mes >= 50000 },
  { tipo: 'diamante_100k', nivel: 'plata', titulo: '💠 Diamante 100K', descripcion: 'Alcanzaste 100,000 diamantes en un mes', icono: '💠', condition: (c, s) => s.diamantes_mes >= 100000 },
  { tipo: 'diamante_300k', nivel: 'oro', titulo: '✨ Diamante 300K', descripcion: 'Alcanzaste 300,000 diamantes en un mes', icono: '✨', condition: (c, s) => s.diamantes_mes >= 300000 },
  { tipo: 'diamante_500k', nivel: 'platino', titulo: '🌟 Diamante 500K', descripcion: 'Alcanzaste 500,000 diamantes en un mes', icono: '🌟', condition: (c, s) => s.diamantes_mes >= 500000 },
  
  // Badges de consistencia
  { tipo: 'racha_7dias', titulo: '🔥 Racha 7 Días', descripcion: 'Estuviste en vivo 7 días consecutivos', icono: '🔥', condition: (c, s) => s.dias_consecutivos >= 7 },
  { tipo: 'racha_14dias', nivel: 'plata', titulo: '🔥🔥 Racha 14 Días', descripcion: 'Estuviste en vivo 14 días consecutivos', icono: '🔥', condition: (c, s) => s.dias_consecutivos >= 14 },
  { tipo: 'racha_30dias', nivel: 'oro', titulo: '🔥🔥🔥 Racha 30 Días', descripcion: 'Estuviste en vivo 30 días consecutivos', icono: '🔥', condition: (c, s) => s.dias_consecutivos >= 30 },
  
  // Badges de ranking
  { tipo: 'top1_semanal', nivel: 'oro', titulo: '🏆 Campeón Semanal', descripcion: 'Primer lugar del ranking semanal', icono: '🏆', condition: (c, s) => s.ranking_position === 1 },
  { tipo: 'top3_semanal', nivel: 'plata', titulo: '🥈 Top 3 Semanal', descripcion: 'Entre los 3 mejores de la semana', icono: '🥈', condition: (c, s) => s.ranking_position <= 3 },
  { tipo: 'top10_semanal', nivel: 'bronce', titulo: '🥉 Top 10 Semanal', descripcion: 'Entre los 10 mejores de la semana', icono: '🥉', condition: (c, s) => s.ranking_position <= 10 },
  
  // Badges de horas
  { tipo: 'maratonista', titulo: '⏰ Maratonista', descripcion: 'Más de 80 horas en vivo en un mes', icono: '⏰', condition: (c, s) => s.horas_mes >= 80 },
  { tipo: 'super_maratonista', nivel: 'oro', titulo: '⏰⏰ Súper Maratonista', descripcion: 'Más de 120 horas en vivo en un mes', icono: '⏰', condition: (c, s) => s.horas_mes >= 120 },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verificar autenticación
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar rol (solo admin puede calcular rankings)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { periodo = 'semanal', fecha_referencia } = await req.json().catch(() => ({}));
    
    const fechaRef = fecha_referencia ? new Date(fecha_referencia) : new Date();
    
    console.log(`[calculate-rankings] Calculando rankings ${periodo} para fecha ${fechaRef.toISOString()}`);

    // Calcular fechas del periodo
    let periodoInicio: Date, periodoFin: Date;
    
    if (periodo === 'semanal') {
      // Semana actual (lunes a domingo)
      periodoFin = new Date(fechaRef);
      periodoInicio = new Date(fechaRef);
      periodoInicio.setDate(periodoInicio.getDate() - 7);
    } else {
      // Mes actual
      periodoInicio = new Date(fechaRef.getFullYear(), fechaRef.getMonth(), 1);
      periodoFin = new Date(fechaRef.getFullYear(), fechaRef.getMonth() + 1, 0);
    }

    const inicioStr = periodoInicio.toISOString().split('T')[0];
    const finStr = periodoFin.toISOString().split('T')[0];

    console.log(`[calculate-rankings] Periodo: ${inicioStr} a ${finStr}`);

    // Obtener datos del periodo
    const { data: creators, error: creatorsError } = await supabase
      .from('creators')
      .select('id, nombre, tiktok_username, manager, grupo')
      .eq('status', 'activo');

    if (creatorsError) throw creatorsError;

    // Obtener estadísticas del periodo
    const { data: stats, error: statsError } = await supabase
      .from('creator_daily_stats')
      .select('creator_id, diamantes, duracion_live_horas, dias_validos_live, fecha')
      .gte('fecha', inicioStr)
      .lte('fecha', finStr);

    if (statsError) throw statsError;

    // Agrupar stats por creator y usar Math.max para obtener el snapshot MTD
    const statsByCreator = new Map<string, any>();
    
    for (const creator of creators || []) {
      const creatorStats = (stats || []).filter(s => s.creator_id === creator.id);
      
      // Use Math.max to get latest MTD snapshot (not reduce)
      const totalDiamantes = Math.max(...creatorStats.map(s => Number(s.diamantes) || 0), 0);
      const totalHoras = Math.max(...creatorStats.map(s => Number(s.duracion_live_horas) || 0), 0);
      const totalDias = Math.max(...creatorStats.map(s => Number(s.dias_validos_live) || 0), 0);
      
      // Calcular días consecutivos (para badges de racha)
      const fechas = creatorStats.map(s => new Date(s.fecha)).sort((a, b) => a.getTime() - b.getTime());
      let diasConsecutivos = 0;
      let rachaActual = 1;
      
      for (let i = 1; i < fechas.length; i++) {
        const diff = (fechas[i].getTime() - fechas[i - 1].getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          rachaActual++;
          diasConsecutivos = Math.max(diasConsecutivos, rachaActual);
        } else if (diff > 1) {
          rachaActual = 1;
        }
      }
      
      statsByCreator.set(creator.id, {
        creator_id: creator.id,
        nombre: creator.nombre,
        tiktok_username: creator.tiktok_username,
        manager: creator.manager,
        grupo: creator.grupo,
        diamantes_periodo: totalDiamantes,
        horas_periodo: totalHoras,
        dias_periodo: totalDias,
        diamantes_mes: totalDiamantes, // Para badges
        horas_mes: totalHoras,
        dias_consecutivos: diasConsecutivos,
        puntos_gamificacion: Math.floor(totalDiamantes / 1000) + (totalDias * 100) + (totalHoras * 10)
      });
    }

    // Ordenar por diamantes y asignar posiciones
    const rankings = Array.from(statsByCreator.values())
      .sort((a, b) => b.diamantes_periodo - a.diamantes_periodo)
      .map((r, index) => ({
        ...r,
        ranking_position: index + 1,
        categoria: index < 10 ? 'top10' : index < 50 ? 'top50' : 'otros'
      }));

    console.log(`[calculate-rankings] Calculados ${rankings.length} rankings`);

    // Guardar rankings históricos
    const rankingsToInsert = rankings.map(r => ({
      creator_id: r.creator_id,
      periodo_tipo: periodo,
      periodo_inicio: inicioStr,
      periodo_fin: finStr,
      ranking_position: r.ranking_position,
      diamantes_periodo: r.diamantes_periodo,
      horas_periodo: r.horas_periodo,
      dias_periodo: r.dias_periodo,
      puntos_gamificacion: r.puntos_gamificacion,
      categoria: r.categoria
    }));

    const { error: insertError } = await supabase
      .from('creator_rankings')
      .upsert(rankingsToInsert, { 
        onConflict: 'creator_id,periodo_tipo,periodo_inicio',
        ignoreDuplicates: false 
      });

    if (insertError) {
      console.error('[calculate-rankings] Error insertando rankings:', insertError);
    }

    // Procesar badges automáticos
    let badgesOtorgados = 0;
    
    for (const ranking of rankings) {
      for (const badgeDef of BADGE_DEFINITIONS) {
        if (badgeDef.condition(null, ranking)) {
          console.log(`[calculate-rankings] Badge earned: ${badgeDef.titulo}`);
          
          // Generar imagen para el badge usando Lovable AI
          let imageUrl = null;
          try {
            const { data: imageData, error: imageError } = await supabase.functions.invoke(
              'generate-badge-image',
              {
                body: {
                  badge_tipo: badgeDef.tipo,
                  badge_nivel: badgeDef.nivel || null,
                  titulo: badgeDef.titulo,
                  descripcion: badgeDef.descripcion
                }
              }
            );
            
            if (!imageError && imageData?.image_url) {
              imageUrl = imageData.image_url;
              console.log(`[calculate-rankings] Generated image for badge ${badgeDef.tipo}: ${imageUrl}`);
            }
          } catch (imgErr) {
            console.warn(`[calculate-rankings] Could not generate image for badge ${badgeDef.tipo}:`, imgErr);
          }
          
          const { error: badgeError } = await supabase
            .from('creator_badges')
            .upsert({
              creator_id: ranking.creator_id,
              badge_tipo: badgeDef.tipo,
              badge_nivel: badgeDef.nivel || null,
              titulo: badgeDef.titulo,
              descripcion: badgeDef.descripcion,
              icono: badgeDef.icono,
              image_url: imageUrl,
              metadata: { periodo: periodo, fecha: finStr, ranking_position: ranking.ranking_position }
            }, {
              onConflict: 'creator_id,badge_tipo,badge_nivel',
              ignoreDuplicates: true
            });
          
          if (!badgeError) {
            badgesOtorgados++;
            
            // Crear notificación de nuevo badge
            await supabase
              .from('ranking_notifications')
              .insert({
                creator_id: ranking.creator_id,
                tipo_notificacion: 'nuevo_badge',
                titulo: '🎖️ Nuevo Logro Desbloqueado',
                mensaje: `¡Felicidades! Has obtenido el badge "${badgeDef.titulo}"`,
                metadata: { badge_tipo: badgeDef.tipo, badge_nivel: badgeDef.nivel }
              });
          }
        }
      }
    }

    console.log(`[calculate-rankings] Otorgados ${badgesOtorgados} nuevos badges`);

    // Detectar cambios importantes de ranking y crear notificaciones
    const { data: rankingsAnteriores } = await supabase
      .from('creator_rankings')
      .select('creator_id, ranking_position')
      .eq('periodo_tipo', periodo)
      .lt('periodo_inicio', inicioStr)
      .order('periodo_inicio', { ascending: false })
      .limit(rankings.length);

    let notificacionesCreadas = 0;
    
    for (const ranking of rankings) {
      const anterior = rankingsAnteriores?.find(r => r.creator_id === ranking.creator_id);
      
      if (anterior && anterior.ranking_position) {
        const diferencia = anterior.ranking_position - ranking.ranking_position;
        
        // Notificar si subió 5+ posiciones
        if (diferencia >= 5) {
          await supabase
            .from('ranking_notifications')
            .insert({
              creator_id: ranking.creator_id,
              tipo_notificacion: 'subida_ranking',
              titulo: '🚀 ¡Gran Avance en el Ranking!',
              mensaje: `Has subido ${diferencia} posiciones. Ahora estás en el puesto #${ranking.ranking_position}`,
              metadata: { old_position: anterior.ranking_position, new_position: ranking.ranking_position, difference: diferencia }
            });
          notificacionesCreadas++;
        }
        
        // Notificar si está cerca del top 10
        if (ranking.ranking_position === 11 || ranking.ranking_position === 12) {
          await supabase
            .from('ranking_notifications')
            .insert({
              creator_id: ranking.creator_id,
              tipo_notificacion: 'cerca_top10',
              titulo: '🎯 ¡Cerca del Top 10!',
              mensaje: `Estás a solo ${ranking.ranking_position - 10} posición(es) del Top 10. ¡Dale el último empujón!`,
              metadata: { ranking_position: ranking.ranking_position, distance_to_top10: ranking.ranking_position - 10 }
            });
          notificacionesCreadas++;
        }
      }
    }

    console.log(`[calculate-rankings] Creadas ${notificacionesCreadas} notificaciones`);

    // Refrescar vista materializada si es ranking semanal
    if (periodo === 'semanal') {
      await supabase.rpc('refresh_leaderboard_actual');
      console.log('[calculate-rankings] Vista materializada refrescada');
    }

    return new Response(
      JSON.stringify({
        success: true,
        periodo,
        periodo_inicio: inicioStr,
        periodo_fin: finStr,
        rankings_calculados: rankings.length,
        badges_otorgados: badgesOtorgados,
        notificaciones_creadas: notificacionesCreadas,
        top10: rankings.slice(0, 10).map(r => ({
          nombre: r.nombre,
          position: r.ranking_position,
          diamantes: r.diamantes_periodo
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[calculate-rankings] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
