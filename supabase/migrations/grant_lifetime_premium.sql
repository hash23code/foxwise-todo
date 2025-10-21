-- Grant lifetime premium access to yourself
-- Replace 'YOUR_USER_ID_HERE' with your actual Clerk user ID

-- First, check your current user ID by looking at the console when logged in
-- or run: SELECT DISTINCT user_id FROM tasks LIMIT 1;

-- Then update this subscription record:
INSERT INTO subscriptions (
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  stripe_price_id,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  created_at,
  updated_at
) VALUES (
  'YOUR_USER_ID_HERE', -- Replace with your Clerk user ID (starts with user_)
  'lifetime_premium_founder',
  'lifetime_premium_founder',
  'lifetime_premium',
  'active',
  NOW(),
  '2099-12-31 23:59:59'::timestamp, -- Premium until the year 2099! 🎉
  false,
  NOW(),
  NOW()
)
ON CONFLICT (user_id)
DO UPDATE SET
  stripe_customer_id = 'lifetime_premium_founder',
  stripe_subscription_id = 'lifetime_premium_founder',
  stripe_price_id = 'lifetime_premium',
  status = 'active',
  current_period_end = '2099-12-31 23:59:59'::timestamp,
  cancel_at_period_end = false,
  updated_at = NOW();

-- Verify it worked
SELECT * FROM subscriptions WHERE user_id = 'YOUR_USER_ID_HERE';
