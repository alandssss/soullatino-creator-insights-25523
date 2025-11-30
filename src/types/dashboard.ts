export interface Creator {
    id: string;
    creator_id: string;
    username: string;
    nivel_actual: string; // e.g., 'G5'
    photo_url?: string;
    meta_dias_mes?: number;
    meta_horas_mes?: number;
}

export interface CreatorDailyStat {
    creator_id: string;
    fecha: string; // YYYY-MM-DD
    diamantes: number;
    duracion_live_horas: number;
    dias_validos_live: number;
    nuevos_seguidores: number;
    emisiones_live?: number;
    partidas?: number;
    diamantes_partidas?: number;
}
