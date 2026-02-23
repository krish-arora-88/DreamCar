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

function featureScore(features: Record<string, unknown>, keys: string[]): number {
  let found = 0;
  for (const key of keys) {
    const v = features[key];
    if (v === true || v === 1) found++;
  }
  return found / keys.length;
}

const SAFETY_FEATURES = [
  'airbags', 'abs', 'stability_control', 'traction_control',
  'blind_spot', 'lane_departure', 'collision_warning', 'automatic_braking',
  'adaptive_cruise', 'backup_camera', 'parking_sensors',
  'ncap', 'backseat_isofix', 'infotainment_parking_cam',
  'visibility_side_mirrors', 'visibility_irvm_back', 'visibility_pillars',
  'backseat_seat_belts_pos',
];

const TECH_FEATURES = [
  'touchscreen', 'navigation', 'bluetooth', 'apple_carplay', 'android_auto',
  'wifi', 'wireless_charging', 'digital_dash', 'heads_up_display',
  'remote_start', 'keyless_entry',
  'driver_s_display_easy', 'driver_s_display_bright',
  'infotainment_responsive', 'infotainment_bright',
  'infotainment_a_c_control', 'infotainment_vol_control',
  'charging_ports',
];

const SPACE_FEATURES = [
  'third_row', 'cargo_space', 'roof_rack',
  'backseat_headroom', 'backseat_kneeroom', 'backseat_incline',
  'backseat_deep_footwell', 'backseat_flat_floor',
  'boot_lip', 'flat_boot', 'easily_foldable_seats', 'load_cover_fits_inside',
  'centre_cubby', 'doorbins_front', 'doorbins_back',
  'cup_holder', 'glovebox', 'seatback_pocket', 'sunglass_storage',
];

const PERFORMANCE_FEATURES = [
  'turbo', 'supercharged', 'awd', '4wd',
  'acceleration', 'brake', 'handling', 'suspension', 'body_roll',
  'engine_noise', 'eco',
];

function computeSafetyScore(features: Record<string, unknown>): number {
  return clamp01(0.5 + featureScore(features, SAFETY_FEATURES) * 0.5);
}

function computeTechnologyScore(features: Record<string, unknown>): number {
  return clamp01(0.5 + featureScore(features, TECH_FEATURES) * 0.5);
}

function computeSpaceScore(car: Car, features: Record<string, unknown>): number {
  let score = 0.5;

  if (car.vehicleType) {
    const type = car.vehicleType.toLowerCase();
    if (type.includes('suv') || type.includes('van') || type.includes('truck')) {
      score += 0.15;
    } else if (type.includes('sedan') || type.includes('wagon')) {
      score += 0.05;
    }
  }

  const seating = features.seating_capacity;
  if (typeof seating === 'number' && seating >= 7) score += 0.1;

  score += featureScore(features, SPACE_FEATURES) * 0.35;
  return clamp01(score);
}

function computePerformanceScore(car: Car, features: Record<string, unknown>): number {
  let score = 0.5;

  if (features.horsepower) {
    const hp = Number(features.horsepower);
    if (hp > 300) score += 0.2;
    else if (hp > 200) score += 0.15;
    else if (hp > 150) score += 0.1;
  }

  if (car.transmission && car.transmission.toLowerCase().includes('manual')) score += 0.05;

  score += featureScore(features, PERFORMANCE_FEATURES) * 0.3;
  return clamp01(score);
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

function deriveWeightsFromCriteria(ci: Record<string, number>): Record<string, number> {
  function avg(keys: readonly string[]): number {
    const vals = keys.map((k) => ci[k]).filter((v) => v != null);
    if (vals.length === 0) return 0.5;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  }
  return {
    priceFit: 1,
    fuel: Math.max(0.1, ci.eco ?? 0.15),
    vehicleType: 1,
    safety: Math.max(0.1, avg(CRITERIA_CATEGORIES.safety)),
    technology: Math.max(0.1, avg(CRITERIA_CATEGORIES.technology)),
    space: Math.max(0.1, avg(CRITERIA_CATEGORIES.space)),
    performance: Math.max(0.1, avg(CRITERIA_CATEGORIES.performance)),
  };
}

export function scoreCars(cars: Car[], prefs: Preferences): ScoredCarResult[] {
  let rawWeights: Record<string, number | undefined> = {
    priceFit: prefs.weights?.priceFit,
    fuel: prefs.weights?.fuel,
    vehicleType: prefs.weights?.vehicleType,
    safety: prefs.weights?.safety,
    technology: prefs.weights?.technology,
    space: prefs.weights?.space,
    performance: prefs.weights?.performance,
  };

  if (prefs.criteriaImportance && Object.keys(prefs.criteriaImportance).length > 0) {
    const derived = deriveWeightsFromCriteria(prefs.criteriaImportance);
    rawWeights = {
      priceFit: prefs.weights?.priceFit ?? derived.priceFit,
      fuel: prefs.weights?.fuel ?? derived.fuel,
      vehicleType: prefs.weights?.vehicleType ?? derived.vehicleType,
      safety: prefs.weights?.safety ?? derived.safety,
      technology: prefs.weights?.technology ?? derived.technology,
      space: prefs.weights?.space ?? derived.space,
      performance: prefs.weights?.performance ?? derived.performance,
    };
  }

  const w = normalizeWeights(rawWeights);

  const results: ScoredCarResult[] = cars.map((car) => {
    const rawFeatures = (car.features as Record<string, unknown>) || {};
    const featuresN = normalizeFeatureMap(rawFeatures);

    const priceScore = computePriceFit(car, prefs.hardFilters?.price);
    const fuelScore = fuelMatch(car, prefs.hardFilters?.fuelType);
    const vtScore = vehicleTypeMatch(car, prefs.hardFilters?.vehicleType);
    const safetyScore = computeSafetyScore(featuresN);
    const techScore = computeTechnologyScore(featuresN);
    const spaceScore = computeSpaceScore(car, featuresN);
    const perfScore = computePerformanceScore(car, featuresN);

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
