const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://fhboambxnmswtxalllnn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking creators table schema...\n');

    // Get one creator to see all columns
    const { data, error } = await supabase
        .from('creators')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Available columns in creators table:');
        console.log(Object.keys(data[0]).sort().join('\n'));

        // Check for specific columns
        const requiredColumns = ['meta_dias_mes', 'meta_horas_mes', 'estado_graduacion', 'email'];
        console.log('\n\nChecking required columns:');
        requiredColumns.forEach(col => {
            const exists = col in data[0];
            console.log(`${exists ? '✅' : '❌'} ${col}`);
        });
    } else {
        console.log('No creators found');
    }
}

checkSchema();
