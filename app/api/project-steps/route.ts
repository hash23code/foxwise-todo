import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// POST create a new project step
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      project_id,
      title,
      description,
      order_index = 0,
      status = 'pending',
      estimated_hours,
      todo_list_id,
    } = body;

    if (!project_id || !title) {
      return NextResponse.json({ error: 'Project ID and title are required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify the project belongs to the user
    const { data: project } = await (supabase
      .from('projects') as any)
      .select('id')
      .eq('id', project_id)
      .eq('user_id', userId)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { data: step, error } = await (supabase
      .from('project_steps') as any)
      .insert({
        project_id,
        title,
        description,
        order_index,
        status,
        estimated_hours,
        todo_list_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project step:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/project-steps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update a project step
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Step ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify the step's project belongs to the user
    const { data: step } = await (supabase
      .from('project_steps') as any)
      .select('project_id, projects!inner(user_id)')
      .eq('id', id)
      .single();

    if (!step || step.projects.user_id !== userId) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 });
    }

    const { data: updatedStep, error } = await (supabase
      .from('project_steps') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project step:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updatedStep);
  } catch (error) {
    console.error('Error in PATCH /api/project-steps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a project step
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Step ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify the step's project belongs to the user
    const { data: step } = await (supabase
      .from('project_steps') as any)
      .select('project_id, projects!inner(user_id)')
      .eq('id', id)
      .single();

    if (!step || step.projects.user_id !== userId) {
      return NextResponse.json({ error: 'Step not found' }, { status: 404 });
    }

    const { error } = await (supabase
      .from('project_steps') as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project step:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/project-steps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
