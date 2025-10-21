// Script to grant yourself lifetime premium access
// Usage: node scripts/grant-me-premium.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function grantLifetimePremium() {
  try {
    console.log('🔍 Finding your user ID...\n');

    // Get the most recent user from tasks table
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('user_id')
      .order('created_at', { ascending: false })
      .limit(1);

    if (taskError || !tasks || tasks.length === 0) {
      console.error('❌ Could not find your user ID. Make sure you have at least one task created.');
      console.log('\n💡 Tip: Log in to the app and create a task first, then run this script again.\n');
      process.exit(1);
    }

    const userId = tasks[0].user_id;
    console.log(`✅ Found your user ID: ${userId}\n`);

    // Grant lifetime premium
    console.log('🎁 Granting lifetime premium access...\n');

    const { data, error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: 'lifetime_premium_founder',
        stripe_subscription_id: 'lifetime_premium_founder',
        stripe_price_id: 'lifetime_premium',
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: '2099-12-31T23:59:59Z', // Premium until 2099! 🚀
        cancel_at_period_end: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error granting premium:', error.message);
      process.exit(1);
    }

    console.log('✅ SUCCESS! You now have lifetime premium access! 🎉\n');
    console.log('📋 Your premium details:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Valid until: 2099-12-31 (75 years!) 🚀`);
    console.log(`   Plan: Lifetime Founder Access 👑\n`);
    console.log('🔄 Refresh your app to see the premium features!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

grantLifetimePremium();
