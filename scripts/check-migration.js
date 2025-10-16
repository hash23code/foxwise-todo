const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Checking database state...\n');

  try {
    // Try to query portfolios table
    const { data, error } = await supabase
      .from('portfolios')
      .select('count')
      .limit(1);

    if (error) {
      if (error.message.includes('relation "public.portfolios" does not exist')) {
        console.log('❌ Portfolios table does NOT exist');
        console.log('\n📋 MIGRATION REQUIRED!\n');
        console.log('Please follow these steps:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Navigate to: SQL Editor');
        console.log('3. Create a new query');
        console.log('4. Copy and paste the contents of: supabase/migrations/add_portfolios.sql');
        console.log('5. Click "Run"\n');
        console.log('Or open: ' + supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/') + '/sql/new');
        return false;
      }
      console.error('❌ Error checking database:', error.message);
      return false;
    }

    console.log('✅ Portfolios table EXISTS!');
    console.log('✅ Migration already applied\n');
    return true;
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

checkMigration().then(success => {
  process.exit(success ? 0 : 1);
});
