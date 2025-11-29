require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateCreator() {
    console.log('Intentando crear un creador de prueba...\n');

    const testCreator = {
        creator_id: 'test_creator_manual_1',
        nombre: 'Test Creator Manual 1',
        tiktok_username: 'test_creator_manual_1',
        telefono: '+1234567890'
    };

    const { data, error } = await supabase
        .from('creators')
        .insert([testCreator])
        .select();

    if (error) {
        console.error('❌ Error creando creador:', error);
    } else {
        console.log('✅ Creador creado exitosamente:', data);
    }
}

testCreateCreator();
