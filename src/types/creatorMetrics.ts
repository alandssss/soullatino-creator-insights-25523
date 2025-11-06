export interface MilestoneTarget {
  target: number;
  remaining: number;
  etaDays: number;
  achieved: boolean;
}

export interface Milestones {
  diamonds: MilestoneTarget;
  liveDays: MilestoneTarget;
  liveHours: MilestoneTarget;
}

export interface Prediction {
  diamonds_eom: number;
  liveDays_eom: number;
  liveHours_eom: number;
  method: 'linear_rate' | 'exponential_smoothing';
  confidence: number;
  lastUpdated: string;
}

export interface SupervisionFlags {
  hasSupervision: boolean;
  lastSupervisor: string | null;
  lastReviewAt: string | null;
  notes: string | null;
  riskLevel: 'verde' | 'amarillo' | 'rojo' | null;
}

export interface CreatorMetrics {
  // Identificación
  creatorId: string;
  month: string; // YYYY-MM
  
  // Métricas MTD (Month-To-Date)
  liveDays_mtd: number;
  liveHours_mtd: number;
  diamonds_mtd: number;
  
  // Métricas mes anterior
  liveDays_prevMonth: number;
  liveHours_prevMonth: number;
  diamonds_prevMonth: number;
  
  // Deltas calculados
  deltaLiveDays: number;
  deltaLiveHours: number;
  deltaDiamonds: number;
  deltaDiamondsPercent: number;
  
  // Hitos
  nextMilestones: Milestones;
  
  // Predicción
  prediction: Prediction;
  
  // Supervisión
  supervisionFlags: SupervisionFlags;
  
  // Meta
  remaining_calendar_days: number;
}
