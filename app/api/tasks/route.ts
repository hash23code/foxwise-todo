import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// GET all tasks for the current user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const list_id = searchParams.get('list_id');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const supabase = await createClient();

    let query = supabase
      .from('tasks')
      .select('*, todo_lists(*)')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (list_id) {
      query = query.eq('list_id', list_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create a new task
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      list_id,
      title,
      description,
      priority,
      status,
      due_date,
      estimated_hours,
      is_recurring,
      recurring_frequency,
      recurring_end_date,
      tags,
      position,
    } = body;

    if (!list_id || !title) {
      return NextResponse.json({ error: 'List ID and title are required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        list_id,
        title,
        description: description || null,
        priority: priority || 'medium',
        status: status || 'pending',
        due_date: due_date || null,
        estimated_hours: estimated_hours ? parseFloat(estimated_hours) : null,
        is_recurring: is_recurring || false,
        recurring_frequency: recurring_frequency || null,
        recurring_end_date: recurring_end_date || null,
        tags: tags || null,
        position: position || 0,
      })
      .select('*, todo_lists(*)')
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update a task
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      list_id,
      title,
      description,
      priority,
      status,
      due_date,
      estimated_hours,
      is_recurring,
      recurring_frequency,
      recurring_end_date,
      tags,
      position,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const updateData: any = {};
    if (list_id !== undefined) updateData.list_id = list_id;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (estimated_hours !== undefined) updateData.estimated_hours = estimated_hours ? parseFloat(estimated_hours) : null;
    if (is_recurring !== undefined) updateData.is_recurring = is_recurring;
    if (recurring_frequency !== undefined) updateData.recurring_frequency = recurring_frequency;
    if (recurring_end_date !== undefined) updateData.recurring_end_date = recurring_end_date;
    if (tags !== undefined) updateData.tags = tags;
    if (position !== undefined) updateData.position = position;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, todo_lists(*)')
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE delete a task
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
