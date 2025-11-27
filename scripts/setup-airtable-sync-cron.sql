-- ================================================================
-- Setup CRON Job for Daily Airtable Sync
-- Schedule: 6:00 AM daily
-- ================================================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create CRON job for daily sync at 6:00 AM
-- This will trigger the Edge Function every day
SELECT cron.schedule(
  'daily-airtable-sync',           -- Job name
  '0 6 * * *',                      -- Cron expression: 6:00 AM daily
  $$
  SELECT
    net.http_post(
      url := 'https://mpseoscrzpnequwvzokn.supabase.co/functions/v1/sync-to-airtable',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'scheduled', true,
        'timestamp', now()
      )
    ) AS request_id;
  $$
);

-- ================================================================
-- Verify CRON job was created
-- ================================================================
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'daily-airtable-sync';

-- ================================================================
-- View CRON job execution history
-- ================================================================
SELECT 
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid 
  FROM cron.job 
  WHERE jobname = 'daily-airtable-sync'
)
ORDER BY start_time DESC
LIMIT 10;

-- ================================================================
-- OPTIONAL: Manually trigger the sync (for testing)
-- ================================================================
-- Uncomment and run this to test the sync immediately:
/*
SELECT
  net.http_post(
    url := 'https://mpseoscrzpnequwvzokn.supabase.co/functions/v1/sync-to-airtable',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY_HERE'
    ),
    body := jsonb_build_object(
      'manual', true,
      'date', (CURRENT_DATE - INTERVAL '1 day')::text
    )
  ) AS request_id;
*/

-- ================================================================
-- OPTIONAL: Delete the CRON job
-- ================================================================
-- Uncomment to remove the CRON job:
/*
SELECT cron.unschedule('daily-airtable-sync');
*/
