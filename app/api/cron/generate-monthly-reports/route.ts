import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key-for-build');

// This endpoint will be called by a cron job on the 1st of each month at 23:00 to generate monthly reports
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron (using authorization header)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get previous month's date range
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = previousMonth.getFullYear();
    const month = previousMonth.getMonth() + 1; // JavaScript months are 0-indexed

    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0); // Last day of previous month
    const endDateStr = `${year}-${month.toString().padStart(2, '0')}-${endDate.getDate()}`;

    // Get all unique user IDs who have tasks in the previous month
    const { data: users, error: usersError } = await (supabase
      .from('tasks') as any)
      .select('user_id')
      .gte('due_date', `${startDate}T00:00:00`)
      .lte('due_date', `${endDateStr}T23:59:59`);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    // Get unique user IDs
    const uniqueUserIds = Array.from(new Set(users?.map((u: any) => u.user_id) || []));

    if (uniqueUserIds.length === 0) {
      return NextResponse.json({ message: 'No users with tasks last month', sent: 0 });
    }

    let sentCount = 0;
    const errors: any[] = [];

    // Generate and send report for each user
    for (const userId of uniqueUserIds) {
      try {
        // Get user settings to check if they want monthly reports
        // TODO: Add monthly_report_enabled and monthly_report_email fields to user_settings table
        const { data: settings } = await (supabase
          .from('user_settings') as any)
          .select('*')
          .eq('user_id', userId)
          .single();

        // For now, we'll send to all users. Later, check: settings?.monthly_report_enabled
        // Skip if user has disabled monthly reports (when field is added)
        // if (!settings?.monthly_report_enabled) continue;

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

        // Generate monthly report data
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

        // Get user's preferred language (default to 'en')
        const language = settings?.language || 'en';

        // Get month name
        const monthName = previousMonth.toLocaleDateString(
          language === 'fr' ? 'fr-FR' : 'en-US',
          { month: 'long', year: 'numeric' }
        );

        // Send email (only if email option is enabled - when field is added)
        // For now, send to everyone
        const { error: emailError } = await resend.emails.send({
          from: 'FoxWise ToDo <noreply@yourdomain.com>', // Update with your verified domain
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

    return NextResponse.json({
      message: 'Monthly reports processed',
      sent: sentCount,
      total: uniqueUserIds.length,
      month: `${year}-${month.toString().padStart(2, '0')}`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in GET /api/cron/generate-monthly-reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    return '#f97316'; // orange
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
