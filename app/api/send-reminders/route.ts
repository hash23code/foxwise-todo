import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key-for-build');

// This endpoint will be called by a cron job to send pending reminders
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a cron job (using a secret token)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const now = new Date();

    // Get all reminders that should be sent (reminder_time <= now and not sent yet)
    const { data: reminders, error: remindersError } = await supabase
      .from('task_reminders')
      .select(`
        *,
        task:tasks (
          id,
          title,
          description,
          due_date,
          priority,
          user_id
        )
      `)
      .eq('is_sent', false)
      .lte('reminder_time', now.toISOString());

    if (remindersError) {
      console.error('Error fetching reminders:', remindersError);
      return NextResponse.json({ error: remindersError.message }, { status: 500 });
    }

    if (!reminders || reminders.length === 0) {
      return NextResponse.json({ message: 'No reminders to send', sent: 0 });
    }

    let sentCount = 0;
    const errors: any[] = [];

    // Process each reminder
    for (const reminderData of reminders) {
      const reminder = reminderData as any;
      try {
        // Get user email from Clerk
        const userResponse = await fetch(`https://api.clerk.com/v1/users/${reminder.task.user_id}`, {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user from Clerk');
        }

        const user = await userResponse.json();
        const userEmail = user.email_addresses?.[0]?.email_address;

        if (!userEmail) {
          throw new Error('User email not found');
        }

        // Send email using Resend
        const { data, error } = await resend.emails.send({
          from: 'FoxWise ToDo <noreply@yourdomain.com>', // Update with your verified domain
          to: [userEmail],
          subject: `Reminder: ${reminder.task.title}`,
          html: generateReminderEmailHTML(reminder.task),
        });

        if (error) {
          throw error;
        }

        // Mark reminder as sent
        await (supabase
          .from('task_reminders') as any)
          .update({ is_sent: true })
          .eq('id', reminder.id);

        sentCount++;
      } catch (error: any) {
        console.error(`Error sending reminder ${reminder.id}:`, error);
        errors.push({
          reminder_id: reminder.id,
          task_id: reminder.task.id,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      message: 'Reminders processed',
      sent: sentCount,
      total: reminders.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in POST /api/send-reminders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Generate HTML email for task reminder
function generateReminderEmailHTML(task: any): string {
  const dueDate = new Date(task.due_date);
  const formattedDate = dueDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const priorityColors: any = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    urgent: '#ef4444',
  };

  const priorityColor = priorityColors[task.priority] || '#6b7280';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task Reminder</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🦊 FoxWise ToDo</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Task Reminder</p>
          </div>

          <!-- Content -->
          <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">You have an upcoming task:</h2>

            <!-- Task Card -->
            <div style="background: #f9fafb; border-left: 4px solid ${priorityColor}; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">${task.title}</h3>

              ${task.description ? `<p style="color: #6b7280; margin: 0 0 15px 0; font-size: 14px; line-height: 1.6;">${task.description}</p>` : ''}

              <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px;">
                <div style="background: white; padding: 8px 12px; border-radius: 6px; font-size: 13px;">
                  <span style="color: #6b7280;">📅 Due:</span>
                  <span style="color: #1f2937; font-weight: 600; margin-left: 5px;">${formattedDate}</span>
                </div>
                <div style="background: ${priorityColor}20; padding: 8px 12px; border-radius: 6px; font-size: 13px;">
                  <span style="color: ${priorityColor}; font-weight: 600; text-transform: uppercase;">${task.priority} Priority</span>
                </div>
              </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard"
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                View in FoxWise ToDo
              </a>
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                You're receiving this because you set a reminder for this task in FoxWise ToDo.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                © 2024 FoxWise ToDo. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
