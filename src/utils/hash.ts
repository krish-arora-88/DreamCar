import { createHash } from 'node:crypto';

function stableSort(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(stableSort);
  }
  if (obj && typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(entries.map(([k, v]) => [k, stableSort(v)]));
  }
  return obj;
}

export function preferenceSignature(input: unknown): string {
  const normalized = stableSort(input);
  const json = JSON.stringify(normalized);
  return createHash('sha256').update(json).digest('hex');
}


