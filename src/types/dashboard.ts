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
    diamonds_dia: number | string;
    live_hours_dia: number | string;
    hizo_live: boolean;
    new_followers_dia: number | string;
}
