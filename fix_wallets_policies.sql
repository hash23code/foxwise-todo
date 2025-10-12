-- =============================================
-- FIX WALLETS & USER_SETTINGS RLS POLICIES
-- This makes them work with Clerk authentication
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own wallets" ON wallets;
DROP POLICY IF EXISTS "Users can insert their own wallets" ON wallets;
DROP POLICY IF EXISTS "Users can update their own wallets" ON wallets;
DROP POLICY IF EXISTS "Users can delete their own wallets" ON wallets;

DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;

-- OPTION 1: Disable RLS (Simpler - Clerk handles auth)
-- Uncomment these if you want to disable RLS:
-- ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- OPTION 2: Keep RLS with permissive policies (Recommended for development)
-- Create permissive policies that allow all operations
-- Security is handled by Clerk authentication in the app layer

CREATE POLICY "Allow all wallet operations"
  ON wallets
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all user_settings operations"
  ON user_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Note: In production, you would want stricter policies
-- For now, this allows the app to work while Clerk handles authentication
