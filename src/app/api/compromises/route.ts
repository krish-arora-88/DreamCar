export const runtime = 'nodejs';

import { z } from 'zod';
import { getOpenAI } from '../../../lib/openai';
import { cacheGet, cacheSet } from '../../../lib/cache';
import { preferenceSignature } from '../../../utils/hash';

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

export async function POST(req: Request): Promise<Response> {
  try {
    const body = BodySchema.parse(await req.json());
    const signature = preferenceSignature({ prefs: body.prefs, items: body.items.map((i) => i.carId) });

    const cached = await cacheGet<{ compromises: Record<string, string[]> }>(`comp:${signature}`);
    if (cached) return Response.json({ ...cached, signature });

    const openai = getOpenAI();
    const system = [
      'Generate 2–4 concise bullets per car that explain compromises vs user preferences.',
      'Output STRICT JSON: { items: [{ carId, bullets: string[] }] }.',
      'Bullets must be short, user-facing, and avoid repetition. No markdown.',
    ].join(' ');
    const user = JSON.stringify({
      preferences: body.prefs,
      items: body.items,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.5,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
    });
    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as { items?: Array<{ carId: string; bullets: string[] }> };
    const compromises = Object.fromEntries((parsed.items ?? []).map((it) => [it.carId, it.bullets]));

    const payload = { compromises };
    await cacheSet(`comp:${signature}`, payload);
    return Response.json({ ...payload, signature });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
}


