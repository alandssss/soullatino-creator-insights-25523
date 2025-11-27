# Supabase → Airtable Daily Sync Integration

## 📋 Overview

Automated daily synchronization system that extracts creator metrics from Supabase and syncs to Airtable at **6:00 AM daily**.

**Purpose**: Feed Airtable with daily creator performance data. Airtable handles report generation and delivery via Humand API.

**What this system does**:
- ✅ Extract yesterday's metrics from Supabase
- ✅ Upsert creators to Airtable `Creadores` table
- ✅ Upsert daily metrics to Airtable `DailyMetrics` table
- ✅ Handle errors with retry logic
- ✅ Log execution details

**What this system does NOT do**:
- ❌ Generate reports (Airtable does this)
- ❌ Send emails or messages (Airtable → Humand does this)
- ❌ Format data for end users (Airtable formulas do this)

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Supabase DB   │
│  (creators +    │
│  daily_stats)   │
└────────┬────────┘
         │
         │ Extract (6:00 AM daily)
         ▼
┌─────────────────────────┐
│  Edge Function          │
│  sync-to-airtable       │
│  - Data extraction      │
│  - Transformation       │
│  - Retry logic          │
└────────┬────────────────┘
         │
         │ Upsert
         ▼
┌─────────────────────────┐
│   Airtable Base         │
│   - Creadores table     │
│   - DailyMetrics table  │
└────────┬────────────────┘
         │
         │ Automations
         ▼
┌─────────────────────────┐
│   Humand API            │
│   (Email reports)       │
└─────────────────────────┘
```

---

## 📊 Airtable Schema

### Table: **Creadores**

| Field Name       | Type              | Description                    |
|------------------|-------------------|--------------------------------|
| creator_id       | Single line text  | Unique creator ID (primary)    |
| username         | Single line text  | Creator display name           |
| email            | Email             | Contact email for reports      |
| nivel_actual     | Single select     | Current level (G0-G11)         |
| meta_dias_mes    | Number            | Monthly days goal (default: 22)|
| meta_horas_mes   | Number            | Monthly hours goal (default: 80)|

### Table: **DailyMetrics**

| Field Name         | Type              | Description                    |
|--------------------|-------------------|--------------------------------|
| creator            | Link to Creadores | Linked creator record          |
| fecha              | Date              | Metric date (YYYY-MM-DD)       |
| diamonds_dia       | Number            | Daily diamonds earned          |
| live_hours_dia     | Number            | Daily live hours               |
| new_followers_dia  | Number            | Daily new followers            |
| hizo_live          | Number            | 1 if went live, 0 if not       |
| mes                | Formula           | `DATETIME_FORMAT({fecha}, "YYYY-MM")` |

**Unique Constraint**: Configure in Airtable to prevent duplicates on `creator + fecha`

---

## 🚀 Deployment Guide

### Step 1: Database Migration

Run the migration to add required fields to Supabase:

```bash
cd /Users/worki/.gemini/antigravity/scratch/soullatino-creator-insights-25523

# Apply migration
supabase db push
```

Or manually execute:
```bash
psql $DATABASE_URL -f supabase/migrations/20251127000001_add_email_and_meta_fields.sql
```

### Step 2: Configure Environment Variables

Set secrets in Supabase Dashboard:

```bash
# Navigate to: Supabase Dashboard → Edge Functions → Settings

# Set each secret:
supabase secrets set SUPABASE_URL=https://mpseoscrzpnequwvzokn.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set AIRTABLE_API_KEY=your_airtable_token
supabase secrets set AIRTABLE_BASE_ID=apprY9jmQ4RvDGo17
supabase secrets set AIRTABLE_CREATORS_TABLE_ID=tblXXXXXXXX
supabase secrets set AIRTABLE_DAILY_METRICS_TABLE_ID=tblYYYYYYYY
supabase secrets set ALERT_EMAIL=admin@soullatino.com
```

**How to get Airtable Table IDs**:
1. Open your Airtable base
2. Click on a table
3. Look at the URL: `https://airtable.com/apprY9jmQ4RvDGo17/tblXXXXXXXX/...`
4. The part after the base ID is the table ID

