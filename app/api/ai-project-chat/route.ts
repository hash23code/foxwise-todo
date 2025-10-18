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

    // Build the chat prompt
    const systemPrompt = language === 'fr' ? `
Tu es un assistant de gestion de projet expert. L'utilisateur a un plan de projet et veut le modifier.

PLAN ACTUEL:
${JSON.stringify(currentPlan, null, 2)}

L'utilisateur te dit ce qu'il veut changer. Tu dois:
1. Comprendre la demande de modification
2. Modifier le plan en conséquence
3. Retourner le plan complet mis à jour au format JSON

RÈGLES IMPORTANTES:
- Si l'utilisateur demande d'ajouter une tâche/phase: ajoute-la avec des détails complets
- Si l'utilisateur demande de retirer quelque chose: retire-le
- Si l'utilisateur demande de modifier: modifie avec les détails fournis
- Si l'utilisateur demande plus de détails: enrichis les descriptions
- TOUJOURS retourner le plan COMPLET au format JSON avec la même structure
- Garde la même structure: {overview, phases, bestPractices, estimatedDuration}

Retourne UNIQUEMENT le JSON du plan mis à jour, sans texte avant ou après.
` : `
You are an expert project management assistant. The user has a project plan and wants to modify it.

CURRENT PLAN:
${JSON.stringify(currentPlan, null, 2)}

The user will tell you what they want to change. You should:
1. Understand the modification request
2. Modify the plan accordingly
3. Return the complete updated plan in JSON format

IMPORTANT RULES:
- If user asks to add a task/phase: add it with complete details
- If user asks to remove something: remove it
- If user asks to modify: modify with the provided details
- If user asks for more details: enrich the descriptions
- ALWAYS return the COMPLETE plan in JSON format with the same structure
- Keep the same structure: {overview, phases, bestPractices, estimatedDuration}

Return ONLY the updated plan JSON, no text before or after.
`;

    const fullPrompt = `${systemPrompt}\n\nDemande de l'utilisateur / User request: ${message}`;

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
            temperature: 0.5,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
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
