import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// GET user memory
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_memory')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user memory:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return empty memory if none exists
    if (!data) {
      return NextResponse.json({
        user_id: userId,
        full_name: null,
        preferences: {},
        habits: {},
        recent_projects: [],
        recent_tasks: [],
        personal_notes: null,
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in GET /api/user-memory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST/PATCH update user memory
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, preferences, habits, recent_projects, recent_tasks, personal_notes } = body;

    const supabase = await createClient();

    // Check if memory exists
    const { data: existing } = await supabase
      .from('user_memory')
      .select('id')
      .eq('user_id', userId)
      .single();

    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (habits !== undefined) updateData.habits = habits;
    if (recent_projects !== undefined) updateData.recent_projects = recent_projects;
    if (recent_tasks !== undefined) updateData.recent_tasks = recent_tasks;
    if (personal_notes !== undefined) updateData.personal_notes = personal_notes;

    let data, error;

    if (existing) {
      // Update existing memory
      const result = await supabase
        .from('user_memory')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      data = result.data;
      error = result.error;
    } else {
      // Create new memory
      const result = await supabase
        .from('user_memory')
        .insert({
          user_id: userId,
          ...updateData,
        })
        .select()
        .single();

      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error updating user memory:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in POST /api/user-memory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
