/**
 * Utilidad para obtener el nombre de display de un creador
 * Prioriza tiktok_username > nombre (si no es ID) > creator_id
 */

export interface CreatorDisplayData {
  tiktok_username?: string | null;
  nombre?: string | null;
  creator_id?: string | null;
}

/**
 * Detecta si un string parece un ID numérico largo de TikTok
 */
const looksLikeNumericId = (str: string): boolean => {
  return /^\d{10,}$/.test(str.trim());
};

/**
 * Obtiene el nombre de display prioritario para un creador
 */
export const getCreatorDisplayName = (creator: CreatorDisplayData | null | undefined): string => {
  if (!creator) return 'Sin nombre';

  // Prioridad 1: tiktok_username (si no es un ID numérico)
  if (creator.tiktok_username && !looksLikeNumericId(creator.tiktok_username)) {
    const username = creator.tiktok_username.trim();
    return username.startsWith('@') ? username : `@${username}`;
  }

  // Prioridad 2: nombre (si no es un ID numérico)
  if (creator.nombre && !looksLikeNumericId(creator.nombre)) {
    return creator.nombre.trim();
  }

  // Prioridad 3: creator_id (sanitizado, no numérico)
  if (creator.creator_id && !looksLikeNumericId(creator.creator_id)) {
    const creatorId = creator.creator_id.trim();
    return creatorId.startsWith('@') ? creatorId : `@${creatorId}`;
  }

  // Último recurso: mostrar que falta el nombre
  return 'ID no válido';
};

/**
 * Obtiene el nombre corto (sin @) para display en UI compacta
 */
export const getCreatorShortName = (creator: CreatorDisplayData | null | undefined): string => {
  const displayName = getCreatorDisplayName(creator);
  return displayName.replace(/^@/, '');
};
