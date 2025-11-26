// scripts/create-admin.js
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env (contains Supabase keys)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
    const adminEmail = 'admin@soullatino.com';
    const adminPassword = 'Admin123456';

    // 1️⃣ Create admin user (or fetch if already exists)
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
    });

    if (userError && !userError.message.includes('User already registered')) {
        console.error('❌ Error creating admin user:', userError.message);
        process.exit(1);
    }

    // Get user ID (from createUser response or by email lookup)
    let userId = userData?.user?.id;
    if (!userId) {
        const { data: existing } = await supabase.auth.admin.getUserByEmail(adminEmail);
        userId = existing?.user?.id;
    }

    if (!userId) {
        console.error('❌ Could not obtain admin user ID');
        process.exit(1);
    }

    console.log(`✅ Admin user ID: ${userId}`);

    // 2️⃣ Upsert admin role in user_roles table
    const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id' });

    if (roleError) {
        console.error('❌ Error assigning admin role:', roleError.message);
        process.exit(1);
    }

    console.log('✅ Admin role assigned successfully');
    console.log('🎉 You can now log in with admin@soullatino.com / Admin123456');
}

main();
