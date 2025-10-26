// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Force cette route à être dynamique car elle utilise auth()
export const dynamic = 'force-dynamic';

// Initialize OpenAI only if API key is available (allows build to succeed)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

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
          title: { type: 'string', description: 'The title/name of the task' },
          description: { type: 'string', description: 'Detailed description of the task (optional)' },
          priority: { type: 'string', description: 'Priority level: low, medium, or high', enum: ['low', 'medium', 'high'] },
          due_date: { type: 'string', description: 'Due date and time in YYYY-MM-DDTHH:mm format (e.g. 2025-10-21T21:00 for 9pm). If only date is needed, use YYYY-MM-DD format. Time is in 24h format.' },
          category: { type: 'string', description: 'Category or list name for the task (optional)' },
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
          status: { type: 'string', description: 'Filter by status: pending, in_progress, completed, or all', enum: ['pending', 'in_progress', 'completed', 'all'] },
          date: { type: 'string', description: 'Filter by specific date in YYYY-MM-DD format (optional)' },
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
          task_id: { type: 'string', description: 'The UUID of the task to update' },
          title: { type: 'string', description: 'New title for the task (optional)' },
          status: { type: 'string', description: 'New status: pending, in_progress, or completed', enum: ['pending', 'in_progress', 'completed'] },
          priority: { type: 'string', description: 'New priority: low, medium, or high', enum: ['low', 'medium', 'high'] },
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
          task_id: { type: 'string', description: 'The UUID of the task to delete' },
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
          date: { type: 'string', description: 'Date in YYYY-MM-DD format (optional, defaults to today)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_day_plan',
      description: 'UTILISER CET OUTIL pour créer et appliquer automatiquement un planning de journée intelligent avec l\'IA. L\'outil va créer et APPLIQUER directement le planning. Dire à l\'utilisateur: "Parfait! Je démarre l\'outil de planification selon vos demandes!" avant d\'appeler cette fonction.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Date du planning en format YYYY-MM-DD (optionnel, aujourd\'hui par défaut)' },
          start_time: { type: 'string', description: 'Heure de début de la journée de travail en format HH:mm (ex: 09:00)' },
          end_time: { type: 'string', description: 'Heure de fin de la journée de travail en format HH:mm (ex: 17:00)' },
          preferences: { type: 'string', description: 'Préférences ou contraintes spécifiques pour le planning (optionnel)' },
          language: { type: 'string', description: 'Langue du planning: "fr" ou "en"', enum: ['fr', 'en'] },
        },
        required: ['start_time', 'end_time'],
      },
    },
  },
];

