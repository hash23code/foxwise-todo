-- Add exchange API integration fields to portfolios table
-- This allows secondary portfolios to sync with exchange APIs

ALTER TABLE portfolios
ADD COLUMN IF NOT EXISTS exchange_name TEXT,
ADD COLUMN IF NOT EXISTS exchange_api_key TEXT,
ADD COLUMN IF NOT EXISTS exchange_api_secret TEXT,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT false;

-- Add comment explaining the fields
COMMENT ON COLUMN portfolios.exchange_name IS 'Exchange platform name (Binance, Coinbase, Kraken, etc.)';
COMMENT ON COLUMN portfolios.exchange_api_key IS 'Encrypted API key for exchange (read-only permissions)';
COMMENT ON COLUMN portfolios.exchange_api_secret IS 'Encrypted API secret for exchange';
COMMENT ON COLUMN portfolios.last_sync_at IS 'Last successful sync timestamp';
COMMENT ON COLUMN portfolios.auto_sync_enabled IS 'Automatically sync portfolio from exchange';

-- Show updated structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'portfolios'
ORDER BY ordinal_position;
