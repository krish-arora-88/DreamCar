import OpenAI from 'openai';

let _instance: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (_instance) return _instance;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  _instance = new OpenAI({
    apiKey,
    timeout: Number(process.env.OPENAI_TIMEOUT_MS ?? '20000'),
    maxRetries: Number(process.env.OPENAI_MAX_RETRIES ?? '2'),
  });
  return _instance;
}

export const openai: OpenAI = new Proxy({} as OpenAI, {
  get(_target, prop, receiver) {
    return Reflect.get(getOpenAI(), prop, receiver);
  },
});

export const OPENAI_MODELS = {
  quiz: () => process.env.OPENAI_MODEL_QUIZ ?? 'gpt-4o-mini',
  prefExtract: () => process.env.OPENAI_MODEL_PREF_EXTRACT ?? 'gpt-4o-mini',
  compromises: () => process.env.OPENAI_MODEL_COMPROMISES ?? 'gpt-4o',
} as const;
