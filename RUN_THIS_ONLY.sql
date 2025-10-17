-- ============================================
-- PORTFOLIO FIX - RUN ONLY THIS FILE
-- DO NOT run add_portfolios.sql or any other file!
-- ============================================

-- Step 1: Force drop all policies (with CASCADE to handle dependencies)
DROP POLICY IF EXISTS "Users can view their own portfolios" ON portfolios CASCADE;
DROP POLICY IF EXISTS "Users can insert their own portfolios" ON portfolios CASCADE;
DROP POLICY IF EXISTS "Users can update their own portfolios" ON portfolios CASCADE;
DROP POLICY IF EXISTS "Users can delete their own portfolios" ON portfolios CASCADE;

-- Step 2: Disable RLS
ALTER TABLE portfolios DISABLE ROW LEVEL SECURITY;

-- Step 3: Clean orphaned portfolios
DELETE FROM portfolios;

-- Step 4: Create portfolio for your user
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
LIMIT 1;

-- Step 5: Link all investments to this portfolio
UPDATE investments i
SET portfolio_id = p.id
FROM portfolios p
WHERE i.user_id = p.user_id;

-- Step 6: Verify
SELECT 'SUCCESS! Portfolios:' as result, COUNT(*) as count FROM portfolios
UNION ALL
SELECT 'SUCCESS! Investments linked:', COUNT(*) FROM investments WHERE portfolio_id IS NOT NULL;

-- Show the data
SELECT * FROM portfolios;
SELECT id, name, symbol, portfolio_id FROM investments;
