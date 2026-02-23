import { createHash } from 'node:crypto';

function isPrimitive(v: unknown): v is string | number | boolean {
  const t = typeof v;
  return t === 'string' || t === 'number' || t === 'boolean';
}

function stableSort(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    const mapped = obj.map(stableSort);
    if (mapped.length > 0 && mapped.every(isPrimitive)) {
      return [...mapped].sort((a, b) => {
        if (typeof a === typeof b) {
          return a < b ? -1 : a > b ? 1 : 0;
        }
        return String(a).localeCompare(String(b));
      });
    }
    return mapped;
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
