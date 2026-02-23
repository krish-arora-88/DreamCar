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

  it('produces identical hashes for brands arrays in different order', () => {
    const a = { hardFilters: { brands: ['Tesla', 'Toyota', 'Honda'] } };
    const b = { hardFilters: { brands: ['Honda', 'Tesla', 'Toyota'] } };
    expect(preferenceSignature(a)).toBe(preferenceSignature(b));
  });

  it('produces identical hashes for vehicleType arrays in different order', () => {
    const a = { hardFilters: { vehicleType: ['SUV', 'Sedan', 'Truck'] } };
    const b = { hardFilters: { vehicleType: ['Truck', 'SUV', 'Sedan'] } };
    expect(preferenceSignature(a)).toBe(preferenceSignature(b));
  });

  it('produces identical hashes for fuelType arrays in different order', () => {
    const a = { hardFilters: { fuelType: ['ev', 'hybrid', 'gas'] } };
    const b = { hardFilters: { fuelType: ['gas', 'ev', 'hybrid'] } };
    expect(preferenceSignature(a)).toBe(preferenceSignature(b));
  });

  it('sorts numeric arrays deterministically', () => {
    const a = { weights: { values: [3, 1, 2] } };
    const b = { weights: { values: [1, 2, 3] } };
    expect(preferenceSignature(a)).toBe(preferenceSignature(b));
  });

  it('sorts boolean arrays deterministically', () => {
    const a = { flags: [true, false, true] };
    const b = { flags: [false, true, true] };
    expect(preferenceSignature(a)).toBe(preferenceSignature(b));
  });

  it('does not sort arrays of mixed/complex types', () => {
    const a = { items: [{ id: 'b' }, { id: 'a' }] };
    const b = { items: [{ id: 'a' }, { id: 'b' }] };
    expect(preferenceSignature(a)).not.toBe(preferenceSignature(b));
  });
});
