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
    `Vous êtes un consultant en stratégie d'entreprise et chef de projet senior avec 20 ans d'expérience. Créez un plan d'action COMPLET, DÉTAILLÉ et PROFESSIONNEL pour ce projet entrepreneurial réel.

PROJET:
Titre : ${title}
Description : ${description || 'Aucune description supplémentaire fournie'}
${targetEndDate ? `Date cible d'achèvement : ${targetEndDate}` : ''}

INSTRUCTIONS CRITIQUES - LISEZ ATTENTIVEMENT:

1. STRUCTURE OBLIGATOIRE:
   - Divisez le projet en 4-6 PHASES MAJEURES (ex: Conceptualisation, Design & Production, Aspects Légaux, Lancement, Croissance)
   - Chaque phase doit contenir 4-8 tâches détaillées
   - MINIMUM TOTAL: 20-30 tâches actionnables

2. NIVEAU DE DÉTAIL REQUIS:
   - Chaque tâche doit expliquer QUOI faire, COMMENT le faire, et POURQUOI c'est important
   - Incluez des exemples concrets, des outils spécifiques, des ressources
   - Mentionnez les livrables attendus pour chaque tâche
   - Ajoutez des conseils d'expert et pièges à éviter

3. EXEMPLES DE QUALITÉ ATTENDUE:

❌ INACCEPTABLE:
{
  "title": "Faire une étude de marché",
  "description": "Analyser le marché"
}

✅ EXCELLENT:
{
  "title": "Réaliser une étude de marché approfondie et identifier votre niche",
  "description": "1) Analysez les tendances du marché en utilisant Google Trends, rapports sectoriels et réseaux sociaux. 2) Identifiez 3-5 segments de clients cibles avec personas détaillés (âge, revenus, style de vie, comportements d'achat). 3) Étudiez 5-10 concurrents directs: analysez leurs prix, positionnement, forces/faiblesses, avis clients. 4) Déterminez votre proposition de valeur unique (USP) qui vous différencie. 5) Validez la demande via sondages (min 50 réponses) et interviews clients potentiels (10-15 personnes). LIVRABLE: Document de 10-15 pages avec analyse SWOT, personas clients, positionnement stratégique.",
  "effort": "large",
  "tips": "Utilisez des outils gratuits comme Google Forms pour les sondages, Reddit et Facebook Groups pour trouver votre audience cible. Ne sautez PAS cette étape - 42% des startups échouent par manque d'étude de marché. Passez minimum 2-3 semaines sur cette phase."
}

4. FORMATAGE JSON STRICT:
{
  "overview": "Paragraphe stratégique de 4-6 phrases expliquant la vision globale, les étapes clés et l'approche recommandée pour ce projet spécifique",
  "phases": [
    {
      "name": "Phase 1: Nom de la phase",
      "description": "Description de 2-3 phrases expliquant les objectifs de cette phase et son importance dans le projet global",
      "tasks": [
        {
          "title": "Titre actionnable et spécifique (8-12 mots)",
          "description": "Description TRÈS détaillée de 150-300 mots minimum avec: 1) Étapes précises numérotées, 2) Outils/ressources spécifiques, 3) Livrables attendus, 4) Métriques de succès si applicable",
          "effort": "small|medium|large",
          "order": 1,
          "dependencies": [],
          "tips": "Conseils d'expert concrets, pièges courants à éviter, statistiques pertinentes, ressources recommandées"
        }
      ]
    }
  ],
  "bestPractices": [
    "8-12 conseils stratégiques ultra-spécifiques pour ce type de projet avec exemples concrets"
  ],
  "estimatedDuration": "Estimation réaliste basée sur les meilleures pratiques du secteur"
}

5. ADAPTEZ LE PLAN AU PROJET SPÉCIFIQUE:
   - Pour une marque de vêtements: phases de design, sourcing, production, branding, e-commerce
   - Pour une app mobile: phases de conception UX, développement, tests, marketing, lancement
   - Pour un restaurant: phases de concept, local, permis, menu, staff, marketing

