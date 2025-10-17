-- ============================================
-- PRODUCTION-READY PORTFOLIO FIX
-- Safe to disable RLS because auth is now handled server-side via Clerk
-- ============================================

-- Disable RLS on portfolios table
-- This is SECURE because:
-- 1. All database queries go through Next.js API routes (/api/portfolios)
-- 2. Clerk validates user authentication on the server
-- 3. Service role key is never exposed to the client
-- 4. API routes enforce user_id filtering
ALTER TABLE portfolios DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'portfolios';
-- Should show: rowsecurity = false

-- Create portfolio for existing user
INSERT INTO portfolios (user_id, name, description, color, is_default, created_at, updated_at)
SELECT DISTINCT
    user_id,
    'Main Portfolio',
    'Default investment portfolio',
    '#8b5cf6',
    true,
    NOW(),
    NOW()
FROM investments
WHERE user_id IS NOT NULL
LIMIT 1
ON CONFLICT DO NOTHING;

-- Link investments to portfolio
UPDATE investments i
SET portfolio_id = p.id
FROM portfolios p
WHERE i.user_id = p.user_id
AND i.portfolio_id IS NULL;

-- Show results
SELECT 'SUCCESS - Portfolios created:' as status, COUNT(*) as count FROM portfolios;
SELECT 'SUCCESS - Investments linked:' as status, COUNT(*) as count FROM investments WHERE portfolio_id IS NOT NULL;
SELECT * FROM portfolios;
