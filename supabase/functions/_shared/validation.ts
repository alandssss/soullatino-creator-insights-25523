import { z } from "https://esm.sh/zod@3.23.8";

export interface ValidationResult<T> {
  ok: boolean;
  data?: T;
  response?: Response;
}

export async function validate<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return { ok: true, data };
  } catch (error) {
    const message = error instanceof z.ZodError 
      ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
      : String(error);
      
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ 
          error: "validation",
          message: "Error de validación",
          details: message 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      )
    };
  }
}
