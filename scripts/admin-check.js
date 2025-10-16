const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function adminCheck() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('🔍 Direct database query...\n');

  // Create client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Query portfolios without any filters
    console.log('Querying portfolios table...');
    const { data: portfolios, error: pError, count } = await supabase
      .from('portfolios')
      .select('*', { count: 'exact' });

    console.log('Response:', {
      error: pError?.message,
      count,
      dataLength: portfolios?.length
    });

    if (pError) {
      console.error('❌ Error querying portfolios:', pError);
      console.log('\nPossible issues:');
      console.log('1. RLS is still enabled');
      console.log('2. SQL was not executed successfully');
      console.log('3. Table does not exist');
      return;
    }

    if (portfolios && portfolios.length > 0) {
      console.log(`\n✅ Found ${portfolios.length} portfolio(s):`);
      portfolios.forEach(p => {
        console.log(`  - ${p.name} (ID: ${p.id})`);
        console.log(`    User: ${p.user_id}`);
        console.log(`    Color: ${p.color}`);
      });
    } else {
      console.log('\n❌ No portfolios in database!');
      console.log('The SQL script may not have executed properly.');
    }

    // Also check table structure
    console.log('\n📊 Checking table info...');
    const { data: tableInfo, error: tError } = await supabase
      .rpc('exec_sql', {
        sql_query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'portfolios'"
      });

    if (!tError) {
      console.log('Table structure exists');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

adminCheck();
