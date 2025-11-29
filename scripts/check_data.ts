
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const supabaseUrl = 'https://fhboambxnmswtxalllnn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkData() {
  console.log('Checking for available data...');
  
  const { data, error } = await supabase
    .from('creator_daily_stats')
    .select('fecha')
    .order('fecha', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No data found in creator_daily_stats');
    return;
  }

  // Group by date
  const dates = {};
  data.forEach(row => {
    dates[row.fecha] = (dates[row.fecha] || 0) + 1;
  });

  console.log('Available dates:', dates);
}

checkData();
