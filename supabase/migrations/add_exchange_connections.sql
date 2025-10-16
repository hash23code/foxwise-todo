-- Create exchange_connections table for secure API key storage
CREATE TABLE IF NOT EXISTS exchange_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  exchange_name TEXT NOT NULL, -- 'binance', 'coinbase', 'kraken', etc.
  api_key_encrypted TEXT NOT NULL, -- Encrypted API key
  api_secret_encrypted TEXT NOT NULL, -- Encrypted API secret
  passphrase_encrypted TEXT, -- For exchanges that require passphrase (like Coinbase Pro)
  permissions JSONB DEFAULT '["read"]'::jsonb, -- Permissions (should be read-only)
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT, -- 'success', 'failed', 'pending'
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, portfolio_id, exchange_name)
);

-- Enable RLS
ALTER TABLE exchange_connections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own exchange connections"
  ON exchange_connections FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own exchange connections"
  ON exchange_connections FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own exchange connections"
  ON exchange_connections FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own exchange connections"
  ON exchange_connections FOR DELETE
  USING (auth.uid()::text = user_id);

-- Create index for faster queries
CREATE INDEX idx_exchange_connections_user_id ON exchange_connections(user_id);
CREATE INDEX idx_exchange_connections_portfolio_id ON exchange_connections(portfolio_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_exchange_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exchange_connections_updated_at
  BEFORE UPDATE ON exchange_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_exchange_connections_updated_at();

COMMENT ON TABLE exchange_connections IS 'Stores encrypted exchange API credentials for portfolio syncing';
COMMENT ON COLUMN exchange_connections.api_key_encrypted IS 'AES-256 encrypted API key';
COMMENT ON COLUMN exchange_connections.api_secret_encrypted IS 'AES-256 encrypted API secret';
