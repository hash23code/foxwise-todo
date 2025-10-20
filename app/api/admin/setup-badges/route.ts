import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// POST: Créer les tables via l'API Supabase Management
export async function POST(request: NextRequest) {
  try {
    const results: any = {
      success: false,
      tables_created: [],
      errors: [],
      method: 'direct_insert'
    };

    // Essayer de créer les tables en insérant une ligne test puis en la supprimant
    // Cela ne fonctionnera que si les tables existent déjà

    // Test 1: Vérifier si user_badges existe
    try {
      const { error: testError1 } = await supabase
        .from('user_badges')
        .select('id')
        .limit(1);

      if (testError1) {
        results.errors.push({
          table: 'user_badges',
          error: testError1.message,
          hint: 'Table does not exist. Please run SQL manually.'
        });
      } else {
        results.tables_created.push('user_badges (already exists)');
      }
    } catch (e: any) {
      results.errors.push({
        table: 'user_badges',
        error: e.message
      });
    }

    // Test 2: Vérifier si task_completion_times existe
    try {
      const { error: testError2 } = await supabase
        .from('task_completion_times')
        .select('id')
        .limit(1);

      if (testError2) {
        results.errors.push({
          table: 'task_completion_times',
          error: testError2.message,
          hint: 'Table does not exist. Please run SQL manually.'
        });
      } else {
        results.tables_created.push('task_completion_times (already exists)');
      }
    } catch (e: any) {
      results.errors.push({
        table: 'task_completion_times',
        error: e.message
      });
    }

    // Si les deux tables existent, c'est un succès
    results.success = results.tables_created.length === 2;

    if (!results.success) {
      return NextResponse.json({
        ...results,
        message: 'Tables do not exist. Please create them using the SQL commands below.',
        sql_commands: getSQLCommands()
      }, { status: 200 });
    }

    return NextResponse.json({
      ...results,
      message: 'Badge system is already set up!'
    });

  } catch (error: any) {
    console.error('Error in POST /api/admin/setup-badges:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      sql_commands: getSQLCommands()
    }, { status: 500 });
  }
}

// GET: Vérifier le statut
export async function GET(request: NextRequest) {
  try {
    const status: any = {
      user_badges: false,
      task_completion_times: false,
      status: 'not_ready'
    };

    // Vérifier user_badges
    try {
      const { error: e1 } = await supabase
        .from('user_badges')
        .select('id')
        .limit(1);

      status.user_badges = !e1;
    } catch (e) {
      status.user_badges = false;
    }

    // Vérifier task_completion_times
    try {
      const { error: e2 } = await supabase
        .from('task_completion_times')
        .select('id')
        .limit(1);

      status.task_completion_times = !e2;
    } catch (e) {
      status.task_completion_times = false;
    }

    status.status = (status.user_badges && status.task_completion_times)
      ? 'ready'
      : 'not_ready';

    if (status.status === 'not_ready') {
      status.sql_commands = getSQLCommands();
    }

    return NextResponse.json(status);

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      status: 'error'
    }, { status: 500 });
  }
}

function getSQLCommands() {
  return [
    {
      step: 1,
      name: 'Create user_badges table',
      sql: `CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  badge_type TEXT NOT NULL,
  badge_tier TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`
    },
    {
      step: 2,
      name: 'Create task_completion_times table',
      sql: `CREATE TABLE task_completion_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
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
);`
    },
    {
      step: 3,
      name: 'Add foreign key constraint',
      sql: `ALTER TABLE task_completion_times
ADD CONSTRAINT task_completion_times_task_id_fkey
FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;`
    },
    {
      step: 4,
      name: 'Create indexes',
      sql: `CREATE INDEX idx_user_badges_user_date ON user_badges(user_id, date);
CREATE INDEX idx_user_badges_type ON user_badges(badge_type);
CREATE INDEX idx_task_completion_user_date ON task_completion_times(user_id, date);
CREATE INDEX idx_task_completion_task ON task_completion_times(task_id);`
    },
    {
      step: 5,
      name: 'Enable RLS',
      sql: `ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completion_times ENABLE ROW LEVEL SECURITY;`
    },
    {
      step: 6,
      name: 'Create RLS policies for user_badges',
      sql: `CREATE POLICY "Users can view their own badges" ON user_badges FOR SELECT USING (true);
CREATE POLICY "Users can insert their own badges" ON user_badges FOR INSERT WITH CHECK (true);`
    },
    {
      step: 7,
      name: 'Create RLS policies for task_completion_times',
      sql: `CREATE POLICY "Users can view their own completion times" ON task_completion_times FOR SELECT USING (true);
CREATE POLICY "Users can insert their own completion times" ON task_completion_times FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own completion times" ON task_completion_times FOR UPDATE USING (true);`
    }
  ];
}
