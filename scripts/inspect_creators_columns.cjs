require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectColumns() {
    console.log('Inspeccionando columnas de creators...\n');

    // Try to insert a dummy record to get a column error, which often lists columns
    const { error } = await supabase
        .from('creators')
        .insert({ 'non_existent_column': 'test' });

    if (error) {
        console.log('Error (puede contener info de columnas):', error.message);
        if (error.hint) console.log('Hint:', error.hint);
    }

    // Also try to select a record to see the structure
    const { data } = await supabase
        .from('creators')
        .select('*')
        .limit(1);

    if (data && data.length > 0) {
        console.log('\nColumnas encontradas en el primer registro:');
        console.log(Object.keys(data[0]));
    }
}

inspectColumns();
