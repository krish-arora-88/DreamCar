import OpenAI from 'openai';

let _instance: OpenAI | null = null;

/**
 * Ensure `url` ends with `/openai/v1/`.
 * Handles bare `https://x.openai.azure.com` as well as partial paths.
 */
export function normalizeAzureBaseURL(url: string): string {
  let u = url.replace(/\/+$/, '');
  if (!u.endsWith('/openai/v1')) {
    if (!u.endsWith('/openai')) {
      u += '/openai';
    }
    u += '/v1';
  }
  return u + '/';
}

function isAzure(): boolean {
  return !!process.env.AZURE_OPENAI_API_KEY;
}

/**
 * Return a singleton OpenAI client configured for Azure (preferred) or
 * vanilla OpenAI (fallback).
 *
 * Throws only when actually called — build-time imports are safe.
 */
export function getOpenAI(): OpenAI {
  if (_instance) return _instance;

  const apiKey =
    process.env.AZURE_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'LLM not configured. Set AZURE_OPENAI_API_KEY (preferred) or OPENAI_API_KEY.',
    );
  }

  let baseURL: string | undefined;

  if (isAzure()) {
    const raw =
      process.env.AZURE_OPENAI_BASE_URL ?? process.env.OPENAI_BASE_URL;
    if (!raw) {
      throw new Error(
        'AZURE_OPENAI_API_KEY is set but AZURE_OPENAI_BASE_URL is missing. ' +
          'Set it to https://<RESOURCE>.openai.azure.com/openai/v1/',
      );
    }
    baseURL = normalizeAzureBaseURL(raw);
  } else if (process.env.OPENAI_BASE_URL) {
    baseURL = process.env.OPENAI_BASE_URL;
  }

  _instance = new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
    timeout: Number(process.env.OPENAI_TIMEOUT_MS ?? '20000'),
    maxRetries: Number(process.env.OPENAI_MAX_RETRIES ?? '2'),
  });

  return _instance;
}

/** Lazy proxy — safe to import at module scope without triggering env checks. */
export const openai: OpenAI = new Proxy({} as OpenAI, {
  get(_target, prop, receiver) {
    return Reflect.get(getOpenAI(), prop, receiver);
  },
});

/**
 * Returns true when LLM env vars are configured (Azure or vanilla OpenAI).
 * Use this to gate optional LLM endpoints gracefully.
 */
export function isLLMConfigured(): boolean {
  return !!(process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY);
}

/** @internal Reset singleton — for tests only. */
export function _resetForTests(): void {
  _instance = null;
}
