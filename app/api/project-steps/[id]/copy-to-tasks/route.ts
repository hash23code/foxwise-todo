import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// POST copy a project step to tasks
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stepId = params.id;
    const supabase = await createClient();

    // Get the project step with project info
    const { data: step, error: stepError } = await (supabase
      .from('project_steps') as any)
      .select(`
        *,
        projects!inner(
          user_id,
          title,
          color,
          todo_list_id
        )
      `)
      .eq('id', stepId)
      .single();

    if (stepError || !step || step.projects.user_id !== userId) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 });
    }

    // Get or create the todo list for this project
    let listId = step.projects.todo_list_id;

    if (!listId) {
      // Create a todo list for this project if it doesn't exist
      const { data: todoList, error: listError } = await (supabase
        .from('todo_lists') as any)
        .insert({
          user_id: userId,
          name: `📁 ${step.projects.title}`,
          color: step.projects.color || '#667eea',
          icon: 'folder',
          is_default: false,
          position: 999,
        })
        .select()
        .single();

      if (listError) {
        console.error('Error creating todo list:', listError);
        return NextResponse.json({ error: 'Failed to create todo list' }, { status: 500 });
      }

      listId = todoList.id;

      // Update the project with the new list_id
      await (supabase
        .from('projects') as any)
        .update({ todo_list_id: listId })
        .eq('id', step.project_id);
    }

    // Create the task in the tasks table
    const { data: task, error: taskError } = await (supabase
      .from('tasks') as any)
      .insert({
        user_id: userId,
        title: step.title,
        description: step.description,
        list_id: listId,
        status: 'pending',
        priority: 'medium',
        estimated_hours: step.estimated_hours,
        tags: [`project:${step.projects.title}`],
      })
      .select()
      .single();

    if (taskError) {
      console.error('Error creating task:', taskError);
      return NextResponse.json({ error: taskError.message }, { status: 500 });
    }

    // Update the project step to link it to the todo_list
    const { error: updateError } = await (supabase
      .from('project_steps') as any)
      .update({ todo_list_id: listId })
      .eq('id', stepId);

    if (updateError) {
      console.warn('Could not update step with todo_list_id:', updateError);
    }

    return NextResponse.json({ task, step }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/project-steps/[id]/copy-to-tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
