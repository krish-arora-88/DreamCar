import { describe, it, expect } from 'vitest';
import { PreferencesSchema } from '../../src/lib/api-schemas';

describe('PreferencesSchema', () => {
  it('accepts a valid full preferences object', () => {
    const input = {
      hardFilters: {
        price: { min: 20000, max: 50000 },
        vehicleType: ['SUV', 'Sedan'],
        fuelType: ['gas', 'hybrid'],
        brands: ['Toyota'],
        year: { min: 2020, max: 2025 },
      },
      weights: {
        priceFit: 3,
        fuel: 2,
        vehicleType: 1,
        safety: 2,
        technology: 1,
        space: 1,
        performance: 1,
      },
      topN: 15,
    };
    const result = PreferencesSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('accepts an empty object (all optional)', () => {
    const result = PreferencesSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid fuelType values', () => {
    const result = PreferencesSchema.safeParse({
      hardFilters: { fuelType: ['diesel'] },
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative weight values', () => {
    const result = PreferencesSchema.safeParse({
      weights: { priceFit: -1 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects topN outside 1..100', () => {
    expect(PreferencesSchema.safeParse({ topN: 0 }).success).toBe(false);
    expect(PreferencesSchema.safeParse({ topN: 101 }).success).toBe(false);
    expect(PreferencesSchema.safeParse({ topN: 50 }).success).toBe(true);
  });

  it('rejects topN that is not an integer', () => {
    expect(PreferencesSchema.safeParse({ topN: 5.5 }).success).toBe(false);
  });

  it('rejects non-object input', () => {
    expect(PreferencesSchema.safeParse('string').success).toBe(false);
    expect(PreferencesSchema.safeParse(42).success).toBe(false);
    expect(PreferencesSchema.safeParse(null).success).toBe(false);
  });

  it('rejects year outside 1900..2100', () => {
    expect(
      PreferencesSchema.safeParse({ hardFilters: { year: { min: 1800 } } }).success,
    ).toBe(false);
    expect(
      PreferencesSchema.safeParse({ hardFilters: { year: { max: 2200 } } }).success,
    ).toBe(false);
  });
});
