require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fhboambxnmswtxalllnn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE';
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