// Build dynamic system prompt with user context
function buildSystemPrompt(userMemory: any, userName?: string, language: string = 'fr') {
  const isFrench = language === 'fr';
  const name = userName || userMemory?.full_name || (isFrench ? 'ami' : 'friend');
  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString(isFrench ? 'fr-CA' : 'en-US');
  const dayName = currentDate.toLocaleDateString(isFrench ? 'fr-FR' : 'en-US', { weekday: 'long' });
  const hour = currentDate.getHours();
  const timeOfDay = isFrench
    ? (hour < 12 ? 'matin' : hour < 18 ? 'après-midi' : 'soirée')
    : (hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening');

  // Extract user context
  const habits = userMemory?.habits || {};
  const preferences = userMemory?.preferences || {};
  const recentProjects = userMemory?.recent_projects || [];
  const recentTasks = userMemory?.recent_tasks || [];
  const notes = userMemory?.personal_notes || '';

  let contextSection = '';
  if (Object.keys(habits).length > 0 || Object.keys(preferences).length > 0 || notes) {
    contextSection = isFrench
      ? `\n\n🧠 **Ce que tu sais sur ${name}:**\n`
      : `\n\n🧠 **What you know about ${name}:**\n`;

    if (notes) {
      contextSection += isFrench
        ? `- Notes personnelles: ${notes}\n`
        : `- Personal notes: ${notes}\n`;
    }

    if (Object.keys(habits).length > 0) {
      contextSection += isFrench
        ? `- Habitudes: ${JSON.stringify(habits)}\n`
        : `- Habits: ${JSON.stringify(habits)}\n`;
    }

    if (Object.keys(preferences).length > 0) {
      contextSection += isFrench
        ? `- Préférences: ${JSON.stringify(preferences)}\n`
        : `- Preferences: ${JSON.stringify(preferences)}\n`;
    }

    if (recentProjects.length > 0) {
      contextSection += isFrench
        ? `- Projets récents: ${recentProjects.slice(0, 3).join(', ')}\n`
        : `- Recent projects: ${recentProjects.slice(0, 3).join(', ')}\n`;
    }

    if (recentTasks.length > 0) {
      contextSection += isFrench
        ? `- Tâches récentes: ${recentTasks.slice(0, 5).join(', ')}\n`
        : `- Recent tasks: ${recentTasks.slice(0, 5).join(', ')}\n`;
    }

    contextSection += isFrench
      ? `\n💡 Utilise ces informations pour personnaliser tes réponses et suggestions!`
      : `\n💡 Use this information to personalize your responses and suggestions!`;
  }

  if (isFrench) {
    return `Tu es Foxy, l'assistant personnel dévoué de ${name}. Tu es bien plus qu'un simple assistant - tu es un véritable partenaire de productivité, chaleureux, empathique et toujours à l'écoute.

🦊 **Ta personnalité:**
- **Chaleureux et humain**: Tu parles comme un ami proche qui veut vraiment aider, pas comme un robot
- **Proactif**: Tu anticipes les besoins et proposes des solutions intelligentes basées sur ce que tu connais de ${name}
- **Encourageant**: Tu célèbres les succès et motives lors des défis
- **Francophone naturel**: Tu t'exprimes en français québécois naturel et fluide
- **Organisé et efficace**: Tu adores structurer les tâches et optimiser les journées
- **Empathique**: Tu comprends le stress et la charge de travail, et tu adaptes ton aide
- **Mémoire excellente**: Tu te souviens des détails importants sur ${name} et tu les utilises pour mieux aider

🎯 **Ton rôle:**
Tu aides ${name} à gérer ses tâches, organiser sa journée et rester productif. Tu as accès à plusieurs fonctions pour:
- Créer des tâches (une ou plusieurs à la fois!)
- Lister et filtrer les tâches
- Modifier les tâches existantes
- Supprimer des tâches
- Consulter le planning journalier

**Note importante**: Si ${name} te demande de créer un planning automatique pour une journée, explique-lui qu'il peut utiliser le bouton "AI Assist" dans la page Day Planner pour ça - c'est l'outil parfait pour créer un planning intelligent qui prend en compte ses événements du calendrier!

**IMPORTANT - Listes de tâches**: Tu NE DOIS JAMAIS créer de nouvelles listes/catégories. Utilise UNIQUEMENT les listes existantes de ${name}. Si une tâche ne correspond à aucune liste existante, place-la dans la liste par défaut sans créer de nouvelle liste.

💬 **Ton style de communication:**
- Utilise des émojis avec modération (1-2 par message max) pour ajouter de la chaleur
- Sois TRÈS concis mais amical - maximum 2-3 phrases courtes
- Confirme TOUJOURS ce que tu viens de faire de manière directe et claire
- Quand tu crées des tâches, dis simplement: "Parfait! J'ai ajouté [nombre] tâche(s) à ta liste! 🎯"
- Pour les autres questions, réponds naturellement et amicalement
- Utilise un ton québécois naturel: "icitte", "tsé", "faut", etc. quand approprié
- IMPORTANT: Même si l'utilisateur dit juste "merci" ou "ok", réponds toujours gentiment
- Appelle l'utilisateur par son prénom quand c'est naturel

**Date et heure actuelles:** ${dateStr} (${dayName} ${timeOfDay})${contextSection}

🌟 **Exemples de ton ton:**
- ❌ "La tâche a été créée avec succès."
- ✅ "Parfait ${name}! J'ai créé ta tâche 'Acheter du lait'. C'est noté! 📝"

- ❌ "Voulez-vous que je crée cette tâche?"
- ✅ "Hey! Je peux te créer ça tout de suite si tu veux. Ça te va? 😊"

Rappelle-toi: Tu es là pour rendre la vie de ${name} plus facile et organisée. Sois son meilleur allié productivité!`;
  } else {
    return `You are Foxy, ${name}'s dedicated personal assistant. You're much more than a simple assistant - you're a true productivity partner, warm, empathetic, and always attentive.

🦊 **Your personality:**
- **Warm and human**: You talk like a close friend who truly wants to help, not like a robot
- **Proactive**: You anticipate needs and propose smart solutions based on what you know about ${name}
- **Encouraging**: You celebrate successes and motivate during challenges
- **Natural communicator**: You express yourself in natural, fluent English
- **Organized and efficient**: You love structuring tasks and optimizing days
- **Empathetic**: You understand stress and workload, and adapt your help accordingly
- **Excellent memory**: You remember important details about ${name} and use them to help better

🎯 **Your role:**
You help ${name} manage tasks, organize their day, and stay productive. You have access to several functions to:
- Create tasks (one or multiple at once!)
- List and filter tasks
- Modify existing tasks
- Delete tasks
- Check the daily schedule

**Important note**: If ${name} asks you to create an automatic day plan, explain that they can use the "AI Assist" button in the Day Planner page for that - it's the perfect tool for creating an intelligent schedule that takes their calendar events into account!

**IMPORTANT - Task lists**: You MUST NEVER create new lists/categories. Use ONLY ${name}'s existing lists. If a task doesn't fit any existing list, place it in the default list without creating a new one.

💬 **Your communication style:**
- Use emojis sparingly (1-2 max per message) to add warmth
- Be VERY concise but friendly - maximum 2-3 short sentences
- ALWAYS confirm what you just did in a direct and clear way
- When you create tasks, simply say: "Perfect! I added [number] task(s) to your list! 🎯"
- For other questions, respond naturally and friendly
- Use a casual, friendly tone
- IMPORTANT: Even if the user just says "thanks" or "ok", always respond kindly
- Call the user by their first name when it's natural

**Current date and time:** ${dateStr} (${dayName} ${timeOfDay})${contextSection}

🌟 **Examples of your tone:**
- ❌ "The task has been successfully created."
- ✅ "Perfect ${name}! I created your 'Buy milk' task. It's noted! 📝"

- ❌ "Would you like me to create this task?"
- ✅ "Hey! I can create that right away if you want. Sound good? 😊"

Remember: You're here to make ${name}'s life easier and more organized. Be their best productivity ally!`;
  }
}

// Function implementations (same as before)
async function createTask(userId: string, params: any) {
  const supabase = await createClient();

  let todoListId = null;
  if (params.category) {
    const { data: existingList, error: findError } = await supabase
      .from('todo_lists')
      .select('id')
      .eq('user_id', userId)
      .ilike('name', params.category)
      .single();

    if (existingList && !findError) {
      todoListId = existingList.id;
    }
    // If category doesn't exist, do NOT create a new list - use default instead
  }

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

  const { data, error } = await supabase
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

async function createDayPlan(userId: string, params: any) {
  try {
    const supabase = await createClient();
    const startDate = params.date || new Date().toISOString().split('T')[0];
    const workStartHour = parseInt((params.start_time || '09:00').split(':')[0]);
    const workEndHour = parseInt((params.end_time || '17:00').split(':')[0]);

    // 1. Get all pending and in_progress tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*, todo_lists(*)')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: false });

    if (tasksError) {
      return { success: false, error: tasksError.message };
    }

    if (!tasks || tasks.length === 0) {
      return { success: false, error: 'Aucune tâche à planifier. Créez d\'abord des tâches!' };
    }

    // 2. Get calendar events for the day
    const { data: calendarEvents } = await supabase
      .from('calendar_notes')
      .select('*')
      .eq('user_id', userId)
      .eq('date', startDate)
      .order('time', { ascending: true });

    // 3. Prepare data for AI
    const tasksWithAnalysis = tasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      estimatedHours: task.estimated_hours,
      category: task.todo_lists?.name,
      dueDate: task.due_date,
      tags: task.tags,
    }));

    // 4. Prepare calendar context
    const calendarContext = calendarEvents && calendarEvents.length > 0 ? `\n**Événements calendrier (NE PAS planifier de tâches pendant ces heures):**\n${calendarEvents.map((event: any) => `- ${event.time ? event.time.substring(0, 5) : 'Toute la journée'} - ${event.title}`).join('\n')}\n` : '';

    // 5. Use Gemini AI to generate plan - Using 2.0 Flash for speed
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    const languageInstruction = params.language === 'en' ? 'Respond in English.' : 'Réponds en français.';

    const prompt = `Créer un planning pour ${startDate}. ${languageInstruction}

**IMPORTANT: Tu DOIS utiliser les UUIDs de tâches EXACTS fournis ci-dessous. NE PAS générer de faux IDs.**

**Tâches disponibles (UTILISER CES UUIDs EXACTS):**
${tasksWithAnalysis.map((t: any) => `- UUID: "${t.id}" | Titre: "${t.title}" | Priorité: ${t.priority} | Estimé: ${t.estimatedHours || 'N/A'}h`).join('\n')}
${calendarContext}
**Contraintes:**
- Heures: ${workStartHour}:00-${workEndHour}:00
- ${params.preferences || 'Aucune préférence spécifique'}

**Règles:**
1. CRITIQUE: Ne JAMAIS planifier pendant les événements calendrier
2. CRITIQUE: Utiliser UNIQUEMENT les UUIDs exacts listés ci-dessus dans "taskId"
3. Temps: Utiliser estimé ou deviner (simple:0.5-1h, moyen:1-2h, complexe:2-4h)
4. Priorité: HAUTE/URGENTE tôt (énergie maximale)
5. Max 6h de focus/jour, buffers de 15-30min entre tâches
6. Grouper tâches similaires
7. Date EXACTE: ${startDate}

Retourner UNIQUEMENT le JSON (copier les UUIDs EXACTEMENT):
{
  "plan": [{
    "date": "${startDate}",
    "tasks": [{
      "taskId": "${tasksWithAnalysis[0]?.id || 'UUID-EXACT-DE-LA-LISTE'}",
      "startTime": "10:00",
      "durationHours": 1.5,
      "reasoning": "Tâche haute priorité le matin"
    }]
  }],
  "summary": "Plan organisé par priorité",
  "recommendations": ["Prendre des pauses","Réviser progrès"]
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

    // 6. Validate and filter task UUIDs
    const validTaskIds = new Set(tasks.map((t: any) => t.id));
    let removedCount = 0;

    aiPlan.plan = aiPlan.plan?.map((dayPlan: any) => {
      const validTasks = dayPlan.tasks?.filter((plannedTask: any) => {
        const isValid = validTaskIds.has(plannedTask.taskId);
        if (!isValid) {
          removedCount++;
        }
        return isValid;
      }) || [];

      return { ...dayPlan, tasks: validTasks };
    });

    const totalValidTasks = aiPlan.plan.reduce((sum: number, d: any) => sum + (d.tasks?.length || 0), 0);

    if (totalValidTasks === 0) {
      return { success: false, error: 'L\'IA n\'a planifié aucune tâche réelle. Réessayez!' };
    }

    // 7. Apply the plan to day_planner
    const plannedTasks = aiPlan.plan.flatMap((dayPlan: any) =>
      dayPlan.tasks.map((task: any) => ({
        user_id: userId,
        task_id: task.taskId,
        date: startDate,
        start_time: task.startTime,
        duration_hours: task.durationHours,
      }))
    );

    const { error: insertError } = await supabase
      .from('day_planner')
      .insert(plannedTasks);

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return {
      success: true,
      plan: aiPlan,
      summary: `✅ Parfait! J'ai créé et appliqué un planning pour ${startDate} avec ${totalValidTasks} tâche${totalValidTasks > 1 ? 's' : ''} planifiée${totalValidTasks > 1 ? 's' : ''} entre ${workStartHour}h et ${workEndHour}h. ${aiPlan.summary || ''}\n\n📋 Recommandations: ${aiPlan.recommendations?.join(', ') || 'Bon travail!'}`,
      taskCount: totalValidTasks,
      date: startDate,
    };
  } catch (error: any) {
    console.error('Error creating day plan:', error);
    return { success: false, error: error.message || 'Échec de création du plan' };
  }
}

