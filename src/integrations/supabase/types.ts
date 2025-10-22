export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      creator_bonificaciones: {
        Row: {
          bono_extra_usd: number | null
          cerca_de_objetivo: boolean | null
          created_at: string | null
          creator_id: string | null
          diam_live_mes: number | null
          dias_extra_22: number | null
          dias_live_mes: number | null
          dias_restantes: number | null
          es_prioridad_300k: boolean | null
          grad_100k: boolean | null
          grad_1m: boolean | null
          grad_300k: boolean | null
          grad_500k: boolean | null
          grad_50k: boolean | null
          hito_12d_40h: boolean | null
          hito_20d_60h: boolean | null
          hito_22d_80h: boolean | null
          horas_live_mes: number | null
          id: string
          mes_referencia: string
          proximo_objetivo_tipo: string | null
          proximo_objetivo_valor: string | null
          req_diam_por_dia: number | null
          req_horas_por_dia: number | null
        }
        Insert: {
          bono_extra_usd?: number | null
          cerca_de_objetivo?: boolean | null
          created_at?: string | null
          creator_id?: string | null
          diam_live_mes?: number | null
          dias_extra_22?: number | null
          dias_live_mes?: number | null
          dias_restantes?: number | null
          es_prioridad_300k?: boolean | null
          grad_100k?: boolean | null
          grad_1m?: boolean | null
          grad_300k?: boolean | null
          grad_500k?: boolean | null
          grad_50k?: boolean | null
          hito_12d_40h?: boolean | null
          hito_20d_60h?: boolean | null
          hito_22d_80h?: boolean | null
          horas_live_mes?: number | null
          id?: string
          mes_referencia: string
          proximo_objetivo_tipo?: string | null
          proximo_objetivo_valor?: string | null
          req_diam_por_dia?: number | null
          req_horas_por_dia?: number | null
        }
        Update: {
          bono_extra_usd?: number | null
          cerca_de_objetivo?: boolean | null
          created_at?: string | null
          creator_id?: string | null
          diam_live_mes?: number | null
          dias_extra_22?: number | null
          dias_live_mes?: number | null
          dias_restantes?: number | null
          es_prioridad_300k?: boolean | null
          grad_100k?: boolean | null
          grad_1m?: boolean | null
          grad_300k?: boolean | null
          grad_500k?: boolean | null
          grad_50k?: boolean | null
          hito_12d_40h?: boolean | null
          hito_20d_60h?: boolean | null
          hito_22d_80h?: boolean | null
          horas_live_mes?: number | null
          id?: string
          mes_referencia?: string
          proximo_objetivo_tipo?: string | null
          proximo_objetivo_valor?: string | null
          req_diam_por_dia?: number | null
          req_horas_por_dia?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_bonificaciones_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_daily_stats: {
        Row: {
          created_at: string | null
          creator_id: string | null
          diamantes: number | null
          diamantes_modo_varios: number | null
          diamantes_partidas: number | null
          diamantes_varios_anfitrion: number | null
          diamantes_varios_invitado: number | null
          dias_validos_live: number | null
          duracion_live_horas: number | null
          emisiones_live: number | null
          fecha: string
          id: string
          ingresos_suscripciones: number | null
          nuevos_seguidores: number | null
          partidas: number | null
          suscripciones_compradas: number | null
          suscriptores: number | null
        }
        Insert: {
          created_at?: string | null
          creator_id?: string | null
          diamantes?: number | null
          diamantes_modo_varios?: number | null
          diamantes_partidas?: number | null
          diamantes_varios_anfitrion?: number | null
          diamantes_varios_invitado?: number | null
          dias_validos_live?: number | null
          duracion_live_horas?: number | null
          emisiones_live?: number | null
          fecha: string
          id?: string
          ingresos_suscripciones?: number | null
          nuevos_seguidores?: number | null
          partidas?: number | null
          suscripciones_compradas?: number | null
          suscriptores?: number | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string | null
          diamantes?: number | null
          diamantes_modo_varios?: number | null
          diamantes_partidas?: number | null
          diamantes_varios_anfitrion?: number | null
          diamantes_varios_invitado?: number | null
          dias_validos_live?: number | null
          duracion_live_horas?: number | null
          emisiones_live?: number | null
          fecha?: string
          id?: string
          ingresos_suscripciones?: number | null
          nuevos_seguidores?: number | null
          partidas?: number | null
          suscripciones_compradas?: number | null
          suscriptores?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_daily_stats_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_interactions: {
        Row: {
          admin_nombre: string | null
          created_at: string | null
          creator_id: string
          id: string
          notas: string | null
          tipo: string
        }
        Insert: {
          admin_nombre?: string | null
          created_at?: string | null
          creator_id: string
          id?: string
          notas?: string | null
          tipo: string
        }
        Update: {
          admin_nombre?: string | null
          created_at?: string | null
          creator_id?: string
          id?: string
          notas?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_interactions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_live_daily: {
        Row: {
          created_at: string | null
          creator_id: string | null
          diamantes: number | null
          fecha: string
          horas: number | null
          id: string
        }
        Insert: {
          created_at?: string | null
          creator_id?: string | null
          diamantes?: number | null
          fecha: string
          horas?: number | null
          id?: string
        }
        Update: {
          created_at?: string | null
          creator_id?: string | null
          diamantes?: number | null
          fecha?: string
          horas?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_live_daily_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_metas: {
        Row: {
          created_at: string | null
          creator_id: string
          id: string
          mes_referencia: string
          meta_diamantes: number
          meta_dias: number | null
          meta_horas: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          id?: string
          mes_referencia: string
          meta_diamantes: number
          meta_dias?: number | null
          meta_horas?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          id?: string
          mes_referencia?: string
          meta_diamantes?: number
          meta_dias?: number | null
          meta_horas?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_metas_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_monthly_stats: {
        Row: {
          created_at: string | null
          creator_id: string | null
          diamantes_mes: number | null
          dias_validos_live_mes: number | null
          duracion_live_horas_mes: number | null
          emisiones_live_mes: number | null
          id: string
          mes_referencia: string
          nuevos_seguidores_mes: number | null
          porcentaje_diamantes: number | null
          porcentaje_dias_validos: number | null
          porcentaje_duracion_live: number | null
          porcentaje_emisiones: number | null
          porcentaje_seguidores: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id?: string | null
          diamantes_mes?: number | null
          dias_validos_live_mes?: number | null
          duracion_live_horas_mes?: number | null
          emisiones_live_mes?: number | null
          id?: string
          mes_referencia: string
          nuevos_seguidores_mes?: number | null
          porcentaje_diamantes?: number | null
          porcentaje_dias_validos?: number | null
          porcentaje_duracion_live?: number | null
          porcentaje_emisiones?: number | null
          porcentaje_seguidores?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string | null
          diamantes_mes?: number | null
          dias_validos_live_mes?: number | null
          duracion_live_horas_mes?: number | null
          emisiones_live_mes?: number | null
          id?: string
          mes_referencia?: string
          nuevos_seguidores_mes?: number | null
          porcentaje_diamantes?: number | null
          porcentaje_dias_validos?: number | null
          porcentaje_duracion_live?: number | null
          porcentaje_emisiones?: number | null
          porcentaje_seguidores?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_monthly_stats_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_recommendations: {
        Row: {
          activa: boolean | null
          created_at: string | null
          creator_id: string | null
          descripcion: string | null
          fecha_creacion: string | null
          icono: string | null
          id: string
          prioridad: string | null
          tipo: string | null
          titulo: string | null
        }
        Insert: {
          activa?: boolean | null
          created_at?: string | null
          creator_id?: string | null
          descripcion?: string | null
          fecha_creacion?: string | null
          icono?: string | null
          id?: string
          prioridad?: string | null
          tipo?: string | null
          titulo?: string | null
        }
        Update: {
          activa?: boolean | null
          created_at?: string | null
          creator_id?: string | null
          descripcion?: string | null
          fecha_creacion?: string | null
          icono?: string | null
          id?: string
          prioridad?: string | null
          tipo?: string | null
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_recommendations_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          agente: string | null
          base_diamantes_antes_union: number | null
          categoria: string | null
          created_at: string | null
          creator_id: string
          diamantes: number | null
          dias_desde_incorporacion: number | null
          dias_desde_inicio: number | null
          dias_en_agencia: number | null
          dias_live: number | null
          email: string | null
          engagement_rate: number | null
          estado_graduacion: string | null
          fecha_incorporacion: string | null
          followers: number | null
          graduacion: string | null
          grupo: string | null
          hito_diamantes: number | null
          horas_live: number | null
          id: string
          instagram: string | null
          last_month_diamantes: number | null
          last_month_engagement: number | null
          last_month_views: number | null
          manager: string | null
          nombre: string
          status: string | null
          telefono: string | null
          tiktok_username: string | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          agente?: string | null
          base_diamantes_antes_union?: number | null
          categoria?: string | null
          created_at?: string | null
          creator_id: string
          diamantes?: number | null
          dias_desde_incorporacion?: number | null
          dias_desde_inicio?: number | null
          dias_en_agencia?: number | null
          dias_live?: number | null
          email?: string | null
          engagement_rate?: number | null
          estado_graduacion?: string | null
          fecha_incorporacion?: string | null
          followers?: number | null
          graduacion?: string | null
          grupo?: string | null
          hito_diamantes?: number | null
          horas_live?: number | null
          id?: string
          instagram?: string | null
          last_month_diamantes?: number | null
          last_month_engagement?: number | null
          last_month_views?: number | null
          manager?: string | null
          nombre: string
          status?: string | null
          telefono?: string | null
          tiktok_username?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          agente?: string | null
          base_diamantes_antes_union?: number | null
          categoria?: string | null
          created_at?: string | null
          creator_id?: string
          diamantes?: number | null
          dias_desde_incorporacion?: number | null
          dias_desde_inicio?: number | null
          dias_en_agencia?: number | null
          dias_live?: number | null
          email?: string | null
          engagement_rate?: number | null
          estado_graduacion?: string | null
          fecha_incorporacion?: string | null
          followers?: number | null
          graduacion?: string | null
          grupo?: string | null
          hito_diamantes?: number | null
          horas_live?: number | null
          id?: string
          instagram?: string | null
          last_month_diamantes?: number | null
          last_month_engagement?: number | null
          last_month_views?: number | null
          manager?: string | null
          nombre?: string
          status?: string | null
          telefono?: string | null
          tiktok_username?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      supervision_live_logs: {
        Row: {
          audio_claro: boolean | null
          buena_iluminacion: boolean | null
          created_at: string | null
          creator_id: string | null
          en_batalla: boolean | null
          en_vivo: boolean | null
          fecha_evento: string | null
          id: string
          notas: string | null
          riesgo: string | null
          score: number | null
          set_profesional: boolean | null
        }
        Insert: {
          audio_claro?: boolean | null
          buena_iluminacion?: boolean | null
          created_at?: string | null
          creator_id?: string | null
          en_batalla?: boolean | null
          en_vivo?: boolean | null
          fecha_evento?: string | null
          id?: string
          notas?: string | null
          riesgo?: string | null
          score?: number | null
          set_profesional?: boolean | null
        }
        Update: {
          audio_claro?: boolean | null
          buena_iluminacion?: boolean | null
          created_at?: string | null
          creator_id?: string | null
          en_batalla?: boolean | null
          en_vivo?: boolean | null
          fecha_evento?: string | null
          id?: string
          notas?: string | null
          riesgo?: string | null
          score?: number | null
          set_profesional?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "supervision_live_logs_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_activity: {
        Row: {
          action_type: string
          created_at: string | null
          creator_id: string | null
          creator_name: string | null
          id: string
          message_preview: string | null
          timestamp: string | null
          user_email: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          creator_id?: string | null
          creator_name?: string | null
          id?: string
          message_preview?: string | null
          timestamp?: string | null
          user_email: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          creator_id?: string | null
          creator_name?: string | null
          id?: string
          message_preview?: string | null
          timestamp?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_activity_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "viewer"],
    },
  },
} as const
