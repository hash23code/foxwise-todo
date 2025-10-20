-- Table pour les badges des utilisateurs
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  badge_type TEXT NOT NULL,
  badge_tier TEXT, -- bronze, silver, gold (pour speed_day)
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB, -- données supplémentaires (temps économisé, catégorie, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table pour enregistrer les temps de complétion des tâches
CREATE TABLE IF NOT EXISTS task_completion_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  planned_start TIMESTAMPTZ, -- heure de début prévue dans le day planner
  planned_duration REAL, -- durée prévue en heures
  actual_completion TIMESTAMPTZ NOT NULL, -- quand l'utilisateur a marqué la tâche comme complétée
  time_saved_minutes INTEGER, -- temps économisé en minutes (peut être négatif)
  was_in_planner BOOLEAN NOT NULL DEFAULT false, -- était dans le day planner?
  was_in_calendar BOOLEAN NOT NULL DEFAULT false, -- était dans le calendrier?
  completed_after_hours BOOLEAN NOT NULL DEFAULT false, -- complétée après 20h?
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_badges_user_date ON user_badges(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_badges_type ON user_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_task_completion_user_date ON task_completion_times(user_id, date);
CREATE INDEX IF NOT EXISTS idx_task_completion_task ON task_completion_times(task_id);

-- Row Level Security (RLS)
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completion_times ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour user_badges
CREATE POLICY "Users can view their own badges"
  ON user_badges
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert their own badges"
  ON user_badges
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Politique RLS pour task_completion_times
CREATE POLICY "Users can view their own completion times"
  ON task_completion_times
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert their own completion times"
  ON task_completion_times
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update their own completion times"
  ON task_completion_times
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true));

-- Commentaires pour documentation
COMMENT ON TABLE user_badges IS 'Stocke tous les badges gagnés par les utilisateurs';
COMMENT ON TABLE task_completion_times IS 'Enregistre les temps de complétion réels des tâches pour le calcul des badges de vitesse';
COMMENT ON COLUMN user_badges.badge_type IS 'Types: perfect_day, flexible, speed_task, speed_day_bronze, speed_day_silver, speed_day_gold, after_hours, exceptional_category, exceptional_global';
COMMENT ON COLUMN task_completion_times.time_saved_minutes IS 'Temps économisé en minutes. Positif = plus rapide, négatif = plus lent';
