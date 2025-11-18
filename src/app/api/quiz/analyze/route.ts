export const runtime = 'nodejs';

import { openai } from '@/lib/openai';
import type { QuizAnswers, AnalyzedPreferences } from '@/types/quiz';

const ANALYSIS_SYSTEM_PROMPT = `You are an expert car recommendation analyst. Your job is to analyze quiz answers about a person's lifestyle, family, driving habits, and preferences, then determine:

1. Hard filters (price range, vehicle types, fuel types, brands if applicable)
2. Importance weights for different criteria (higher weight = more important to this person)
3. A brief reasoning explaining your analysis

Consider these factors:
- Family with infants → higher weight on safety, space, ISOFIX anchors
- Long commute → higher weight on fuel efficiency, comfort
- City parking → smaller vehicles preferred
- Off-road/harsh weather → AWD/4WD preference, higher ground clearance
- Environmental concern → EV/hybrid preference
- Tech enthusiast → higher weight on technology features
- Cargo needs → larger vehicles, storage capacity
- Budget → price filter

Available weight categories:
- priceFit: How well the price matches their budget
- fuel: Fuel efficiency and type preference
- vehicleType: Body style match (sedan, SUV, truck, etc.)
- safety: Safety features and ratings
- technology: Tech features and connectivity
- space: Interior space and cargo capacity
- performance: Power, handling, driving experience

Return JSON with structure:
{
  "hardFilters": {
    "price": { "max": number },
    "vehicleType": string[],
    "fuelType": ("gas"|"hybrid"|"phev"|"ev")[],
    "year": { "min": number }
  },
  "weights": {
    "priceFit": number,
    "fuel": number,
    "vehicleType": number,
    "safety": number,
    "technology": number,
    "space": number,
    "performance": number
  },
  "reasoning": string
}`;

export async function POST(req: Request): Promise<Response> {
  try {
    const { answers }: { answers: QuizAnswers } = await req.json();

    if (!answers || Object.keys(answers).length === 0) {
      return new Response(JSON.stringify({ error: 'No quiz answers provided' }), { status: 400 });
    }

    // Format answers for GPT
    const formattedAnswers = Object.entries(answers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze these quiz answers and determine the user's car preferences:\n\n${formattedAnswers}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const analysisText = completion.choices[0]?.message?.content;
    if (!analysisText) {
      throw new Error('No response from GPT');
    }

    const analyzed = JSON.parse(analysisText) as AnalyzedPreferences;

    // Validate and set defaults
    const preferences = {
      hardFilters: analyzed.hardFilters || {},
      weights: {
        priceFit: analyzed.weights?.priceFit || 1,
        fuel: analyzed.weights?.fuel || 1,
        vehicleType: analyzed.weights?.vehicleType || 1,
        safety: analyzed.weights?.safety || 1,
        technology: analyzed.weights?.technology || 1,
        space: analyzed.weights?.space || 1,
        performance: analyzed.weights?.performance || 1,
      },
      topN: 20,
    };

    return Response.json({
      preferences,
      reasoning: analyzed.reasoning || 'Analysis completed based on your quiz responses.',
    });
  } catch (error: unknown) {
    console.error('Quiz analysis error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

