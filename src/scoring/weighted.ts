import type { Preferences, ScoredCarResult, Contribution, FuelKind } from '../types/preferences';
import type { Car } from '@prisma/client';

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
  if (median == null) return 0.5; // neutral when unknown
  if (!price?.max && !price?.min) return 0.5;

  // Prefer max if provided; fall back to min band
  if (price?.max != null) {
    if (median <= price.max) return 1;
    // linear decay until 1.5x max, then 0
    const worst = price.max * 1.5;
    return clamp01(1 - (median - price.max) / (worst - price.max));
  }
  if (price?.min != null) {
    if (median >= price.min) return 1;
    // linear decay down to 0.5x min
    const worst = Math.max(1, price.min * 0.5);
    return clamp01(1 - (price.min - median) / (price.min - worst));
  }
  return 0.5;
}

function hasAnyFuel(car: Car, allowed: FuelKind[]): boolean {
  if (allowed.length === 0) return true;
  return (
    (allowed.includes('gas') && car.gas === true) ||
    (allowed.includes('hybrid') && car.hybrid === true) ||
    (allowed.includes('phev') && car.phev === true) ||
    (allowed.includes('ev') && car.ev === true)
  );
}

function fuelMatch(car: Car, allowed?: FuelKind[]): number {
  if (!allowed || allowed.length === 0) return 0.5;
  return hasAnyFuel(car, allowed) ? 1 : 0;
}

function vehicleTypeMatch(car: Car, allowed?: string[]): number {
  if (!allowed || allowed.length === 0) return 0.5;
  if (car.vehicleType == null) return 0.5;
  return allowed.includes(car.vehicleType) ? 1 : 0;
}

function normalizeWeights(weights: Record<string, number | undefined>, fallback = 1): Record<string, number> {
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
  const w = normalizeWeights({
    priceFit: prefs.weights?.priceFit,
    fuel: prefs.weights?.fuel,
    vehicleType: prefs.weights?.vehicleType,
  });

  const results: ScoredCarResult[] = cars.map((car) => {
    const priceScore = computePriceFit(car, prefs.hardFilters?.price);
    const fuelScore = fuelMatch(car, prefs.hardFilters?.fuelType);
    const vtScore = vehicleTypeMatch(car, prefs.hardFilters?.vehicleType);

    const contributions: Contribution = {
      priceFit: priceScore * w.priceFit,
      fuel: fuelScore * w.fuel,
      vehicleType: vtScore * w.vehicleType,
    };
    const overall = (contributions.priceFit ?? 0) + (contributions.fuel ?? 0) + (contributions.vehicleType ?? 0);

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

