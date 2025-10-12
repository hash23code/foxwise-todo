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

-- Enable Row Level Security
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own budgets"
  ON budgets FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update their own budgets"
  ON budgets FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own budgets"
  ON budgets FOR DELETE
  USING (auth.jwt() ->> 'sub' = user_id OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create index for better query performance
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
