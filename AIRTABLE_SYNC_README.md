# 🔄 Supabase → Airtable Daily Sync

Automated daily synchronization system for creator metrics.

## 🎯 Purpose

**Backend responsibility**: Extract daily metrics from Supabase and sync to Airtable.

**Airtable responsibility**: Generate reports, send via Humand API.

## ⏰ Schedule

**Daily at 6:00 AM** via pg_cron

## 📦 What's Included

```
supabase/functions/sync-to-airtable/
├── index.ts                          # Main Edge Function handler
├── types.ts                          # TypeScript interfaces
├── services/
│   ├── supabaseExtractor.ts         # Data extraction from Supabase
│   └── airtableClient.ts            # Airtable API integration
└── .env.example                      # Environment variables template

supabase/migrations/
└── 20251127000001_add_email_and_meta_fields.sql

scripts/
├── setup-airtable-sync-cron.sql     # CRON job configuration
└── deploy-airtable-sync.sh          # Automated deployment

docs/
└── AIRTABLE_INTEGRATION.md          # Full documentation
```

## 🚀 Quick Start

### 1. Deploy

```bash
./scripts/deploy-airtable-sync.sh
```

### 2. Configure Secrets

In Supabase Dashboard → Edge Functions → Settings:

```bash
SUPABASE_URL=https://mpseoscrzpnequwvzokn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key
AIRTABLE_API_KEY=your_token
AIRTABLE_BASE_ID=apprY9jmQ4RvDGo17
AIRTABLE_CREATORS_TABLE_ID=tblXXXX
AIRTABLE_DAILY_METRICS_TABLE_ID=tblYYYY
ALERT_EMAIL=admin@soullatino.com
```

### 3. Test

```bash
curl -X POST https://mpseoscrzpnequwvzokn.supabase.co/functions/v1/sync-to-airtable \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-11-26"}'
```

## 📊 Data Flow

```
Supabase DB (creators + daily_stats)
         ↓
   Extract metrics
         ↓
Edge Function (transform + retry)
         ↓
   Upsert to Airtable
         ↓
Airtable (Creadores + DailyMetrics)
         ↓
   Automations
         ↓
Humand API (email reports)
```

## 🔧 Key Features

- ✅ **Automatic creator creation** - Creates missing creators in Airtable
- ✅ **Upsert logic** - Updates existing records, creates new ones
- ✅ **Retry mechanism** - Exponential backoff for rate limits
- ✅ **Error handling** - Comprehensive logging and alerts
- ✅ **Pagination** - Handles large datasets
- ✅ **Type safety** - Full TypeScript support

## 📚 Documentation

See [docs/AIRTABLE_INTEGRATION.md](./docs/AIRTABLE_INTEGRATION.md) for:
- Architecture details
- Airtable schema requirements
- Deployment guide
- Testing procedures
- Troubleshooting
- Maintenance tasks

## 🆘 Troubleshooting

**No data synced?**
```sql
-- Check if data exists for yesterday
SELECT COUNT(*) FROM creator_daily_stats 
WHERE fecha = CURRENT_DATE - INTERVAL '1 day';
```

**CRON not running?**
```sql
-- Verify CRON job
SELECT * FROM cron.job WHERE jobname = 'daily-airtable-sync';

-- Check execution history
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-airtable-sync')
ORDER BY start_time DESC LIMIT 5;
```

**View logs**: Supabase Dashboard → Edge Functions → sync-to-airtable → Logs

## 🔒 Security

- Never commit API keys or secrets
- Use Supabase secrets for all credentials
- Service role key is server-side only
- Airtable token has minimal required scopes

---

**Built with**: Supabase Edge Functions (Deno) + Airtable REST API
