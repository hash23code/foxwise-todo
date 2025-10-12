-- =============================================
-- BUDGET TRACKER SCHEMA UPDATES
-- Multi-wallet, Multi-currency, Extended Categories
-- =============================================

-- 1. Create Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('main', 'savings', 'business', 'investment', 'other')) NOT NULL,
  currency TEXT DEFAULT 'CAD',
  beginning_balance DECIMAL(10, 2) DEFAULT 0,
  current_balance DECIMAL(10, 2) DEFAULT 0,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  default_currency TEXT DEFAULT 'CAD',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  default_wallet_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Update Transactions Table
-- First, drop existing constraints if they exist
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- Add new columns to transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS wallet_id UUID,
  ADD COLUMN IF NOT EXISTS budget_id UUID,
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

-- Update the type constraint to include new categories
ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('income', 'expense', 'bills', 'debt_payment', 'savings'));

-- 4. Update Budgets Table
ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS parent_type TEXT CHECK (parent_type IN ('income', 'expense', 'bills', 'debt_payment', 'savings')) DEFAULT 'expense';

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Wallets RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallets"
  ON wallets FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own wallets"
  ON wallets FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own wallets"
  ON wallets FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own wallets"
  ON wallets FOR DELETE
  USING (auth.jwt() ->> 'sub' = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- User Settings RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_budget_id ON transactions(budget_id);
CREATE INDEX IF NOT EXISTS idx_budgets_parent_type ON budgets(parent_type);

-- =============================================
-- FUNCTIONS FOR UPDATING WALLET BALANCES
-- =============================================

-- Function to update wallet balance when transaction is added/updated/deleted
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    -- Subtract old transaction from wallet
    IF OLD.wallet_id IS NOT NULL THEN
      UPDATE wallets
      SET current_balance = current_balance -
        CASE
          WHEN OLD.type IN ('income', 'savings') THEN OLD.amount
          WHEN OLD.type IN ('expense', 'bills', 'debt_payment') THEN -OLD.amount
        END
      WHERE id = OLD.wallet_id;
    END IF;
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Reverse old transaction
    IF OLD.wallet_id IS NOT NULL THEN
      UPDATE wallets
      SET current_balance = current_balance -
        CASE
          WHEN OLD.type IN ('income', 'savings') THEN OLD.amount
          WHEN OLD.type IN ('expense', 'bills', 'debt_payment') THEN -OLD.amount
        END
      WHERE id = OLD.wallet_id;
    END IF;
    -- Apply new transaction
    IF NEW.wallet_id IS NOT NULL THEN
      UPDATE wallets
      SET current_balance = current_balance +
        CASE
          WHEN NEW.type IN ('income', 'savings') THEN NEW.amount
          WHEN NEW.type IN ('expense', 'bills', 'debt_payment') THEN -NEW.amount
        END
      WHERE id = NEW.wallet_id;
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    -- Add new transaction to wallet
    IF NEW.wallet_id IS NOT NULL THEN
      UPDATE wallets
      SET current_balance = current_balance +
        CASE
          WHEN NEW.type IN ('income', 'savings') THEN NEW.amount
          WHEN NEW.type IN ('expense', 'bills', 'debt_payment') THEN -NEW.amount
        END
      WHERE id = NEW.wallet_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for wallet balance updates
DROP TRIGGER IF EXISTS trigger_update_wallet_balance ON transactions;
CREATE TRIGGER trigger_update_wallet_balance
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_balance();
