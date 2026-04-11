import type { Preferences, ScoredCarResult, Contribution, FuelKind } from '../types/preferences';
import type { Car } from '@prisma/client';
import { normalizeFeatureMap } from '../utils/normalizeFeatureKey';
import { CRITERIA_CATEGORIES } from '../config/criteria';

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function pickMedianPrice(car: Car): number | null {
  const lo = car.priceLower ?? null;
  const hi = car.priceUpper ?? null;
  if (lo != null && hi != null) return Math.round((lo + hi) / 2);
  if (lo != null) return lo;
  if (hi != null) return hi;
  return null;
}

function computePriceFit(car: Car, price?: { min?: number; max?: number }): number {
  const median = pickMedianPrice(car);
  if (median == null) return 0.5;
  if (!price?.max && !price?.min) return 0.5;

  if (price?.max != null) {
    if (median <= price.max) return 1;
    const worst = price.max * 1.5;
    return clamp01(1 - (median - price.max) / (worst - price.max));
  }
  if (price?.min != null) {
    if (median >= price.min) return 1;
    const worst = Math.max(1, price.min * 0.5);
    return clamp01(1 - (price.min - median) / (price.min - worst));
  }
  return 0.5;
}

function fuelMatch(car: Car, allowed?: FuelKind[]): number {
  if (!allowed || allowed.length === 0) return 0.5;
  const hasAny =
    (allowed.includes('gas') && car.gas === true) ||
    (allowed.includes('hybrid') && car.hybrid === true) ||
    (allowed.includes('phev') && car.phev === true) ||
    (allowed.includes('ev') && car.ev === true);
  return hasAny ? 1 : 0;
}

/**
 * Score a car against a set of criteria keys, weighted by the user's importance scores.
 *
 * Feature values are interpreted as:
 *   true / 1     → 1.0 (feature confirmed present)
 *   false / 0    → 0.0 (feature confirmed absent)
 *   missing/null → 0.5 (no data — neutral, neither helps nor hurts)
 *
 * When ci is empty (legacy path), falls back to equal weights of 0.15 per criterion.
 */
function weightedCriteriaScore(
  features: Record<string, unknown>,
  keys: readonly string[],
  ci: Record<string, number>,
): number {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const key of keys) {
    const importance = ci[key] ?? 0.15;
    const raw = features[key];
    const score =
      raw === true || raw === 1 ? 1 :
      raw === false || raw === 0 ? 0 :
      0.5;
    weightedSum += importance * score;
    totalWeight += importance;
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
}

/**
 * Returns a multiplier in (0, 1] penalising cars that are confirmed missing
 * a feature the user marked as must-have (importance ≥ 0.85).
 *
 * Each failed must-have multiplies the score by 0.85 (15 % penalty).
 * Missing data (undefined) is not penalised — only explicit false/0.
 */
function computeMustHavePenalty(
  features: Record<string, unknown>,
  ci: Record<string, number>,
): number {
  let penalty = 1.0;
  for (const [key, importance] of Object.entries(ci)) {
    if (importance >= 0.85) {
      const raw = features[key];
      if (raw === false || raw === 0) {
        penalty *= 0.85;
      }
    }
  }
  return penalty;
}

function avgImportance(ci: Record<string, number>, keys: readonly string[]): number {
  const vals = keys.map((k) => ci[k]).filter((v) => v != null);
  if (vals.length === 0) return 0.5;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function normalizeWeights(weights: Record<string, number | undefined>): Record<string, number> {
  const entries = Object.entries(weights).map(([k, v]) => [k, v == null ? 0 : Math.max(0, v)] as const);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total <= 0) {
    const keys = Object.keys(weights);
    const eq = 1 / Math.max(1, keys.length);
    return Object.fromEntries(keys.map((k) => [k, eq])) as Record<string, number>;
  }
  return Object.fromEntries(entries.map(([k, v]) => [k, v / total])) as Record<string, number>;
}

