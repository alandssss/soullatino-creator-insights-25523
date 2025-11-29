export interface CreatorStats {
    diamonds: number;
    hours: number;
    liveDays: number;
    // metas del mes (se pueden obtener de creators.meta_*)
    metaDiasMes?: number;
    metaHorasMes?: number;
}

/**
 * Evalúa alertas basadas en las métricas del creador.
 */
export function evaluateCreatorAlerts(stats: CreatorStats) {
    const alerts: string[] = [];
    const progDias = stats.metaDiasMes ? stats.liveDays / stats.metaDiasMes : 0;
    const progHoras = stats.metaHorasMes ? stats.hours / stats.metaHorasMes : 0;
    const crecimiento = stats.diamonds; // simplificado: comparar con mes anterior fuera de alcance aquí

    if (progHoras < 0.5) alerts.push('Aumentar horas LIVE');
    if (progDias < 0.5) alerts.push('Hacer más transmisiones');
    if (crecimiento < 0) alerts.push('Creciendo menos que el mes anterior');
    if (stats.diamonds < 20000) alerts.push('Nivel bajo de monetización');

    return alerts;
}
