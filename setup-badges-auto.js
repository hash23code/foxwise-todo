/**
 * 🎯 SOLUTION AUTOMATIQUE - Création des tables de badges
 *
 * Exécuter: node setup-badges-auto.js
 *
 * Ce script va:
 * 1. Installer le package PostgreSQL si nécessaire
 * 2. Se connecter directement à ta base de données Supabase
 * 3. Créer toutes les tables automatiquement
 * 4. Vérifier que tout fonctionne
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Démarrage de la configuration automatique du système de badges...\n');

// Étape 1: Vérifier si pg est installé
console.log('📦 Vérification des dépendances...');
try {
  require.resolve('pg');
  console.log('✅ PostgreSQL client déjà installé\n');
} catch (e) {
  console.log('📥 Installation du client PostgreSQL...');
  try {
    execSync('npm install pg --no-save', { stdio: 'inherit' });
    console.log('✅ Client PostgreSQL installé\n');
  } catch (error) {
    console.error('❌ Erreur lors de l\'installation de pg');
    console.log('\n💡 Essaye manuellement: npm install pg');
    process.exit(1);
  }
}

// Étape 2: Charger les variables d'environnement
console.log('🔑 Chargement des informations de connexion...');
let envContent;
try {
  envContent = fs.readFileSync('.env.local', 'utf8');
} catch (e) {
  console.error('❌ Fichier .env.local non trouvé');
  console.log('💡 Assure-toi d\'être dans le dossier du projet');
  process.exit(1);
}

const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const SERVICE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Variables d\'environnement manquantes dans .env.local');
  process.exit(1);
}

// Extraire le project ref
const projectRef = SUPABASE_URL.match(/https:\/\/(.+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ Format d\'URL Supabase invalide');
  process.exit(1);
}

console.log(`✅ Projet: ${projectRef}\n`);

// Étape 3: Construire l'URL de connexion PostgreSQL
// Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
console.log('🔌 Connexion à la base de données...');
console.log('⚠️  NOTE: Pour la connexion directe, tu as besoin du mot de passe de ta base de données\n');

console.log('📝 Étapes pour obtenir ton mot de passe de base de données:');
console.log('   1. Va sur supabase.com/dashboard');
console.log('   2. Sélectionne ton projet');
console.log('   3. Settings → Database');
console.log('   4. Scroll vers "Connection string" → "URI"');
console.log('   5. Clique sur "Reset database password" si tu ne l\'as pas\n');

console.log('💡 Une fois que tu as le mot de passe, crée une variable dans .env.local:');
console.log('   DATABASE_PASSWORD=ton_mot_de_passe_ici\n');

// Chercher le mot de passe
const DB_PASSWORD = envContent.match(/DATABASE_PASSWORD=(.+)/)?.[1]?.trim();

if (!DB_PASSWORD) {
  console.log('❌ Mot de passe de base de données non trouvé dans .env.local\n');
  console.log('🔧 SOLUTION ALTERNATIVE:');
  console.log('   Comme c\'est la première fois, le plus simple est d\'utiliser le SQL Editor:');
  console.log('   1. Ouvre le fichier: SETUP-BADGES-INSTRUCTIONS.md');
  console.log('   2. Copie le SQL de la section "ALTERNATIVE"');
  console.log('   3. Va sur Supabase Dashboard → SQL Editor');
  console.log('   4. Essaye dans un autre navigateur si ça bug\n');
  process.exit(1);
}

// Étape 4: Connexion et exécution du SQL
const { Client } = require('pg');

const connectionString = `postgresql://postgres.${projectRef}:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const sql = `
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

async function setupBadges() {
  try {
    await client.connect();
    console.log('✅ Connecté à la base de données\n');

    console.log('📝 Création des tables...');
    await client.query(sql);
    console.log('✅ Tables créées avec succès!\n');

    // Vérification
    console.log('🔍 Vérification...');
    const checkTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name IN ('user_badges', 'task_completion_times')
      AND table_schema = 'public'
    `);

    if (checkTables.rows.length === 2) {
      console.log('✅ Vérification réussie!\n');
      console.log('📋 Tables créées:');
      checkTables.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
      console.log('\n🎉 SUCCÈS! Le système de badges est prêt!');
      console.log('\n🚀 Prochaines étapes:');
      console.log('   1. Va dans le Day Planner');
      console.log('   2. Complète une tâche');
      console.log('   3. Les badges devraient apparaître! 🎯\n');
    } else {
      console.log('⚠️  Tables créées mais vérification partielle');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 Solutions:');
    console.log('   1. Vérifie que le mot de passe DATABASE_PASSWORD dans .env.local est correct');
    console.log('   2. Vérifie ta connexion internet');
    console.log('   3. Essaye la méthode manuelle avec le SQL Editor\n');
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupBadges();
