#!/bin/bash

# ================================================================
# Test Script: Airtable Sync Integration
# ================================================================

set -e

echo "=================================================="
echo "🧪 Testing Airtable Sync Integration"
echo "=================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ================================================================
# Configuration
# ================================================================
SUPABASE_URL="${SUPABASE_URL:-https://mpseoscrzpnequwvzokn.supabase.co}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_SERVICE_ROLE_KEY not set${NC}"
    echo "Set it with: export SUPABASE_SERVICE_ROLE_KEY=your_key"
    exit 1
fi

FUNCTION_URL="${SUPABASE_URL}/functions/v1/sync-to-airtable"

# ================================================================
# Test 1: Check if Edge Function is deployed
# ================================================================
echo -e "\n${BLUE}[Test 1/4]${NC} Checking Edge Function deployment..."

response=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$FUNCTION_URL" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d '{}')

if [ "$response" == "200" ] || [ "$response" == "207" ]; then
    echo -e "${GREEN}✅ Edge Function is deployed and responding${NC}"
else
    echo -e "${RED}❌ Edge Function not responding (HTTP $response)${NC}"
    exit 1
fi

# ================================================================
# Test 2: Test with yesterday's date
# ================================================================
echo -e "\n${BLUE}[Test 2/4]${NC} Testing sync for yesterday..."

yesterday=$(date -v-1d +%Y-%m-%d 2>/dev/null || date -d "yesterday" +%Y-%m-%d)
echo "Target date: $yesterday"

response=$(curl -s -X POST "$FUNCTION_URL" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"date\": \"$yesterday\"}")

echo "$response" | jq '.' 2>/dev/null || echo "$response"

if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    total=$(echo "$response" | jq -r '.totalRecords // 0')
    errors=$(echo "$response" | jq -r '.errors | length // 0')
    
    echo -e "${GREEN}✅ Sync completed${NC}"
    echo "   Total records: $total"
    echo "   Errors: $errors"
    
    if [ "$errors" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Some errors occurred${NC}"
        echo "$response" | jq -r '.errors[]'
    fi
else
    echo -e "${RED}❌ Sync failed${NC}"
fi

# ================================================================
# Test 3: Test with specific date (2 days ago)
# ================================================================
echo -e "\n${BLUE}[Test 3/4]${NC} Testing sync for specific date (2 days ago)..."

two_days_ago=$(date -v-2d +%Y-%m-%d 2>/dev/null || date -d "2 days ago" +%Y-%m-%d)
echo "Target date: $two_days_ago"

response=$(curl -s -X POST "$FUNCTION_URL" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"date\": \"$two_days_ago\"}")

if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    total=$(echo "$response" | jq -r '.totalRecords // 0')
    echo -e "${GREEN}✅ Sync completed for $two_days_ago${NC}"
    echo "   Total records: $total"
else
    echo -e "${YELLOW}⚠️  No data or sync failed for $two_days_ago${NC}"
fi

# ================================================================
# Test 4: Verify CRON job configuration
# ================================================================
echo -e "\n${BLUE}[Test 4/4]${NC} Verifying CRON job..."

if [ -z "$SUPABASE_DB_URL" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_DB_URL not set, skipping CRON verification${NC}"
else
    cron_check=$(psql "$SUPABASE_DB_URL" -t -c \
        "SELECT COUNT(*) FROM cron.job WHERE jobname = 'daily-airtable-sync';" 2>/dev/null || echo "0")
    
    if [ "$cron_check" -gt 0 ]; then
        echo -e "${GREEN}✅ CRON job is configured${NC}"
        
        # Show CRON details
        psql "$SUPABASE_DB_URL" -c \
            "SELECT jobid, schedule, active FROM cron.job WHERE jobname = 'daily-airtable-sync';"
    else
        echo -e "${RED}❌ CRON job not found${NC}"
        echo "Run: psql \$SUPABASE_DB_URL -f scripts/setup-airtable-sync-cron.sql"
    fi
fi

# ================================================================
# Summary
# ================================================================
echo -e "\n=================================================="
echo -e "${GREEN}✅ Testing Complete${NC}"
echo "=================================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Verify data in Airtable:"
echo "   - Check Creadores table for creator records"
echo "   - Check DailyMetrics table for daily data"
echo "   - Verify linked records"
echo ""
echo "2. Monitor logs in Supabase Dashboard:"
echo "   Edge Functions → sync-to-airtable → Logs"
echo ""
echo "3. Check CRON execution history:"
echo "   psql \$SUPABASE_DB_URL -c \"SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-airtable-sync') ORDER BY start_time DESC LIMIT 5;\""
echo ""
