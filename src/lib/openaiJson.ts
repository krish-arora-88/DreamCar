import { getOpenAI } from './openai';
import type OpenAI from 'openai';

export class OpenAIJsonError extends Error {
  constructor(
    message: string,
    public readonly raw: string,
  ) {
    super(message);
    this.name = 'OpenAIJsonError';
  }
}

interface OpenAIJsonOptions {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  endpoint: string;
}

interface OpenAIJsonResult<T> {
  data: T;
  usage: OpenAI.CompletionUsage | undefined;
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall through to brace extraction
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      // Fall through
    }
  }

  throw new OpenAIJsonError('Failed to parse JSON from OpenAI response', raw);
}

export async function openaiJson<T = unknown>(
  opts: OpenAIJsonOptions,
): Promise<OpenAIJsonResult<T>> {
  const client = getOpenAI();
  const start = Date.now();

  const completion = await client.chat.completions.create({
    model: opts.model,
    temperature: opts.temperature ?? 0.3,
    messages: [
      { role: 'system', content: opts.systemPrompt },
      { role: 'user', content: opts.userPrompt },
    ],
    response_format: { type: 'json_object' },
  });

  const latencyMs = Date.now() - start;
  const usage = completion.usage ?? undefined;

  console.log(
    JSON.stringify({
      event: 'openai_request',
      endpoint: opts.endpoint,
      model: opts.model,
      latencyMs,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      totalTokens: usage?.total_tokens,
    }),
  );

  const choice = completion.choices[0];

  if (choice?.finish_reason === 'content_filter') {
    throw new OpenAIJsonError(
      'Azure content filter triggered — the response was blocked. ' +
        'Review your prompt or adjust Azure content filter settings.',
      choice.message?.content ?? '',
    );
  }

  const raw = choice?.message?.content ?? '';

  if (!raw) {
    throw new OpenAIJsonError(
      'Empty response from LLM (possible Azure content filter or model error).',
      '',
    );
  }

  const data = extractJson(raw) as T;

  return { data, usage };
}
