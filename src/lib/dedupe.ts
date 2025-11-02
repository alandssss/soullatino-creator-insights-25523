/**
 * Utilidades de deduplicación para creadores
 */

export function dedupeBy<T>(items: T[], getKey: (item: T) => string | number): T[] {
  return Array.from(new Map(items.map(i => [getKey(i), i])).values());
}

export function normalizePhone(p?: string | null): string {
  return (p || '').replace(/\D/g, '');
}

export function normalizeName(n?: string | null): string {
  return (n || '').toLowerCase().trim();
}

export function creatorKey(c: { telefono?: string | null; nombre?: string | null }): string {
  const phoneNorm = normalizePhone(c.telefono);
  const nameNorm = normalizeName(c.nombre);
  return phoneNorm || nameNorm;
}
