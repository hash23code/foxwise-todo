import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key-for-build');

// Force dynamic rendering (required for cron)
export const dynamic = 'force-dynamic';

// Combined endpoint - generates daily reports (and monthly on 1st of month)
// This runs daily at 23:00 via Vercel Cron
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const today = new Date();
    const isFirstOfMonth = today.getDate() === 1;

    let dailyResult = null;
    let monthlyResult = null;

    // ALWAYS generate daily reports
    dailyResult = await generateDailyReports(supabase, today);

    // If it's the 1st of the month, also generate monthly reports
    if (isFirstOfMonth) {
      monthlyResult = await generateMonthlyReports(supabase, today);
    }

    return NextResponse.json({
      message: isFirstOfMonth ? 'Daily and monthly reports processed' : 'Daily reports processed',
      daily: dailyResult,
      monthly: monthlyResult,
      date: today.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Error in GET /api/cron/generate-reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Generate daily reports for all users
async function generateDailyReports(supabase: any, today: Date) {
  const dateStr = today.toISOString().split('T')[0];

  // Get all unique user IDs who have tasks today
  const { data: users, error: usersError } = await (supabase
    .from('tasks') as any)
    .select('user_id')
    .gte('due_date', `${dateStr}T00:00:00`)
    .lt('due_date', `${dateStr}T23:59:59`);

  if (usersError) {
    console.error('Error fetching users for daily reports:', usersError);
    return { error: usersError.message };
  }

  const uniqueUserIds = Array.from(new Set(users?.map((u: any) => u.user_id) || []));

  if (uniqueUserIds.length === 0) {
    return { message: 'No users with tasks today', sent: 0 };
  }

  let sentCount = 0;
  const errors: any[] = [];

  for (const userId of uniqueUserIds) {
    try {
      const { data: settings } = await (supabase
        .from('user_settings') as any)
        .select('*')
        .eq('user_id', userId)
        .single();

      // Fetch user email from Clerk
      const userResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user ${userId} from Clerk`);
      }

      const user = await userResponse.json();
      const userEmail = user.email_addresses?.[0]?.email_address;

      if (!userEmail) {
        throw new Error(`User ${userId} email not found`);
      }

      // Get tasks for today
      const { data: tasks } = await (supabase
        .from('tasks') as any)
        .select('*, todo_lists(*)')
        .eq('user_id', userId)
        .gte('due_date', `${dateStr}T00:00:00`)
        .lt('due_date', `${dateStr}T23:59:59`);

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter((t: any) => t.status === 'completed').length || 0;
      const inProgressTasks = tasks?.filter((t: any) => t.status === 'in-progress').length || 0;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Calculate productivity score
      const highPriorityTasks = tasks?.filter((t: any) => t.priority === 'urgent' || t.priority === 'high').length || 0;
      const highPriorityCompleted = tasks?.filter((t: any) =>
        (t.priority === 'urgent' || t.priority === 'high') && t.status === 'completed'
      ).length || 0;
      const highPriorityCompletionRate = highPriorityTasks > 0
        ? (highPriorityCompleted / highPriorityTasks) * 100
        : 0;
      const taskCountScore = Math.min(totalTasks * 10, 100);
      const productivity = Math.round(
        (completionRate * 0.6) + (highPriorityCompletionRate * 0.3) + (taskCountScore * 0.1)
      );

      const language = settings?.language || 'en';

      // Send email
      const { error: emailError } = await resend.emails.send({
        from: 'FoxWise ToDo <noreply@yourdomain.com>',
        to: [userEmail],
        subject: language === 'fr'
          ? `📊 Votre Rapport Quotidien - ${new Date(dateStr).toLocaleDateString('fr-FR')}`
          : `📊 Your Daily Report - ${new Date(dateStr).toLocaleDateString('en-US')}`,
        html: generateDailyReportEmailHTML({
          date: dateStr,
          totalTasks,
          completedTasks,
          inProgressTasks,
          completionRate,
          productivity,
          language,
          userName: user.first_name || 'there',
        }),
      });

      if (emailError) {
        throw emailError;
      }

      sentCount++;
    } catch (error: any) {
      console.error(`Error generating daily report for user ${userId}:`, error);
      errors.push({
        user_id: userId,
        error: error.message,
      });
    }
  }

  return {
    message: 'Daily reports processed',
    sent: sentCount,
    total: uniqueUserIds.length,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Generate monthly reports for all users
async function generateMonthlyReports(supabase: any, today: Date) {
  // Get previous month's date range
  const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const year = previousMonth.getFullYear();
  const month = previousMonth.getMonth() + 1;

  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0);
  const endDateStr = `${year}-${month.toString().padStart(2, '0')}-${endDate.getDate()}`;

  // Get all unique user IDs who have tasks in the previous month
  const { data: users, error: usersError } = await (supabase
    .from('tasks') as any)
    .select('user_id')
    .gte('due_date', `${startDate}T00:00:00`)
    .lte('due_date', `${endDateStr}T23:59:59`);

  if (usersError) {
    console.error('Error fetching users for monthly reports:', usersError);
    return { error: usersError.message };
  }

  const uniqueUserIds = Array.from(new Set(users?.map((u: any) => u.user_id) || []));

  if (uniqueUserIds.length === 0) {
    return { message: 'No users with tasks last month', sent: 0 };
  }

  let sentCount = 0;
  const errors: any[] = [];

  for (const userId of uniqueUserIds) {
    try {
      const { data: settings } = await (supabase
        .from('user_settings') as any)
        .select('*')
        .eq('user_id', userId)
        .single();

      // Fetch user email from Clerk
      const userResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user ${userId} from Clerk`);
      }

      const user = await userResponse.json();
      const userEmail = user.email_addresses?.[0]?.email_address;

      if (!userEmail) {
        throw new Error(`User ${userId} email not found`);
      }

      // Get tasks for the month
      const { data: tasks } = await (supabase
        .from('tasks') as any)
        .select('*, todo_lists(*)')
        .eq('user_id', userId)
        .gte('due_date', `${startDate}T00:00:00`)
        .lte('due_date', `${endDateStr}T23:59:59`);

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter((t: any) => t.status === 'completed').length || 0;
      const averageCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Calculate total hours
      const totalHours = tasks?.reduce((sum: number, task: any) => {
        return sum + (parseFloat(task.estimated_hours) || 0);
      }, 0) || 0;

      // Calculate productivity score
      const highPriorityTasks = tasks?.filter((t: any) => t.priority === 'urgent' || t.priority === 'high').length || 0;
      const highPriorityCompleted = tasks?.filter((t: any) =>
        (t.priority === 'urgent' || t.priority === 'high') && t.status === 'completed'
      ).length || 0;
      const highPriorityCompletionRate = highPriorityTasks > 0
        ? (highPriorityCompleted / highPriorityTasks) * 100
        : 0;
      const taskCountScore = Math.min(totalTasks * 2, 100);
      const productivity = Math.round(
        (averageCompletionRate * 0.6) + (highPriorityCompletionRate * 0.3) + (taskCountScore * 0.1)
      );

      // Calculate category breakdown
      const categoryMap = new Map<string, number>();
      tasks?.forEach((task: any) => {
        const categoryName = task.todo_lists?.name || 'Uncategorized';
        const hours = parseFloat(task.estimated_hours) || 0;
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + hours);
      });

      const topCategories = Array.from(categoryMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, hours]) => ({
          category,
          hours: Math.round(hours * 10) / 10,
          percentage: totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0,
        }));

      const language = settings?.language || 'en';

      const monthName = previousMonth.toLocaleDateString(
        language === 'fr' ? 'fr-FR' : 'en-US',
        { month: 'long', year: 'numeric' }
      );

      // Send email
      const { error: emailError } = await resend.emails.send({
        from: 'FoxWise ToDo <noreply@yourdomain.com>',
        to: [userEmail],
        subject: language === 'fr'
          ? `📊 Votre Rapport Mensuel - ${monthName}`
          : `📊 Your Monthly Report - ${monthName}`,
        html: generateMonthlyReportEmailHTML({
          month: monthName,
          totalTasks,
          completedTasks,
          averageCompletionRate,
          totalHours,
          productivity,
          topCategories,
          language,
          userName: user.first_name || 'there',
        }),
      });

      if (emailError) {
        throw emailError;
      }

      sentCount++;
    } catch (error: any) {
      console.error(`Error generating monthly report for user ${userId}:`, error);
      errors.push({
        user_id: userId,
        error: error.message,
      });
    }
  }

  return {
    message: 'Monthly reports processed',
    sent: sentCount,
    total: uniqueUserIds.length,
    month: `${year}-${month.toString().padStart(2, '0')}`,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Generate HTML email for daily report
function generateDailyReportEmailHTML(data: {
  date: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  completionRate: number;
  productivity: number;
  language: string;
  userName: string;
}): string {
  const formattedDate = new Date(data.date).toLocaleDateString(
    data.language === 'fr' ? 'fr-FR' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  const getProductivityColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#f97316';
  };

  const productivityColor = getProductivityColor(data.productivity);

  const t = data.language === 'fr' ? {
    greeting: `Bonjour ${data.userName}`,
    title: 'Votre Rapport Quotidien',
    subtitle: `Résumé de votre journée du ${formattedDate}`,
    totalTasks: 'Tâches Totales',
    completed: 'Complétées',
    inProgress: 'En Cours',
    completionRate: 'Taux de Complétion',
    productivity: 'Score de Productivité',
    viewDashboard: 'Voir le Dashboard',
    footer: 'Vous recevez cet email car vous avez activé les rapports quotidiens dans FoxWise ToDo.',
    copyright: '© 2024 FoxWise ToDo. Tous droits réservés.',
  } : {
    greeting: `Hello ${data.userName}`,
    title: 'Your Daily Report',
    subtitle: `Summary of your day on ${formattedDate}`,
    totalTasks: 'Total Tasks',
    completed: 'Completed',
    inProgress: 'In Progress',
    completionRate: 'Completion Rate',
    productivity: 'Productivity Score',
    viewDashboard: 'View Dashboard',
    footer: 'You\'re receiving this because you enabled daily reports in FoxWise ToDo.',
    copyright: '© 2024 FoxWise ToDo. All rights reserved.',
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t.title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🦊 FoxWise ToDo</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">${t.title}</p>
          </div>

          <!-- Content -->
          <div style="background: #1a1a1a; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
            <h2 style="color: #ffffff; margin: 0 0 10px 0; font-size: 20px;">${t.greeting}! 👋</h2>
            <p style="color: #9ca3af; margin: 0 0 30px 0; font-size: 14px;">${t.subtitle}</p>

            <!-- Stats Grid -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px;">
              <!-- Total Tasks -->
              <div style="background: #2a2a2a; padding: 20px; border-radius: 12px; border-left: 4px solid #14b8a6;">
                <p style="color: #9ca3af; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">${t.totalTasks}</p>
                <p style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">${data.totalTasks}</p>
              </div>

              <!-- Completed -->
              <div style="background: #2a2a2a; padding: 20px; border-radius: 12px; border-left: 4px solid #10b981;">
                <p style="color: #9ca3af; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">${t.completed}</p>
                <p style="color: #10b981; margin: 0; font-size: 28px; font-weight: bold;">${data.completedTasks}</p>
              </div>

              <!-- In Progress -->
              <div style="background: #2a2a2a; padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
                <p style="color: #9ca3af; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">${t.inProgress}</p>
                <p style="color: #f59e0b; margin: 0; font-size: 28px; font-weight: bold;">${data.inProgressTasks}</p>
              </div>

              <!-- Completion Rate -->
              <div style="background: #2a2a2a; padding: 20px; border-radius: 12px; border-left: 4px solid #06b6d4;">
                <p style="color: #9ca3af; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">${t.completionRate}</p>
                <p style="color: #06b6d4; margin: 0; font-size: 28px; font-weight: bold;">${data.completionRate}%</p>
              </div>
            </div>

            <!-- Productivity Score -->
            <div style="background: linear-gradient(135deg, ${productivityColor}22 0%, ${productivityColor}11 100%); padding: 25px; border-radius: 12px; border: 2px solid ${productivityColor}; margin-bottom: 30px;">
              <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">${t.productivity}</p>
              <div style="display: flex; align-items: center; gap: 15px;">
                <p style="color: ${productivityColor}; margin: 0; font-size: 48px; font-weight: bold;">${data.productivity}</p>
                <div style="flex: 1; background: #2a2a2a; height: 12px; border-radius: 6px; overflow: hidden;">
                  <div style="background: ${productivityColor}; height: 100%; width: ${data.productivity}%; border-radius: 6px;"></div>
                </div>
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard"
                 style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.3);">
                ${t.viewDashboard} →
              </a>
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #2a2a2a; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                ${t.footer}
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">
                ${t.copyright}
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Generate HTML email for monthly report
function generateMonthlyReportEmailHTML(data: {
  month: string;
  totalTasks: number;
  completedTasks: number;
  averageCompletionRate: number;
  totalHours: number;
  productivity: number;
  topCategories: Array<{ category: string; hours: number; percentage: number }>;
  language: string;
  userName: string;
}): string {
  const getProductivityColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#f97316';
  };

  const productivityColor = getProductivityColor(data.productivity);

  const t = data.language === 'fr' ? {
    greeting: `Bonjour ${data.userName}`,
    title: 'Votre Rapport Mensuel',
    subtitle: `Récapitulatif de votre mois de ${data.month}`,
    totalTasks: 'Tâches Totales',
    completed: 'Complétées',
    completionRate: 'Taux de Complétion',
    totalHours: 'Heures Totales',
    productivity: 'Score de Productivité',
    topCategories: 'Top Catégories',
    hours: 'heures',
    viewReports: 'Voir les Rapports',
    footer: 'Vous recevez cet email car vous avez activé les rapports mensuels dans FoxWise ToDo.',
    copyright: '© 2024 FoxWise ToDo. Tous droits réservés.',
  } : {
    greeting: `Hello ${data.userName}`,
    title: 'Your Monthly Report',
    subtitle: `Summary of ${data.month}`,
    totalTasks: 'Total Tasks',
    completed: 'Completed',
    completionRate: 'Completion Rate',
    totalHours: 'Total Hours',
    productivity: 'Productivity Score',
    topCategories: 'Top Categories',
    hours: 'hours',
    viewReports: 'View Reports',
    footer: 'You\'re receiving this because you enabled monthly reports in FoxWise ToDo.',
    copyright: '© 2024 FoxWise ToDo. All rights reserved.',
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t.title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🦊 FoxWise ToDo</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">${t.title}</p>
          </div>

          <!-- Content -->
          <div style="background: #1a1a1a; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
            <h2 style="color: #ffffff; margin: 0 0 10px 0; font-size: 20px;">${t.greeting}! 🎉</h2>
            <p style="color: #9ca3af; margin: 0 0 30px 0; font-size: 14px;">${t.subtitle}</p>

            <!-- Stats Grid -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px;">
              <!-- Total Tasks -->
              <div style="background: #2a2a2a; padding: 20px; border-radius: 12px; border-left: 4px solid #8b5cf6;">
                <p style="color: #9ca3af; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">${t.totalTasks}</p>
                <p style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">${data.totalTasks}</p>
              </div>

              <!-- Completed -->
              <div style="background: #2a2a2a; padding: 20px; border-radius: 12px; border-left: 4px solid #10b981;">
                <p style="color: #9ca3af; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">${t.completed}</p>
                <p style="color: #10b981; margin: 0; font-size: 28px; font-weight: bold;">${data.completedTasks}</p>
              </div>

              <!-- Completion Rate -->
              <div style="background: #2a2a2a; padding: 20px; border-radius: 12px; border-left: 4px solid #06b6d4;">
                <p style="color: #9ca3af; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">${t.completionRate}</p>
                <p style="color: #06b6d4; margin: 0; font-size: 28px; font-weight: bold;">${data.averageCompletionRate}%</p>
              </div>

              <!-- Total Hours -->
              <div style="background: #2a2a2a; padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
                <p style="color: #9ca3af; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">${t.totalHours}</p>
                <p style="color: #f59e0b; margin: 0; font-size: 28px; font-weight: bold;">${data.totalHours.toFixed(1)}</p>
              </div>
            </div>

            <!-- Productivity Score -->
            <div style="background: linear-gradient(135deg, ${productivityColor}22 0%, ${productivityColor}11 100%); padding: 25px; border-radius: 12px; border: 2px solid ${productivityColor}; margin-bottom: 30px;">
              <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">${t.productivity}</p>
              <div style="display: flex; align-items: center; gap: 15px;">
                <p style="color: ${productivityColor}; margin: 0; font-size: 48px; font-weight: bold;">${data.productivity}</p>
                <div style="flex: 1; background: #2a2a2a; height: 12px; border-radius: 6px; overflow: hidden;">
                  <div style="background: ${productivityColor}; height: 100%; width: ${data.productivity}%; border-radius: 6px;"></div>
                </div>
              </div>
            </div>

            <!-- Top Categories -->
            ${data.topCategories.length > 0 ? `
              <div style="background: #2a2a2a; padding: 25px; border-radius: 12px; margin-bottom: 30px;">
                <p style="color: #ffffff; margin: 0 0 20px 0; font-size: 16px; font-weight: 600;">${t.topCategories}</p>
                ${data.topCategories.map((cat, index) => {
                  const colors = ['#8b5cf6', '#ec4899', '#14b8a6'];
                  const color = colors[index] || '#6b7280';
                  return `
                    <div style="margin-bottom: ${index < data.topCategories.length - 1 ? '15px' : '0'};">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #ffffff; font-size: 14px;">${cat.category}</span>
                        <span style="color: ${color}; font-size: 14px; font-weight: 600;">${cat.hours} ${t.hours} (${cat.percentage}%)</span>
                      </div>
                      <div style="background: #1a1a1a; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: ${color}; height: 100%; width: ${cat.percentage}%; border-radius: 4px;"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}

            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reports"
                 style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">
                ${t.viewReports} →
              </a>
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #2a2a2a; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                ${t.footer}
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">
                ${t.copyright}
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
