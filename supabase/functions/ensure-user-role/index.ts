import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

    // Primero verificar si el usuario ya tiene un rol
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    // Si ya existe un rol, devolverlo sin cambios
    if (existingRole) {
      console.log(`[ensure-user-role] Usuario ${user.id} ya tiene rol '${existingRole.role}'`);
      return new Response(
        JSON.stringify({
          success: true,
          role: existingRole.role,
          message: `Rol existente '${existingRole.role}' mantenido`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Si no existe, crear uno nuevo con el rol proporcionado o 'viewer' por defecto
    const { role = 'viewer' } = await req.json().catch(() => ({}));

    // Validar el rol
    const validRoles = ['admin', 'manager', 'viewer', 'supervisor'];
    if (!validRoles.includes(role)) {
      throw new Error(`Rol inválido: ${role}`);
    }

    console.log(`[ensure-user-role] Creando nuevo rol '${role}' para user ${user.id}`);

    // Insertar el nuevo rol
    const { data, error } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role })
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
