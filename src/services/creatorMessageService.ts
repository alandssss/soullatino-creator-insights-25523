/**
 * Servicio para generación de mensajes personalizados para creadores
 */

interface CreatorData {
  nombre: string;
  tiktok_username?: string;
}

interface Metrics {
  dias: number;
  horas: number;
  diamantes: number;
}

interface Goals {
  nextGoal: string | null;
}

/**
 * Genera un mensaje personalizado diario para el creador
 */
export const generateDailyMessage = (
  creatorData: CreatorData,
  metrics: Metrics,
  goals: Goals
): string => {
  const username = creatorData.tiktok_username || creatorData.nombre;
  const greeting = `¡Hola @${username}! 🌟`;
  
  let message = `${greeting}\n\nTu avance del mes:\n`;
  message += `📅 Días en vivo: ${metrics.dias}\n`;
  message += `⏰ Horas acumuladas: ${metrics.horas.toFixed(1)}h\n`;
  message += `💎 Diamantes: ${metrics.diamantes.toLocaleString()}\n`;
  
  if (goals.nextGoal) {
    message += `\n🎯 Tu próxima meta: ${goals.nextGoal}`;
  }
  
  message += `\n\n¡Sigue así! Tu manager está aquí para apoyarte. 💪`;
  
  return message;
};

/**
 * Genera un mensaje de coaching personalizado
 */
export const generateCoachingMessage = (
  creatorData: CreatorData,
  remainingDays: number,
  requiredDailyDiamonds: number
): string => {
  const username = creatorData.tiktok_username || creatorData.nombre;
  
  return `¡Hola @${username}! 🌟

Quedan ${remainingDays} días del mes. Para alcanzar tu meta, necesitas aproximadamente ${requiredDailyDiamonds.toLocaleString()} diamantes por día.

Recuerda:
- Mantén tu constancia en vivo
- Interactúa con tu audiencia
- Aprovecha las batallas para impulsar tus diamantes

¡Tu manager cree en ti! 💪`;
};

/**
 * Genera un mensaje de felicitación por meta alcanzada
 */
export const generateCongratulationsMessage = (
  creatorData: CreatorData,
  goalReached: string
): string => {
  const username = creatorData.tiktok_username || creatorData.nombre;
  
  return `🎉 ¡FELICIDADES @${username}! 🎉

¡Alcanzaste tu meta de ${goalReached}! Este es un gran logro que demuestra tu dedicación y talento.

Tu manager está muy orgulloso de ti. ¡Sigamos por más éxitos! 🚀`;
};
