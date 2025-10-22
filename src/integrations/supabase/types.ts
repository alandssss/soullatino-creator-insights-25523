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
      creators: {
        Row: {
          agente: string | null
          base_diamantes_antes_union: number | null
          created_at: string | null
          creator_id: string
          dias_desde_incorporacion: number | null
          estado_graduacion: string | null
          fecha_incorporacion: string | null
          grupo: string | null
          id: string
          nombre: string
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          agente?: string | null
          base_diamantes_antes_union?: number | null
          created_at?: string | null
          creator_id: string
          dias_desde_incorporacion?: number | null
          estado_graduacion?: string | null
          fecha_incorporacion?: string | null
          grupo?: string | null
          id?: string
          nombre: string
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          agente?: string | null
          base_diamantes_antes_union?: number | null
          created_at?: string | null
          creator_id?: string
          dias_desde_incorporacion?: number | null
          estado_graduacion?: string | null
          fecha_incorporacion?: string | null
          grupo?: string | null
          id?: string
          nombre?: string
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
