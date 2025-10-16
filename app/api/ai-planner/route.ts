import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// POST - Generate AI day plan
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      planType, // 'day' or 'week'
      startDate,
      endDate,
      workStartHour,
      workEndHour,
      breakTimes, // array of {start, duration}
      preferences,
      language = 'en', // 'en' or 'fr'
    } = body;

    const supabase = await createClient();

    // 1. Get all pending and in_progress tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*, todo_lists(*)')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: false });

    if (tasksError) {
      return NextResponse.json({ error: tasksError.message }, { status: 500 });
    }

    // 2. Get historical day planner data to analyze actual time spent
    const { data: historicalData, error: historyError } = await supabase
      .from('day_planner')
      .select('*, task:tasks(*)')
      .eq('user_id', userId)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // Last 30 days

    if (historyError) {
      console.error('Error fetching historical data:', historyError);
    }

    // 3. Analyze time accuracy for tasks
    const timeAnalysis: any = {};
    if (historicalData) {
      historicalData.forEach((entry: any) => {
        if (entry.task_id) {
          if (!timeAnalysis[entry.task_id]) {
            timeAnalysis[entry.task_id] = {
              plannedHours: [],
              taskTitle: entry.task?.title || 'Unknown',
            };
          }
          timeAnalysis[entry.task_id].plannedHours.push(entry.duration_hours);
        }
      });
    }

    // 4. Prepare data for AI
    const tasksWithAnalysis = tasks.map((task: any) => {
      const analysis = timeAnalysis[task.id];
      const avgHistoricalTime = analysis
        ? analysis.plannedHours.reduce((a: number, b: number) => a + b, 0) / analysis.plannedHours.length
        : null;

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        estimatedHours: task.estimated_hours,
        category: task.todo_lists?.name,
        dueDate: task.due_date,
        historicalAvgTime: avgHistoricalTime,
        tags: task.tags,
      };
    });

    // 5. Use Gemini AI to generate plan - Using 2.5 Flash model for fast, accurate planning
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const languageInstruction = language === 'fr'
      ? 'IMPORTANT: Respond in French. The "summary" and "recommendations" fields must be in French.'
      : 'IMPORTANT: Respond in English. The "summary" and "recommendations" fields must be in English.';

    const prompt = `You are an AI planning assistant. Create a realistic ${planType} schedule plan.

${languageInstruction}

**CRITICAL: You MUST use exactly the start date provided below. Do not use today's date or any other date.**

**Available tasks:**
${JSON.stringify(tasksWithAnalysis, null, 2)}

**Schedule constraints:**
- Work hours: ${workStartHour}:00 to ${workEndHour}:00
- Plan type: ${planType === 'day' ? 'Single day' : 'Full week'}
- Start date: ${startDate} (USE THIS EXACT DATE - DO NOT CHANGE IT)
${endDate ? `- End date: ${endDate}` : ''}
${breakTimes && breakTimes.length > 0 ? `- Break times: ${JSON.stringify(breakTimes)}` : ''}
${preferences ? `- Additional preferences: ${preferences}` : ''}

**Time estimation rules:**
1. If a task has historicalAvgTime, use that as it's more accurate than estimatedHours
2. If estimatedHours exists but no historicalAvgTime, use estimatedHours
3. If neither exists, estimate based on task complexity and description:
   - Simple tasks (emails, quick updates): 0.5-1 hour
   - Medium tasks (code reviews, meetings, documentation): 1-2 hours
   - Complex tasks (feature development, research, analysis): 2-4 hours
   - Very complex tasks (architecture design, major refactoring): 4-6 hours
4. Tasks marked as "in_progress" may need less time (they're partially done) - reduce estimate by 30-50%
5. High priority tasks should be scheduled earlier in the day when energy is highest
6. Don't overpack - leave 15-30 minute buffer time between tasks for breaks and context switching
7. Respect work hours and break times strictly
8. Consider task dependencies and logical grouping (similar tasks together for efficiency)
9. Account for realistic human productivity - don't schedule more than 6 hours of focused work per day
10. For estimation, consider: task description complexity, technical requirements, and potential unknowns

**Output format (JSON only, no markdown):**
{
  "plan": [
    {
      "date": "YYYY-MM-DD",
      "tasks": [
        {
          "taskId": "uuid",
          "startTime": "HH:00",
          "durationHours": 2,
          "reasoning": "Why this time allocation"
        }
      ]
    }
  ],
  "summary": "Brief explanation of the planning strategy",
  "recommendations": ["tip 1", "tip 2"]
}

Generate a realistic, achievable plan. Return ONLY valid JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResponse = response.text().trim();

    // Clean up response
    if (textResponse.startsWith('```json')) {
      textResponse = textResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (textResponse.startsWith('```')) {
      textResponse = textResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const aiPlan = JSON.parse(textResponse);

    // 6. Force correct dates (in case AI didn't follow instructions)
    if (planType === 'day') {
      // For single day plan, ensure the date is exactly startDate
      if (aiPlan.plan && aiPlan.plan.length > 0) {
        aiPlan.plan[0].date = startDate;
      }
    } else {
      // For week plan, ensure dates are sequential starting from startDate
      if (aiPlan.plan && aiPlan.plan.length > 0) {
        aiPlan.plan.forEach((dayPlan: any, index: number) => {
          const date = new Date(startDate);
          date.setDate(date.getDate() + index);
          dayPlan.date = date.toISOString().split('T')[0];
        });
      }
    }

    // 7. Enhance plan with full task details
    const enhancedPlan = {
      ...aiPlan,
      plan: aiPlan.plan.map((dayPlan: any) => ({
        ...dayPlan,
        tasks: dayPlan.tasks.map((plannedTask: any) => {
          const task = tasks.find((t: any) => t.id === plannedTask.taskId);
          return {
            ...plannedTask,
            task: task ? {
              id: task.id,
              title: task.title,
              description: task.description,
              priority: task.priority,
              status: task.status,
              todo_lists: task.todo_lists,
            } : null,
          };
        }),
      })),
    };

    return NextResponse.json(enhancedPlan);
  } catch (error) {
    console.error('Error in POST /api/ai-planner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Apply the AI plan to day planner
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body; // Array of day plans

    console.log('Received plan with', plan.length, 'days');
    plan.forEach((dayPlan: any, i: number) => {
      console.log(`Day ${i + 1} (${dayPlan.date}): ${dayPlan.tasks.length} tasks`);
    });

    const supabase = await createClient();

    // Insert all planned tasks
    const plannedTasks = plan.flatMap((dayPlan: any) =>
      dayPlan.tasks.map((task: any) => ({
        user_id: userId,
        task_id: task.taskId,
        date: dayPlan.date,
        start_time: task.startTime,
        duration_hours: task.durationHours,
      }))
    );

    console.log('Inserting', plannedTasks.length, 'tasks into day_planner');

    const { data, error } = await supabase
      .from('day_planner')
      .insert(plannedTasks)
      .select();

    if (error) {
      console.error('Error applying plan:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Successfully inserted', data?.length || 0, 'tasks');
    console.log('Inserted task IDs:', data?.map((t: any) => t.id));

    return NextResponse.json({ success: true, applied: data?.length || 0 });
  } catch (error) {
    console.error('Error in PUT /api/ai-planner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
