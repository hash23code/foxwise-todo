import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Créer toutes les tables et configurations pour le système de badges
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      user_badges_table: false,
      task_completion_times_table: false,
      indexes: false,
      policies: false,
      errors: [] as string[]
    };

    // ÉTAPE 1: Créer la table user_badges
    try {
      const { error: userBadgesError } = await supabase.rpc('exec_sql', {
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
      });

      if (userBadgesError) {
        results.errors.push(`user_badges table: ${userBadgesError.message}`);
      } else {
        results.user_badges_table = true;
      }
    } catch (e: any) {
      results.errors.push(`user_badges table: ${e.message}`);
    }

    // ÉTAPE 2: Créer la table task_completion_times
    try {
      const { error: completionError } = await supabase.rpc('exec_sql', {
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
      });

      if (completionError) {
        results.errors.push(`task_completion_times table: ${completionError.message}`);
      } else {
        results.task_completion_times_table = true;
      }
    } catch (e: any) {
      results.errors.push(`task_completion_times table: ${e.message}`);
    }

    // ÉTAPE 3: Créer les index
    try {
      const indexQueries = [
        'CREATE INDEX IF NOT EXISTS idx_user_badges_user_date ON user_badges(user_id, date);',
        'CREATE INDEX IF NOT EXISTS idx_user_badges_type ON user_badges(badge_type);',
        'CREATE INDEX IF NOT EXISTS idx_task_completion_user_date ON task_completion_times(user_id, date);',
        'CREATE INDEX IF NOT EXISTS idx_task_completion_task ON task_completion_times(task_id);'
      ];

      for (const query of indexQueries) {
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          results.errors.push(`Index: ${error.message}`);
        }
      }
      results.indexes = true;
    } catch (e: any) {
      results.errors.push(`Indexes: ${e.message}`);
    }

    // ÉTAPE 4: Activer RLS et créer les politiques
    try {
      const rlsQueries = [
        'ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;',
        'ALTER TABLE task_completion_times ENABLE ROW LEVEL SECURITY;',
        `DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;`,
        `CREATE POLICY "Users can view their own badges" ON user_badges FOR SELECT USING (user_id = current_setting('app.current_user_id', true));`,
        `DROP POLICY IF EXISTS "Users can insert their own badges" ON user_badges;`,
        `CREATE POLICY "Users can insert their own badges" ON user_badges FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));`,
        `DROP POLICY IF EXISTS "Users can view their own completion times" ON task_completion_times;`,
        `CREATE POLICY "Users can view their own completion times" ON task_completion_times FOR SELECT USING (user_id = current_setting('app.current_user_id', true));`,
        `DROP POLICY IF EXISTS "Users can insert their own completion times" ON task_completion_times;`,
        `CREATE POLICY "Users can insert their own completion times" ON task_completion_times FOR INSERT WITH CHECK (user_id = current_setting('app.current_user_id', true));`,
        `DROP POLICY IF EXISTS "Users can update their own completion times" ON task_completion_times;`,
        `CREATE POLICY "Users can update their own completion times" ON task_completion_times FOR UPDATE USING (user_id = current_setting('app.current_user_id', true));`
      ];

      for (const query of rlsQueries) {
        const { error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          results.errors.push(`RLS Policy: ${error.message}`);
        }
      }
      results.policies = true;
    } catch (e: any) {
      results.errors.push(`RLS Policies: ${e.message}`);
    }

    const success = results.user_badges_table && results.task_completion_times_table;

    return NextResponse.json({
      success,
      message: success
        ? 'Badge system setup completed successfully!'
        : 'Badge system setup completed with some errors. Tables may already exist.',
      details: results
    }, { status: success ? 200 : 207 });

  } catch (error: any) {
    console.error('Error in POST /api/setup-badges:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      hint: 'If RPC function exec_sql does not exist, you need to execute the SQL manually in Supabase Dashboard'
    }, { status: 500 });
  }
}

// GET: Vérifier l'état des tables
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Vérifier si les tables existent
    const { data: userBadgesExists } = await supabase
      .from('user_badges')
      .select('id')
      .limit(1);

    const { data: completionExists } = await supabase
      .from('task_completion_times')
      .select('id')
      .limit(1);

    return NextResponse.json({
      user_badges_exists: userBadgesExists !== null,
      task_completion_times_exists: completionExists !== null,
      status: (userBadgesExists !== null && completionExists !== null)
        ? 'ready'
        : 'not_setup'
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      user_badges_exists: false,
      task_completion_times_exists: false,
      status: 'not_setup'
    });
  }
}
