import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// Force cette route à être dynamique car elle utilise auth()
export const dynamic = 'force-dynamic';

// GET all projects for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get projects with their steps count
    const { data: projects, error } = await (supabase
      .from('projects') as any)
      .select(`
        *,
        project_steps (
          id,
          title,
          description,
          order_index,
          status,
          estimated_hours,
          todo_list_id,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(projects || []);
  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create a new project
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      status = 'planning',
      start_date,
      target_end_date,
      color = '#667eea',
      ai_plan,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // First, create a dedicated todo list for this project
    const { data: todoList, error: listError } = await (supabase
      .from('todo_lists') as any)
      .insert({
        user_id: userId,
        name: `📁 ${title}`,
        color: color,
        icon: 'folder',
        is_default: false,
        position: 999, // Put project lists at the end
      })
      .select()
      .single();

    if (listError) {
      console.error('Error creating todo list:', listError);
      // Continue even if todo list creation fails
    }

    const { data: project, error } = await (supabase
      .from('projects') as any)
      .insert({
        user_id: userId,
        title,
        description,
        status,
        start_date,
        target_end_date,
        color,
        ai_plan,
        todo_list_id: todoList?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update a project
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: project, error } = await (supabase
      .from('projects') as any)
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error in PATCH /api/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a project
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Support both query param and body
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await request.json();
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await (supabase
      .from('projects') as any)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
