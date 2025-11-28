-- Create debug_logs table
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    function_name text,
    message text,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS but allow everything for now (internal use)
ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to debug_logs" ON public.debug_logs
    FOR ALL USING (true) WITH CHECK (true);
