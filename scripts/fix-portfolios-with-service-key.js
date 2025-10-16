const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixPortfolios() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    console.log('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY is required!');
    console.log('\nTo get your service role key:');
    console.log('1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api');
    console.log('2. Copy the "service_role" key (NOT the anon key)');
    console.log('3. Add to .env.local:\n');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here\n');
    process.exit(1);
  }

  // Create client with service role key (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🔧 Fixing portfolios with service role key...\n');

  try {
    // Step 1: Clean up ALL existing portfolios (service key bypasses RLS)
    console.log('🧹 Cleaning up existing portfolios...');
    const { error: deleteError } = await supabase
      .from('portfolios')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError && deleteError.code !== 'PGRST116') { // PGRST116 = no rows found, which is ok
      console.log(`⚠️  Warning during cleanup: ${deleteError.message}`);
    }

    // Step 2: Get user_id from investments
    const { data: investments, error: invError } = await supabase
      .from('investments')
      .select('user_id')
      .limit(1);

    if (invError || !investments?.[0]) {
      console.log('❌ Could not find user_id from investments');
      return;
    }

    const userId = investments[0].user_id;
    console.log(`👤 Found user_id: ${userId}`);

    // Step 3: Create new portfolio (service key bypasses RLS completely)
    console.log('📁 Creating Main Portfolio...');
    const { data: newPortfolio, error: createError } = await supabase
      .from('portfolios')
      .insert({
        user_id: userId,
        name: 'Main Portfolio',
        description: 'Default investment portfolio',
        color: '#8b5cf6',
        is_default: true
      })
      .select()
      .single();

    if (createError) {
      console.log(`❌ Failed to create portfolio: ${createError.message}`);
      console.log(`   Code: ${createError.code}`);
      console.log(`   Details: ${JSON.stringify(createError.details)}`);
      console.log('\n⚠️  Service key should bypass RLS. Check your key is correct.');
      return;
    }

    console.log(`✅ Created portfolio: ${newPortfolio.name} (${newPortfolio.id})`);

    // Step 4: Update all investments
    console.log('🔗 Linking investments to portfolio...');
    const { data: updatedInvestments, error: updateError } = await supabase
      .from('investments')
      .update({ portfolio_id: newPortfolio.id })
      .eq('user_id', userId)
      .select();

    if (updateError) {
      console.log(`❌ Failed to update investments: ${updateError.message}`);
      return;
    }

    console.log(`✅ Updated ${updatedInvestments.length} investments`);

    // Step 5: Verify
    console.log('\n📊 Verification:');
    const { data: allPortfolios, count } = await supabase
      .from('portfolios')
      .select('*', { count: 'exact' });

    console.log(`  - Total portfolios: ${count}`);
    allPortfolios?.forEach(p => {
      console.log(`    • ${p.name} (${p.color})`);
    });

    const { data: linkedInvestments } = await supabase
      .from('investments')
      .select('name, portfolio_id')
      .eq('user_id', userId);

    const linked = linkedInvestments?.filter(i => i.portfolio_id).length || 0;
    console.log(`  - Investments linked: ${linked}/${linkedInvestments?.length || 0}`);

    console.log('\n🎉 SUCCESS! Refresh your investments page now!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

fixPortfolios();
