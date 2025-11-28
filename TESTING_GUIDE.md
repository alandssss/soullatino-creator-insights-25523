# Testing Guide: Fixed Excel Upload 🧪

## **CRITICAL CHANGE DEPLOYED**
✅ `upload-excel-recommendations` now has **8-step exhaustive logging**  
✅ Changed from UPSERT to INSERT for clearer error reporting  
✅ Removed duplicate bonificaciones call from frontend  

---

## How to Test

### 1. Upload Excel File
- Go to `/admin` page
- Select your Excel file
- Click "Cargar Datos de Creadores"

### 2. What You'll See in Console (F12)

The function now logs **every single step**:

```
[STEP 1] === Processing file: nombre.xlsx Size: 123456 bytes
[STEP 2] === Excel parsed. Rows found: 393
[STEP 3] === Mapped rows: 385 out of 393
[STEP 4] === Creators created/updated: 12
[STEP 5] === Daily rows prepared: 385 (deduplicated from 387)
[STEP 6] === Deleting existing records for date: 2025-11-27
[STEP 6] Successfully deleted 0 existing records
[STEP 7] === Inserting 385 records into creator_daily_stats
[STEP 7] Sample record: {...}
[STEP 7] ✅ INSERT completed. Returned rows: 385
[STEP 7] Sample inserted record: {...}
[STEP 8] === Verifying data persistence...
[STEP 8] ✅ VERIFIED: 385 records in DB for 2025-11-27
[STEP 8] Sample verified record: {...}
[STEP 8] ✅✅✅ SUCCESS: Verified 385 records persisted to database
```

### 3. Expected Success Message

UI toast should show:
> ✅ Archivo procesado exitosamente  
> 393 filas procesadas. 385 registros disponibles para hoy.

> ✅ Bonificaciones calculadas  
> 385 creadores procesados

### 4. If It Fails

The console will show **exactly where** it failed:

- **[STEP 3] error** → Excel mapping issue (bad column names)
- **[STEP 6] error** → DELETE failed (permission issue)
- **[STEP 7] ❌ INSERT ERROR** → **THIS IS THE MOST LIKELY FAILURE**
  - Will show exact error code and details
  - Common errors:
    - `foreign_key_violation` → creator_id doesn't exist
    - `unique_violation` → duplicate (creator_id, fecha)
    - `permission_denied` → RLS policy blocking
- ** [STEP 8] ❌❌❌ CRITICAL FAILURE** → INSERT succeeded but 0 records in DB (should be impossible)

---

## Manual Verification

After successful upload, verify in DB:

```bash
# Check creator_daily_stats
node scripts/check_daily_stats.js

# Check creator_bonificaciones
node scripts/check_mes_referencia.js
```

**Expected**:
- `creator_daily_stats`: Should have 385 records for today
- `creator_bonificaciones`: Should have 385 records for current month (2025-11)

---

## Next Steps After Success

1. ✅ Verify data in Airtable:
   ```bash
   curl -X POST https://fhboambxnmswtxalllnn.supabase.co/functions/v1/sync-to-airtable \
     -H "Authorization: Bearer SERVICE_ROLE_KEY" \
     -d '{"month": "2025-11"}'
   ```

2. ✅ Check Airtable Base to see synced data

3. ✅ Setup CRON for daily automation
