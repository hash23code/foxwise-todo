-- Add symbol, quantity, and purchase price tracking to investments table

ALTER TABLE investments
ADD COLUMN IF NOT EXISTS symbol VARCHAR(20),
ADD COLUMN IF NOT EXISTS quantity DECIMAL(18, 8),
ADD COLUMN IF NOT EXISTS purchase_price_per_unit DECIMAL(18, 2);

-- Add index on symbol for faster lookups
CREATE INDEX IF NOT EXISTS idx_investments_symbol ON investments(symbol);

-- Add comment explaining the fields
COMMENT ON COLUMN investments.symbol IS 'Ticker symbol (e.g., BTC, AAPL, ETH)';
COMMENT ON COLUMN investments.quantity IS 'Number of units/shares owned';
COMMENT ON COLUMN investments.purchase_price_per_unit IS 'Price per unit at time of purchase';
