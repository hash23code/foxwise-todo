-- ============================================
-- COMPREHENSIVE PORTFOLIO FIX
-- ============================================

-- 1. Check current state
SELECT 'BEFORE FIX - Portfolios:' as info, COUNT(*) as count FROM portfolios;
SELECT 'BEFORE FIX - Investments:' as info, COUNT(*) as count FROM investments;

-- 2. Disable RLS completely
ALTER TABLE portfolios DISABLE ROW LEVEL SECURITY;

-- 3. Clean up ALL policies
DO $$
BEGIN
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON portfolios;', ' ')
        FROM pg_policies
        WHERE tablename = 'portfolios'
    );
EXCEPTION WHEN others THEN
    RAISE NOTICE 'No policies to drop';
END $$;

-- 4. Get the user_id from existing investments
DO $$
DECLARE
    v_user_id TEXT;
    v_portfolio_id UUID;
BEGIN
    -- Get user_id from investments
    SELECT DISTINCT user_id INTO v_user_id
    FROM investments
    LIMIT 1;

    RAISE NOTICE 'Found user_id: %', v_user_id;

    -- Check if portfolio already exists for this user
    SELECT id INTO v_portfolio_id
    FROM portfolios
    WHERE user_id = v_user_id
    LIMIT 1;

    IF v_portfolio_id IS NULL THEN
        RAISE NOTICE 'No portfolio found, creating one...';

        -- Create portfolio
        INSERT INTO portfolios (user_id, name, description, color, is_default, created_at, updated_at)
        VALUES (
            v_user_id,
            'Main Portfolio',
            'Default investment portfolio',
            '#8b5cf6',
            true,
            NOW(),
            NOW()
        )
        RETURNING id INTO v_portfolio_id;

        RAISE NOTICE 'Created portfolio with id: %', v_portfolio_id;

        -- Update ALL investments to use this portfolio
        UPDATE investments
        SET portfolio_id = v_portfolio_id
        WHERE user_id = v_user_id;

        RAISE NOTICE 'Updated investments to use new portfolio';
    ELSE
        RAISE NOTICE 'Portfolio already exists with id: %', v_portfolio_id;
    END IF;
END $$;

-- 5. Verify the fix
SELECT 'AFTER FIX - Portfolios:' as info, COUNT(*) as count FROM portfolios;
SELECT 'AFTER FIX - Investments with portfolio:' as info, COUNT(*) as count FROM investments WHERE portfolio_id IS NOT NULL;

-- 6. Show actual data
SELECT id, name, user_id, color, is_default FROM portfolios;
SELECT id, name, portfolio_id, user_id FROM investments ORDER BY name;
