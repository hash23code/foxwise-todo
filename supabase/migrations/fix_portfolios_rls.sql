-- Fix: Create portfolios for users who already have investments
-- This bypasses RLS by running as a database function

DO $$
DECLARE
    user_record RECORD;
    default_portfolio_id UUID;
    portfolio_exists BOOLEAN;
BEGIN
    -- Get distinct users from investments
    FOR user_record IN
        SELECT DISTINCT user_id FROM investments
    LOOP
        -- Check if user already has a portfolio
        SELECT EXISTS(
            SELECT 1 FROM portfolios WHERE user_id = user_record.user_id
        ) INTO portfolio_exists;

        IF NOT portfolio_exists THEN
            -- Create default portfolio for this user
            INSERT INTO portfolios (user_id, name, description, color, is_default)
            VALUES (user_record.user_id, 'Main Portfolio', 'Default investment portfolio', '#8b5cf6', true)
            RETURNING id INTO default_portfolio_id;

            RAISE NOTICE 'Created portfolio % for user %', default_portfolio_id, user_record.user_id;

            -- Update investments that don't have a portfolio
            UPDATE investments
            SET portfolio_id = default_portfolio_id
            WHERE user_id = user_record.user_id
            AND (portfolio_id IS NULL OR portfolio_id NOT IN (SELECT id FROM portfolios));

            RAISE NOTICE 'Updated investments for user %', user_record.user_id;
        ELSE
            RAISE NOTICE 'User % already has portfolios, skipping', user_record.user_id;
        END IF;
    END LOOP;
END $$;

-- Verify the fix
SELECT
    p.id,
    p.name,
    p.user_id,
    COUNT(i.id) as investment_count
FROM portfolios p
LEFT JOIN investments i ON i.portfolio_id = p.id
GROUP BY p.id, p.name, p.user_id
ORDER BY p.created_at;
