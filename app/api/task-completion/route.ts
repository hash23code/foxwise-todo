import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { calculateTimeSaved, isAfterHours, BADGE_CONFIG } from '@/lib/badges';

// POST: Enregistrer le temps de complétion d'une tâche
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task_id, actual_completion } = body;

    if (!task_id || !actual_completion) {
      return NextResponse.json(
        { error: 'Missing required fields: task_id, actual_completion' },
        { status: 400 }
      );
    }

    const completionDate = new Date(actual_completion);
    // Utiliser la date locale pour éviter le décalage UTC
    const year = completionDate.getFullYear();
    const month = String(completionDate.getMonth() + 1).padStart(2, '0');
    const day = String(completionDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const supabase = await createClient();

    // Vérifier si la tâche était dans le day planner
    const { data: plannedTask } = await (supabase
      .from('day_planner') as any)
      .select('start_time, duration_hours, date')
      .eq('task_id', task_id)
      .eq('date', dateStr)
      .maybeSingle();

    // Vérifier si la tâche était dans le calendrier (avait une due_date)
    const { data: task } = await (supabase
      .from('tasks') as any)
      .select('due_date')
      .eq('id', task_id)
      .single();

    const wasInPlanner = !!plannedTask;
    const wasInCalendar = !!task?.due_date;

    let plannedStart: string | null = null;
    let plannedDuration: number | null = null;
    let timeSavedMinutes: number | null = null;

    // Si la tâche était planifiée, calculer le temps économisé
    if (plannedTask) {
      // Construire la date/heure de début prévue
      plannedStart = `${plannedTask.date}T${plannedTask.start_time}:00`;
      plannedDuration = plannedTask.duration_hours;

      // Calculer le temps économisé
      if (plannedDuration !== null) {
        timeSavedMinutes = calculateTimeSaved(
          plannedStart,
          plannedDuration,
          actual_completion
        );
      }
    }

    // Vérifier si complétée après 20h
    const completedAfterHours = isAfterHours(actual_completion);

    // Enregistrer le temps de complétion
    const { data: completion, error: completionError } = await (supabase
      .from('task_completion_times') as any)
      .insert({
        task_id,
        user_id: userId,
        date: dateStr,
        planned_start: plannedStart,
        planned_duration: plannedDuration,
        actual_completion,
        time_saved_minutes: timeSavedMinutes,
        was_in_planner: wasInPlanner,
        was_in_calendar: wasInCalendar,
        completed_after_hours: completedAfterHours,
      })
      .select()
      .single();

    if (completionError) {
      console.error('Error saving completion time:', completionError);
      return NextResponse.json({ error: completionError.message }, { status: 500 });
    }

    // Vérifier et attribuer les badges immédiatement
    const badges = [];

    // Badge SPEED_TASK: au moins 15 min économisées
    if (timeSavedMinutes && timeSavedMinutes >= BADGE_CONFIG.speed_task.minimum_minutes_saved) {
      const { data: speedBadge, error: speedError } = await (supabase
        .from('user_badges') as any)
        .insert({
          user_id: userId,
          date: dateStr,
          badge_type: 'speed_task',
          metadata: {
            task_id,
            time_saved_minutes: timeSavedMinutes,
          },
        })
        .select()
        .single();

      if (!speedError && speedBadge) {
        badges.push(speedBadge);
      }
    }

    // Badge FLEXIBLE: tâche complétée qui n'était ni dans le planner ni dans le calendrier
    if (!wasInPlanner && !wasInCalendar) {
      // Vérifier si le badge n'existe pas déjà pour cette date
      const { data: existingFlexible } = await (supabase
        .from('user_badges') as any)
        .select('id')
        .eq('user_id', userId)
        .eq('date', dateStr)
        .eq('badge_type', 'flexible')
        .maybeSingle();

      if (!existingFlexible) {
        const { data: flexibleBadge, error: flexibleError } = await (supabase
          .from('user_badges') as any)
          .insert({
            user_id: userId,
            date: dateStr,
            badge_type: 'flexible',
            metadata: {
              task_id,
            },
          })
          .select()
          .single();

        if (!flexibleError && flexibleBadge) {
          badges.push(flexibleBadge);
        }
      }
    }

    // Badge AFTER_HOURS: tâche complétée après 20h
    if (completedAfterHours) {
      // Vérifier si le badge n'existe pas déjà pour cette date
      const { data: existingAfterHours } = await (supabase
        .from('user_badges') as any)
        .select('id')
        .eq('user_id', userId)
        .eq('date', dateStr)
        .eq('badge_type', 'after_hours')
        .maybeSingle();

      if (!existingAfterHours) {
        const { data: afterHoursBadge, error: afterHoursError } = await (supabase
          .from('user_badges') as any)
          .insert({
            user_id: userId,
            date: dateStr,
            badge_type: 'after_hours',
            metadata: {
              task_id,
              completion_hour: completionDate.getHours(),
            },
          })
          .select()
          .single();

        if (!afterHoursError && afterHoursBadge) {
          badges.push(afterHoursBadge);
        }
      }
    }

    return NextResponse.json({
      completion,
      badges_earned: badges,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/task-completion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Récupérer les temps de complétion pour une date
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await (supabase
      .from('task_completion_times') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('actual_completion', { ascending: true });

    if (error) {
      console.error('Error fetching completion times:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/task-completion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
