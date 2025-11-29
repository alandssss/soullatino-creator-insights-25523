require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testBulkInsert() {
    console.log('Intentando insertar múltiples creadores...\n');

    const creators = [];
    for (let i = 0; i < 5; i++) {
        creators.push({
            creator_id: `bulk_test_${i}`,
            nombre: `Bulk Test ${i}`,
            tiktok_username: `bulk_test_${i}`,
            telefono: `+100000000${i}`
        });
    }

    const { data, error } = await supabase
        .from('creators')
        .insert(creators)
        .select();

    if (error) {
        console.error('❌ Error en bulk insert:', error);
    } else {
        console.log(`✅ Insertados ${data.length} creadores exitosamente`);
    }
}

testBulkInsert();
