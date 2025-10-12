-- =============================================
-- FRESH START - COMPLETE DATABASE SETUP
-- Copy EVERYTHING and run ONCE
-- =============================================

-- DROP EVERYTHING (clean slate)
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS investments CASCADE;

-- CREATE TABLES
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  currency TEXT DEFAULT 'CAD',
  beginning_balance DECIMAL(10, 2) DEFAULT 0,
  current_balance DECIMAL(10, 2) DEFAULT 0,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  default_currency TEXT DEFAULT 'CAD',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  default_wallet_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency TEXT,
  recurring_end_date DATE,
  wallet_id UUID,
  budget_id UUID,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  period TEXT NOT NULL,
  parent_type TEXT DEFAULT 'expense',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  current_value DECIMAL(10, 2) NOT NULL,
  purchase_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CREATE INDEXES
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_budget_id ON transactions(budget_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_parent_type ON budgets(parent_type);
CREATE INDEX idx_investments_user_id ON investments(user_id);

-- DISABLE ROW LEVEL SECURITY (Clerk handles authentication)
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE investments DISABLE ROW LEVEL SECURITY;

-- CREATE FUNCTION TO UPDATE WALLET BALANCES
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    IF OLD.wallet_id IS NOT NULL THEN
      UPDATE wallets
      SET current_balance = current_balance -
        CASE
          WHEN OLD.type IN ('income', 'savings') THEN OLD.amount
          WHEN OLD.type IN ('expense', 'bills', 'debt_payment') THEN -OLD.amount
          ELSE 0
        END
      WHERE id = OLD.wallet_id;
    END IF;
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.wallet_id IS NOT NULL THEN
      UPDATE wallets
      SET current_balance = current_balance -
        CASE
          WHEN OLD.type IN ('income', 'savings') THEN OLD.amount
          WHEN OLD.type IN ('expense', 'bills', 'debt_payment') THEN -OLD.amount
          ELSE 0
        END
      WHERE id = OLD.wallet_id;
    END IF;
    IF NEW.wallet_id IS NOT NULL THEN
      UPDATE wallets
      SET current_balance = current_balance +
        CASE
          WHEN NEW.type IN ('income', 'savings') THEN NEW.amount
          WHEN NEW.type IN ('expense', 'bills', 'debt_payment') THEN -NEW.amount
          ELSE 0
        END
      WHERE id = NEW.wallet_id;
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    IF NEW.wallet_id IS NOT NULL THEN
      UPDATE wallets
      SET current_balance = current_balance +
        CASE
          WHEN NEW.type IN ('income', 'savings') THEN NEW.amount
          WHEN NEW.type IN ('expense', 'bills', 'debt_payment') THEN -NEW.amount
          ELSE 0
        END
      WHERE id = NEW.wallet_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- CREATE TRIGGER
DROP TRIGGER IF EXISTS trigger_update_wallet_balance ON transactions;
CREATE TRIGGER trigger_update_wallet_balance
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_balance();

-- DONE!
-- Your database is ready. No RLS issues!
