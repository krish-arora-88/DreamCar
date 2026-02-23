export const runtime = 'nodejs';

import { z } from 'zod';
import { OPENAI_MODELS } from '@/lib/openai';
import { openaiJson } from '@/lib/openaiJson';
import { withTelemetry } from '@/lib/telemetry';

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

async function handler(req: Request): Promise<Response> {
  const body = (await req.json()) as { prompt?: string; draft?: unknown };
  const prompt = body.prompt ?? '';
  const draft = body.draft ?? {};

  const system = [
    'You extract car search preferences from a user description.',
    'Return STRICT JSON with keys: hardFilters { price {min,max}, vehicleType[], fuelType[], brands[], year {min,max} }, weights {priceFit,fuel,vehicleType}, topN.',
    'Use numbers only. Default to empty arrays or omit keys if unspecified.',
  ].join(' ');
  const user = `User description:\n${prompt}\nDraft JSON (may be partial):\n${JSON.stringify(draft)}`;

  const { data: parsed } = await openaiJson({
    model: OPENAI_MODELS.prefExtract(),
    systemPrompt: system,
    userPrompt: user,
    temperature: 0.2,
    endpoint: '/api/preferences/extract',
  });

  const prefs = PrefsSchema.parse(parsed);
  return Response.json(prefs);
}

export const POST = withTelemetry('/api/preferences/extract', handler);
