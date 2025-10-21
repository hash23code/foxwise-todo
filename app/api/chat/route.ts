import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Define function tools that the AI can use
const tools = [
  {
    functionDeclarations: [
      {
        name: 'create_task',
        description: 'Create a new task for the user',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'The title/name of the task',
            },
            description: {
              type: 'string',
              description: 'Detailed description of the task (optional)',
            },
            priority: {
              type: 'string',
              description: 'Priority level: low, medium, or high',
              enum: ['low', 'medium', 'high'],
            },
            due_date: {
              type: 'string',
              description: 'Due date in YYYY-MM-DD format (optional)',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'list_tasks',
        description: 'List all tasks for the user, optionally filtered by status or date',
        parameters: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Filter by status: pending, in_progress, completed, or all',
              enum: ['pending', 'in_progress', 'completed', 'all'],
            },
            date: {
              type: 'string',
              description: 'Filter by specific date in YYYY-MM-DD format (optional)',
            },
          },
          required: [],
        },
      },
      {
        name: 'update_task',
        description: 'Update an existing task (title, status, priority, etc.)',
        parameters: {
          type: 'object',
          properties: {
            task_id: {
              type: 'string',
              description: 'The UUID of the task to update',
            },
            title: {
              type: 'string',
              description: 'New title for the task (optional)',
            },
            status: {
              type: 'string',
              description: 'New status: pending, in_progress, or completed',
              enum: ['pending', 'in_progress', 'completed'],
            },
            priority: {
              type: 'string',
              description: 'New priority: low, medium, or high',
              enum: ['low', 'medium', 'high'],
            },
          },
          required: ['task_id'],
        },
      },
      {
        name: 'delete_task',
        description: 'Delete a task permanently',
        parameters: {
          type: 'object',
          properties: {
            task_id: {
              type: 'string',
              description: 'The UUID of the task to delete',
            },
          },
          required: ['task_id'],
        },
      },
      {
        name: 'get_today_schedule',
        description: 'Get the schedule/day planner for today or a specific date',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format (optional, defaults to today)',
            },
          },
          required: [],
        },
      },
    ],
  },
];

// Function implementations
async function createTask(userId: string, params: any) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: params.title,
      description: params.description || null,
      priority: params.priority || 'medium',
      due_date: params.due_date || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, task: data };
}

async function listTasks(userId: string, params: any) {
  const supabase = await createClient();

  let query = supabase
    .from('tasks')
    .select('*, todo_lists(*)')
    .eq('user_id', userId);

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  if (params.date) {
    query = query.eq('due_date', params.date);
  }

  query = query.order('created_at', { ascending: false }).limit(20);

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, tasks: data };
}

async function updateTask(userId: string, params: any) {
  const supabase = await createClient();

  const updates: any = {};
  if (params.title) updates.title = params.title;
  if (params.status) updates.status = params.status;
  if (params.priority) updates.priority = params.priority;

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', params.task_id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, task: data };
}

async function deleteTask(userId: string, params: any) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', params.task_id)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function getTodaySchedule(userId: string, params: any) {
  const supabase = await createClient();
  const date = params.date || new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('day_planner')
    .select('*, task:tasks(*)')
    .eq('user_id', userId)
    .eq('date', date)
    .order('start_time', { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, schedule: data, date };
}

// POST - Chat with AI assistant
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, history = [] } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Initialize the model with function calling
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      tools,
    });

    // Build conversation history
    const chatHistory = history.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    // Add system context
    const contextMessage = `You are a helpful AI assistant for FoxWise ToDo, a task management application.
You can help users create tasks, view their tasks, update them, delete them, and check their daily schedule.
Be friendly, concise, and helpful. Always confirm when you've completed an action.
Current date: ${new Date().toISOString().split('T')[0]}
User ID: ${userId}`;

    let result = await chat.sendMessage([{ text: contextMessage }, { text: message }]);
    let response = result.response;

    // Handle function calls
    let functionCallCount = 0;
    const maxFunctionCalls = 5; // Prevent infinite loops

    while (response.functionCalls() && functionCallCount < maxFunctionCalls) {
      functionCallCount++;
      const functionCalls = response.functionCalls();
      const functionResponses = [];

      for (const call of functionCalls) {
        console.log(`[AI Chat] Function call: ${call.name}`, call.args);

        let functionResult;

        switch (call.name) {
          case 'create_task':
            functionResult = await createTask(userId, call.args);
            break;
          case 'list_tasks':
            functionResult = await listTasks(userId, call.args);
            break;
          case 'update_task':
            functionResult = await updateTask(userId, call.args);
            break;
          case 'delete_task':
            functionResult = await deleteTask(userId, call.args);
            break;
          case 'get_today_schedule':
            functionResult = await getTodaySchedule(userId, call.args);
            break;
          default:
            functionResult = { success: false, error: 'Unknown function' };
        }

        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: functionResult,
          },
        });
      }

      // Send function results back to the model
      result = await chat.sendMessage(functionResponses);
      response = result.response;
    }

    // Get the final text response
    const text = response.text();

    return NextResponse.json({
      message: text,
      success: true,
    });

  } catch (error: any) {
    console.error('Error in POST /api/chat:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        message: 'Sorry, I encountered an error. Please try again.',
      },
      { status: 500 }
    );
  }
}
