const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read the migration SQL
  const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', 'add_portfolios.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('🚀 Running portfolio migration...\n');

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.log('\n📋 Please run this SQL manually in Supabase Dashboard > SQL Editor:');
      console.log('\n' + sql);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Portfolios table created');
    console.log('📊 portfolio_id added to investments table');
    console.log('📊 Default portfolios created for existing users');
    console.log('📊 RLS policies configured\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📋 Manual migration required. Run this SQL in Supabase Dashboard:\n');
    console.log(sql);
    process.exit(1);
  }
}

runMigration();
