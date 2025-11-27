
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Found' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('Checking creators table full select...');
    const { data, error } = await supabase.from('creators').select('id, nombre').limit(1);

    if (error) {
        console.error('❌ Error accessing creators table:', error);
    } else {
        console.log('✅ Creators table is visible! Rows found:', data.length);
        if (data.length > 0) console.log('Sample:', data[0]);
    }
}

checkTable();
