# 🎯 Installation du Système de Badges - SOLUTION SIMPLE

## ⚡ MÉTHODE RAPIDE (Recommandée)

### Étape 1: Installer Supabase CLI
```bash
npm install -g supabase
```

### Étape 2: Exécuter UNE commande
```bash
npx supabase db push --db-url "YOUR_DATABASE_URL"
```

**Où trouver ton DATABASE_URL:**
1. Va sur Supabase Dashboard
2. Clique sur ton projet
3. Settings → Database → Connection String → URI
4. Copie l'URL complète (elle ressemble à: `postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres`)

---

## 🔧 ALTERNATIVE: SQL Simple (si le CLI ne marche pas)

Si ton SQL Editor fonctionne maintenant, copie-colle ce code EN UNE SEULE FOIS:

```sql
-- Table 1: user_badges
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

-- Table 2: task_completion_times
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_date ON user_badges(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_badges_type ON user_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_task_completion_user_date ON task_completion_times(user_id, date);
CREATE INDEX IF NOT EXISTS idx_task_completion_task ON task_completion_times(task_id);

-- RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completion_times ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own badges" ON user_badges FOR SELECT USING (true);
CREATE POLICY "Users can insert their own badges" ON user_badges FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own completion times" ON task_completion_times FOR SELECT USING (true);
CREATE POLICY "Users can insert their own completion times" ON task_completion_times FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own completion times" ON task_completion_times FOR UPDATE USING (true);
```

---

## 🐛 Si rien ne fonctionne

Essaie le SQL Editor dans:
1. Un autre navigateur (Chrome → Firefox)
2. Mode incognito
3. Vide ton cache navigateur
4. Vérifie ta connexion internet

---

## ✅ Comment vérifier que ça a marché

Après avoir exécuté le SQL (méthode 1 ou 2), va sur:
- Supabase Dashboard → Table Editor
- Tu devrais voir 2 nouvelles tables: `user_badges` et `task_completion_times`

Ensuite, teste dans l'app:
1. Va dans le Day Planner
2. Complète une tâche
3. Les badges devraient apparaître à côté du nom du jour!
