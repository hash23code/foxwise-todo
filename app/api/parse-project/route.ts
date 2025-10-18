import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// POST parse voice input into project fields using Gemini
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Detect language
    const isFrench = /[àâäçéèêëïîôùûüÿœæ]/i.test(text) ||
                     /\b(je|tu|il|elle|nous|vous|ils|elles|le|la|les|un|une|des|du|de|et|ou|mais|donc|car|pour|dans|sur|avec|par|sans|sous|mon|ma|mes|ton|ta|tes|son|sa|ses)\b/i.test(text);

    const prompt = isFrench
      ? `Tu es un assistant IA spécialisé dans l'analyse de projets. Analyse le texte suivant et extrais les informations de projet.

Texte: "${text}"

Retourne UNIQUEMENT un objet JSON (sans texte avant ou après) avec cette structure exacte:
{
  "title": "titre court du projet",
  "description": "description détaillée du projet",
  "status": "planning",
  "start_date": null,
  "target_end_date": null
}

Règles IMPORTANTES:
- Le titre doit être court et descriptif (max 50 caractères)
- La description doit être détaillée et complète
- status doit être exactement "planning"
- start_date et target_end_date doivent être null (sans guillemets) si non mentionnées
- Si une date est mentionnée, utilise le format "YYYY-MM-DD" (avec guillemets)
- Retourne UNIQUEMENT le JSON, rien d'autre (pas de \`\`\`json, juste le JSON)`
      : `You are an AI assistant specialized in project analysis. Analyze the following text and extract project information.

Text: "${text}"

Return ONLY a JSON object (no text before or after) with this exact structure:
{
  "title": "short project title",
  "description": "detailed project description",
  "status": "planning",
  "start_date": null,
  "target_end_date": null
}

IMPORTANT Rules:
- Title should be short and descriptive (max 50 characters)
- Description should be detailed and complete
- status must be exactly "planning"
- start_date and target_end_date must be null (without quotes) if not mentioned
- If a date is mentioned, use format "YYYY-MM-DD" (with quotes)
- Return ONLY the JSON, nothing else (no \`\`\`json, just the JSON)`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);

      // Return fallback data instead of error
      return NextResponse.json({
        title: text.substring(0, 50),
        description: text,
        status: 'planning',
        start_date: null,
        target_end_date: null,
      });
    }

    const data = await response.json();

    let responseText = '';
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      responseText = data.candidates[0].content.parts[0].text;
    } else {
      return NextResponse.json(
        { error: 'Invalid response from AI' },
        { status: 500 }
      );
    }

    // Extract JSON from response (AI might wrap it in markdown code blocks)
    let projectData;
    try {
      // Clean up the response text
      let cleanText = responseText.trim();

      // Remove markdown code blocks if present
      const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        cleanText = codeBlockMatch[1].trim();
      }

      // Try to extract JSON object
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }

      // Parse the JSON
      projectData = JSON.parse(cleanText);

      // Ensure required fields exist with defaults
      projectData = {
        title: projectData.title || 'Untitled Project',
        description: projectData.description || '',
        status: projectData.status || 'planning',
        start_date: projectData.start_date || null,
        target_end_date: projectData.target_end_date || null,
      };

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Response text:', responseText);

      // Return a fallback response instead of error
      return NextResponse.json({
        title: text.substring(0, 50),
        description: text,
        status: 'planning',
        start_date: null,
        target_end_date: null,
      });
    }

    return NextResponse.json(projectData);
  } catch (error) {
    console.error('Error in POST /api/parse-project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
