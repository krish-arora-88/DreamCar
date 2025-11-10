import { getRedis } from './redis';

const redis = getRedis();
const DEFAULT_TTL = Number(process.env.CACHE_TTL_SECONDS ?? '86400');

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const value = await redis.get<T>(key);
    return (value as T | null) ?? null;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds = DEFAULT_TTL): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // best-effort
  }
}


