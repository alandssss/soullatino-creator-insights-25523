import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY') ?? '';

        // Extract project ref from URL
        const projectRef = supabaseUrl.split('://')[1]?.split('.')[0] ?? 'unknown';

        const supabase = createClient(supabaseUrl, serviceRoleKey);

        // Count rows in key tables
        const { count: creatorsCount, error: creatorsError } = await supabase
            .from('creators')
            .select('*', { count: 'exact', head: true });

        const { count: dailyCount, error: dailyError } = await supabase
            .from('creator_daily_stats')
            .select('*', { count: 'exact', head: true });

        const { count: bonifCount, error: bonifError } = await supabase
            .from('creator_bonificaciones')
            .select('*', { count: 'exact', head: true });

        return new Response(
            JSON.stringify({
                environment: {
                    supabaseUrl: supabaseUrl,
                    projectRef: projectRef,
                    hasKey: !!serviceRoleKey
                },
                database: {
                    creators: { count: creatorsCount, error: creatorsError?.message },
                    daily_stats: { count: dailyCount, error: dailyError?.message },
                    bonificaciones: { count: bonifCount, error: bonifError?.message }
                }
            }),
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
});
