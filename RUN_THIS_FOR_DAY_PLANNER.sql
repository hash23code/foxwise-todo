-- ============================================
-- RUN THIS SQL IN YOUR SUPABASE SQL EDITOR
-- This will add the day_planner table and estimated_hours to tasks
-- ============================================

-- 1. Add estimated_hours column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(5,2);

-- 2. Create day_planner table (for scheduling tasks by hour)
CREATE TABLE IF NOT EXISTS day_planner (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL, -- Format: "HH:MM" (e.g., "09:00", "14:30")
  duration_hours NUMERIC(4,2) NOT NULL, -- Allows decimals like 0.5, 1.5, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for day_planner
CREATE INDEX IF NOT EXISTS idx_day_planner_user_id ON day_planner(user_id);
CREATE INDEX IF NOT EXISTS idx_day_planner_task_id ON day_planner(task_id);
CREATE INDEX IF NOT EXISTS idx_day_planner_date ON day_planner(date);

-- 4. Enable RLS on day_planner
ALTER TABLE day_planner ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS policy to block direct access
CREATE POLICY "Block direct access to day_planner"
  ON day_planner FOR ALL
  USING (false);

-- 6. Create trigger for updated_at
CREATE TRIGGER update_day_planner_updated_at
  BEFORE UPDATE ON day_planner
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Done! Now refresh your app and try adding tasks to the Day Planner
