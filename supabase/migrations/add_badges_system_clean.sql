-- ====================================
-- ÉTAPE 1: Créer les tables
-- ====================================

-- Table pour les badges des utilisateurs
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  badge_type TEXT NOT NULL,
  badge_tier TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table pour enregistrer les temps de complétion des tâches
CREATE TABLE IF NOT EXISTS task_completion_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  planned_start TIMESTAMPTZ,
  planned_duration REAL,
  actual_completion TIMESTAMPTZ NOT NULL,
  time_saved_minutes INTEGER,
  was_in_planner BOOLEAN NOT NULL DEFAULT false,
  was_in_calendar BOOLEAN NOT NULL DEFAULT false,
  completed_after_hours BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================
-- ÉTAPE 2: Créer les index
-- ====================================

CREATE INDEX IF NOT EXISTS idx_user_badges_user_date ON user_badges(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_badges_type ON user_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_task_completion_user_date ON task_completion_times(user_id, date);
CREATE INDEX IF NOT EXISTS idx_task_completion_task ON task_completion_times(task_id);

-- ====================================
-- ÉTAPE 3: Activer RLS
-- ====================================

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completion_times ENABLE ROW LEVEL SECURITY;

-- ====================================
-- ÉTAPE 4: Créer les politiques RLS
-- ====================================

-- Politiques pour user_badges
DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;
CREATE POLICY "Users can view their own badges"
  ON user_badges
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

DROP POLICY IF EXISTS "Users can insert their own badges" ON user_badges;
CREATE POLICY "Users can insert their own badges"
  ON user_badges
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Politiques pour task_completion_times
DROP POLICY IF EXISTS "Users can view their own completion times" ON task_completion_times;
CREATE POLICY "Users can view their own completion times"
  ON task_completion_times
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

DROP POLICY IF EXISTS "Users can insert their own completion times" ON task_completion_times;
CREATE POLICY "Users can insert their own completion times"
  ON task_completion_times
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

DROP POLICY IF EXISTS "Users can update their own completion times" ON task_completion_times;
CREATE POLICY "Users can update their own completion times"
  ON task_completion_times
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true));