### Step 3: Deploy Edge Function

```bash
# Deploy the function
supabase functions deploy sync-to-airtable

# Verify deployment
supabase functions list
```

### Step 4: Setup CRON Job

Execute the CRON setup script:

```bash
psql $DATABASE_URL -f scripts/setup-airtable-sync-cron.sql
```

**Verify CRON job**:
```sql
SELECT * FROM cron.job WHERE jobname = 'daily-airtable-sync';
```

---

## 🧪 Testing

### Manual Sync (Test Mode)

Trigger a manual sync for a specific date:

```bash
curl -X POST https://mpseoscrzpnequwvzokn.supabase.co/functions/v1/sync-to-airtable \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-11-26"}'
```

### Verify in Airtable

1. Open your Airtable base
2. Check `Creadores` table - should have creator records
3. Check `DailyMetrics` table - should have daily records
4. Verify linked records show correctly
5. Check `mes` formula calculates correctly

### Monitor Logs

View Edge Function logs in Supabase Dashboard:
- Navigate to: Edge Functions → sync-to-airtable → Logs
- Look for sync summary output

View CRON execution history:
```sql
SELECT 
  runid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-airtable-sync')
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🔧 Troubleshooting

### Issue: No data synced

**Check**:
1. Verify data exists in Supabase for yesterday:
   ```sql
   SELECT COUNT(*) FROM creator_daily_stats 
   WHERE fecha = CURRENT_DATE - INTERVAL '1 day';
   ```
2. Check Edge Function logs for errors
3. Verify environment variables are set correctly

### Issue: Rate limit errors (429)

**Solution**: The client has built-in retry logic with exponential backoff. If persistent:
- Reduce batch size in code
- Add delay between requests
- Check Airtable API limits

### Issue: Creator not found in Airtable

**Solution**: The system auto-creates creators. Check:
1. Airtable API key has write permissions
2. Table ID is correct
3. Check Edge Function logs for creation errors

### Issue: Duplicate records in DailyMetrics

**Solution**: 
1. Configure unique constraint in Airtable on `creator + fecha`
2. The upsert logic should prevent this, check logs

---

## 📧 Email Alerts

The system includes a placeholder for email alerts on failures. To implement:

1. Choose an email service (SendGrid, Resend, AWS SES, etc.)
2. Add credentials to environment variables
3. Implement the `sendErrorAlert()` function in `index.ts`

**Example with Resend**:
```typescript
async function sendErrorAlert(result: SyncResult, config: any) {
  if (!config.alertEmail) return;
  
  const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
  
  await resend.emails.send({
    from: 'alerts@soullatino.com',
    to: config.alertEmail,
    subject: `⚠️ Airtable Sync Failed - ${result.date}`,
    html: formatErrorReport(result),
  });
}
```

---

## 📝 Maintenance

### Update Creator Meta Goals

To change default meta values:

```sql
UPDATE creators 
SET 
  meta_dias_mes = 25,
  meta_horas_mes = 100
WHERE nivel_actual = 'G5';
```

### Re-sync Historical Data

To re-sync a specific date:

```bash
curl -X POST https://mpseoscrzpnequwvzokn.supabase.co/functions/v1/sync-to-airtable \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-11-20"}'
```

### Disable CRON Job

```sql
SELECT cron.unschedule('daily-airtable-sync');
```

### Re-enable CRON Job

Re-run the setup script:
```bash
psql $DATABASE_URL -f scripts/setup-airtable-sync-cron.sql
```

---

## 🔒 Security Notes

- **Never commit** `.env` files or API keys to git
- Use Supabase secrets for all sensitive values
- Airtable API key should have minimal required scopes
- Service role key should only be used server-side
- Consider IP whitelisting for production

---

## 📚 Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Airtable API Reference](https://airtable.com/developers/web/api/introduction)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)

---

## 🆘 Support

For issues or questions:
1. Check Edge Function logs in Supabase Dashboard
2. Review CRON job execution history
3. Verify Airtable data manually
4. Check this documentation for troubleshooting steps