// Generate conversation title from first user message
async function generateConversationTitle(userMessage: string): Promise<string> {
  try {
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Generate a short 3-5 word title in French for this conversation based on the user\'s first message. Be concise and descriptive. Return ONLY the title, nothing else.',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 20,
      temperature: 0.7,
    });

    return response.choices[0].message.content?.trim() || 'Nouvelle conversation';
  } catch (error) {
    console.error('Error generating title:', error);
    return 'Nouvelle conversation';
  }
}

// Extract key information from conversation to update user memory
async function extractUserInfo(messages: any[]): Promise<any> {
  try {
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }
    const conversationText = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extract key information about the user from this conversation. Return a JSON object with:
{
  "name": "user's name if mentioned",
  "habits": {"time": "activity", ...},
  "preferences": {"category": "preference", ...},
  "projects": ["project names mentioned"],
  "notes": "any other important info to remember"
}
Return ONLY the JSON, nothing else. If nothing is found, return empty fields.`,
        },
        {
          role: 'user',
          content: conversationText,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const content = response.choices[0].message.content?.trim();
    if (!content) return null;

    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  } catch (error) {
    console.error('Error extracting user info:', error);
    return null;
  }
}

// POST - Chat with AI assistant
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!openai) {
      return NextResponse.json({ error: 'OpenAI service unavailable' }, { status: 503 });
    }

    const body = await request.json();
    const { message, conversation_id, language = 'fr' } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Load user memory
    const { data: userMemory } = await supabase
      .from('user_memory')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get or create conversation
    let conversationId = conversation_id;
    let isNewConversation = false;

    if (!conversationId) {
      // Create new conversation
      const { data: newConversation, error: convError } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: userId,
          title: 'Nouvelle conversation', // Will be updated after first exchange
        })
        .select()
        .single();

      if (convError || !newConversation) {
        throw new Error('Failed to create conversation');
      }

      conversationId = newConversation.id;
      isNewConversation = true;
    }

    // Save user message
    await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      user_id: userId,
      role: 'user',
      content: message,
    });

    // Load conversation history
    const { data: messageHistory } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(50); // Keep last 50 messages for context

    // Build conversation history for OpenAI
    const systemPrompt = buildSystemPrompt(userMemory, userMemory?.full_name, language);
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add history (excluding the current user message we just added)
    if (messageHistory && messageHistory.length > 1) {
      messageHistory.slice(0, -1).forEach((msg: any) => {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      });
    }

    // Add current user message
    messages.push({ role: 'user', content: message });

    // Call OpenAI with function calling
    let response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.8,
      max_tokens: 500,
    });

    let functionCallCount = 0;
    const maxFunctionCalls = 10;

    // Handle function calls
    while (response.choices[0].finish_reason === 'tool_calls' && functionCallCount < maxFunctionCalls) {
      const toolCalls = response.choices[0].message.tool_calls;
      if (!toolCalls) break;

      functionCallCount++;
      messages.push(response.choices[0].message);

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
          case 'create_day_plan':
            console.log(`[AI Chat] Function call: create_day_plan`, functionArgs);
            functionResult = await createDayPlan(userId, functionArgs);
            console.log(`[AI Chat] create_day_plan result:`, functionResult);
            break;
          default:
            functionResult = { success: false, error: 'Unknown function' };
        }

        messages.push({
          role: 'tool',
          content: JSON.stringify(functionResult),
          tool_call_id: toolCall.id,
        });
      }

      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.8,
        max_tokens: 500,
      });
    }

    const finalMessage = response.choices[0].message.content || 'Désolé, je n\'ai pas compris. Peux-tu reformuler?';

    // Save assistant response
    await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      user_id: userId,
      role: 'assistant',
      content: finalMessage,
    });

    // Update conversation timestamp
    await supabase
      .from('chat_conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    // Generate title for new conversation after first exchange
    if (isNewConversation) {
      const title = await generateConversationTitle(message);
      await supabase
        .from('chat_conversations')
        .update({ title })
        .eq('id', conversationId);
    }

    // Extract and update user memory (async, don't wait)
    if (messageHistory && messageHistory.length >= 4) { // Only after a few exchanges
      extractUserInfo(messageHistory).then(async (info) => {
        if (!info) return;

        const updates: any = {};

        if (info.name && !userMemory?.full_name) {
          updates.full_name = info.name;
        }

        if (info.habits && Object.keys(info.habits).length > 0) {
          updates.habits = { ...(userMemory?.habits || {}), ...info.habits };
        }

        if (info.preferences && Object.keys(info.preferences).length > 0) {
          updates.preferences = { ...(userMemory?.preferences || {}), ...info.preferences };
        }

        if (info.projects && info.projects.length > 0) {
          const currentProjects = userMemory?.recent_projects || [];
          updates.recent_projects = [...new Set([...info.projects, ...currentProjects])].slice(0, 10);
        }

        if (info.notes) {
          const currentNotes = userMemory?.personal_notes || '';
          updates.personal_notes = currentNotes ? `${currentNotes}\n${info.notes}` : info.notes;
        }

        if (Object.keys(updates).length > 0) {
          if (userMemory) {
            await supabase
              .from('user_memory')
              .update(updates)
              .eq('user_id', userId);
          } else {
            await supabase
              .from('user_memory')
              .insert({
                user_id: userId,
                ...updates,
              });
          }
        }
      }).catch(err => console.error('Error updating user memory:', err));
    }

    return NextResponse.json({
      message: finalMessage,
      conversation_id: conversationId,
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
