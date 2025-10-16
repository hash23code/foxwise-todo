const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function disableRLS() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY is required!');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🔓 Disabling RLS on portfolios table...\n');

  try {
    // Execute raw SQL to disable RLS using service role
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE portfolios DISABLE ROW LEVEL SECURITY;'
    });

    if (error) {
      console.log('❌ RPC method not available. Need to run SQL manually.');
      console.log('\n📋 Please run this SQL in Supabase Dashboard:');
      console.log('---');
      console.log('ALTER TABLE portfolios DISABLE ROW LEVEL SECURITY;');
      console.log('---\n');

      console.log('Steps:');
      console.log('1. Go to https://supabase.com/dashboard/project/blwihylwwqeyjbqnuktw/editor');
      console.log('2. Click "SQL Editor" in left sidebar');
      console.log('3. Paste the SQL above');
      console.log('4. Click RUN\n');
      return;
    }

    console.log('✅ RLS disabled successfully!');

    // Verify
    const { data: portfolios, error: queryError } = await supabase
      .from('portfolios')
      .select('*');

    if (!queryError && portfolios) {
      console.log(`\n📊 Portfolios now visible: ${portfolios.length}`);
      portfolios.forEach(p => {
        console.log(`  • ${p.name} (${p.color})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

disableRLS();
