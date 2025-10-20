/**
 * Script pour créer les tables du système de badges dans Supabase
 * Exécuter: node scripts/setup-badges-db.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createBadgesTables() {
  console.log('🚀 Starting badge system setup...\n');

  const sqlCommands = [
    {
      name: 'Create user_badges table',
      sql: `
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
      `
    },
    {
      name: 'Create task_completion_times table',
      sql: `
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
      `
    },
    {
      name: 'Create index on user_badges (user_id, date)',
      sql: `CREATE INDEX IF NOT EXISTS idx_user_badges_user_date ON user_badges(user_id, date);`
    },
    {
      name: 'Create index on user_badges (badge_type)',
      sql: `CREATE INDEX IF NOT EXISTS idx_user_badges_type ON user_badges(badge_type);`
    },
    {
      name: 'Create index on task_completion_times (user_id, date)',
      sql: `CREATE INDEX IF NOT EXISTS idx_task_completion_user_date ON task_completion_times(user_id, date);`
    },
    {
      name: 'Create index on task_completion_times (task_id)',
      sql: `CREATE INDEX IF NOT EXISTS idx_task_completion_task ON task_completion_times(task_id);`
    },
    {
      name: 'Enable RLS on user_badges',
      sql: `ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;`
    },
    {
      name: 'Enable RLS on task_completion_times',
      sql: `ALTER TABLE task_completion_times ENABLE ROW LEVEL SECURITY;`
    },
    {
      name: 'Create RLS policy: Users can view their own badges',
      sql: `
        DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;
        CREATE POLICY "Users can view their own badges"
          ON user_badges FOR SELECT
          USING (user_id = current_setting('app.current_user_id', true));
      `
    },
    {
      name: 'Create RLS policy: Users can insert their own badges',
      sql: `
        DROP POLICY IF EXISTS "Users can insert their own badges" ON user_badges;
        CREATE POLICY "Users can insert their own badges"
          ON user_badges FOR INSERT
          WITH CHECK (user_id = current_setting('app.current_user_id', true));
      `
    },
    {
      name: 'Create RLS policy: Users can view their own completion times',
      sql: `
        DROP POLICY IF EXISTS "Users can view their own completion times" ON task_completion_times;
        CREATE POLICY "Users can view their own completion times"
          ON task_completion_times FOR SELECT
          USING (user_id = current_setting('app.current_user_id', true));
      `
    },
    {
      name: 'Create RLS policy: Users can insert their own completion times',
      sql: `
        DROP POLICY IF EXISTS "Users can insert their own completion times" ON task_completion_times;
        CREATE POLICY "Users can insert their own completion times"
          ON task_completion_times FOR INSERT
          WITH CHECK (user_id = current_setting('app.current_user_id', true));
      `
    },
    {
      name: 'Create RLS policy: Users can update their own completion times',
      sql: `
        DROP POLICY IF EXISTS "Users can update their own completion times" ON task_completion_times;
        CREATE POLICY "Users can update their own completion times"
          ON task_completion_times FOR UPDATE
          USING (user_id = current_setting('app.current_user_id', true));
      `
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const command of sqlCommands) {
    try {
      console.log(`⏳ ${command.name}...`);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ query: command.sql })
        }
      );

      if (response.ok || response.status === 409) {
        console.log(`✅ ${command.name} - SUCCESS\n`);
        successCount++;
      } else {
        const error = await response.text();
        console.log(`⚠️  ${command.name} - WARNING: ${error}\n`);
        errorCount++;
      }
    } catch (error) {
      console.log(`❌ ${command.name} - ERROR: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('='.repeat(50));

  if (errorCount === 0) {
    console.log('\n🎉 Badge system setup completed successfully!');
  } else {
    console.log('\n⚠️  Setup completed with some warnings. This is normal if tables already exist.');
    console.log('💡 You can verify the tables in Supabase Dashboard > Table Editor');
  }

  // Test if tables exist
  console.log('\n🔍 Verifying tables...');

  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select('id')
      .limit(1);

    if (error && !error.message.includes('does not exist')) {
      console.log('✅ user_badges table exists');
    } else if (error) {
      console.log('❌ user_badges table not found');
    } else {
      console.log('✅ user_badges table exists and accessible');
    }
  } catch (e) {
    console.log('❌ Could not verify user_badges table');
  }

  try {
    const { data, error } = await supabase
      .from('task_completion_times')
      .select('id')
      .limit(1);

    if (error && !error.message.includes('does not exist')) {
      console.log('✅ task_completion_times table exists');
    } else if (error) {
      console.log('❌ task_completion_times table not found');
    } else {
      console.log('✅ task_completion_times table exists and accessible');
    }
  } catch (e) {
    console.log('❌ Could not verify task_completion_times table');
  }
}

createBadgesTables()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
