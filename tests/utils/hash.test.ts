import { describe, it, expect } from 'vitest';
import { preferenceSignature } from '../../src/utils/hash';

describe('preferenceSignature', () => {
  it('is stable for same structure regardless of key order', () => {
    const a = { hardFilters: { price: { max: 45000 }, fuelType: ['ev', 'hybrid'] }, weights: { priceFit: 2 } };
    const b = { weights: { priceFit: 2 }, hardFilters: { fuelType: ['ev', 'hybrid'], price: { max: 45000 } } };
    const sigA = preferenceSignature(a);
    const sigB = preferenceSignature(b);
    expect(sigA).toBe(sigB);
    expect(sigA).toMatch(/^[a-f0-9]{64}$/);
  });
});


