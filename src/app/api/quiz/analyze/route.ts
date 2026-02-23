export const runtime = 'nodejs';

import { cacheGet, cacheSet } from '@/lib/cache';
import { preferenceSignature } from '@/utils/hash';
import { withTelemetry } from '@/lib/telemetry';
import { QuizV2AnswersSchema } from '@/lib/api-schemas';
import { derivePreferences } from '@/lib/quiz/v2/derivePreferences';

const QUIZ_CACHE_TTL = Number(process.env.QUIZ_CACHE_TTL_SECONDS ?? '21600');

interface CachedResult {
  preferences: unknown;
  reasoning: string;
  criteriaImportance: Record<string, number>;
  mustHaves?: string[];
  avoid?: string[];
}

async function handler(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const payload = body as { answers?: unknown };
  if (!payload.answers || typeof payload.answers !== 'object') {
    return new Response(JSON.stringify({ error: 'No quiz answers provided' }), { status: 400 });
  }

  const parsed = QuizV2AnswersSchema.safeParse(payload.answers);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid quiz answers', details: parsed.error.flatten() }),
      { status: 400 },
    );
  }

  const cacheKey = `quiz:v2:${preferenceSignature(parsed.data)}`;
  const cached = await cacheGet<CachedResult>(cacheKey);
  if (cached) return Response.json(cached);

  const derived = derivePreferences(parsed.data);

  const preferences = {
    hardFilters: derived.hardFilters,
    weights: derived.weights,
    criteriaImportance: derived.criteriaImportance,
    topN: 20,
  };

  const result: CachedResult = {
    preferences,
    reasoning: derived.reasoning,
    criteriaImportance: derived.criteriaImportance,
    mustHaves: derived.mustHaves,
    avoid: derived.avoid,
  };

  await cacheSet(cacheKey, result, QUIZ_CACHE_TTL);
  return Response.json(result);
}

export const POST = withTelemetry('/api/quiz/analyze', handler);
