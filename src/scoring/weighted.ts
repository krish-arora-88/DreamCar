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

function computeSafetyScore(car: Car): number {
  const features = (car.features as Record<string, any>) || {};
  let score = 0.5; // baseline

  // Check for safety-related features in the features JSON
  const safetyFeatures = [
    'airbags',
    'abs',
    'stability_control',
    'traction_control',
    'blind_spot',
    'lane_departure',
    'collision_warning',
    'automatic_braking',
    'adaptive_cruise',
    'backup_camera',
    'parking_sensors',
  ];

  let foundFeatures = 0;
  safetyFeatures.forEach((feature) => {
    if (features[feature] === true || features[feature] === 1) {
      foundFeatures++;
    }
  });

  // Boost score based on found features
  score += (foundFeatures / safetyFeatures.length) * 0.5;
  return clamp01(score);
}

function computeTechnologyScore(car: Car): number {
  const features = (car.features as Record<string, any>) || {};
  let score = 0.5;

  const techFeatures = [
    'touchscreen',
    'navigation',
    'bluetooth',
    'apple_carplay',
    'android_auto',
    'wifi',
    'wireless_charging',
    'digital_dash',
    'heads_up_display',
    'remote_start',
    'keyless_entry',
  ];

  let foundFeatures = 0;
  techFeatures.forEach((feature) => {
    if (features[feature] === true || features[feature] === 1) {
      foundFeatures++;
    }
  });

  score += (foundFeatures / techFeatures.length) * 0.5;
  return clamp01(score);
}

function computeSpaceScore(car: Car): number {
  const features = (car.features as Record<string, any>) || {};
  let score = 0.5;

  // Larger vehicles generally have more space
  if (car.vehicleType) {
    const type = car.vehicleType.toLowerCase();
    if (type.includes('suv') || type.includes('van') || type.includes('truck')) {
      score += 0.3;
    } else if (type.includes('sedan') || type.includes('wagon')) {
      score += 0.1;
    }
  }

  // Check for space-related features
  if (features.third_row || features.seating_capacity >= 7) score += 0.2;
  if (features.cargo_space || features.roof_rack) score += 0.1;

  return clamp01(score);
}

function computePerformanceScore(car: Car): number {
  const features = (car.features as Record<string, any>) || {};
  let score = 0.5;

  // Performance indicators
  if (features.horsepower) {
    const hp = Number(features.horsepower);
    if (hp > 300) score += 0.3;
    else if (hp > 200) score += 0.2;
    else if (hp > 150) score += 0.1;
  }

  if (features.turbo || features.supercharged) score += 0.1;
  if (features.awd || features['4wd']) score += 0.1;
  if (car.transmission && car.transmission.toLowerCase().includes('manual')) score += 0.1;

  return clamp01(score);
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
    safety: prefs.weights?.safety,
    technology: prefs.weights?.technology,
    space: prefs.weights?.space,
    performance: prefs.weights?.performance,
  });

  const results: ScoredCarResult[] = cars.map((car) => {
    const priceScore = computePriceFit(car, prefs.hardFilters?.price);
    const fuelScore = fuelMatch(car, prefs.hardFilters?.fuelType);
    const vtScore = vehicleTypeMatch(car, prefs.hardFilters?.vehicleType);
    const safetyScore = computeSafetyScore(car);
    const techScore = computeTechnologyScore(car);
    const spaceScore = computeSpaceScore(car);
    const perfScore = computePerformanceScore(car);

    const contributions: Contribution = {
      priceFit: priceScore * w.priceFit,
      fuel: fuelScore * w.fuel,
      vehicleType: vtScore * w.vehicleType,
      safety: safetyScore * w.safety,
      technology: techScore * w.technology,
      space: spaceScore * w.space,
      performance: perfScore * w.performance,
    };

    const overall =
      (contributions.priceFit ?? 0) +
      (contributions.fuel ?? 0) +
      (contributions.vehicleType ?? 0) +
      (contributions.safety ?? 0) +
      (contributions.technology ?? 0) +
      (contributions.space ?? 0) +
      (contributions.performance ?? 0);

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
