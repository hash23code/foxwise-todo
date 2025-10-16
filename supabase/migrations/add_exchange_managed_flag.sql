-- Add is_exchange_managed flag to portfolios table
-- This flag indicates if a portfolio is managed by an exchange connection
-- Exchange-managed portfolios should not allow manual investment additions

ALTER TABLE portfolios
ADD COLUMN IF NOT EXISTS is_exchange_managed BOOLEAN DEFAULT FALSE;

-- Add exchange_name to track which exchange manages this portfolio
ALTER TABLE portfolios
ADD COLUMN IF NOT EXISTS exchange_name TEXT;

-- Create index for faster queries on exchange-managed portfolios
CREATE INDEX IF NOT EXISTS idx_portfolios_exchange_managed
ON portfolios(is_exchange_managed)
WHERE is_exchange_managed = true;

-- Update existing portfolios that are linked to exchanges
-- This will mark them as exchange-managed
UPDATE portfolios p
SET is_exchange_managed = true,
    exchange_name = ec.exchange_name
FROM exchange_connections ec
WHERE p.id = ec.portfolio_id
  AND ec.portfolio_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN portfolios.is_exchange_managed IS 'Indicates if this portfolio is automatically managed by an exchange connection. Users cannot manually add investments to exchange-managed portfolios.';
COMMENT ON COLUMN portfolios.exchange_name IS 'The name of the exchange managing this portfolio (e.g., binance, coinbase, alpaca)';
