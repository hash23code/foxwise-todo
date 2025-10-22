const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function runMigration() {
  try {
    console.log('📋 Running timezone migration...\n');

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'add_timezone_to_user_memory.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('Trying alternative method...');

      // Execute SQL directly (this may not work with all SQL)
      const { error: altError } = await supabase.from('user_memory').select('timezone').limit(1);

      if (altError && altError.message.includes('column "timezone" does not exist')) {
        console.error('❌ Migration failed. Please run the SQL manually in Supabase dashboard:');
        console.log('\n' + migrationSQL + '\n');
        process.exit(1);
      } else {
        console.log('✅ Timezone column already exists or migration completed!');
      }
    } else {
      console.log('✅ Migration completed successfully!');
      console.log(data);
    }

    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    console.log('\nℹ️  Please run this SQL manually in Supabase dashboard:');
    console.log('\n-- Add timezone field to user_memory table');
    console.log('ALTER TABLE user_memory');
    console.log("ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Toronto';");
    console.log('\n-- Add comment');
    console.log("COMMENT ON COLUMN user_memory.timezone IS 'User timezone for accurate date/time calculations (IANA timezone format)';");
    process.exit(1);
  }
}

runMigration();
