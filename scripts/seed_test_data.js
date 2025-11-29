
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fhboambxnmswtxalllnn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seedData() {
    console.log('🌱 Seeding test data...');

    const email = 'test@soullatino.com';
    let creatorId;

    // 1. Check if creator exists
    const { data: existingCreator } = await supabase
        .from('creators')
        .select('creator_id')
        .eq('email', email)
        .single();

    if (existingCreator) {
        console.log('ℹ️ Test creator already exists');
        creatorId = existingCreator.creator_id;
    } else {
        creatorId = crypto.randomUUID();
        const testCreator = {
            creator_id: creatorId,
            nombre: 'Test Creator',
            email: email,
            estado_graduacion: 'active',
            meta_dias_mes: 22,
            meta_horas_mes: 80,
            tiktok_username: 'test_user_tiktok'
        };

        const { error: insertError } = await supabase
            .from('creators')
            .insert(testCreator);

        if (insertError) {
            console.error('❌ Error creating creator:', insertError);
            return;
        }
        console.log(`✅ Test creator created with ID: ${creatorId}`);
    }

    // 2. Insert daily stats for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const { data: existingStat } = await supabase
        .from('creator_daily_stats')
        .select('*')
        .eq('creator_id', creatorId)
        .eq('fecha', dateStr)
        .single();

    if (!existingStat) {
        const testStat = {
            creator_id: creatorId,
            fecha: dateStr,
            diamantes: 1500,
            duracion_live_horas: 2.5,
            nuevos_seguidores: 10,
            emisiones_live: 1
        };

        const { error: statError } = await supabase
            .from('creator_daily_stats')
            .insert(testStat);

        if (statError) {
            console.error('❌ Error creating stats:', statError);
            return;
        }
        console.log(`✅ Test stats seeded for date: ${dateStr}`);
    } else {
        console.log(`ℹ️ Test stats already exist for ${dateStr}`);
    }
}

seedData();
