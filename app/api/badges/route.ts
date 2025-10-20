import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { Badge, BadgeType, BadgeTier } from '@/lib/badges';

// GET: Récupérer les badges pour une date
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date'); // Format: YYYY-MM-DD
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const supabase = await createClient();

    let query = supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (date) {
      query = query.eq('date', date);
    } else if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching badges:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/badges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Créer un nouveau badge
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, badge_type, badge_tier, metadata } = body;

    if (!date || !badge_type) {
      return NextResponse.json(
        { error: 'Missing required fields: date, badge_type' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Vérifier si ce badge existe déjà pour cette date
    const { data: existing } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .eq('badge_type', badge_type)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Badge already exists for this date' },
        { status: 409 }
      );
    }

    // Créer le badge
    const { data: badge, error } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        date,
        badge_type,
        badge_tier: badge_tier || null,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating badge:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(badge, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/badges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Supprimer un badge (pour testing)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const badgeId = searchParams.get('id');

    if (!badgeId) {
      return NextResponse.json({ error: 'Missing badge id' }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('user_badges')
      .delete()
      .eq('id', badgeId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting badge:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/badges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
