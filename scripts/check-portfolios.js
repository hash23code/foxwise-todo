const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkPortfolios() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔍 Checking portfolios and investments...\n');

  try {
    // Check portfolios
    const { data: portfolios, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*');

    if (portfolioError) throw portfolioError;

    console.log(`📊 Portfolios found: ${portfolios?.length || 0}`);
    if (portfolios && portfolios.length > 0) {
      portfolios.forEach(p => {
        console.log(`  - ${p.name} (${p.id})`);
      });
    } else {
      console.log('  ℹ️  No portfolios found. They will be auto-created when you add your first investment.');
    }

    // Check investments
    const { data: investments, error: invError } = await supabase
      .from('investments')
      .select('*');

    if (invError) throw invError;

    console.log(`\n💼 Investments found: ${investments?.length || 0}`);
    if (investments && investments.length > 0) {
      investments.forEach(inv => {
        console.log(`  - ${inv.name}: portfolio_id = ${inv.portfolio_id || 'NULL'}`);
      });
    }

    console.log('\n✅ Database check complete!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPortfolios();
