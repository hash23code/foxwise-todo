import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// POST generate AI project plan using Gemini
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, targetEndDate, language = 'en' } = body;

    console.log('[AI Planner] Language received:', language, 'Title:', title);

    if (!title) {
      return NextResponse.json({ error: 'Project title is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Construct the prompt for Gemini (bilingual support) - OPTIMIZED for speed
    const prompt = language === 'fr' ?
    `Créez un plan de projet en français pour: ${title}
${description ? `Description: ${description}` : ''}
${targetEndDate ? `Date: ${targetEndDate}` : ''}

Format JSON:
{
  "overview": "Vue d'ensemble (3-4 phrases courtes)",
  "phases": [
    {
      "name": "Phase X: Nom",
      "description": "Objectifs (1-2 phrases)",
      "tasks": [
        {
          "title": "Titre actionnable",
          "description": "Étapes clés, outils. 40-50 mots max.",
          "effort": "small|medium|large",
          "order": 1,
          "dependencies": [],
          "tips": "Conseil pratique principal"
        }
      ]
    }
  ],
  "bestPractices": ["6-8 conseils"],
  "estimatedDuration": "Estimation"
}

3 phases, 4-5 tâches/phase. Descriptions COURTES. JSON uniquement.`
    :
    `Create project plan in English for: ${title}
${description ? `Description: ${description}` : ''}
${targetEndDate ? `Date: ${targetEndDate}` : ''}

JSON format:
{
  "overview": "Overview (3-4 short sentences)",
  "phases": [
    {
      "name": "Phase X: Name",
      "description": "Objectives (1-2 sentences)",
      "tasks": [
        {
          "title": "Actionable title",
          "description": "Key steps, tools. 40-50 words max.",
          "effort": "small|medium|large",
          "order": 1,
          "dependencies": [],
          "tips": "Main practical tip"
        }
      ]
    }
  ],
  "bestPractices": ["6-8 tips"],
  "estimatedDuration": "Estimate"
}

3 phases, 4-5 tasks/phase. SHORT descriptions. JSON only.`;

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
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.5,
            topK: 30,
            topP: 0.9,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate project plan' },
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

    // Extract JSON from response (AI might wrap it in markdown code blocks)
    let plan;
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
      plan = JSON.parse(cleanText);

      // Ensure the plan has the minimum required structure
      if (!plan.overview) plan.overview = `Project plan for: ${title}`;
      if (!plan.phases || !Array.isArray(plan.phases)) plan.phases = [];
      if (!plan.bestPractices || !Array.isArray(plan.bestPractices)) plan.bestPractices = [];
      if (!plan.estimatedDuration) plan.estimatedDuration = 'To be determined';

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Response text:', responseText);

      // Return a basic plan structure instead of error (bilingual)
      plan = language === 'fr' ? {
        overview: `Plan de projet pour : ${title}`,
        phases: [
          {
            name: 'Planification Initiale',
            description: description || 'Définir la portée et les objectifs du projet',
            tasks: [
              {
                title: 'Définir les exigences du projet',
                description: 'Recueillir et documenter toutes les exigences du projet',
                effort: 'medium',
                order: 1,
                dependencies: [],
                tips: 'Engager les parties prenantes dès le début'
              }
            ]
          }
        ],
        bestPractices: ['Communication régulière', 'Développement itératif', 'Assurance qualité'],
        estimatedDuration: 'À déterminer en fonction de la portée'
      } : {
        overview: `Project plan for: ${title}`,
        phases: [
          {
            name: 'Initial Planning',
            description: description || 'Define project scope and objectives',
            tasks: [
              {
                title: 'Define project requirements',
                description: 'Gather and document all project requirements',
                effort: 'medium',
                order: 1,
                dependencies: [],
                tips: 'Engage with stakeholders early'
              }
            ]
          }
        ],
        bestPractices: ['Regular communication', 'Iterative development', 'Quality assurance'],
        estimatedDuration: 'To be determined based on scope'
      };
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error in POST /api/ai-project-planner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
