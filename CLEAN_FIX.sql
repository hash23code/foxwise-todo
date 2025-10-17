-- ============================================
-- CLEAN PORTFOLIO FIX - Handles all edge cases
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- STEP 1: Drop specific policies we know exist
DROP POLICY IF EXISTS "Users can view their own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can insert their own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can update their own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can delete their own portfolios" ON portfolios;

-- STEP 2: Drop any other policies that might exist
DO $$
DECLARE
    pol_record RECORD;
BEGIN
    FOR pol_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE tablename = 'portfolios'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            pol_record.policyname,
            pol_record.schemaname,
            pol_record.tablename
        );
        RAISE NOTICE 'Dropped policy: %', pol_record.policyname;
    END LOOP;
END $$;

-- STEP 3: Disable RLS
ALTER TABLE portfolios DISABLE ROW LEVEL SECURITY;

-- STEP 4: Clean up orphaned data
DELETE FROM portfolios WHERE user_id NOT IN (
    SELECT DISTINCT user_id FROM investments WHERE user_id IS NOT NULL
);

-- STEP 5: Create portfolio for existing user
DO $$
DECLARE
    v_user_id TEXT;
    v_portfolio_id UUID;
    v_portfolio_count INTEGER;
BEGIN
    -- Get user_id from investments
    SELECT DISTINCT user_id INTO v_user_id
    FROM investments
    WHERE user_id IS NOT NULL
    LIMIT 1;

    RAISE NOTICE 'User ID: %', v_user_id;

    -- Check if portfolio exists
    SELECT COUNT(*) INTO v_portfolio_count
    FROM portfolios
    WHERE user_id = v_user_id;

    RAISE NOTICE 'Existing portfolios: %', v_portfolio_count;

    IF v_portfolio_count = 0 THEN
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

        RAISE NOTICE 'Created portfolio: %', v_portfolio_id;

        -- Link investments
        UPDATE investments
        SET portfolio_id = v_portfolio_id
        WHERE user_id = v_user_id;

        RAISE NOTICE 'Linked investments to portfolio';
    ELSE
        -- Use existing portfolio
        SELECT id INTO v_portfolio_id
        FROM portfolios
        WHERE user_id = v_user_id
        LIMIT 1;

        RAISE NOTICE 'Using existing portfolio: %', v_portfolio_id;

        -- Link any unlinked investments
        UPDATE investments
        SET portfolio_id = v_portfolio_id
        WHERE user_id = v_user_id
        AND (portfolio_id IS NULL OR portfolio_id = v_portfolio_id);
    END IF;
END $$;

-- STEP 6: Show results
SELECT 'PORTFOLIOS' as table_name, COUNT(*) as count FROM portfolios
UNION ALL
SELECT 'INVESTMENTS_LINKED' as table_name, COUNT(*) as count FROM investments WHERE portfolio_id IS NOT NULL;

-- STEP 7: Show actual data
SELECT id, name, user_id, color, is_default, created_at FROM portfolios;
SELECT id, name, symbol, portfolio_id FROM investments ORDER BY name;
