import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { transcript, language } = await request.json();

    if (!transcript) {
      return NextResponse.json(
        { success: false, error: 'No transcript provided' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentDay = currentDate.getDate();

    const prompt = language === 'fr-FR'
      ? `Tu es un assistant qui analyse des notes vocales en français. Date actuelle: ${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDay.toString().padStart(2, '0')}.

Analyse cette phrase et extrais:
1. Un titre court (5 mots maximum)
2. Une description (le reste de l'information)
3. Une date au format YYYY-MM-DD (si mentionnée, sinon utilise la date actuelle)
4. Une heure au format HH:MM (si mentionnée, sinon laisse vide)

Règles pour les dates:
- "le 15" = le 15 du mois actuel
- "le 15 janvier" = 15 janvier de cette année
- "demain" = date actuelle + 1 jour
- "après-demain" = date actuelle + 2 jours
- "la semaine prochaine" = dans 7 jours
- Si aucune date n'est mentionnée, utilise la date actuelle

Phrase: "${transcript}"

Réponds UNIQUEMENT en JSON sans formatage markdown:
{
  "title": "titre court ici",
  "description": "description détaillée ici",
  "date": "YYYY-MM-DD",
  "time": "HH:MM ou vide"
}`
      : `You are an assistant that analyzes voice notes in English. Current date: ${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDay.toString().padStart(2, '0')}.

Analyze this sentence and extract:
1. A short title (5 words maximum)
2. A description (the rest of the information)
3. A date in YYYY-MM-DD format (if mentioned, otherwise use current date)
4. A time in HH:MM format (if mentioned, otherwise leave empty)

Rules for dates:
- "on the 15th" = 15th of current month
- "on January 15" = January 15 of current year
- "tomorrow" = current date + 1 day
- "day after tomorrow" = current date + 2 days
- "next week" = in 7 days
- If no date is mentioned, use current date

Sentence: "${transcript}"

Respond ONLY with JSON without markdown formatting:
{
  "title": "short title here",
  "description": "detailed description here",
  "date": "YYYY-MM-DD",
  "time": "HH:MM or empty"
}`;

    // Use Gemini 2.5 Flash via direct API call
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { success: false, error: 'Gemini API request failed', details: errorData },
        { status: 503 }
      );
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('Invalid Gemini response structure:', JSON.stringify(geminiData));
      return NextResponse.json(
        { success: false, error: 'Invalid response from Gemini API' },
        { status: 500 }
      );
    }

    // Remove markdown code blocks if present
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonText);

    return NextResponse.json({
      success: true,
      title: parsed.title || '',
      description: parsed.description || '',
      date: parsed.date || new Date().toISOString().split('T')[0],
      time: parsed.time || '',
    });
  } catch (error: any) {
    console.error('Error parsing note:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
