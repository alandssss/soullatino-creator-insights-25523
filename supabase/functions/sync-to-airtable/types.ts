/**
 * TypeScript interfaces for Supabase → Airtable sync
 */

// ============================================
// SUPABASE DATA STRUCTURES
// ============================================

export interface SupabaseCreatorMetric {
  creator_id: string;
  username: string;
  email: string | null;
  nivel_actual: string | null;
  meta_dias_mes: number;
  meta_horas_mes: number;
  fecha: string; // YYYY-MM-DD
  diamonds_dia: number;
  live_hours_dia: number;
  new_followers_dia: number;
  hizo_live: number; // 0 or 1
}

// ============================================
// AIRTABLE DATA STRUCTURES
// ============================================

export interface AirtableCreator {
  fields: {
    creator_id: string;
    username: string;
    email?: string;
    nivel_actual?: string;
    meta_dias_mes: number;
    meta_horas_mes: number;
  };
}

export interface AirtableDailyMetric {
  fields: {
    creator: string[]; // Array of Airtable record IDs (linked record)
    fecha: string; // YYYY-MM-DD
    diamonds_dia: number;
    live_hours_dia: number;
    new_followers_dia: number;
    hizo_live: number; // 0 or 1
  };
}

export interface AirtableRecord<T> {
  id: string;
  fields: T;
  createdTime: string;
}

export interface AirtableListResponse<T> {
  records: AirtableRecord<T>[];
  offset?: string;
}

export interface AirtableCreateResponse<T> {
  id: string;
  fields: T;
  createdTime: string;
}

// ============================================
// SYNC RESULT TRACKING
// ============================================

export interface SyncResult {
  success: boolean;
  date: string;
  totalRecords: number;
  creatorsProcessed: number;
  creatorsCreated: number;
  creatorsUpdated: number;
  metricsCreated: number;
  metricsUpdated: number;
  errors: SyncError[];
  duration: number; // milliseconds
  timestamp: string;
}

export interface SyncError {
  creator_id: string;
  operation: 'creator_upsert' | 'metric_upsert' | 'data_extraction';
  error: string;
  retryCount: number;
}

// ============================================
// CONFIGURATION
// ============================================

export interface SyncConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  airtableApiKey: string;
  airtableBaseId: string;
  airtableDailyMetricsTableId: string;
  airtableCreatorsTableId: string;
  maxRetries: number;
  retryDelayMs: number;
  batchSize: number;
}
