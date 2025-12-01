import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { getSpeedDayTier, BADGE_CONFIG } from '@/lib/badges';

// Force cette route à être dynamique car elle utilise auth()
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Vérifier et attribuer les badges de fin de journée
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, check_type } = body; // check_type: '17h' ou 'midnight'

    if (!date || !check_type) {
      return NextResponse.json(
        { error: 'Missing required fields: date, check_type' },
        { status: 400 }
      );
    }

    const badges = [];

    // Vérification à 17h
    if (check_type === '17h') {
      // Badge PERFECT_DAY: toutes les tâches de la journée terminées
      const perfectDayBadge = await checkPerfectDay(userId, date);
      if (perfectDayBadge) badges.push(perfectDayBadge);

      // Badge SPEED_DAY: temps total économisé
      const speedDayBadge = await checkSpeedDay(userId, date);
      if (speedDayBadge) badges.push(speedDayBadge);

      // Badge EXCEPTIONAL: vérifier les performances par rapport à la semaine dernière
      const exceptionalBadges = await checkExceptionalBadges(userId, date);
      badges.push(...exceptionalBadges);
    }

    // Vérification à minuit (déjà géré dans task-completion, mais on peut vérifier si manqué)
    if (check_type === 'midnight') {
      // Vérifier si le badge after_hours a été attribué
      const { data: afterHoursTasks } = await supabase
        .from('task_completion_times')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date)
        .eq('completed_after_hours', true)
        .limit(1);

      if (afterHoursTasks && afterHoursTasks.length > 0) {
        // Vérifier si le badge existe déjà
        const { data: existingBadge } = await supabase
          .from('user_badges')
          .select('id')
          .eq('user_id', userId)
          .eq('date', date)
          .eq('badge_type', 'after_hours')
          .maybeSingle();

        if (!existingBadge) {
          const { data: badge } = await supabase
            .from('user_badges')
            .insert({
              user_id: userId,
              date,
              badge_type: 'after_hours',
              metadata: {},
            })
            .select()
            .single();

          if (badge) badges.push(badge);
        }
      }
    }

    return NextResponse.json({
      badges_earned: badges,
      count: badges.length,
    });

  } catch (error) {
    console.error('Error in POST /api/badges/check-daily:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Vérifier le badge Perfect Day
async function checkPerfectDay(userId: string, date: string) {
  // Récupérer toutes les tâches planifiées pour cette journée
  const { data: plannedTasks } = await supabase
    .from('day_planner')
    .select('task_id')
    .eq('user_id', userId)
    .eq('date', date);

  if (!plannedTasks || plannedTasks.length === 0) {
    return null; // Pas de tâches planifiées = pas de badge
  }

  // Vérifier combien de ces tâches sont complétées
  const taskIds = plannedTasks.map(pt => pt.task_id);
  const { data: completedTasks } = await supabase
    .from('tasks')
    .select('id')
    .in('id', taskIds)
    .eq('status', 'completed');

  // Toutes les tâches planifiées sont-elles complétées?
  if (completedTasks && completedTasks.length === plannedTasks.length) {
    // Vérifier si le badge existe déjà
    const { data: existingBadge } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .eq('badge_type', 'perfect_day')
      .maybeSingle();

    if (existingBadge) {
      return null; // Badge déjà attribué
    }

    // Créer le badge
    const { data: badge } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        date,
        badge_type: 'perfect_day',
        metadata: {
          tasks_completed: completedTasks.length,
          tasks_total: plannedTasks.length,
        },
      })
      .select()
      .single();

    return badge;
  }

  return null;
}

// Vérifier le badge Speed Day
async function checkSpeedDay(userId: string, date: string) {
  // Calculer le temps total économisé
  const { data: completions } = await supabase
    .from('task_completion_times')
    .select('time_saved_minutes')
    .eq('user_id', userId)
    .eq('date', date)
    .not('time_saved_minutes', 'is', null);

  if (!completions || completions.length === 0) {
    return null;
  }

  const totalMinutesSaved = completions.reduce(
    (sum, c) => sum + (c.time_saved_minutes || 0),
    0
  );

  // Déterminer le tier du badge
  const tier = getSpeedDayTier(totalMinutesSaved);

  if (!tier) {
    return null; // Pas assez de temps économisé
  }

  const badgeType = `speed_day_${tier}` as 'speed_day_bronze' | 'speed_day_silver' | 'speed_day_gold';

  // Vérifier si un badge speed_day existe déjà pour cette date
  const { data: existingBadge } = await supabase
    .from('user_badges')
    .select('id, badge_type')
    .eq('user_id', userId)
    .eq('date', date)
    .like('badge_type', 'speed_day_%')
    .maybeSingle();

  if (existingBadge) {
    // Si un badge de tier inférieur existe, le mettre à jour
    const existingTier = existingBadge.badge_type.split('_')[2];
    const tierOrder = { bronze: 1, silver: 2, gold: 3 };

    if (tierOrder[tier as keyof typeof tierOrder] > tierOrder[existingTier as keyof typeof tierOrder]) {
      // Mettre à jour vers un tier supérieur
      await supabase
        .from('user_badges')
        .delete()
        .eq('id', existingBadge.id);
    } else {
      return null; // Badge déjà attribué ou de tier supérieur
    }
  }

  // Créer le badge
  const { data: badge } = await supabase
    .from('user_badges')
    .insert({
      user_id: userId,
      date,
      badge_type: badgeType,
      badge_tier: tier,
      metadata: {
        time_saved_minutes: totalMinutesSaved,
      },
    })
    .select()
    .single();

  return badge;
}

