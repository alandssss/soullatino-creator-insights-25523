-- Enable the pg_cron extension
create extension if not exists pg_cron;

-- Schedule the daily recompute job for 6:00 AM America/Chihuahua time
-- Note: cron uses UTC, so 6:00 AM Chihuahua (UTC-6) is 12:00 PM UTC
-- Adjusting for Standard Time (UTC-6) -> 12:00 UTC
-- Adjusting for Daylight Savings (if applicable) -> check local time

-- We'll schedule it for 12:00 UTC (6:00 AM CST)
select cron.schedule(
  'daily-recompute', -- Job name
  '0 12 * * *',      -- Cron expression (12:00 UTC)
  $$
  select
    net.http_post(
      url:='https://fhboambxnmswtxalllnn.supabase.co/functions/v1/cron-daily-recompute',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
    ) as request_id;
  $$
);

-- Verify the job is scheduled
select * from cron.job;
