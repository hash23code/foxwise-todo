-- Fix RLS policy for day_planner to allow users to access their own data

-- Drop the blocking policy
DROP POLICY IF EXISTS "Block direct access to day_planner" ON day_planner;

-- Create proper policies for day_planner
CREATE POLICY "Users can view own day planner"
  ON day_planner FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own day planner"
  ON day_planner FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own day planner"
  ON day_planner FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own day planner"
  ON day_planner FOR DELETE
  USING (auth.uid()::text = user_id);

-- Done! Now users can manage their own day planner entries
