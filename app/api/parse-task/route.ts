import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@clerk/nextjs/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a task parsing assistant. Parse the following natural language input and extract task details.
Return a JSON object with the following fields:
- title (string, required): The main task title
- description (string, optional): Additional details about the task
- priority (string): One of: "low", "medium", "high", "urgent". Default is "medium"
- due_date (string, optional): ISO 8601 date string if a date/time is mentioned
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
