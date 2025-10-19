import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// GET daily report for a specific date
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json({ error: 'Date parameter is required (YYYY-MM-DD)' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch all tasks for this user with the specified due date
    const { data: tasks, error } = await (supabase
      .from('tasks') as any)
      .select('*, todo_lists(*)')
      .eq('user_id', userId)
      .gte('due_date', `${dateParam}T00:00:00`)
      .lt('due_date', `${dateParam}T23:59:59`);

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate statistics
    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter((t: any) => t.status === 'completed').length || 0;
    const inProgressTasks = tasks?.filter((t: any) => t.status === 'in-progress').length || 0;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate time by category
    const categoryMap = new Map<string, { hours: number; color: string }>();
    tasks?.forEach((task: any) => {
      const categoryName = task.todo_lists?.name || 'Uncategorized';
      const hours = parseFloat(task.estimated_hours) || 0;

      if (categoryMap.has(categoryName)) {
        const existing = categoryMap.get(categoryName)!;
        existing.hours += hours;
      } else {
        // Assign colors based on category name
        const colors = [
          'bg-blue-500',
          'bg-purple-500',
          'bg-green-500',
          'bg-yellow-500',
          'bg-pink-500',
          'bg-indigo-500',
          'bg-teal-500',
          'bg-orange-500',
        ];
        const colorIndex = Array.from(categoryMap.keys()).length % colors.length;
        categoryMap.set(categoryName, { hours, color: colors[colorIndex] });
      }
    });

    const timeByCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      hours: Math.round(data.hours * 10) / 10, // Round to 1 decimal
      color: data.color,
    }));

    // Get top priority tasks
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const topPriorities = tasks
      ?.filter((t: any) => t.priority === 'urgent' || t.priority === 'high')
      .sort((a: any, b: any) =>
        (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) -
        (priorityOrder[b.priority as keyof typeof priorityOrder] || 4)
      )
      .slice(0, 5)
      .map((t: any) => ({
        title: t.title,
        priority: t.priority,
        completed: t.status === 'completed',
      })) || [];

    // Calculate productivity score (0-100)
    // Based on: completion rate (60%), high priority completion (30%), task count (10%)
    const highPriorityTasks = tasks?.filter((t: any) => t.priority === 'urgent' || t.priority === 'high').length || 0;
    const highPriorityCompleted = tasks?.filter((t: any) =>
      (t.priority === 'urgent' || t.priority === 'high') && t.status === 'completed'
    ).length || 0;
    const highPriorityCompletionRate = highPriorityTasks > 0
      ? (highPriorityCompleted / highPriorityTasks) * 100
      : 0;

    const taskCountScore = Math.min(totalTasks * 10, 100); // Max 10 tasks for full score
    const productivity = Math.round(
      (completionRate * 0.6) +
      (highPriorityCompletionRate * 0.3) +
      (taskCountScore * 0.1)
    );

    // Build response
    const dailyReport = {
      date: dateParam,
      totalTasks,
      completedTasks,
      inProgressTasks,
      completionRate,
      timeByCategory,
      topPriorities,
      productivity: Math.min(productivity, 100), // Cap at 100
    };

    return NextResponse.json(dailyReport);
  } catch (error) {
    console.error('Error in GET /api/reports/daily:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