CRÉEZ UN PLAN TELLEMENT DÉTAILLÉ qu'un entrepreneur débutant pourrait le suivre étape par étape sans aide externe. Soyez l'expert consultant que vous embaucheriez pour 5000€.`
    :
    `You are a senior business strategy consultant and project manager with 20 years of experience. Create a COMPLETE, DETAILED, and PROFESSIONAL action plan for this real entrepreneurial project.

PROJECT:
Title: ${title}
Description: ${description || 'No additional description provided'}
${targetEndDate ? `Target Completion Date: ${targetEndDate}` : ''}

CRITICAL INSTRUCTIONS - READ CAREFULLY:

1. MANDATORY STRUCTURE:
   - Divide the project into 4-6 MAJOR PHASES (e.g., Conceptualization, Design & Production, Legal Aspects, Launch, Growth)
   - Each phase must contain 4-8 detailed tasks
   - MINIMUM TOTAL: 20-30 actionable tasks

2. REQUIRED LEVEL OF DETAIL:
   - Each task must explain WHAT to do, HOW to do it, and WHY it's important
   - Include concrete examples, specific tools, resources
   - Mention expected deliverables for each task
   - Add expert advice and pitfalls to avoid

3. QUALITY EXAMPLES EXPECTED:

❌ UNACCEPTABLE:
{
  "title": "Do market research",
  "description": "Analyze the market"
}

✅ EXCELLENT:
{
  "title": "Conduct comprehensive market research and identify your niche",
  "description": "1) Analyze market trends using Google Trends, industry reports, and social media. 2) Identify 3-5 target customer segments with detailed personas (age, income, lifestyle, buying behaviors). 3) Study 5-10 direct competitors: analyze their pricing, positioning, strengths/weaknesses, customer reviews. 4) Determine your unique value proposition (USP) that differentiates you. 5) Validate demand via surveys (min 50 responses) and interviews with potential customers (10-15 people). DELIVERABLE: 10-15 page document with SWOT analysis, customer personas, strategic positioning.",
  "effort": "large",
  "tips": "Use free tools like Google Forms for surveys, Reddit and Facebook Groups to find your target audience. Do NOT skip this step - 42% of startups fail due to lack of market research. Spend minimum 2-3 weeks on this phase."
}

4. STRICT JSON FORMAT:
{
  "overview": "Strategic paragraph of 4-6 sentences explaining the overall vision, key milestones, and recommended approach for this specific project",
  "phases": [
    {
      "name": "Phase 1: Phase name",
      "description": "2-3 sentence description explaining the objectives of this phase and its importance in the overall project",
      "tasks": [
        {
          "title": "Actionable and specific title (8-12 words)",
          "description": "VERY detailed description of 150-300 words minimum with: 1) Numbered precise steps, 2) Specific tools/resources, 3) Expected deliverables, 4) Success metrics if applicable",
          "effort": "small|medium|large",
          "order": 1,
          "dependencies": [],
          "tips": "Concrete expert advice, common pitfalls to avoid, relevant statistics, recommended resources"
        }
      ]
    }
  ],
  "bestPractices": [
    "8-12 ultra-specific strategic tips for this type of project with concrete examples"
  ],
  "estimatedDuration": "Realistic estimate based on industry best practices"
}

5. ADAPT THE PLAN TO THE SPECIFIC PROJECT:
   - For a clothing brand: phases of design, sourcing, production, branding, e-commerce
   - For a mobile app: phases of UX design, development, testing, marketing, launch
   - For a restaurant: phases of concept, location, permits, menu, staff, marketing

CREATE A PLAN SO DETAILED that a beginner entrepreneur could follow it step-by-step without external help. Be the expert consultant you would hire for $5000.`;

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
