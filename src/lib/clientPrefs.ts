const STORAGE_KEY = 'dreamcar:searchState';

export interface SearchState {
  prefs: unknown;
  reasoning?: string;
  criteriaImportance?: Record<string, number>;
  mustHaves?: string[];
  avoid?: string[];
}

export function saveSearchState(state: SearchState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded or SSR – best effort
  }
}

export function loadSearchState(): SearchState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SearchState;
  } catch {
    return null;
  }
}

export function clearSearchState(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // SSR or unavailable – no-op
  }
}
