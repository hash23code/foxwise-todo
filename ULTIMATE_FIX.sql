-- ============================================
-- ULTIMATE PORTFOLIO FIX
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Disable RLS completely
ALTER TABLE portfolios DISABLE ROW LEVEL SECURITY;

-- STEP 2: Remove ALL policies
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN
        SELECT policyname FROM pg_policies WHERE tablename = 'portfolios'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON portfolios', pol_name);
    END LOOP;
END $$;

-- STEP 3: Clean up any orphaned portfolios
DELETE FROM portfolios WHERE user_id NOT IN (SELECT DISTINCT user_id FROM investments);

-- STEP 4: Create portfolio for the user
INSERT INTO portfolios (user_id, name, description, color, is_default, created_at, updated_at)
SELECT
    user_id,
    'Main Portfolio',
    'Default investment portfolio',
    '#8b5cf6',
    true,
    NOW(),
    NOW()
FROM investments
WHERE user_id IS NOT NULL
GROUP BY user_id
ON CONFLICT DO NOTHING;

-- STEP 5: Link all investments to their portfolio
UPDATE investments i
SET portfolio_id = p.id
FROM portfolios p
WHERE i.user_id = p.user_id
AND i.portfolio_id IS NULL;

-- STEP 6: Verification
SELECT '=== RESULTS ===' as status;
SELECT 'Portfolios created:' as info, COUNT(*) as count FROM portfolios;
SELECT 'Investments linked:' as info, COUNT(*) as count FROM investments WHERE portfolio_id IS NOT NULL;
SELECT 'Portfolio details:' as info;
SELECT id, name, user_id, color, is_default FROM portfolios;
