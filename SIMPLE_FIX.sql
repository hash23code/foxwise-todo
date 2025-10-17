-- Step 1: Disable RLS (Row Level Security)
ALTER TABLE portfolios DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop old policies
DROP POLICY IF EXISTS "Users can view their own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can insert their own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can update their own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can delete their own portfolios" ON portfolios;

-- Step 3: Insert a test portfolio directly
-- Replace 'user_33vzjdFZIcUKh8AnZnK7xZamLMA' with your actual user_id from investments
INSERT INTO portfolios (user_id, name, description, color, is_default)
SELECT DISTINCT
    user_id,
    'Main Portfolio',
    'Default investment portfolio',
    '#8b5cf6',
    true
FROM investments
WHERE user_id IS NOT NULL
LIMIT 1
ON CONFLICT DO NOTHING;

-- Step 4: Get the portfolio ID and update investments
WITH new_portfolio AS (
    SELECT id, user_id FROM portfolios LIMIT 1
)
UPDATE investments i
SET portfolio_id = np.id
FROM new_portfolio np
WHERE i.user_id = np.user_id;

-- Step 5: Verify
SELECT 'Portfolios created:' as message, COUNT(*) as count FROM portfolios
UNION ALL
SELECT 'Investments linked:' as message, COUNT(*) as count FROM investments WHERE portfolio_id IS NOT NULL;
