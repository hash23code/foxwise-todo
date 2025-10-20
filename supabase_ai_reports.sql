-- Table for storing AI-generated reports
CREATE TABLE IF NOT EXISTS ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  category_filter TEXT, -- NULL for all categories, or specific category name

  -- Report data
  title TEXT NOT NULL,
  summary TEXT NOT NULL, -- AI-generated summary
  ai_analysis TEXT NOT NULL, -- Detailed AI analysis
  recommendations JSONB NOT NULL, -- Array of AI recommendations
  comparison JSONB, -- Comparison with previous period

  -- Statistics
  stats JSONB NOT NULL, -- All numerical stats (tasks, hours, completion rates, etc.)
  charts_data JSONB NOT NULL, -- Data for charts/graphs

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_reports_user_id ON ai_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_reports_created_at ON ai_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_reports_period ON ai_reports(period_start, period_end);

-- RLS Policies
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;

-- Users can only see their own reports
CREATE POLICY "Users can view their own reports"
  ON ai_reports
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can create their own reports
CREATE POLICY "Users can create their own reports"
  ON ai_reports
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Users can delete their own reports
CREATE POLICY "Users can delete their own reports"
  ON ai_reports
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_ai_reports_updated_at
  BEFORE UPDATE ON ai_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_reports_updated_at();
