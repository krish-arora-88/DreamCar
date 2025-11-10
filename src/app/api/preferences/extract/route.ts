export const runtime = 'nodejs';

import { z } from 'zod';
import { getOpenAI } from '../../../../lib/openai';

const PrefsSchema = z.object({
  hardFilters: z
    .object({
      price: z.object({ min: z.number().optional(), max: z.number().optional() }).partial().optional(),
      vehicleType: z.array(z.string()).optional(),
      fuelType: z.array(z.enum(['gas', 'hybrid', 'phev', 'ev'])).optional(),
      brands: z.array(z.string()).optional(),
      year: z.object({ min: z.number().optional(), max: z.number().optional() }).partial().optional(),
    })
    .partial()
    .optional(),
  weights: z
    .object({
      priceFit: z.number().optional(),
      fuel: z.number().optional(),
      vehicleType: z.number().optional(),
    })
    .partial()
    .optional(),
  topN: z.number().optional(),
});

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as { prompt?: string; draft?: unknown };
  const prompt = body.prompt ?? '';
  const draft = body.draft ?? {};

  try {
    const openai = getOpenAI();
    const system = [
      'You extract car search preferences from a user description.',
      'Return STRICT JSON with keys: hardFilters { price {min,max}, vehicleType[], fuelType[], brands[], year {min,max} }, weights {priceFit,fuel,vehicleType}, topN.',
      'Use numbers only. Default to empty arrays or omit keys if unspecified.',
    ].join(' ');
    const user = `User description:\n${prompt}\nDraft JSON (may be partial):\n${JSON.stringify(draft)}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);
    const prefs = PrefsSchema.parse(parsed);
    return Response.json(prefs);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
}


