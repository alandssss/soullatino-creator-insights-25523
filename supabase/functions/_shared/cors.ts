// CORS estricto con whitelist de dominios permitidos
const ALLOWED_ORIGINS = new Set([
  "https://mpseoscrzpnequwvzokn.lovableproject.com",
  "http://localhost:5173",
  "http://localhost:8080",
]);

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function withCORS(response: Response, origin: string | null): Response {
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "";
  const headers = new Headers(response.headers);
  
  if (allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  
  headers.set("Vary", "Origin");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type");
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function handleCORSPreflight(origin: string | null): Response {
  return withCORS(
    new Response(null, { status: 204 }),
    origin
  );
}
