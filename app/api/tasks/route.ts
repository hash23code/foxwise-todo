import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// GET all tasks for the current user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const list_id = searchParams.get('list_id');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const supabase = await createClient();

    let query = (supabase
      .from('tasks') as any)
      .select('*, todo_lists(*)')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (list_id) {
      query = query.eq('list_id', list_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create a new task
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      list_id,
      title,
      description,
      priority,
      status,
      due_date,
      estimated_hours,
      is_recurring,
      recurring_frequency,
      recurring_end_date,
      tags,
      position,
    } = body;

    if (!list_id || !title) {
      return NextResponse.json({ error: 'List ID and title are required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await (supabase
      .from('tasks') as any)
      .insert({
        user_id: userId,
        list_id,
        title,
        description: description || null,
        priority: priority || 'medium',
        status: status || 'pending',
        due_date: due_date || null,
        estimated_hours: estimated_hours ? parseFloat(estimated_hours) : null,
        is_recurring: is_recurring || false,
        recurring_frequency: recurring_frequency || null,
        recurring_end_date: recurring_end_date || null,
        tags: tags || null,
        position: position || 0,
      })
      .select('*, todo_lists(*)')
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update a task
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      list_id,
      title,
      description,
      priority,
      status,
      due_date,
      estimated_hours,
      is_recurring,
      recurring_frequency,
      recurring_end_date,
      tags,
      position,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const updateData: any = {};
    if (list_id !== undefined) updateData.list_id = list_id;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (estimated_hours !== undefined) updateData.estimated_hours = estimated_hours ? parseFloat(estimated_hours) : null;
    if (is_recurring !== undefined) updateData.is_recurring = is_recurring;
    if (recurring_frequency !== undefined) updateData.recurring_frequency = recurring_frequency;
    if (recurring_end_date !== undefined) updateData.recurring_end_date = recurring_end_date;
    if (tags !== undefined) updateData.tags = tags;
    if (position !== undefined) updateData.position = position;

    const { data, error } = await (supabase
      .from('tasks') as any)
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, todo_lists(*)')
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Si la tâche vient d'être marquée comme 'completed', enregistrer le temps de complétion
    if (status === 'completed') {
      try {
        // Importer la logique de badge
        const { calculateTimeSaved, isAfterHours, BADGE_CONFIG } = await import('@/lib/badges');

        const completionDate = new Date();
        // Utiliser la date locale pour éviter le décalage UTC
        const year = completionDate.getFullYear();
        const month = String(completionDate.getMonth() + 1).padStart(2, '0');
        const day = String(completionDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const actual_completion = completionDate.toISOString();

        console.log('🐛 DEBUG TIMEZONE - Completion Date:', {
          now: completionDate.toString(),
          year, month, day,
          dateStr,
          actual_completion,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });

        // Vérifier si la tâche était dans le day planner
        const { data: plannedTask } = await (supabase
          .from('day_planner') as any)
          .select('start_time, duration_hours, date')
          .eq('task_id', id)
          .eq('date', dateStr)
          .maybeSingle();

        // Vérifier si la tâche était dans le calendrier (avait une due_date)
        const wasInPlanner = !!plannedTask;
        const wasInCalendar = !!data.due_date;

        let plannedStart: string | null = null;
        let plannedDuration: number | null = null;
        let timeSavedMinutes: number | null = null;

        // Si la tâche était planifiée, calculer le temps économisé
        if (plannedTask) {
          plannedStart = `${plannedTask.date}T${plannedTask.start_time}:00`;
          plannedDuration = plannedTask.duration_hours;

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
        await (supabase
          .from('task_completion_times') as any)
          .insert({
            task_id: id,
            user_id: userId,
            date: dateStr,
            planned_start: plannedStart,
            planned_duration: plannedDuration,
            actual_completion,
            time_saved_minutes: timeSavedMinutes,
            was_in_planner: wasInPlanner,
            was_in_calendar: wasInCalendar,
            completed_after_hours: completedAfterHours,
          });

        // Créer les badges
        // Badge SPEED_TASK: au moins 15 min économisées
        if (timeSavedMinutes && timeSavedMinutes >= BADGE_CONFIG.speed_task.minimum_minutes_saved) {
          await (supabase
            .from('user_badges') as any)
            .insert({
              user_id: userId,
              date: dateStr,
              badge_type: 'speed_task',
              metadata: {
                task_id: id,
                time_saved_minutes: timeSavedMinutes,
              },
            });
        }

        // Badge FLEXIBLE: tâche complétée qui n'était ni dans le planner ni dans le calendrier
        if (!wasInPlanner && !wasInCalendar) {
          const { data: existingFlexible } = await (supabase
            .from('user_badges') as any)
            .select('id')
            .eq('user_id', userId)
            .eq('date', dateStr)
            .eq('badge_type', 'flexible')
            .maybeSingle();

          if (!existingFlexible) {
            await (supabase
              .from('user_badges') as any)
              .insert({
                user_id: userId,
                date: dateStr,
                badge_type: 'flexible',
                metadata: { task_id: id },
              });
          }
        }

        // Badge AFTER_HOURS: tâche complétée après 20h
        if (completedAfterHours) {
          const { data: existingAfterHours } = await (supabase
            .from('user_badges') as any)
            .select('id')
            .eq('user_id', userId)
            .eq('date', dateStr)
            .eq('badge_type', 'after_hours')
            .maybeSingle();

          if (!existingAfterHours) {
            await (supabase
              .from('user_badges') as any)
              .insert({
                user_id: userId,
                date: dateStr,
                badge_type: 'after_hours',
                metadata: {
                  task_id: id,
                  completion_hour: completionDate.getHours(),
                },
              });
          }
        }

        // Badge PERFECT_DAY: Toutes les tâches de la journée complétées
        // Récupérer les tâches planifiées pour aujourd'hui
        const { data: todayPlannedTasks } = await (supabase
          .from('day_planner') as any)
          .select('task_id')
          .eq('date', dateStr);

        const plannedTaskIds = todayPlannedTasks?.map((t: any) => t.task_id) || [];

        // Récupérer toutes les tâches avec due_date aujourd'hui
        const { data: tasksWithDueDate } = await (supabase
          .from('tasks') as any)
          .select('id, status')
          .eq('user_id', userId)
          .eq('due_date', dateStr)
          .neq('status', 'archived');

        // Récupérer les tâches planifiées (si différentes)
        let plannedTasks: any[] = [];
        if (plannedTaskIds.length > 0) {
          const { data } = await (supabase
            .from('tasks') as any)
            .select('id, status')
            .eq('user_id', userId)
            .in('id', plannedTaskIds)
            .neq('status', 'archived');
          plannedTasks = data || [];
        }

        // Combiner et dédupliquer
        const allTaskIds = new Set<string>();
        const todayTasks: any[] = [];

        [...(tasksWithDueDate || []), ...plannedTasks].forEach(task => {
          if (!allTaskIds.has(task.id)) {
            allTaskIds.add(task.id);
            todayTasks.push(task);
          }
        });

        if (todayTasks && todayTasks.length > 0) {
          const completedTasks = todayTasks.filter((t: any) => t.status === 'completed');

          console.log('🌟 Perfect Day Check:', {
            dateStr,
            todayTasksTotal: todayTasks.length,
            completedCount: completedTasks.length,
            allCompleted: completedTasks.length === todayTasks.length
          });

          // Si toutes les tâches d'aujourd'hui sont complétées
          if (completedTasks.length === todayTasks.length) {
            const { data: existingPerfectDay } = await (supabase
              .from('user_badges') as any)
              .select('id')
              .eq('user_id', userId)
              .eq('date', dateStr)
              .eq('badge_type', 'perfect_day')
              .maybeSingle();

            if (!existingPerfectDay) {
              await (supabase
                .from('user_badges') as any)
                .insert({
                  user_id: userId,
                  date: dateStr,
                  badge_type: 'perfect_day',
                  metadata: {
                    tasks_completed: completedTasks.length,
                    tasks_total: todayTasks.length,
                  },
                });
              console.log('✅ Perfect Day badge created!');
            }
          }
        }

        // Badge EXCEPTIONAL_DAY: Performance exceptionnelle vs moyenne 7 derniers jours
        const sevenDaysAgo = new Date(completionDate);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`;

        const { data: recentCompletions } = await (supabase
          .from('task_completion_times') as any)
          .select('date')
          .eq('user_id', userId)
          .gte('date', sevenDaysAgoStr)
          .lt('date', dateStr);

        if (recentCompletions && recentCompletions.length > 0) {
          // Grouper par date et compter
          const completionsByDate: Record<string, number> = {};
          recentCompletions.forEach((completion: any) => {
            completionsByDate[completion.date] = (completionsByDate[completion.date] || 0) + 1;
          });

          const dailyCounts = Object.values(completionsByDate);
          const average = dailyCounts.reduce((sum, count) => sum + count, 0) / dailyCounts.length;

          // Compter les tâches complétées aujourd'hui
          const { data: todayCompletions } = await (supabase
            .from('task_completion_times') as any)
            .select('id')
            .eq('user_id', userId)
            .eq('date', dateStr);

          const todayCount = todayCompletions?.length || 0;

          if (average > 0) {
            const percentageIncrease = ((todayCount - average) / average) * 100;

            const { getExceptionalDayTier } = await import('@/lib/badges');
            const tier = getExceptionalDayTier(percentageIncrease);

            if (tier) {
              const { data: existingExceptional } = await (supabase
                .from('user_badges') as any)
                .select('id')
                .eq('user_id', userId)
                .eq('date', dateStr)
                .eq('badge_type', tier)
                .maybeSingle();

              if (!existingExceptional) {
                await (supabase
                  .from('user_badges') as any)
                  .insert({
                    user_id: userId,
                    date: dateStr,
                    badge_type: tier,
                    metadata: {
                      tasks_today: todayCount,
                      average_7days: Math.round(average * 10) / 10,
                      percentage_improvement: Math.round(percentageIncrease),
                    },
                  });
              }
            }
          }
        }

        console.log('✅ Task completion and badges recorded for task:', id);
      } catch (completionError) {
        console.error('Error recording task completion:', completionError);
        // Ne pas bloquer la réponse si l'enregistrement échoue
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE delete a task
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await (supabase
      .from('tasks') as any)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
