-- =====================================================
-- COMPLETE EXCHANGE AUTO-PORTFOLIO SETUP
-- Run this ONCE in Supabase SQL Editor
-- =====================================================

-- Step 1: Clean up existing objects (if any)
DROP TABLE IF EXISTS exchange_connections CASCADE;
DROP TRIGGER IF EXISTS exchange_connections_updated_at ON exchange_connections;
DROP FUNCTION IF EXISTS update_exchange_connections_updated_at();

-- Step 2: Add columns to portfolios (safe if already exists)
ALTER TABLE portfolios
ADD COLUMN IF NOT EXISTS is_exchange_managed BOOLEAN DEFAULT FALSE;

ALTER TABLE portfolios
ADD COLUMN IF NOT EXISTS exchange_name TEXT;

-- Step 3: Create exchange_connections table
CREATE TABLE exchange_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  exchange_name TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  api_secret_encrypted TEXT NOT NULL,
  passphrase_encrypted TEXT,
  permissions JSONB DEFAULT '["read"]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, portfolio_id, exchange_name)
);

-- Step 4: Enable RLS
ALTER TABLE exchange_connections ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policies
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

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_exchange_connections_user_id ON exchange_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_connections_portfolio_id ON exchange_connections(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_exchange_managed ON portfolios(is_exchange_managed) WHERE is_exchange_managed = true;

-- Step 7: Create trigger
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

-- Step 8: Force schema reload
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- DONE! Everything is set up.
-- =====================================================
