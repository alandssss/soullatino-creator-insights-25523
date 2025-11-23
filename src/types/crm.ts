/**
 * FASE 7: Tipos TypeScript compartidos para CRM
 * Define estructuras de datos comunes usadas en toda la aplicación
 */

/**
 * Información básica del creador (CRM)
 */
export interface CreatorCRM {
  id: string;
  nombre: string;
  tiktok_username: string | null;
  telefono: string | null;
  email: string | null;
  manager: string | null;
  agente: string | null;
  categoria: string | null;
  grupo: string | null;
  graduacion: string | null;
  status: string | null;
  dias_en_agencia: number;
  fecha_incorporacion: string | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * Métricas MTD (Month-To-Date) del creador
 */
export interface MetricsMTD {
  liveDays: number;
  liveHours: number;
  diamonds: number;
  // Comparación con mes anterior
  deltaVsPrevMonth: {
    days: number;
    hours: number;
    diamonds: number;
    diamondsPercent: number;
  };
  // Métricas del mes anterior (para referencia)
  prevMonth: {
    liveDays: number;
    liveHours: number;
    diamonds: number;
  };
}

/**
 * Estado de bonificaciones del creador
 */
export interface BonusStatus {
  // Hitos de diamantes
  milestone50k: boolean;
  milestone100k: boolean;
  milestone300k: boolean;
  milestone500k: boolean;
  milestone1m: boolean;
  // Bono por días extra
  extraDays: number;
  extraDaysBonus: number;
  // Total
  totalBonusUSD: number;
  breakdown: string[]; // Explicación detallada
}

/**
 * Hito individual (diamantes, días, horas)
 */
export interface Milestone {
  target: number;
  label: string;
  current: number;
  remaining: number;
  achieved: boolean;
  progress: number; // 0-100
  etaDays: number; // Días estimados para alcanzar
}

/**
 * Conjunto completo de hitos
 */
export interface MilestonesSet {
  diamonds: Milestone[];
  days: Milestone;
  hours: Milestone;
  combined: Array<{
    label: string;
    daysTarget: number;
    hoursTarget: number;
    daysAchieved: boolean;
    hoursAchieved: boolean;
    bothAchieved: boolean;
  }>;
}

/**
 * Predicción de fin de mes (EOM)
 */
export interface PredictionEOM {
  diamonds_eom: number;
  liveDays_eom: number;
  liveHours_eom: number;
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number; // 0-1
  method: 'linear_rate' | 'weighted_average' | 'insufficient_data';
  lastUpdated: string;
  insights: string[]; // Mensajes explicativos
}

/**
 * Alerta de riesgo para un creador
 */
export interface CreatorAlert {
  id: string;
  creatorId: string;
  creatorName: string;
  tiktok_username: string | null;
  manager: string | null;
  alertType: 'dias_faltantes' | 'horas_faltantes' | 'diamantes_bajo_ritmo' | 'sin_actividad';
  severity: 'high' | 'medium' | 'low';
  reason: string; // Descripción legible
  impactUSD: number; // Pérdida potencial estimada
  daysRemaining: number;
  nextMilestone: string;
  actionable: boolean;
  suggestedAction: string;
  createdAt: string;
}

/**
 * KPI de manager
 */
export interface ManagerKPI {
  managerName: string;
  creatorCount: number;
  potentialBonusesSaved: number; // USD
  tasksCompletedWeek: number;
  lastInteraction: string | null;
  avgResponseTime: number | null; // horas
}

/**
 * Contacto prioritario (Dashboard)
 */
export interface PriorityContact {
  creatorId: string;
  creatorName: string;
  tiktok_username: string | null;
  telefono: string | null;
  manager: string | null;
  riskLevel: 'high' | 'medium' | 'low';
  reason: string;
  potentialLossUSD: number;
  nextMilestone: string;
  currentProgress: {
    dias: number;
    horas: number;
    diamantes: number;
  };
  required: {
    dias: number;
    horas: number;
    diamantes: number;
  };
  daysRemaining: number;
  priority: number; // 1-100, mayor = más urgente
}

/**
 * Mensaje diario generado por IA
 */
export interface DailyMessage {
  creatorId: string;
  creatorName: string;
  message: string;
  messageType: 'motivational' | 'warning' | 'celebration' | 'coaching';
  context: {
    liveDays: number;
    liveHours: number;
    diamonds: number;
    nextMilestone: string;
    daysRemaining: number;
  };
  generatedAt: string;
}

/**
 * Interacción registrada con el creador
 */
export interface CreatorInteraction {
  id: string;
  creatorId: string;
  tipo: 'llamada' | 'whatsapp' | 'supervision' | 'email' | 'nota';
  notas: string | null;
  adminNombre: string | null;
  createdAt: string;
}

/**
 * Tag asignado a un creador
 */
export type CreatorTag = 
  | 'VIP'
  | 'Nuevo'
  | 'Riesgo Alto'
  | 'Potencial 300K'
  | 'Graduado'
  | 'Inactivo'
  | 'Prioritario'
  | 'En Observación';

/**
 * Asignación de tag a creador
 */
export interface CreatorTagAssignment {
  id: string;
  creatorId: string;
  tag: CreatorTag;
  assignedBy: string | null;
  assignedAt: string;
  notes: string | null;
}

/**
 * Prospecto de reclutamiento
 */
export interface RecruitmentProspect {
  id: string;
  nombre: string;
  tiktok_username: string | null;
  telefono: string | null;
  email: string | null;
  instagram: string | null;
  estado: 'prospecto' | 'contactado' | 'en_prueba' | 'firmado' | 'descartado';
  etapa: string | null;
  origen: string | null;
  responsable: string | null;
  agenteAsignado: string | null;
  seguidoresEstimados: number | null;
  diamantesEstimados: number | null;
  fechaContacto: string | null;
  fechaProximoContacto: string | null;
  proximaAccion: string | null;
  notas: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Datos completos del perfil CRM del creador
 */
export interface CreatorProfileCRM {
  creator: CreatorCRM;
  metrics: MetricsMTD;
  bonuses: BonusStatus;
  milestones: MilestonesSet;
  prediction: PredictionEOM;
  alerts: CreatorAlert[];
  interactions: CreatorInteraction[];
  tags: CreatorTagAssignment[];
  supervisionFlags: {
    hasSupervision: boolean;
    lastSupervisor: string | null;
    lastReviewAt: string | null;
    notes: string | null;
    riskLevel: 'low' | 'medium' | 'high' | null;
  };
}
