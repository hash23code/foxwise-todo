import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { audioData, mimeType, language } = await request.json();

    if (!audioData) {
      return NextResponse.json(
        { error: 'Audio data is required' },
        { status: 400 }
      );
    }

    // Check if API key is available
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.log('[Transcribe API] Gemini API key is not configured');
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }

    const languageInstruction = language === 'fr-FR'
      ? 'Transcribe this French audio to text.'
      : 'Transcribe this English audio to text.';

    console.log('[Transcribe API] Sending audio to Gemini for transcription...');
    console.log('[Transcribe API] Audio mime type:', mimeType);
    console.log('[Transcribe API] Audio data length:', audioData.length);

    // Use Gemini 2.5 Flash for audio transcription
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'audio/webm',
                  data: audioData
                }
              },
              {
                text: `${languageInstruction} Return only the transcribed text, nothing else.`
              }
            ]
          }]
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('[Transcribe API] Gemini API error:', errorData);
      return NextResponse.json(
        { error: 'Gemini transcription failed', details: errorData },
        { status: 503 }
      );
    }

    const geminiData = await geminiResponse.json();
    console.log('[Transcribe API] Received transcription from Gemini');

    const transcription = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!transcription) {
      console.error('[Transcribe API] Invalid Gemini response structure:', JSON.stringify(geminiData));
      return NextResponse.json(
        { error: 'Invalid response from Gemini API' },
        { status: 500 }
      );
    }

    console.log('[Transcribe API] Transcription:', transcription);

    return NextResponse.json({
      success: true,
      transcription: transcription.trim(),
    });

  } catch (error: any) {
    console.error('[Transcribe API] Error in transcribe-audio API:', error);
    console.error('[Transcribe API] Error details:', {
      message: error.message,
      name: error.name,
    });

    return NextResponse.json(
      {
        error: 'Failed to transcribe audio',
        details: error.message
      },
      { status: 500 }
    );
  }
}