export function scoreCars(cars: Car[], prefs: Preferences): ScoredCarResult[] {
  const hasCriteria = !!(prefs.criteriaImportance && Object.keys(prefs.criteriaImportance).length > 0);
  // ci is the per-criterion importance map; empty object for legacy (no-quiz) path
  const ci: Record<string, number> = hasCriteria ? prefs.criteriaImportance! : {};

  const results: ScoredCarResult[] = cars.map((car) => {
    const rawFeatures = (car.features as Record<string, unknown>) || {};
    const featuresN = normalizeFeatureMap(rawFeatures);

    // ── Per-dimension scores ──────────────────────────────────────────────
    const priceScore = computePriceFit(car, prefs.hardFilters?.price);
    const fuelScore = fuelMatch(car, prefs.hardFilters?.fuelType);

    // Category scores: directly weighted by the user's per-criterion importance.
    // This closes the gap between "what the user said matters" and "what is scored."
    // vehicleType is excluded — it is already enforced as a hard SQL filter.
    const safetyScore = weightedCriteriaScore(featuresN, CRITERIA_CATEGORIES.safety, ci);
    const techScore = weightedCriteriaScore(featuresN, CRITERIA_CATEGORIES.technology, ci);
    const spaceScore = weightedCriteriaScore(featuresN, CRITERIA_CATEGORIES.space, ci);
    const perfScore = weightedCriteriaScore(featuresN, CRITERIA_CATEGORIES.performance, ci);

    // ── Category weights ──────────────────────────────────────────────────
    // When criteriaImportance is present, category weights are derived from the
    // average importance of criteria within each category (matching the scoring).
    // vehicleType is intentionally absent — hard filter makes it non-differentiating.
    const rawWeights: Record<string, number | undefined> = hasCriteria
      ? {
          priceFit:    prefs.weights?.priceFit    ?? 1.0,
          fuel:        prefs.weights?.fuel        ?? Math.max(0.1, ci['eco'] ?? 0.15),
          safety:      prefs.weights?.safety      ?? Math.max(0.1, avgImportance(ci, CRITERIA_CATEGORIES.safety)),
          technology:  prefs.weights?.technology  ?? Math.max(0.1, avgImportance(ci, CRITERIA_CATEGORIES.technology)),
          space:       prefs.weights?.space       ?? Math.max(0.1, avgImportance(ci, CRITERIA_CATEGORIES.space)),
          performance: prefs.weights?.performance ?? Math.max(0.1, avgImportance(ci, CRITERIA_CATEGORIES.performance)),
        }
      : {
          // Legacy path (direct API, no quiz): use provided weights exactly.
          // Unspecified categories default to undefined → 0, so the caller controls
          // the full weight profile. normalizeWeights falls back to equal weights
          // when all values are 0/undefined.
          priceFit:    prefs.weights?.priceFit,
          fuel:        prefs.weights?.fuel,
          safety:      prefs.weights?.safety,
          technology:  prefs.weights?.technology,
          space:       prefs.weights?.space,
          performance: prefs.weights?.performance,
        };

    const w = normalizeWeights(rawWeights);

    const contributions: Contribution = {
      priceFit:    priceScore  * (w.priceFit    ?? 0),
      fuel:        fuelScore   * (w.fuel        ?? 0),
      safety:      safetyScore * (w.safety      ?? 0),
      technology:  techScore   * (w.technology  ?? 0),
      space:       spaceScore  * (w.space       ?? 0),
      performance: perfScore   * (w.performance ?? 0),
    };

    const rawOverall =
      (contributions.priceFit    ?? 0) +
      (contributions.fuel        ?? 0) +
      (contributions.safety      ?? 0) +
      (contributions.technology  ?? 0) +
      (contributions.space       ?? 0) +
      (contributions.performance ?? 0);

    // Apply must-have penalty: cars confirmed missing a feature the user rated
    // as critical (≥ 0.85 importance) are penalised 15 % per failed must-have.
    const penalty = hasCriteria ? computeMustHavePenalty(featuresN, ci) : 1.0;
    const overall = rawOverall * penalty;

    return {
      carId: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      vehicleType: car.vehicleType ?? null,
      priceLower: car.priceLower ?? null,
      priceUpper: car.priceUpper ?? null,
      overall,
      contributions,
    };
  });

  results.sort((a, b) => b.overall - a.overall);
  return results;
}
