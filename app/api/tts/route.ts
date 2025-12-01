import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';

// Force cette route à être dynamique car elle utilise auth()
export const dynamic = 'force-dynamic';

// Initialize OpenAI only if API key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// POST - Text-to-Speech using OpenAI
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!openai) {
      return NextResponse.json({ error: 'OpenAI service unavailable' }, { status: 503 });
    }

    const body = await request.json();
    const { text, voice = 'alloy' } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Valid voices: alloy, echo, fable, onyx, nova, shimmer
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    const selectedVoice = validVoices.includes(voice) ? voice : 'alloy';

    // Call OpenAI TTS
    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: selectedVoice,
      input: text,
      speed: 1.0,
    });

    // Convert response to buffer
    const buffer = Buffer.from(await mp3Response.arrayBuffer());

    // Return audio with proper headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('Error in POST /api/tts:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
