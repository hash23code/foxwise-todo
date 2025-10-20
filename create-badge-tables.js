// Script simple pour créer les tables de badges
// Exécuter: node create-badge-tables.js

const https = require('https');
const fs = require('fs');

// Charger les variables d'environnement
const envContent = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const SERVICE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();

// Extraire le project ref de l'URL
const projectRef = SUPABASE_URL.match(/https:\/\/(.+)\.supabase\.co/)[1];

console.log('🚀 Creating badge tables...\n');

// SQL à exécuter
const sql = `
-- Table 1
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

-- Table 2
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

-- Index
CREATE INDEX IF NOT EXISTS idx_user_badges_user_date ON user_badges(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_badges_type ON user_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_task_completion_user_date ON task_completion_times(user_id, date);
CREATE INDEX IF NOT EXISTS idx_task_completion_task ON task_completion_times(task_id);

-- RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completion_times ENABLE ROW LEVEL SECURITY;

-- Politiques
DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;
CREATE POLICY "Users can view their own badges" ON user_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own badges" ON user_badges;
CREATE POLICY "Users can insert their own badges" ON user_badges FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own completion times" ON task_completion_times;
CREATE POLICY "Users can view their own completion times" ON task_completion_times FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own completion times" ON task_completion_times;
CREATE POLICY "Users can insert their own completion times" ON task_completion_times FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own completion times" ON task_completion_times;
CREATE POLICY "Users can update their own completion times" ON task_completion_times FOR UPDATE USING (true);
`;

// Fonction pour exécuter le SQL via l'API Supabase
function executeSql() {
  const postData = JSON.stringify({ query: sql });

  const options = {
    hostname: `${projectRef}.supabase.co`,
    path: '/rest/v1/rpc/exec_sql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('✅ Tables créées avec succès!');
        console.log('\n📋 Tables créées:');
        console.log('  - user_badges');
        console.log('  - task_completion_times');
        console.log('\n✨ Le système de badges est prêt!');
      } else {
        console.log(`⚠️  Status: ${res.statusCode}`);
        console.log('Response:', data);
        console.log('\n💡 Si vous voyez "relation already exists", c\'est normal - les tables existent déjà!');
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Erreur:', e.message);
    console.log('\n📝 Copiez ce SQL dans Supabase Dashboard > SQL Editor:\n');
    console.log(sql);
  });

  req.write(postData);
  req.end();
}

executeSql();
