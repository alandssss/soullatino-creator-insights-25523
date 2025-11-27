-- ================================================================
-- Migration: Add email and meta fields for Airtable integration
-- Date: 2025-11-27
-- Purpose: Support daily sync to Airtable with email reports
-- ================================================================

-- Add email field to creators table
ALTER TABLE public.creators 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add meta fields for monthly goals
ALTER TABLE public.creators 
ADD COLUMN IF NOT EXISTS meta_dias_mes INTEGER DEFAULT 22;

ALTER TABLE public.creators 
ADD COLUMN IF NOT EXISTS meta_horas_mes INTEGER DEFAULT 80;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_creators_email 
ON public.creators(email) 
WHERE email IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.creators.email IS 'Creator email address for reports and notifications';
COMMENT ON COLUMN public.creators.meta_dias_mes IS 'Monthly goal for live streaming days (default: 22)';
COMMENT ON COLUMN public.creators.meta_horas_mes IS 'Monthly goal for live streaming hours (default: 80)';

-- Update existing creators with default meta values if NULL
UPDATE public.creators 
SET 
  meta_dias_mes = COALESCE(meta_dias_mes, 22),
  meta_horas_mes = COALESCE(meta_horas_mes, 80)
WHERE meta_dias_mes IS NULL OR meta_horas_mes IS NULL;