// Vérifier les badges exceptionnels
async function checkExceptionalBadges(userId: string, date: string) {
  const badges = [];

  // Calculer la date d'il y a une semaine
  const currentDate = new Date(date);
  const lastWeekDate = new Date(currentDate);
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeekStr = lastWeekDate.toISOString().split('T')[0];

  // Récupérer les statistiques de cette semaine
  const thisWeekStart = new Date(currentDate);
  thisWeekStart.setDate(thisWeekStart.getDate() - 6); // 7 jours incluant aujourd'hui
  const thisWeekStartStr = thisWeekStart.toISOString().split('T')[0];

  const lastWeekStart = new Date(lastWeekDate);
  lastWeekStart.setDate(lastWeekStart.getDate() - 6);
  const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0];

  // Comparer les tâches pending cette semaine vs semaine dernière
  const { data: thisWeekPending } = await supabase
    .from('tasks')
    .select('id, list_id, todo_lists(name)')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .gte('created_at', thisWeekStartStr);

  const { data: lastWeekPending } = await supabase
    .from('tasks')
    .select('id, list_id, todo_lists(name)')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .gte('created_at', lastWeekStartStr)
    .lte('created_at', lastWeekStr);

  const thisWeekCount = thisWeekPending?.length || 0;
  const lastWeekCount = lastWeekPending?.length || 0;

  // Badge EXCEPTIONAL_GLOBAL: baisse de 20%+ globale
  if (lastWeekCount > 0) {
    const percentageDecrease = ((lastWeekCount - thisWeekCount) / lastWeekCount) * 100;

    if (percentageDecrease >= BADGE_CONFIG.exceptional.threshold_percentage) {
      const { data: existingBadge } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date)
        .eq('badge_type', 'exceptional_global')
        .maybeSingle();

      if (!existingBadge) {
        const { data: badge } = await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            date,
            badge_type: 'exceptional_global',
            metadata: {
              percentage_improvement: Math.round(percentageDecrease),
              tasks_this_week: thisWeekCount,
              tasks_last_week: lastWeekCount,
            },
          })
          .select()
          .single();

        if (badge) badges.push(badge);
      }
    }
  }

  // Badge EXCEPTIONAL_CATEGORY: baisse de 20%+ par catégorie
  // Grouper par catégorie
  const thisWeekByCategory: Record<string, number> = {};
  const lastWeekByCategory: Record<string, number> = {};

  thisWeekPending?.forEach(task => {
    const listId = task.list_id;
    thisWeekByCategory[listId] = (thisWeekByCategory[listId] || 0) + 1;
  });

  lastWeekPending?.forEach(task => {
    const listId = task.list_id;
    lastWeekByCategory[listId] = (lastWeekByCategory[listId] || 0) + 1;
  });

  // Vérifier chaque catégorie
  for (const [listId, lastCount] of Object.entries(lastWeekByCategory)) {
    const thisCount = thisWeekByCategory[listId] || 0;
    const percentageDecrease = ((lastCount - thisCount) / lastCount) * 100;

    if (percentageDecrease >= BADGE_CONFIG.exceptional.threshold_percentage) {
      // Récupérer le nom de la catégorie
      const { data: list } = await supabase
        .from('todo_lists')
        .select('name')
        .eq('id', listId)
        .single();

      const { data: existingBadge } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date)
        .eq('badge_type', 'exceptional_category')
        .eq('metadata->>category_id', listId)
        .maybeSingle();

      if (!existingBadge) {
        const { data: badge } = await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            date,
            badge_type: 'exceptional_category',
            metadata: {
              category_id: listId,
              category_name: list?.name || 'Unknown',
              percentage_improvement: Math.round(percentageDecrease),
              tasks_this_week: thisCount,
              tasks_last_week: lastCount,
            },
          })
          .select()
          .single();

        if (badge) badges.push(badge);
      }
    }
  }

  return badges;
}
