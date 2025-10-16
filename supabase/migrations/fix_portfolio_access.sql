-- DISABLE RLS on portfolios table since we're using Clerk auth, not Supabase auth
-- We handle authorization in our API layer
ALTER TABLE portfolios DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can insert their own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can update their own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can delete their own portfolios" ON portfolios;

-- Now create portfolios for existing users
DO $$
DECLARE
    user_record RECORD;
    default_portfolio_id UUID;
BEGIN
    FOR user_record IN
        SELECT DISTINCT user_id FROM investments WHERE user_id IS NOT NULL
    LOOP
        -- Check if portfolio already exists for this user
        IF NOT EXISTS (SELECT 1 FROM portfolios WHERE user_id = user_record.user_id) THEN
            -- Create default portfolio
            INSERT INTO portfolios (user_id, name, description, color, is_default)
            VALUES (user_record.user_id, 'Main Portfolio', 'Default investment portfolio', '#8b5cf6', true)
            RETURNING id INTO default_portfolio_id;

            RAISE NOTICE 'Created portfolio % for user %', default_portfolio_id, user_record.user_id;

            -- Update investments to use this portfolio
            UPDATE investments
            SET portfolio_id = default_portfolio_id
            WHERE user_id = user_record.user_id
            AND (portfolio_id IS NULL OR portfolio_id NOT IN (SELECT id FROM portfolios));
        END IF;
    END LOOP;
END $$;

-- Verify results
SELECT
    'Created portfolios:' as status,
    COUNT(*) as portfolio_count
FROM portfolios;

SELECT
    p.name as portfolio_name,
    p.user_id,
    p.color,
    COUNT(i.id) as investment_count
FROM portfolios p
LEFT JOIN investments i ON i.portfolio_id = p.id
GROUP BY p.id, p.name, p.user_id, p.color;
