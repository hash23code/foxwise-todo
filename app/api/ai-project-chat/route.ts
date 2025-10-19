import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, currentPlan, language = 'en' } = body;

    if (!message || !currentPlan) {
      return NextResponse.json(
        { error: 'Message and current plan are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Build the chat prompt - SIMPLIFIED for faster response
    const systemPrompt = language === 'fr' ? `
Vous êtes un assistant de projet. Modifiez le plan selon la demande.

PLAN ACTUEL (JSON):
${JSON.stringify(currentPlan, null, 2)}

DEMANDE: ${message}

INSTRUCTIONS:
- Modifiez uniquement ce qui est demandé
- Gardez les descriptions courtes (max 50 mots par tâche)
- Retournez le plan COMPLET en JSON valide
- Structure: {overview, phases, bestPractices, estimatedDuration}
- Phases contient des tasks avec: title, description, effort, order, dependencies, tips

Retournez UNIQUEMENT le JSON valide, rien d'autre.
` : `
You are a project assistant. Modify the plan as requested.

CURRENT PLAN (JSON):
${JSON.stringify(currentPlan, null, 2)}

REQUEST: ${message}

INSTRUCTIONS:
- Modify only what is requested
- Keep descriptions short (max 50 words per task)
- Return COMPLETE plan in valid JSON
- Structure: {overview, phases, bestPractices, estimatedDuration}
- Phases contain tasks with: title, description, effort, order, dependencies, tips

Return ONLY valid JSON, nothing else.
`;

    const fullPrompt = systemPrompt;

    // Call Gemini API
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
                  text: fullPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 20,
            topP: 0.9,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to modify project plan' },
        { status: 500 }
      );
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

    // Extract JSON from response
    let updatedPlan;
    try {
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

      updatedPlan = JSON.parse(cleanText);

      // Ensure structure
      if (!updatedPlan.overview) updatedPlan.overview = currentPlan.overview;
      if (!updatedPlan.phases || !Array.isArray(updatedPlan.phases)) updatedPlan.phases = currentPlan.phases;
      if (!updatedPlan.bestPractices) updatedPlan.bestPractices = currentPlan.bestPractices;
      if (!updatedPlan.estimatedDuration) updatedPlan.estimatedDuration = currentPlan.estimatedDuration;

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Response text:', responseText);

      // Return current plan if parsing fails
      return NextResponse.json({
        plan: currentPlan,
        message: language === 'fr'
          ? 'Désolé, je n\'ai pas pu modifier le plan. Pouvez-vous reformuler votre demande?'
          : 'Sorry, I couldn\'t modify the plan. Could you rephrase your request?'
      });
    }

    return NextResponse.json({
      plan: updatedPlan,
      message: language === 'fr'
        ? 'Plan mis à jour avec succès!'
        : 'Plan updated successfully!'
    });
  } catch (error) {
    console.error('Error in POST /api/ai-project-chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
