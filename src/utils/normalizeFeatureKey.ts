/**
 * Convert an arbitrary CSV column name (or human label) to a stable snake_case key.
 * E.g. "Driver's Display: Easy" → "driver_s_display_easy"
 *      "Backseat: Headroom"     → "backseat_headroom"
 *      "A/C control"            → "a_c_control"
 */
export function normalizeFeatureKey(str: string): string {
  return str
    .toLowerCase()
    .replace(/['']/g, '_')           // apostrophes
    .replace(/[/:,&]+/g, '_')        // slashes, colons, commas, ampersands
    .replace(/[^a-z0-9_]+/g, '_')    // any remaining non-alphanumeric
    .replace(/_+/g, '_')             // collapse runs of underscores
    .replace(/^_|_$/g, '');          // trim leading/trailing underscores
}

/**
 * Normalize all keys of a features object.
 * Already-normalized keys (containing only [a-z0-9_]) pass through unchanged.
 * Collisions: later values win (rare in practice).
 */
export function normalizeFeatureMap(features: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(features)) {
    result[normalizeFeatureKey(key)] = value;
  }
  return result;
}
