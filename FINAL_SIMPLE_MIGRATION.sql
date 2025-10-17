-- ================================================
-- CRÉATION SIMPLE ET PROPRE
-- Copie-colle tout ça dans Supabase SQL Editor
-- ================================================

-- 1. Ajouter les colonnes au portfolio (sécuritaire)
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS is_exchange_managed BOOLEAN DEFAULT FALSE;
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS exchange_name TEXT;

-- 2. Créer la table exchange_connections (nettoie d'abord)
DROP TABLE IF EXISTS exchange_connections CASCADE;

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

-- 3. RLS activé
ALTER TABLE exchange_connections ENABLE ROW LEVEL SECURITY;

-- 4. Politiques
CREATE POLICY "Users can manage own connections" ON exchange_connections
  FOR ALL USING (auth.uid()::text = user_id);

-- 5. Index
CREATE INDEX idx_exchange_user ON exchange_connections(user_id);
CREATE INDEX idx_exchange_portfolio ON exchange_connections(portfolio_id);

-- C'EST TOUT! ✅
