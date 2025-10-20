import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// POST - Generate AI report
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      reportType, // 'daily', 'weekly', 'monthly'
      periodStart,
      periodEnd,
      categoryFilter, // null for all, or category name
      language = 'en',
    } = body;

    const supabase = await createClient();

    // 1. Fetch tasks for current period
    let query = supabase
      .from('tasks')
      .select('*, todo_lists(*)')
      .eq('user_id', userId)
      .gte('due_date', `${periodStart}T00:00:00`)
      .lte('due_date', `${periodEnd}T23:59:59`);

    const { data: currentTasks, error: currentError } = await (query as any);

    if (currentError) {
      return NextResponse.json({ error: currentError.message }, { status: 500 });
    }

    // Filter by category if specified
    let filteredTasks = currentTasks;
    if (categoryFilter && categoryFilter !== 'all') {
      filteredTasks = currentTasks?.filter((t: any) => t.todo_lists?.name === categoryFilter);
    }

    // 2. Calculate current period statistics
    const stats = calculateStats(filteredTasks || []);

    // 3. Fetch tasks for previous period (for comparison)
    const daysDiff = Math.ceil((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const prevPeriodEnd = new Date(periodStart);
    prevPeriodEnd.setDate(prevPeriodEnd.getDate() - 1);
    const prevPeriodStart = new Date(prevPeriodEnd);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - daysDiff + 1);

    const { data: prevTasks } = await (supabase
      .from('tasks') as any)
      .select('*, todo_lists(*)')
      .eq('user_id', userId)
      .gte('due_date', `${prevPeriodStart.toISOString().split('T')[0]}T00:00:00`)
      .lte('due_date', `${prevPeriodEnd.toISOString().split('T')[0]}T23:59:59`);

    let filteredPrevTasks = prevTasks;
    if (categoryFilter && categoryFilter !== 'all') {
      filteredPrevTasks = prevTasks?.filter((t: any) => t.todo_lists?.name === categoryFilter);
    }

    const prevStats = calculateStats(filteredPrevTasks || []);

    // 4. Calculate comparison
    const comparison = {
      tasksDiff: stats.totalTasks - prevStats.totalTasks,
      tasksPercentChange: prevStats.totalTasks > 0
        ? Math.round(((stats.totalTasks - prevStats.totalTasks) / prevStats.totalTasks) * 100)
        : 0,
      completionDiff: stats.completionRate - prevStats.completionRate,
      hoursDiff: stats.totalHours - prevStats.totalHours,
      hoursPercentChange: prevStats.totalHours > 0
        ? Math.round(((stats.totalHours - prevStats.totalHours) / prevStats.totalHours) * 100)
        : 0,
      productivityDiff: stats.productivity - prevStats.productivity,
    };

    // 5. Prepare data for charts
    const chartsData = {
      categoryBreakdown: stats.categoryBreakdown,
      priorityDistribution: stats.priorityDistribution,
      completionTrend: {
        current: stats.completionRate,
        previous: prevStats.completionRate,
      },
      timeDistribution: stats.timeByCategory,
    };

    // 6. Use AI to generate analysis and recommendations
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const aiPrompt = language === 'fr' ? `
Tu es un assistant d'analyse de productivité. Génère un rapport détaillé en français basé sur ces données:

**Période:** ${periodStart} à ${periodEnd} (${reportType})
${categoryFilter && categoryFilter !== 'all' ? `**Catégorie:** ${categoryFilter}` : '**Toutes les catégories**'}

**Statistiques actuelles:**
- Tâches totales: ${stats.totalTasks}
- Tâches complétées: ${stats.completedTasks}
- Taux de complétion: ${stats.completionRate}%
- Heures totales: ${stats.totalHours}h
- Score de productivité: ${stats.productivity}/100

**Comparaison avec période précédente:**
- Tâches: ${comparison.tasksDiff >= 0 ? '+' : ''}${comparison.tasksDiff} (${comparison.tasksPercentChange >= 0 ? '+' : ''}${comparison.tasksPercentChange}%)
- Taux de complétion: ${comparison.completionDiff >= 0 ? '+' : ''}${comparison.completionDiff}%
- Heures: ${comparison.hoursDiff >= 0 ? '+' : ''}${comparison.hoursDiff}h (${comparison.hoursPercentChange >= 0 ? '+' : ''}${comparison.hoursPercentChange}%)
- Productivité: ${comparison.productivityDiff >= 0 ? '+' : ''}${comparison.productivityDiff} points

**Répartition par catégorie:**
${stats.categoryBreakdown.map((cat: any) => `- ${cat.category}: ${cat.hours}h (${cat.percentage}%)`).join('\n')}

**Répartition par priorité:**
${Object.entries(stats.priorityDistribution).map(([priority, data]: [string, any]) =>
  `- ${priority.toUpperCase()}: ${data.count} tâches (${data.completed} complétées)`
).join('\n')}

Génère un rapport en JSON avec exactement cette structure:
{
  "summary": "Résumé en 2-3 phrases des performances",
  "analysis": "Analyse détaillée en 4-5 paragraphes couvrant:\n1. Performance globale\n2. Points forts\n3. Points à améliorer\n4. Tendances observées",
  "recommendations": [
    {
      "title": "Titre court",
      "description": "Description détaillée",
      "priority": "high|medium|low",
      "impact": "Description de l'impact"
    }
  ]
}

**Important:**
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après
- Sois spécifique et actionnable dans les recommandations
- Base ton analyse sur les données fournies
- Identifie des patterns et tendances concrètes
` : `
You are a productivity analysis assistant. Generate a detailed report in English based on this data:

**Period:** ${periodStart} to ${periodEnd} (${reportType})
${categoryFilter && categoryFilter !== 'all' ? `**Category:** ${categoryFilter}` : '**All categories**'}

**Current Statistics:**
- Total tasks: ${stats.totalTasks}
- Completed tasks: ${stats.completedTasks}
- Completion rate: ${stats.completionRate}%
- Total hours: ${stats.totalHours}h
- Productivity score: ${stats.productivity}/100

**Comparison with previous period:**
- Tasks: ${comparison.tasksDiff >= 0 ? '+' : ''}${comparison.tasksDiff} (${comparison.tasksPercentChange >= 0 ? '+' : ''}${comparison.tasksPercentChange}%)
- Completion rate: ${comparison.completionDiff >= 0 ? '+' : ''}${comparison.completionDiff}%
- Hours: ${comparison.hoursDiff >= 0 ? '+' : ''}${comparison.hoursDiff}h (${comparison.hoursPercentChange >= 0 ? '+' : ''}${comparison.hoursPercentChange}%)
- Productivity: ${comparison.productivityDiff >= 0 ? '+' : ''}${comparison.productivityDiff} points

**Category breakdown:**
${stats.categoryBreakdown.map((cat: any) => `- ${cat.category}: ${cat.hours}h (${cat.percentage}%)`).join('\n')}

**Priority distribution:**
${Object.entries(stats.priorityDistribution).map(([priority, data]: [string, any]) =>
  `- ${priority.toUpperCase()}: ${data.count} tasks (${data.completed} completed)`
).join('\n')}

Generate a report in JSON with exactly this structure:
{
  "summary": "2-3 sentence summary of performance",
  "analysis": "Detailed analysis in 4-5 paragraphs covering:\n1. Overall performance\n2. Strengths\n3. Areas for improvement\n4. Observed trends",
  "recommendations": [
    {
      "title": "Short title",
      "description": "Detailed description",
      "priority": "high|medium|low",
      "impact": "Impact description"
    }
  ]
}

**Important:**
- Respond ONLY with JSON, no text before or after
- Be specific and actionable in recommendations
- Base your analysis on the provided data
- Identify concrete patterns and trends
`;

    const result = await model.generateContent(aiPrompt);
    const response = await result.response;
    let textResponse = response.text().trim();

    // Clean up response
    if (textResponse.startsWith('```json')) {
      textResponse = textResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (textResponse.startsWith('```')) {
      textResponse = textResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const aiReport = JSON.parse(textResponse);

    // 7. Save report to database
    const reportData = {
      user_id: userId,
      report_type: reportType,
      period_start: periodStart,
      period_end: periodEnd,
      category_filter: categoryFilter || null,
      title: language === 'fr'
        ? `Rapport ${reportType === 'daily' ? 'Quotidien' : reportType === 'weekly' ? 'Hebdomadaire' : 'Mensuel'} - ${periodStart}`
        : `${reportType === 'daily' ? 'Daily' : reportType === 'weekly' ? 'Weekly' : 'Monthly'} Report - ${periodStart}`,
      summary: aiReport.summary,
      ai_analysis: aiReport.analysis,
      recommendations: aiReport.recommendations,
      comparison,
      stats,
      charts_data: chartsData,
    };

    const { data: savedReport, error: saveError } = await (supabase
      .from('ai_reports') as any)
      .insert([reportData])
      .select()
      .single();

    if (saveError) {
      console.error('Error saving report:', saveError);
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json(savedReport);
  } catch (error) {
    console.error('Error in POST /api/ai-reports/generate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to calculate statistics
function calculateStats(tasks: any[]) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate total hours
  const totalHours = tasks.reduce((sum: number, task: any) => {
    return sum + (parseFloat(task.estimated_hours) || 0);
  }, 0);

  // Category breakdown
  const categoryMap = new Map<string, number>();
  tasks.forEach((task: any) => {
    const categoryName = task.todo_lists?.name || 'Uncategorized';
    const hours = parseFloat(task.estimated_hours) || 0;
    categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + hours);
  });

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, hours]) => ({
      category,
      hours: Math.round(hours * 10) / 10,
      percentage: totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0,
    }))
    .sort((a, b) => b.hours - a.hours);

  // Priority distribution
  const priorityDistribution: any = {};
  ['urgent', 'high', 'medium', 'low'].forEach(priority => {
    const tasksOfPriority = tasks.filter((t: any) => t.priority === priority);
    priorityDistribution[priority] = {
      count: tasksOfPriority.length,
      completed: tasksOfPriority.filter((t: any) => t.status === 'completed').length,
    };
  });

  // Time by category (for charts)
  const timeByCategory = categoryBreakdown.map(cat => ({
    name: cat.category,
    value: cat.hours,
  }));

  // Productivity score
  const highPriorityTasks = tasks.filter((t: any) => t.priority === 'urgent' || t.priority === 'high').length;
  const highPriorityCompleted = tasks.filter((t: any) =>
    (t.priority === 'urgent' || t.priority === 'high') && t.status === 'completed'
  ).length;
  const highPriorityCompletionRate = highPriorityTasks > 0
    ? (highPriorityCompleted / highPriorityTasks) * 100
    : 0;
  const taskCountScore = Math.min(totalTasks * 2, 100);
  const productivity = Math.round(
    (completionRate * 0.6) + (highPriorityCompletionRate * 0.3) + (taskCountScore * 0.1)
  );

  return {
    totalTasks,
    completedTasks,
    completionRate,
    totalHours: Math.round(totalHours * 10) / 10,
    categoryBreakdown,
    priorityDistribution,
    timeByCategory,
    productivity,
  };
}
