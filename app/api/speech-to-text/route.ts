// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import OpenAI from 'openai';

// Initialize OpenAI only if API key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// POST: Transcribe audio using OpenAI Whisper
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!openai) {
      return NextResponse.json({ error: 'OpenAI service unavailable' }, { status: 503 });
    }

    // Get the audio file from FormData
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    console.log('[Speech-to-Text] Processing audio:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
      language: language || 'auto-detect'
    });

    // Convert File to format Whisper expects
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: language || undefined, // Auto-detect if not specified
      response_format: 'json',
    });

    console.log('[Speech-to-Text] Transcription result:', transcription.text);

    return NextResponse.json({
      text: transcription.text,
      language: language || 'auto',
    });

  } catch (error: any) {
    console.error('Error in POST /api/speech-to-text:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
