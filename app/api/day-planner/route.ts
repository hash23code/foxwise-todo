import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// GET day planner entries for a specific date
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await (supabase
      .from('day_planner') as any)
      .select(`
        *,
        task:tasks (
          id,
          title,
          description,
          priority,
          status,
          due_date,
          list_id,
          tags,
          todo_lists (
            name,
            color
          )
        )
      `)
      .eq('user_id', userId)
      .eq('date', date)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching day planner:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`GET day-planner for ${date}: found ${data?.length || 0} tasks`);
    if (data && data.length > 0) {
      console.log('Task start times:', data.map((t: any) => `${t.start_time} (${t.duration_hours}h)`));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/day-planner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new day planner entry
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { task_id, date, start_time, duration_hours } = body;

    if (!task_id || !date || !start_time || !duration_hours) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await (supabase
      .from('day_planner') as any)
      .insert({
        user_id: userId,
        task_id,
        date,
        start_time,
        duration_hours,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating day planner entry:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/day-planner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update day planner entry
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, start_time, duration_hours } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const updateData: any = {};
    if (start_time !== undefined) updateData.start_time = start_time;
    if (duration_hours !== undefined) updateData.duration_hours = duration_hours;

    const { data, error } = await (supabase
      .from('day_planner') as any)
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating day planner entry:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/day-planner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE day planner entry
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

    const { error } = await (supabase
      .from('day_planner') as any)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting day planner entry:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/day-planner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
