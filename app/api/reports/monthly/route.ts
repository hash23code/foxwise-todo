import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// Force dynamic rendering (required for auth)
export const dynamic = 'force-dynamic';

// GET monthly report for a specific month
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!year || !month) {
      return NextResponse.json({ error: 'Year and month parameters are required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Calculate date range for the month
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month
    const endDateStr = `${year}-${month.padStart(2, '0')}-${endDate.getDate()}`;

    // Fetch all tasks for this user in the specified month
    const { data: tasks, error } = await (supabase
      .from('tasks') as any)
      .select('*, todo_lists(*)')
      .eq('user_id', userId)
      .gte('due_date', `${startDate}T00:00:00`)
      .lte('due_date', `${endDateStr}T23:59:59`);

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate monthly statistics
    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter((t: any) => t.status === 'completed').length || 0;
    const averageCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate total hours
    const totalHours = tasks?.reduce((sum: number, task: any) => {
      return sum + (parseFloat(task.estimated_hours) || 0);
    }, 0) || 0;

    // Calculate category breakdown
    const categoryMap = new Map<string, { hours: number; percentage: number; color: string }>();
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

    tasks?.forEach((task: any) => {
      const categoryName = task.todo_lists?.name || 'Uncategorized';
      const hours = parseFloat(task.estimated_hours) || 0;

      if (categoryMap.has(categoryName)) {
        const existing = categoryMap.get(categoryName)!;
        existing.hours += hours;
      } else {
        const colorIndex = Array.from(categoryMap.keys()).length % colors.length;
        categoryMap.set(categoryName, { hours, percentage: 0, color: colors[colorIndex] });
      }
    });

    // Calculate percentages
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      hours: Math.round(data.hours * 10) / 10,
      percentage: totalHours > 0 ? Math.round((data.hours / totalHours) * 100) : 0,
      color: data.color,
    }));

    // Get projects progress (using todo_lists as projects)
    const projectsMap = new Map<string, { total: number; completed: number; color: string }>();
    tasks?.forEach((task: any) => {
      const projectName = task.todo_lists?.name || 'Uncategorized';

      if (projectsMap.has(projectName)) {
        const existing = projectsMap.get(projectName)!;
        existing.total += 1;
        if (task.status === 'completed') {
          existing.completed += 1;
        }
      } else {
        const colorIndex = Array.from(projectsMap.keys()).length % colors.length;
        projectsMap.set(projectName, {
          total: 1,
          completed: task.status === 'completed' ? 1 : 0,
          color: colors[colorIndex],
        });
      }
    });

    const projectsProgress = Array.from(projectsMap.entries()).map(([name, data]) => ({
      name,
      progress: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      color: data.color,
    }));

    // Calculate productivity score
    const highPriorityTasks = tasks?.filter((t: any) => t.priority === 'urgent' || t.priority === 'high').length || 0;
    const highPriorityCompleted = tasks?.filter((t: any) =>
      (t.priority === 'urgent' || t.priority === 'high') && t.status === 'completed'
    ).length || 0;
    const highPriorityCompletionRate = highPriorityTasks > 0
      ? (highPriorityCompleted / highPriorityTasks) * 100
      : 0;

    const taskCountScore = Math.min(totalTasks * 2, 100); // Max 50 tasks for full score
    const productivity = Math.round(
      (averageCompletionRate * 0.6) +
      (highPriorityCompletionRate * 0.3) +
      (taskCountScore * 0.1)
    );

    // Calculate trends (compare with previous month)
    const prevMonth = parseInt(month) === 1 ? 12 : parseInt(month) - 1;
    const prevYear = parseInt(month) === 1 ? parseInt(year) - 1 : parseInt(year);
    const prevStartDate = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-01`;
    const prevEndDate = new Date(prevYear, prevMonth, 0);
    const prevEndDateStr = `${prevYear}-${prevMonth.toString().padStart(2, '0')}-${prevEndDate.getDate()}`;

    const { data: prevTasks } = await (supabase
      .from('tasks') as any)
      .select('*')
      .eq('user_id', userId)
      .gte('due_date', `${prevStartDate}T00:00:00`)
      .lte('due_date', `${prevEndDateStr}T23:59:59`);

    const prevCompletedTasks = prevTasks?.filter((t: any) => t.status === 'completed').length || 0;
    const improvement = completedTasks - prevCompletedTasks;

    // Build response
    const monthlyReport = {
      month: `${year}-${month.padStart(2, '0')}`,
      totalTasks,
      completedTasks,
      averageCompletionRate,
      totalHours: Math.round(totalHours * 10) / 10,
      projectsProgress,
      categoryBreakdown,
      productivity: Math.min(productivity, 100),
      trends: {
        tasksCompleted: completedTasks,
        improvement,
      },
    };

    return NextResponse.json(monthlyReport);
  } catch (error) {
    console.error('Error in GET /api/reports/monthly:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
