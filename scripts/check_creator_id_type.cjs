require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCreatorIdType() {
    console.log('Verificando tipo de creator_id...\n');

    // Try to insert a text value into creator_id
    const { error } = await supabase
        .from('creators')
        .insert({
            creator_id: 'not_a_uuid',
            nombre: 'Type Test',
            tiktok_username: 'type_test'
        });

    if (error) {
        console.log('Error:', error.message);
        if (error.message.includes('uuid')) {
            console.log('⚠️ creator_id parece ser UUID');
        } else {
            console.log('ℹ️ Error no relacionado con UUID (probablemente text)');
        }
    } else {
        console.log('✅ Insertó texto exitosamente -> creator_id es TEXT');
        // Cleanup
        await supabase.from('creators').delete().eq('tiktok_username', 'type_test');
    }
}

checkCreatorIdType();
