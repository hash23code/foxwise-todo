import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST parse task details from natural language input
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Fetch user's todo lists to help AI suggest the right category
    const { data: userLists } = await supabase
      .from('todo_lists')
      .select('id, name')
      .eq('user_id', userId)
      .order('position');

    const listsInfo = userLists?.map(l => `- ${l.name} (id: ${l.id})`).join('\n') || 'No lists available';

    // Get current date/time for context
    const now = new Date();
    const currentDateTime = now.toISOString();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an intelligent task parsing assistant. Parse the following natural language input and extract task details.

CURRENT CONTEXT:
- Current Date/Time: ${currentDateTime}
- Day of Week: ${dayOfWeek}
- User's Available Lists/Categories:
${listsInfo}

IMPORTANT DATE/TIME DETECTION RULES (support both French and English):
- "aujourd'hui" / "today" → today's date
- "demain" / "tomorrow" → tomorrow's date
- "lundi" / "Monday", "mardi" / "Tuesday", etc. → next occurrence of that day
- "la semaine prochaine" / "next week" → 7 days from now
- "dans 3 jours" / "in 3 days" → 3 days from now
- "le 25 décembre" / "December 25" → specific date
- TIME DETECTION:
  - "à 14h" / "at 2pm" / "14h30" / "2:30pm" → include time in ISO format
  - "ce matin" / "this morning" → 9:00 AM today
  - "ce soir" / "tonight" / "this evening" → 7:00 PM today
  - "cet après-midi" / "this afternoon" → 2:00 PM today
  - "midi" / "noon" → 12:00 PM
  - "minuit" / "midnight" → 12:00 AM

CATEGORY/LIST DETECTION RULES:
- Analyze the task content and suggest the most appropriate list_id from the user's available lists
- Examples (French/English):
  * "tondre la pelouse" / "mow the lawn" → "Maison" / "Home" category
  * "amener ma famille au zoo" / "take family to zoo" → "Famille" / "Family" category
  * "réunion avec le client" / "meeting with client" → "Travail" / "Work" category
  * "acheter du lait" / "buy milk" → "Courses" / "Shopping" / "Personnel" / "Personal" category
- If a category is explicitly mentioned in the task, use it
- If no good match, leave list_id as null

Return a JSON object with the following fields:
- title (string, required): The main task title (clean, without date/time/category info)
- description (string, optional): Additional details about the task
- priority (string): One of: "low", "medium", "high", "urgent". Default is "medium"
- due_date (string, optional): FULL ISO 8601 datetime string (with time if mentioned) like "2025-10-21T14:30:00"
- due_time (string, optional): Time in HH:MM format if mentioned (e.g., "14:30")
- list_id (string, optional): The ID of the suggested category/list from the user's available lists
- tags (array of strings, optional): Relevant tags extracted from the input
- is_recurring (boolean): Whether this is a recurring task
- recurring_frequency (string, optional): One of: "daily", "weekly", "monthly", "yearly" if recurring

Input: "${text}"

Return ONLY the JSON object, no explanation.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();

    // Clean up the response to ensure it's valid JSON
    let jsonText = textResponse.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    try {
      const parsedTask = JSON.parse(jsonText);

      // Validate required fields
      if (!parsedTask.title) {
        return NextResponse.json({ error: 'Failed to parse task title' }, { status: 400 });
      }

      // Ensure proper defaults
      parsedTask.priority = parsedTask.priority || 'medium';
      parsedTask.is_recurring = parsedTask.is_recurring || false;

      // Validate priority
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(parsedTask.priority)) {
        parsedTask.priority = 'medium';
      }

      // Validate recurring frequency if recurring
      if (parsedTask.is_recurring && parsedTask.recurring_frequency) {
        const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];
        if (!validFrequencies.includes(parsedTask.recurring_frequency)) {
          parsedTask.recurring_frequency = null;
        }
      }

      return NextResponse.json(parsedTask);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Response text:', jsonText);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in POST /api/parse-task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
