// Rate limiting con Deno KV (ventana deslizante por minuto)
export interface RateLimitConfig {
  key: string;
  limitPerMin: number;
}

export interface RateLimitResult {
  ok: boolean;
  response?: Response;
}

export async function rateLimit(
  req: Request, 
  cfg: RateLimitConfig
): Promise<RateLimitResult> {
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const minute = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
  const bucket = `ratelimit:${cfg.key}:${ip}:${minute}`;
  
  try {
    // @ts-ignore - Deno KV disponible en Edge Functions
    const kv = await Deno.openKv?.();
    if (!kv) {
      console.warn("Deno KV no disponible, skipping rate limit");
      return { ok: true };
    }
    
    const current = (await kv.get<number>([bucket])).value ?? 0;
    
    if (current >= cfg.limitPerMin) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({ 
            error: "rate_limit",
            message: "Demasiadas peticiones. Intenta de nuevo en 1 minuto." 
          }), 
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "60",
            }
          }
        )
      };
    }
    
    // Incrementar contador con TTL de 60 segundos
    await kv.set([bucket], current + 1, { expireIn: 60_000 });
    
    return { ok: true };
  } catch (error) {
    console.error("Rate limit error:", error);
    // En caso de error, permitir request (fail open)
    return { ok: true };
  }
}
