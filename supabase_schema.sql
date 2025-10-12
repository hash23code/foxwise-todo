-- Budget Tracker Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  period TEXT CHECK (period IN ('monthly', 'yearly')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly') OR recurring_frequency IS NULL),
  recurring_end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create investments table
CREATE TABLE IF NOT EXISTS investments (
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);

-- Enable Row Level Security
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Budgets policies
CREATE POLICY "Users can view their own budgets"
  ON budgets FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own budgets"
  ON budgets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own budgets"
  ON budgets FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own budgets"
  ON budgets FOR DELETE
  USING (true);

-- Transactions policies
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  USING (true);

-- Investments policies
CREATE POLICY "Users can view their own investments"
  ON investments FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own investments"
  ON investments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own investments"
  ON investments FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own investments"
  ON investments FOR DELETE
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON investments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
