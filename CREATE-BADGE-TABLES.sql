-- Script SQL pour créer les tables de badges dans Supabase
-- À exécuter dans Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- Table pour stocker les temps de complétion des tâches
CREATE TABLE IF NOT EXISTS task_completion_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  planned_start TIMESTAMPTZ,
  planned_duration NUMERIC,
  actual_completion TIMESTAMPTZ NOT NULL,
  time_saved_minutes INTEGER,
  was_in_planner BOOLEAN DEFAULT false,
  was_in_calendar BOOLEAN DEFAULT false,
  completed_after_hours BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour stocker les badges gagnés
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  badge_type TEXT NOT NULL,
  badge_tier TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  earned_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_task_completion_user_date ON task_completion_times(user_id, date);
CREATE INDEX IF NOT EXISTS idx_task_completion_task ON task_completion_times(task_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_date ON user_badges(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_badges_type ON user_badges(badge_type);

-- RLS (Row Level Security) pour task_completion_times
ALTER TABLE task_completion_times ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own completion times" ON task_completion_times;
DROP POLICY IF EXISTS "Users can insert their own completion times" ON task_completion_times;

CREATE POLICY "Users can view their own completion times"
  ON task_completion_times FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own completion times"
  ON task_completion_times FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS (Row Level Security) pour user_badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can insert their own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can delete their own badges" ON user_badges;

CREATE POLICY "Users can view their own badges"
  ON user_badges FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert their own badges"
  ON user_badges FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete their own badges"
  ON user_badges FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
