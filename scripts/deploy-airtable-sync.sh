#!/bin/bash

# ================================================================
# Supabase → Airtable Sync - Deployment Script
# ================================================================

set -e  # Exit on error

echo "=================================================="
echo "🚀 Deploying Airtable Sync Integration"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ================================================================
# Step 1: Verify Supabase CLI is installed
# ================================================================
echo -e "\n${YELLOW}[1/5]${NC} Checking Supabase CLI..."

if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install it: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"

# ================================================================
# Step 2: Verify we're in the correct directory
# ================================================================
echo -e "\n${YELLOW}[2/5]${NC} Verifying project structure..."

if [ ! -d "supabase/functions/sync-to-airtable" ]; then
    echo -e "${RED}❌ Edge Function directory not found${NC}"
    echo "Make sure you're in the project root directory"
    exit 1
fi

echo -e "${GREEN}✅ Project structure verified${NC}"

# ================================================================
# Step 3: Apply database migrations
# ================================================================
echo -e "\n${YELLOW}[3/5]${NC} Applying database migrations..."

if [ -f "supabase/migrations/20251127000001_add_email_and_meta_fields.sql" ]; then
    echo "Applying migration: add_email_and_meta_fields.sql"
    
    # Check if SUPABASE_DB_URL is set
    if [ -z "$SUPABASE_DB_URL" ]; then
        echo -e "${YELLOW}⚠️  SUPABASE_DB_URL not set. Skipping migration.${NC}"
        echo "To apply manually, run:"
        echo "  psql \$SUPABASE_DB_URL -f supabase/migrations/20251127000001_add_email_and_meta_fields.sql"
    else
        psql "$SUPABASE_DB_URL" -f supabase/migrations/20251127000001_add_email_and_meta_fields.sql
        echo -e "${GREEN}✅ Migration applied${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Migration file not found${NC}"
fi

# ================================================================
# Step 4: Deploy Edge Function
# ================================================================
echo -e "\n${YELLOW}[4/5]${NC} Deploying Edge Function..."

supabase functions deploy sync-to-airtable --no-verify-jwt

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Edge Function deployed successfully${NC}"
else
    echo -e "${RED}❌ Edge Function deployment failed${NC}"
    exit 1
fi

# ================================================================
# Step 5: Setup CRON job
# ================================================================
echo -e "\n${YELLOW}[5/5]${NC} Setting up CRON job..."

if [ -z "$SUPABASE_DB_URL" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_DB_URL not set. Skipping CRON setup.${NC}"
    echo "To setup manually, run:"
    echo "  psql \$SUPABASE_DB_URL -f scripts/setup-airtable-sync-cron.sql"
else
    psql "$SUPABASE_DB_URL" -f scripts/setup-airtable-sync-cron.sql
    echo -e "${GREEN}✅ CRON job configured${NC}"
fi

# ================================================================
# Deployment Summary
# ================================================================
echo -e "\n=================================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=================================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Set environment variables in Supabase Dashboard:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - AIRTABLE_API_KEY"
echo "   - AIRTABLE_BASE_ID"
echo "   - AIRTABLE_CREATORS_TABLE_ID"
echo "   - AIRTABLE_DAILY_METRICS_TABLE_ID"
echo "   - ALERT_EMAIL (optional)"
echo ""
echo "2. Test the sync manually:"
echo "   curl -X POST https://mpseoscrzpnequwvzokn.supabase.co/functions/v1/sync-to-airtable \\"
echo "     -H \"Authorization: Bearer YOUR_SERVICE_ROLE_KEY\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"date\": \"2025-11-26\"}'"
echo ""
echo "3. Verify CRON job:"
echo "   SELECT * FROM cron.job WHERE jobname = 'daily-airtable-sync';"
echo ""
echo "4. Monitor logs in Supabase Dashboard"
echo ""
echo "📚 Full documentation: docs/AIRTABLE_INTEGRATION.md"
echo ""
