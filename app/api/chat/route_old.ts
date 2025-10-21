// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define function tools that the AI can use
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task for the user. Can be called multiple times to create several tasks at once.',
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
          category: {
            type: 'string',
            description: 'Category or list name for the task (optional)',
          },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
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
  },
  {
    type: 'function',
    function: {
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
  },
  {
    type: 'function',
    function: {
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
  },
  {
    type: 'function',
    function: {
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
  },
];

// System prompt with personality
const SYSTEM_PROMPT = `Tu es FoxWise AI, l'assistant personnel dévoué de l'utilisateur. Tu es bien plus qu'un simple assistant - tu es un véritable partenaire de productivité, chaleureux, empathique et toujours à l'écoute.

🦊 **Ta personnalité:**
- **Chaleureux et humain**: Tu parles comme un ami proche qui veut vraiment aider, pas comme un robot
- **Proactif**: Tu anticipes les besoins et proposes des solutions intelligentes
- **Encourageant**: Tu célèbres les succès et motives lors des défis
- **Francophone naturel**: Tu t'exprimes en français québécois naturel et fluide
- **Organisé et efficace**: Tu adores structurer les tâches et optimiser les journées
- **Empathique**: Tu comprends le stress et la charge de travail, et tu adaptes ton aide

🎯 **Ton rôle:**
Tu aides l'utilisateur à gérer ses tâches, organiser sa journée et rester productif. Tu as accès à plusieurs fonctions pour:
- Créer des tâches (une ou plusieurs à la fois!)
- Lister et filtrer les tâches
- Modifier les tâches existantes
- Supprimer des tâches
- Consulter le planning journalier

💬 **Ton style de communication:**
- Utilise des émojis avec modération (1-2 par message max) pour ajouter de la chaleur
- Sois TRÈS concis mais amical - maximum 2-3 phrases courtes
- Confirme TOUJOURS ce que tu viens de faire de manière directe et claire
- Quand tu crées des tâches, dis simplement: "Parfait! J'ai ajouté [nombre] tâche(s) à ta liste! 🎯"
- Pour les autres questions, réponds naturellement et amicalement
- Utilise un ton québécois naturel: "icitte", "tsé", "faut", etc. quand approprié
- IMPORTANT: Même si l'utilisateur dit juste "merci" ou "ok", réponds toujours gentiment

🌟 **Exemples de ton ton:**
- ❌ "La tâche a été créée avec succès."
- ✅ "Parfait! J'ai créé ta tâche 'Acheter du lait'. C'est noté! 📝"

- ❌ "Voulez-vous que je crée cette tâche?"
- ✅ "Hey! Je peux te créer ça tout de suite si tu veux. Ça te va? 😊"

**Date actuelle:** ${new Date().toLocaleDateString('fr-CA')} (${new Date().toLocaleDateString('fr-FR', { weekday: 'long' })})

Rappelle-toi: Tu es là pour rendre la vie de l'utilisateur plus facile et organisée. Sois son meilleur allié productivité!`;

// Function implementations
async function createTask(userId: string, params: any) {
  const supabase = await createClient();

  // If category is provided, try to find or create the todo_list
  let todoListId = null;
  if (params.category) {
    const { data: existingList } = await supabase
      .from('todo_lists')
      .select('id')
      .eq('user_id', userId)
      .ilike('name', params.category)
      .single();

    if (existingList) {
      todoListId = existingList.id;
    } else {
      // Create new list with defaults
      const { data: newList, error: listError } = await supabase
        .from('todo_lists')
        .insert({
          user_id: userId,
          name: params.category,
          color: '#3b82f6',
          icon: 'list',
          is_default: false,
          position: 0,
        })
        .select('id')
        .single();

      if (listError) {
        console.error('[AI Chat] Error creating list:', listError);
      }

      if (newList) {
        todoListId = newList.id;
      }
    }
  }

  // If no list was found/created, use the default list or create one
  if (!todoListId) {
    const { data: defaultList } = await supabase
      .from('todo_lists')
      .select('id')
      .eq('user_id', userId)
      .or('is_default.eq.true,name.ilike.%tasks%')
      .limit(1)
      .single();

    if (defaultList) {
      todoListId = defaultList.id;
    } else {
      // Create a default "My Tasks" list
      const { data: newDefaultList } = await supabase
        .from('todo_lists')
        .insert({
          user_id: userId,
          name: 'My Tasks',
          color: '#8b5cf6',
          icon: 'check-square',
          is_default: true,
          position: 0,
        })
        .select('id')
        .single();

      if (newDefaultList) {
        todoListId = newDefaultList.id;
      }
    }
  }

  const { data, error} = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      list_id: todoListId,
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

  query = query.order('created_at', { ascending: false }).limit(50);

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, tasks: data, count: data.length };
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

    // Build conversation history for OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Add history (excluding the welcome message)
    history
      .filter((msg: any) => msg.content !== history[0]?.content) // Skip welcome
      .forEach((msg: any) => {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      });

    // Add current user message
    messages.push({ role: 'user', content: message });

    // Call OpenAI with function calling
    let response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.8, // More personality!
      max_tokens: 500,
    });

    let functionCallCount = 0;
    const maxFunctionCalls = 10; // Allow more for multiple task creation

    // Handle function calls
    while (response.choices[0].finish_reason === 'tool_calls' && functionCallCount < maxFunctionCalls) {
      const toolCalls = response.choices[0].message.tool_calls;
      if (!toolCalls) break;

      functionCallCount++;

      // Add assistant's message with tool calls
      messages.push(response.choices[0].message);

      // Execute all function calls
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`[AI Chat] Function call: ${functionName}`, functionArgs);

        let functionResult;

        switch (functionName) {
          case 'create_task':
            functionResult = await createTask(userId, functionArgs);
            console.log(`[AI Chat] create_task result:`, functionResult);
            break;
          case 'list_tasks':
            functionResult = await listTasks(userId, functionArgs);
            break;
          case 'update_task':
            functionResult = await updateTask(userId, functionArgs);
            break;
          case 'delete_task':
            functionResult = await deleteTask(userId, functionArgs);
            break;
          case 'get_today_schedule':
            functionResult = await getTodaySchedule(userId, functionArgs);
            break;
          default:
            functionResult = { success: false, error: 'Unknown function' };
        }

        // Add function result to messages
        messages.push({
          role: 'tool',
          content: JSON.stringify(functionResult),
          tool_call_id: toolCall.id,
        });
      }

      // Get next response from OpenAI
      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.8,
        max_tokens: 500,
      });
    }

    // Get the final text response
    const finalMessage = response.choices[0].message.content || 'Désolé, je n\'ai pas compris. Peux-tu reformuler?';

    return NextResponse.json({
      message: finalMessage,
      success: true,
    });

  } catch (error: any) {
    console.error('Error in POST /api/chat:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        message: 'Oups! J\'ai rencontré un petit problème. Peux-tu réessayer? 😅',
      },
      { status: 500 }
    );
  }
}
