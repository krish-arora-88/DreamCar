import { describe, it, expect } from 'vitest';
import { scoreCars } from '../../src/scoring/weighted';
import type { Preferences } from '../../src/types/preferences';

describe('scoreCars (Weighted Sum)', () => {
  it('scores and sorts by overall with contributions', () => {
    const cars = [
      {
        id: 'a',
        make: 'BrandA',
        model: 'X',
        year: 2020,
        vehicleType: 'SUV',
        priceLower: 30000,
        priceUpper: 35000,
        gas: true,
        hybrid: false,
        phev: false,
        ev: false,
      },
      {
        id: 'b',
        make: 'BrandB',
        model: 'Y',
        year: 2022,
        vehicleType: 'Sedan',
        priceLower: 42000,
        priceUpper: 45000,
        gas: false,
        hybrid: true,
        phev: false,
        ev: false,
      },
    ] as any[];

    const prefs: Preferences = {
      hardFilters: {
        price: { max: 45000 },
        vehicleType: ['SUV', 'Sedan'],
        fuelType: ['hybrid'],
      },
      weights: { priceFit: 2, fuel: 1, vehicleType: 1 },
      topN: 10,
    };

    const results = scoreCars(cars as any, prefs);
    expect(results).toHaveLength(2);
    // Hybrid sedan should rank higher given fuel preference
    expect(results[0].carId).toBe('b');
    // Contributions sum to overall
    const c = results[0].contributions;
    const sum = (c.priceFit ?? 0) + (c.fuel ?? 0) + (c.vehicleType ?? 0);
    expect(Math.abs(sum - results[0].overall)).toBeLessThan(1e-6);
  });
});


