export const runtime = 'nodejs';

import { z } from 'zod';
import { OPENAI_MODELS } from '@/lib/openai';
import { openaiJson } from '@/lib/openaiJson';
import { cacheGet, cacheSet } from '@/lib/cache';
import { preferenceSignature } from '@/utils/hash';
import { withTelemetry } from '@/lib/telemetry';

const ItemSchema = z.object({
  carId: z.string(),
  make: z.string(),
  model: z.string(),
  year: z.number(),
  contributions: z.record(z.number()).optional(),
});

const BodySchema = z.object({
  prefs: z.any(),
  items: z.array(ItemSchema).min(1).max(20),
});

async function handler(req: Request): Promise<Response> {
  const body = BodySchema.parse(await req.json());
  const signature = preferenceSignature({ prefs: body.prefs, items: body.items.map((i) => i.carId) });

  const cached = await cacheGet<{ compromises: Record<string, string[]> }>(`comp:${signature}`);
  if (cached) return Response.json({ ...cached, signature });

  const system = [
    'Generate 2–4 concise bullets per car that explain compromises vs user preferences.',
    'Output STRICT JSON: { items: [{ carId, bullets: string[] }] }.',
    'Bullets must be short, user-facing, and avoid repetition. No markdown.',
  ].join(' ');
  const user = JSON.stringify({
    preferences: body.prefs,
    items: body.items,
  });

  const { data: parsed } = await openaiJson<{ items?: Array<{ carId: string; bullets: string[] }> }>({
    model: OPENAI_MODELS.compromises(),
    systemPrompt: system,
    userPrompt: user,
    temperature: 0.5,
    endpoint: '/api/compromises',
  });

  const compromises = Object.fromEntries((parsed.items ?? []).map((it) => [it.carId, it.bullets]));
  const payload = { compromises };
  await cacheSet(`comp:${signature}`, payload);
  return Response.json({ ...payload, signature });
}

export const POST = withTelemetry('/api/compromises', handler);
