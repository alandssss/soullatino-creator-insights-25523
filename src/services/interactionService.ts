import { supabase } from "@/integrations/supabase/client";
import { openWhatsApp } from "@/utils/whatsapp";
import { Tables } from "@/integrations/supabase/types";

type Creator = Tables<"creators">;
type Interaction = Tables<"creator_interactions">;

export interface InteractionDetails {
  tipo: string;
  notas: string;
  admin_nombre?: string;
}

export interface AIAdviceResponse {
  advice: string;
  milestone?: string;
  milestoneDescription?: string;
}

/**
 * Servicio centralizado para gestión de interacciones con creadores
 * Maneja IA, grabación de interacciones y WhatsApp
 */
export class InteractionService {
  /**
   * Genera consejo de IA analizando datos del creador
   */
  static async generateAdvice(creatorId: string): Promise<AIAdviceResponse> {
    console.log('[InteractionService] Llamando a process-creator-analytics con creatorId:', creatorId);
    
    // CRITICAL: Get auth session to pass token to edge function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('[InteractionService] Usuario no autenticado');
      throw new Error("Debes iniciar sesión para generar consejos de IA");
    }

    const { data, error } = await supabase.functions.invoke("process-creator-analytics", {
      body: { creatorId },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    console.log('[InteractionService] Respuesta de process-creator-analytics:', { data, error });

    if (error) {
      console.error('[InteractionService] Error de la función:', error);
      
      // Better error messages based on status
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        throw new Error("No autorizado. Verifica que tengas los permisos necesarios.");
      }
      if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        throw new Error("No tienes permisos para generar consejos. Contacta al administrador.");
      }
      
      throw new Error(`Error generando consejo IA: ${error.message}`);
    }

    if (!data) {
      console.error('[InteractionService] La función devolvió 200 pero sin datos');
      throw new Error("La función de IA no devolvió datos. Verifica los logs de la función.");
    }

    if (!data.recommendation) {
      console.error('[InteractionService] Datos recibidos pero sin recommendation:', data);
      throw new Error("No se recibió recomendación de la IA. Estructura de respuesta incorrecta.");
    }

    console.log('[InteractionService] Consejo generado exitosamente:', data.recommendation);

    return {
      advice: data.recommendation,
      milestone: data.milestone,
      milestoneDescription: data.milestoneDescription,
    };
  }

  /**
   * Carga la última recomendación activa desde la BD
   */
  static async getLatestRecommendation(creatorId: string) {
    const { data, error } = await supabase
      .from("creator_recommendations" as any)
      .select("descripcion, tipo, titulo")
      .eq("creator_id", creatorId)
      .eq("activa", true)
      .order("fecha_creacion", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Error cargando recomendación: ${error.message}`);
    }

    return data
      ? {
          advice: (data as any).descripcion || "",
          milestone: (data as any).tipo || "",
          title: (data as any).titulo || "",
        }
      : null;
  }

  /**
   * Graba una nueva interacción (con validación de autenticación y rol)
   */
  static async recordInteraction(
    creatorId: string,
    details: InteractionDetails
  ): Promise<Interaction> {
    // Verificar autenticación ANTES de insertar
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("Debes iniciar sesión para registrar interacciones");
    }

    // Verificar rol del usuario
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (!roleData || !['admin', 'manager', 'supervisor'].includes(roleData.role)) {
      throw new Error("No tienes permisos para registrar interacciones");
    }

    // Ahora sí, insertar
    const { data, error } = await supabase
      .from("creator_interactions")
      .insert({
        creator_id: creatorId,
        tipo: details.tipo,
        notas: details.notas,
        admin_nombre: details.admin_nombre || session.user.email || "Manager",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error guardando interacción: ${error.message}`);
    }

    return data;
  }

  /**
   * Obtiene todas las interacciones de un creador
   */
  static async getInteractions(creatorId: string): Promise<Interaction[]> {
    const { data, error } = await supabase
      .from("creator_interactions")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Error cargando interacciones: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Obtiene las estadísticas del mes actual desde creator_bonificaciones (fuente correcta)
   */
  static async getCurrentMonthStats(creatorId: string) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const mesReferencia = firstDayOfMonth.toISOString().split('T')[0];

    // Obtener desde creator_bonificaciones - fuente correcta de datos MTD
    const { data: bonusData, error } = await supabase
      .from("creator_bonificaciones")
      .select("dias_live_mes, horas_live_mes, diam_live_mes")
      .eq("creator_id", creatorId)
      .eq("mes_referencia", mesReferencia)
      .maybeSingle();

    if (error) {
      console.error('[InteractionService] Error obteniendo bonificaciones:', error);
      return { dias: 0, horas: 0, diamantes: 0 };
    }

    if (!bonusData) {
      return { dias: 0, horas: 0, diamantes: 0 };
    }

    return {
      dias: bonusData.dias_live_mes || 0,
      horas: bonusData.horas_live_mes || 0,
      diamantes: bonusData.diam_live_mes || 0
    };
  }

  /**
   * Genera mensaje de WhatsApp personalizado con datos del mes actual
   */
  static async generateWhatsAppMessage(creator: Creator, userName: string = "el equipo"): Promise<string> {
    // Obtener estadísticas actualizadas del mes actual
    const stats = await InteractionService.getCurrentMonthStats(creator.id);
    
    return `Hola soy ${userName} de SoulLatino, tus estadísticas del mes son:

📅 ${stats.dias} Días Live
⏰ ${stats.horas.toFixed(1)} Horas Live
💎 ${stats.diamantes.toLocaleString()} Diamantes

¿Podemos hablar para ayudarte a mejorar tu desempeño?`;
  }

  /**
   * Envía mensaje por WhatsApp (usa el fix universal)
   */
  static async sendWhatsAppMessage(
    creator: Creator,
    message: string,
    actionType: 'bonificaciones' | 'reclutamiento' | 'seguimiento' | 'general' = 'seguimiento'
  ): Promise<void> {
    if (!creator.telefono) {
      throw new Error("El creador no tiene número de teléfono registrado");
    }

    if (!message || message.trim() === "") {
      throw new Error("El mensaje no puede estar vacío");
    }

    await openWhatsApp({
      phone: creator.telefono,
      message: message,
      creatorId: creator.id,
      creatorName: creator.nombre,
      actionType,
    });
  }
}

// Exportar instancia singleton
export const interactionService = InteractionService;
