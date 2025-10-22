import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No autorizado');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extraer el JWT del header
    const jwt = authHeader.replace('Bearer ', '');
    
    // Verificar el JWT y obtener el user_id
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      throw new Error('Usuario no autenticado');
    }

    const { role = 'viewer' } = await req.json().catch(() => ({}));

    // Validar el rol
    const validRoles = ['admin', 'manager', 'viewer'];
    if (!validRoles.includes(role)) {
      throw new Error(`Rol inválido: ${role}`);
    }

    console.log(`[ensure-user-role] Asignando rol '${role}' a user ${user.id}`);

    // Upsert del rol usando el cliente admin
    const { data, error } = await supabase
      .from('user_roles')
      .upsert(
        { user_id: user.id, role },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('[ensure-user-role] Error:', error);
      throw error;
    }

    console.log(`[ensure-user-role] Rol asignado exitosamente:`, data);

    return new Response(
      JSON.stringify({
        success: true,
        role: data.role,
        message: `Rol '${data.role}' asignado correctamente`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('[ensure-user-role] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
