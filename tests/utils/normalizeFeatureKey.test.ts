import { describe, it, expect } from 'vitest';
import { normalizeFeatureKey, normalizeFeatureMap } from '../../src/utils/normalizeFeatureKey';

describe('normalizeFeatureKey', () => {
  it('converts human-readable CSV headers to snake_case', () => {
    expect(normalizeFeatureKey("Driver's Display: Easy")).toBe('driver_s_display_easy');
    expect(normalizeFeatureKey('Backseat: Headroom')).toBe('backseat_headroom');
    expect(normalizeFeatureKey('Infotainment: A/C control')).toBe('infotainment_a_c_control');
    expect(normalizeFeatureKey('Price LL')).toBe('price_ll');
  });

  it('handles apostrophes (straight and curly)', () => {
    expect(normalizeFeatureKey("Driver's Display")).toBe('driver_s_display');
    expect(normalizeFeatureKey('Driver\u2019s Display')).toBe('driver_s_display');
  });

  it('handles slashes and colons', () => {
    expect(normalizeFeatureKey('A/C control')).toBe('a_c_control');
    expect(normalizeFeatureKey('Visibility: Side mirrors')).toBe('visibility_side_mirrors');
    expect(normalizeFeatureKey('Rear A/C, port, Climate')).toBe('rear_a_c_port_climate');
  });

  it('handles already-normalized keys as no-ops', () => {
    expect(normalizeFeatureKey('apple_carplay')).toBe('apple_carplay');
    expect(normalizeFeatureKey('ncap')).toBe('ncap');
  });

  it('collapses multiple underscores and trims', () => {
    expect(normalizeFeatureKey('  foo___bar  ')).toBe('foo_bar');
  });
});

describe('normalizeFeatureMap', () => {
  it('normalizes all keys of a features object', () => {
    const input = {
      "Driver's Display: Easy": true,
      'Backseat: Headroom': true,
      'apple_carplay': true,
    };
    const result = normalizeFeatureMap(input);
    expect(result).toEqual({
      driver_s_display_easy: true,
      backseat_headroom: true,
      apple_carplay: true,
    });
  });
});
