import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// Force cette route à être dynamique car elle utilise auth()
export const dynamic = 'force-dynamic';

// GET all messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;
    const supabase = await createClient();

    // Verify conversation belongs to user
    const { data: conversation } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get messages
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in GET /api/conversations/[id]/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
