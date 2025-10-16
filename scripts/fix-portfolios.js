const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixPortfolios() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Use service role key to bypass RLS
  const adminClient = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : createClient(supabaseUrl, anonKey);

  console.log('🔧 Checking and fixing portfolios...\n');

  try {
    // Get all investments to find user_ids
    const { data: investments } = await adminClient
      .from('investments')
      .select('user_id, portfolio_id');

    if (!investments || investments.length === 0) {
      console.log('ℹ️  No investments found. Nothing to fix.');
      return;
    }

    console.log(`Found ${investments.length} investments`);
    console.log(`User ID format: ${investments[0].user_id}\n`);

    // Get unique portfolio IDs from investments
    const portfolioIds = [...new Set(investments.map(i => i.portfolio_id).filter(Boolean))];
    console.log(`Portfolio IDs referenced: ${portfolioIds.length}`);

    // Check if these portfolios exist
    const { data: existingPortfolios } = await adminClient
      .from('portfolios')
      .select('*')
      .in('id', portfolioIds);

    console.log(`Portfolios that exist: ${existingPortfolios?.length || 0}\n`);

    if (existingPortfolios && existingPortfolios.length > 0) {
      console.log('✅ Portfolios found:');
      existingPortfolios.forEach(p => {
        console.log(`  - ${p.name} (${p.id})`);
        console.log(`    user_id: ${p.user_id}`);
      });
    } else {
      console.log('❌ No portfolios exist in database!');
      console.log('💡 Creating default portfolio...\n');

      const userId = investments[0].user_id;
      const { data: newPortfolio, error } = await adminClient
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

      if (error) {
        console.error('❌ Error creating portfolio:', error.message);
        return;
      }

      console.log(`✅ Created portfolio: ${newPortfolio.name} (${newPortfolio.id})`);

      // Update investments without portfolio
      const { error: updateError } = await adminClient
        .from('investments')
        .update({ portfolio_id: newPortfolio.id })
        .eq('user_id', userId)
        .is('portfolio_id', null);

      if (updateError) {
        console.error('❌ Error updating investments:', updateError.message);
      } else {
        console.log('✅ Updated investments to use new portfolio');
      }
    }

    console.log('\n✅ Fix complete! Refresh your page.\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixPortfolios();
