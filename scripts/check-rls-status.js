const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkRLS() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
    console.log('Using anon key instead (limited permissions)...\n');
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('🔍 Checking RLS Status and Policies...\n');

  try {
    // Check if we can query the table at all
    const { data: portfolios, error: queryError, count } = await supabase
      .from('portfolios')
      .select('*', { count: 'exact' });

    console.log('📊 Query Result:');
    console.log(`  - Count: ${count}`);
    console.log(`  - Data length: ${portfolios?.length || 0}`);
    console.log(`  - Error: ${queryError?.message || 'none'}\n`);

    // Get user_id from investments
    const { data: investments } = await supabase
      .from('investments')
      .select('user_id')
      .limit(1);

    const userId = investments?.[0]?.user_id;
    console.log(`👤 User ID from investments: ${userId}\n`);

    // Try to insert a portfolio directly
    console.log('🧪 Attempting direct insert...');
    const { data: newPortfolio, error: insertError } = await supabase
      .from('portfolios')
      .insert({
        user_id: userId,
        name: 'Test Portfolio',
        description: 'Test portfolio created by diagnostic',
        color: '#8b5cf6',
        is_default: true
      })
      .select()
      .single();

    if (insertError) {
      console.log(`❌ Insert failed: ${insertError.message}`);
      console.log(`   Code: ${insertError.code}`);
      console.log(`   Details: ${insertError.details}\n`);

      if (insertError.message.includes('policy')) {
        console.log('⚠️  This is an RLS policy issue!');
        console.log('   Solution: The FINAL_FIX.sql MUST be run in Supabase dashboard\n');
      }
    } else {
      console.log(`✅ Successfully created portfolio: ${newPortfolio.id}`);
      console.log('   The database is now working!\n');

      // Update investments
      console.log('🔗 Updating investments to use this portfolio...');
      const { error: updateError } = await supabase
        .from('investments')
        .update({ portfolio_id: newPortfolio.id })
        .eq('user_id', userId);

      if (!updateError) {
        console.log('✅ Investments updated successfully!');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkRLS();
