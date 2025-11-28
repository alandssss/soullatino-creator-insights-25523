-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Schedule the daily recompute job for 6:00 AM America/Chihuahua time (12:00 UTC)
select cron.schedule(
  'daily-recompute',
  '0 12 * * *',
  $$
  select
    net.http_post(
      url:='https://fhboambxnmswtxalllnn.supabase.co/functions/v1/cron-daily-recompute',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE"}'::jsonb
    ) as request_id;
  $$
);
