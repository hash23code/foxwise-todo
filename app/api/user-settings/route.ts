import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// GET user settings
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const { data, error } = await (supabase
      .from('user_settings') as any)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return null
        return NextResponse.json(null);
      }
      console.error('Error fetching user settings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/user-settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create or update user settings
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      default_list_id,
      email_reminders_enabled,
      push_reminders_enabled,
      default_reminder_time,
      theme,
      language,
      timezone,
      default_currency, // For compatibility with Finance app
    } = body;

    const supabase = await createClient();

    // Check if settings exist
    const { data: existing } = await (supabase
      .from('user_settings') as any)
      .select('id')
      .eq('user_id', userId)
      .single();

    const settingsData: any = {
      user_id: userId,
    };

    if (default_list_id !== undefined) settingsData.default_list_id = default_list_id;
    if (email_reminders_enabled !== undefined) settingsData.email_reminders_enabled = email_reminders_enabled;
    if (push_reminders_enabled !== undefined) settingsData.push_reminders_enabled = push_reminders_enabled;
    if (default_reminder_time !== undefined) settingsData.default_reminder_time = default_reminder_time;
    if (theme !== undefined) settingsData.theme = theme;
    if (language !== undefined) settingsData.language = language;
    if (timezone !== undefined) settingsData.timezone = timezone;
    // Note: default_currency is stored in Finance app, not in ToDo app schema

    if (existing) {
      // Update existing settings
      const { data, error } = await (supabase
        .from('user_settings') as any)
        .update(settingsData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    } else {
      // Create new settings
      const { data, error } = await (supabase
        .from('user_settings') as any)
        .insert(settingsData)
        .select()
        .single();

      if (error) {
        console.error('Error creating user settings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data, { status: 201 });
    }
  } catch (error) {
    console.error('Error in POST /api/user-settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
