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

    // Construct the prompt for Gemini (bilingual support)
    const prompt = language === 'fr' ?
    `Vous êtes un chef de projet professionnel expérimenté. Créez un plan de projet COMPLET et DÉTAILLÉ pour un projet réel d'entreprise.

PROJET:
Titre : ${title}
Description : ${description || 'Aucune description supplémentaire fournie'}
${targetEndDate ? `Date cible d'achèvement : ${targetEndDate}` : ''}

INSTRUCTIONS CRITIQUES:
- Ce plan est pour un VRAI projet d'entreprise/affaires, pas un exercice académique
- Créez AU MINIMUM 10-20 étapes concrètes et actionnables
- Divisez le projet en 3-5 phases principales
- Chaque phase doit contenir 3-7 tâches spécifiques
- Soyez TRÈS détaillé et pratique - chaque tâche doit être claire et actionnable
- Incluez des détails sur COMMENT accomplir chaque tâche, pas seulement QUOI faire

Formatez votre réponse en JSON avec cette structure :
{
  "overview": "Vue d'ensemble stratégique du projet (2-3 paragraphes détaillés)",
  "phases": [
    {
      "name": "Nom de la phase",
      "description": "Description détaillée de la phase et ses objectifs",
      "tasks": [
        {
          "title": "Titre de la tâche (clair et actionnable)",
          "description": "Description TRÈS détaillée: quoi faire, comment le faire, quels livrables produire",
          "effort": "small|medium|large",
          "order": 1,
          "dependencies": ["Titre des tâches prerequises"],
          "tips": "Conseils pratiques, pièges à éviter, meilleures pratiques"
        }
      ]
    }
  ],
  "bestPractices": ["Conseils stratégiques et meilleures pratiques pour ce type de projet (5-10 points)"],
  "estimatedDuration": "Estimation réaliste (ex: 2-3 mois, 6-8 semaines, etc.)"
}

EXEMPLE DE NIVEAU DE DÉTAIL ATTENDU:
❌ Mauvais: "title": "Faire le marketing"
✅ Bon: "title": "Développer une stratégie de marketing digital multicanal"
       "description": "Créer un plan marketing complet incluant: 1) Analyse de la concurrence sur 3 plateformes principales, 2) Définition des personas clients (3-5 profils détaillés), 3) Stratégie de contenu avec calendrier éditorial sur 3 mois, 4) Budget publicitaire réparti sur Google Ads, Facebook et LinkedIn, 5) KPIs et métriques de succès"

Créez un plan que quelqu'un pourrait suivre étape par étape pour réaliser ce projet avec succès.`
    :
    `You are an experienced professional project manager. Create a COMPLETE and DETAILED project plan for a REAL business project.

PROJECT:
Title: ${title}
Description: ${description || 'No additional description provided'}
${targetEndDate ? `Target Completion Date: ${targetEndDate}` : ''}

CRITICAL INSTRUCTIONS:
- This plan is for a REAL business/entrepreneurial project, not an academic exercise
- Create AT LEAST 10-20 concrete, actionable steps
- Divide the project into 3-5 major phases
- Each phase should contain 3-7 specific tasks
- Be VERY detailed and practical - each task must be clear and actionable
- Include details on HOW to accomplish each task, not just WHAT to do

Format your response as a JSON object with this structure:
{
  "overview": "Strategic overview of the project approach (2-3 detailed paragraphs)",
  "phases": [
    {
      "name": "Phase name",
      "description": "Detailed description of the phase and its objectives",
      "tasks": [
        {
          "title": "Task title (clear and actionable)",
          "description": "VERY detailed description: what to do, how to do it, what deliverables to produce",
          "effort": "small|medium|large",
          "order": 1,
          "dependencies": ["Titles of prerequisite tasks"],
          "tips": "Practical advice, pitfalls to avoid, best practices"
        }
      ]
    }
  ],
  "bestPractices": ["Strategic tips and best practices for this type of project (5-10 points)"],
  "estimatedDuration": "Realistic estimate (e.g., 2-3 months, 6-8 weeks, etc.)"
}

EXAMPLE OF EXPECTED LEVEL OF DETAIL:
❌ Bad: "title": "Do marketing"
✅ Good: "title": "Develop comprehensive multi-channel digital marketing strategy"
       "description": "Create a complete marketing plan including: 1) Competitive analysis across 3 main platforms, 2) Define customer personas (3-5 detailed profiles), 3) Content strategy with 3-month editorial calendar, 4) Advertising budget allocated across Google Ads, Facebook, and LinkedIn, 5) KPIs and success metrics with tracking dashboard setup"

Create a plan that someone could follow step-by-step to successfully complete this project.`;

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
            temperature: 0.7,
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

      // Return a basic plan structure instead of error
      plan = {
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
