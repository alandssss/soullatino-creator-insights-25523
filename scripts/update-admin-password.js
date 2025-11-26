// scripts/update-admin-password.js
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
    const email = 'admin@soullatino.com';
    const newPassword = 'Pues56!'; // Updated to meet complexity requirements

    console.log(`🔄 Updating password for ${email}...`);

    // 1. Get User ID using listUsers
    const { data: { users }, error: findError } = await supabase.auth.admin.listUsers();

    if (findError) {
        console.error('❌ Error listing users:', findError.message);
        process.exit(1);
    }

    let user = users.find(u => u.email === email);

    if (!user) {
        console.log('User not found, attempting to create...');
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
            email,
            password: newPassword,
            email_confirm: true
        });

        if (createError) {
            console.error('❌ Failed to create user:', createError.message);
            process.exit(1);
        }
        console.log('✅ User created successfully');
        user = createData.user;
    } else {
        // 2. Update Password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (updateError) {
            console.error('❌ Error updating password:', updateError.message);
            process.exit(1);
        }
        console.log('✅ Password updated successfully');
    }

    // 3. Ensure Admin Role
    console.log('🔄 Verifying admin role...');
    const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: user.id, role: 'admin' }, { onConflict: 'user_id' });

    if (roleError) {
        console.error('❌ Error assigning admin role:', roleError.message);
        process.exit(1);
    }

    console.log('✅ Admin role confirmed');
    console.log(`🎉 Login ready: ${email} / ${newPassword}`);
}

main();
