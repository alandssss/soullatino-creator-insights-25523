/**
 * Servicio para análisis predictivo de fin de mes (EOM)
 * Calcula proyecciones basadas en ritmo actual
 */

export interface EOMPrediction {
  diamonds: number;
  days: number;
  hours: number;
  confidence: 'high' | 'medium' | 'low';
  method: string;
}

/**
 * Calcula predicción de fin de mes basada en datos actuales
 */
export function calculateEOMPrediction(
  currentDiamonds: number,
  currentDays: number,
  currentHours: number,
  daysElapsed: number,
  daysInMonth: number
): EOMPrediction | null {
  // Sanitizar entradas
  const sanitizedDiamonds = isFinite(currentDiamonds) && currentDiamonds >= 0 ? currentDiamonds : 0;
  const sanitizedDays = isFinite(currentDays) && currentDays >= 0 ? currentDays : 0;
  const sanitizedHours = isFinite(currentHours) && currentHours >= 0 ? currentHours : 0;
  const sanitizedDaysElapsed = Math.max(1, daysElapsed); // Mínimo 1 para evitar división por 0
  
  // Validar que haya datos suficientes
  if (daysElapsed < 3) {
    return null;
  }
  
  // Calcular tasas diarias
  const diamondsDailyRate = sanitizedDiamonds / sanitizedDaysElapsed;
  const daysDailyRate = sanitizedDays / sanitizedDaysElapsed;
  const hoursDailyRate = sanitizedHours / sanitizedDaysElapsed;
  
  // Proyectar al final del mes
  const projectedDiamonds = Math.round(diamondsDailyRate * daysInMonth);
  const projectedDays = Math.min(daysInMonth, Math.round(daysDailyRate * daysInMonth)); // No puede exceder días del mes
  const projectedHours = parseFloat((hoursDailyRate * daysInMonth).toFixed(1));
  
  // Validar que las proyecciones sean finitas
  if (!isFinite(projectedDiamonds) || !isFinite(projectedDays) || !isFinite(projectedHours)) {
    return null;
  }
  
  // Calcular nivel de confianza
  let confidence: 'high' | 'medium' | 'low';
  if (daysElapsed >= 10) {
    confidence = 'high';
  } else if (daysElapsed >= 5) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  
  return {
    diamonds: projectedDiamonds,
    days: projectedDays,
    hours: projectedHours,
    confidence,
    method: 'Ritmo diario promedio'
  };
}

/**
 * Genera un mensaje descriptivo de la predicción
 */
export function getPredictionSummary(prediction: EOMPrediction | null): string {
  if (!prediction) {
    return 'No hay suficientes datos para proyectar (se necesitan al menos 3 días con actividad)';
  }
  
  const confidenceText = {
    high: 'Alta confianza',
    medium: 'Confianza media',
    low: 'Confianza baja'
  }[prediction.confidence];
  
  return `Proyección al cierre: ${prediction.diamonds.toLocaleString()} 💎, ${prediction.days} días, ${prediction.hours}h (${confidenceText})`;
}
