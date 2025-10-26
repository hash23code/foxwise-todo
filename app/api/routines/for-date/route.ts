import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

// GET routines that apply to a specific date
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayOfMonth = date.getDate();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const supabase = await createClient();

    // Get all active routines for the user
    const { data: allRoutines, error } = await (supabase
      .from('routines') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching routines:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter routines based on frequency and date
    const applicableRoutines = allRoutines.filter((routine: any) => {
      // Daily routines
      if (routine.frequency_type === 'daily') {
        // If skip_weekends is true and it's a weekend, exclude
        if (routine.skip_weekends && isWeekend) {
          return false;
        }
        return true;
      }

      // Weekly routines
      if (routine.frequency_type === 'weekly') {
        // Check if the day of week is in the weekly_days array
        return routine.weekly_days && routine.weekly_days.includes(dayOfWeek);
      }

      // Monthly routines
      if (routine.frequency_type === 'monthly') {
        // Check if the day of month is in the monthly_days array
        return routine.monthly_days && routine.monthly_days.includes(dayOfMonth);
      }

      return false;
    });

    return NextResponse.json(applicableRoutines);
  } catch (error) {
    console.error('Error in GET /api/routines/for-date:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
