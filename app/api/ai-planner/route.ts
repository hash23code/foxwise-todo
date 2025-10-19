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
      weatherData, // weather forecast for planning
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

    // Prepare weather context for AI
    const weatherContext = weatherData ? `
**Weather Forecast:**
- Date: ${weatherData.date}
- Temperature: ${weatherData.daily?.temp?.min}°-${weatherData.daily?.temp?.max}°C
- Conditions: ${weatherData.daily?.description}
- Precipitation: ${Math.round(weatherData.daily?.precipitation || 0)}%
- Periods:
  * Morning (6h-12h): ${weatherData.periods?.morning?.temp}°C, ${weatherData.periods?.morning?.description}, ${Math.round(weatherData.periods?.morning?.precipitation || 0)}% rain - ${weatherData.suitable?.morning?.suitable ? 'GOOD for outdoor' : 'BAD weather - indoor preferred'}
  * Afternoon (12h-18h): ${weatherData.periods?.afternoon?.temp}°C, ${weatherData.periods?.afternoon?.description}, ${Math.round(weatherData.periods?.afternoon?.precipitation || 0)}% rain - ${weatherData.suitable?.afternoon?.suitable ? 'GOOD for outdoor' : 'BAD weather - indoor preferred'}
  * Evening (18h-23h): ${weatherData.periods?.evening?.temp}°C, ${weatherData.periods?.evening?.description}, ${Math.round(weatherData.periods?.evening?.precipitation || 0)}% rain - ${weatherData.suitable?.evening?.suitable ? 'GOOD for outdoor' : 'BAD weather - indoor preferred'}

**Weather-based scheduling rules:**
- Schedule outdoor tasks ONLY during periods marked "GOOD for outdoor"
- If task is URGENT priority, schedule regardless of weather (urgent = must be done)
- If ALL periods are BAD weather, schedule outdoor tasks only if URGENT
- Prefer indoor tasks during bad weather periods
- Group outdoor tasks together during good weather windows
` : '';

    const languageInstruction = language === 'fr'
      ? 'Réponds en français (summary et recommendations en français).'
      : 'Respond in English.';

    const prompt = `AI Planner: Create ${planType} schedule for ${startDate}${endDate ? `-${endDate}` : ''}. ${languageInstruction}

**Tasks:**
${JSON.stringify(tasksWithAnalysis.map((t: any) => ({
  id: t.id,
  title: t.title,
  desc: t.description?.substring(0, 80) || '',
  priority: t.priority,
  status: t.status,
  est: t.estimatedHours,
  hist: t.historicalAvgTime,
  cat: t.categoryName,
  tags: t.tags
})), null, 1)}
${weatherContext}
**Constraints:**
- Hours: ${workStartHour}:00-${workEndHour}:00
${breakTimes?.length > 0 ? `- Breaks: ${JSON.stringify(breakTimes)}` : ''}
${preferences ? `- Prefs: ${preferences}` : ''}

**Rules:**
1. Time: Use hist>est>estimate (simple:0.5-1h, med:1-2h, complex:2-4h). In-progress: -30-50%
2. Priority: HIGH/URGENT early (peak energy)
3. Max 6h focus/day, 15-30min buffers
4. Group similar tasks
5. Weather: Outdoor only in good weather UNLESS urgent
6. USE EXACT date ${startDate}

JSON only:
{
  "plan": [{
    "date": "YYYY-MM-DD",
    "tasks": [{
      "taskId": "uuid",
      "startTime": "HH:00",
      "durationHours": 1.5,
      "reasoning": "brief why"
    }]
  }],
  "summary": "strategy",
  "recommendations": ["tip1","tip2"]
}`;

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
          const task: any = tasks.find((t: any) => t.id === plannedTask.taskId);
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
