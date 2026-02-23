import { describe, it, expect } from 'vitest';
import { scoreCars } from '../../src/scoring/weighted';
import type { Preferences } from '../../src/types/preferences';

function makeCar(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-car',
    make: 'TestMake',
    model: 'TestModel',
    year: 2024,
    vehicleType: 'SUV',
    priceLower: 30000,
    priceUpper: 35000,
    score: null,
    gas: true,
    hybrid: false,
    phev: false,
    ev: false,
    transmission: 'Automatic',
    features: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as any;
}

describe('scoreCars (Weighted Sum)', () => {
  it('scores and sorts by overall with contributions', () => {
    const cars = [
      makeCar({ id: 'a', make: 'BrandA', model: 'X', year: 2020, vehicleType: 'SUV', priceLower: 30000, priceUpper: 35000, gas: true, hybrid: false }),
      makeCar({ id: 'b', make: 'BrandB', model: 'Y', year: 2022, vehicleType: 'Sedan', priceLower: 42000, priceUpper: 45000, gas: false, hybrid: true }),
    ];

    const prefs: Preferences = {
      hardFilters: {
        price: { max: 45000 },
        vehicleType: ['SUV', 'Sedan'],
        fuelType: ['hybrid'],
      },
      weights: { priceFit: 2, fuel: 1, vehicleType: 1 },
      topN: 10,
    };

    const results = scoreCars(cars, prefs);
    expect(results).toHaveLength(2);
    expect(results[0].carId).toBe('b');
    const c = results[0].contributions;
    const sum = (c.priceFit ?? 0) + (c.fuel ?? 0) + (c.vehicleType ?? 0);
    expect(Math.abs(sum - results[0].overall)).toBeLessThan(1e-6);
  });

  it('moves safety score above baseline with CSV-style original feature keys', () => {
    const car = makeCar({
      id: 'csv-safety',
      features: {
        'NCAP': true,
        'Backseat: Isofix': true,
        'Infotainment: Parking Cam': true,
        'Visibility: Side mirrors': true,
        'Visibility: IRVM-Back': true,
        'Visibility: Pillars': true,
        'Backseat: Seat-belts pos': true,
      },
    });

    const prefs: Preferences = {
      weights: { safety: 10, priceFit: 0, fuel: 0, vehicleType: 0, technology: 0, space: 0, performance: 0 },
    };

    const [result] = scoreCars([car], prefs);
    const safetyContrib = result.contributions.safety ?? 0;
    const baseline = 0.5;
    expect(safetyContrib).toBeGreaterThan(baseline);
  });

  it('moves technology score above baseline with CSV-style feature keys', () => {
    const car = makeCar({
      id: 'csv-tech',
      features: {
        "Driver's Display: Easy": true,
        "Driver's Display: Bright": true,
        'Infotainment: Responsive': true,
        'Infotainment: Bright': true,
        'Infotainment: A/C control': true,
        'Infotainment: Vol control': true,
        'Charging ports': true,
      },
    });

    const prefs: Preferences = {
      weights: { technology: 10, priceFit: 0, fuel: 0, vehicleType: 0, safety: 0, space: 0, performance: 0 },
    };

    const [result] = scoreCars([car], prefs);
    const techContrib = result.contributions.technology ?? 0;
    expect(techContrib).toBeGreaterThan(0.5);
  });

  it('moves space score above baseline with CSV-style feature keys', () => {
    const car = makeCar({
      id: 'csv-space',
      features: {
        'Backseat: Headroom': true,
        'Boot lip': true,
        'Flat boot': true,
        'Easily foldable seats': true,
        'Centre cubby': true,
        'Doorbins Front': true,
        'Doorbins Back': true,
        'Cup-holder': true,
        'Glovebox': true,
        'Seatback Pocket': true,
        'Sunglass storage': true,
      },
    });

    const prefs: Preferences = {
      weights: { space: 10, priceFit: 0, fuel: 0, vehicleType: 0, safety: 0, technology: 0, performance: 0 },
    };

    const [result] = scoreCars([car], prefs);
    const spaceContrib = result.contributions.space ?? 0;
    expect(spaceContrib).toBeGreaterThan(0.5);
  });

  it('moves performance score above baseline with CSV-style feature keys', () => {
    const car = makeCar({
      id: 'csv-perf',
      features: {
        'Acceleration': true,
        'Brake': true,
        'Handling': true,
        'Suspension': true,
        'Body roll': true,
        'Engine noise': true,
        'Eco': true,
      },
    });

    const prefs: Preferences = {
      weights: { performance: 10, priceFit: 0, fuel: 0, vehicleType: 0, safety: 0, technology: 0, space: 0 },
    };

    const [result] = scoreCars([car], prefs);
    const perfContrib = result.contributions.performance ?? 0;
    expect(perfContrib).toBeGreaterThan(0.5);
  });
});
