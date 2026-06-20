/**
 * @file co2_calculator.test.js
 * @description Comprehensive test suite for the CO2e calculator module.
 * Covers all transport modes, diet types, energy calculations,
 * combined inputs, boundary values, and error handling.
 */

const { calculateCO2e, EMISSION_FACTORS } = require('./co2_calculator');

// ─────────────────────────────────────────────
// Transport
// ─────────────────────────────────────────────
describe('Transport emissions', () => {
  test('car: 0.20 kg/km × 10 km = 2.0 kg', () => {
    expect(calculateCO2e({ transport: { mode: 'car', distanceKm: 10 } })).toBe(2.0);
  });

  test('bus: 0.10 kg/km × 15 km = 1.5 kg', () => {
    expect(calculateCO2e({ transport: { mode: 'bus', distanceKm: 15 } })).toBe(1.5);
  });

  test('train: 0.05 kg/km × 20 km = 1.0 kg', () => {
    expect(calculateCO2e({ transport: { mode: 'train', distanceKm: 20 } })).toBe(1.0);
  });

  test('bike: 0 kg regardless of distance', () => {
    expect(calculateCO2e({ transport: { mode: 'bike', distanceKm: 50 } })).toBe(0);
  });

  test('walk: 0 kg regardless of distance', () => {
    expect(calculateCO2e({ transport: { mode: 'walk', distanceKm: 5 } })).toBe(0);
  });

  test('mode is case-insensitive (CAR → car)', () => {
    expect(calculateCO2e({ transport: { mode: 'CAR', distanceKm: 10 } })).toBe(2.0);
  });

  test('zero distance = 0 kg', () => {
    expect(calculateCO2e({ transport: { mode: 'car', distanceKm: 0 } })).toBe(0);
  });

  test('unknown mode = 0 kg (safe fallback)', () => {
    expect(calculateCO2e({ transport: { mode: 'rocket', distanceKm: 100 } })).toBe(0);
  });

  test('fractional distance: car 7.5 km = 1.5 kg', () => {
    expect(calculateCO2e({ transport: { mode: 'car', distanceKm: 7.5 } })).toBe(1.5);
  });
});

// ─────────────────────────────────────────────
// Diet
// ─────────────────────────────────────────────
describe('Diet emissions', () => {
  test('vegan: 2.0 kg/day × 1 day = 2.0 kg', () => {
    expect(calculateCO2e({ diet: { type: 'vegan', days: 1 } })).toBe(2.0);
  });

  test('vegetarian: 3.0 kg/day × 1 day = 3.0 kg', () => {
    expect(calculateCO2e({ diet: { type: 'vegetarian', days: 1 } })).toBe(3.0);
  });

  test('omnivore: 5.0 kg/day × 1 day = 5.0 kg', () => {
    expect(calculateCO2e({ diet: { type: 'omnivore', days: 1 } })).toBe(5.0);
  });

  test('meat_heavy: 7.0 kg/day × 1 day = 7.0 kg', () => {
    expect(calculateCO2e({ diet: { type: 'meat_heavy', days: 1 } })).toBe(7.0);
  });

  test('multi-day: vegan × 7 days = 14.0 kg', () => {
    expect(calculateCO2e({ diet: { type: 'vegan', days: 7 } })).toBe(14.0);
  });

  test('diet type is case-insensitive (VEGAN → vegan)', () => {
    expect(calculateCO2e({ diet: { type: 'VEGAN', days: 1 } })).toBe(2.0);
  });

  test('zero days = 0 kg', () => {
    expect(calculateCO2e({ diet: { type: 'omnivore', days: 0 } })).toBe(0);
  });

  test('unknown diet type = 0 kg (safe fallback)', () => {
    expect(calculateCO2e({ diet: { type: 'keto', days: 1 } })).toBe(0);
  });
});

// ─────────────────────────────────────────────
// Energy
// ─────────────────────────────────────────────
describe('Energy emissions', () => {
  test('0.4 kg/kWh × 10 kWh = 4.0 kg', () => {
    expect(calculateCO2e({ energy: { kwh: 10 } })).toBe(4.0);
  });

  test('zero kWh = 0 kg', () => {
    expect(calculateCO2e({ energy: { kwh: 0 } })).toBe(0);
  });

  test('fractional kWh: 2.5 kWh = 1.0 kg', () => {
    expect(calculateCO2e({ energy: { kwh: 2.5 } })).toBe(1.0);
  });
});

// ─────────────────────────────────────────────
// Combined
// ─────────────────────────────────────────────
describe('Combined emissions', () => {
  test('bus 15km + omnivore + 5kWh = 8.5 kg', () => {
    expect(calculateCO2e({
      transport: { mode: 'bus', distanceKm: 15 },  // 1.5
      diet:      { type: 'omnivore', days: 1 },    // 5.0
      energy:    { kwh: 5 },                        // 2.0
    })).toBe(8.5);
  });

  test('car 20km + meat_heavy + 10kWh = 15.0 kg', () => {
    expect(calculateCO2e({
      transport: { mode: 'car', distanceKm: 20 },   // 4.0
      diet:      { type: 'meat_heavy', days: 1 },   // 7.0
      energy:    { kwh: 10 },                        // 4.0
    })).toBe(15.0);
  });

  test('bike + vegan (no energy) = diet only', () => {
    expect(calculateCO2e({
      transport: { mode: 'bike', distanceKm: 10 },  // 0
      diet:      { type: 'vegan', days: 1 },        // 2.0
    })).toBe(2.0);
  });

  test('result is rounded to 2 decimal places', () => {
    // car 1km = 0.20, vegan 1day = 2.0, energy 0.1kWh = 0.04 → 2.24
    const result = calculateCO2e({
      transport: { mode: 'car', distanceKm: 1 },
      diet:      { type: 'vegan', days: 1 },
      energy:    { kwh: 0.1 },
    });
    expect(result).toBe(2.24);
    // Verify max 2 decimal places
    expect(result.toString().replace(/^\d+\.?/, '').length).toBeLessThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────
// Edge cases & error handling
// ─────────────────────────────────────────────
describe('Edge cases and error handling', () => {
  test('empty object returns 0', () => {
    expect(calculateCO2e({})).toBe(0);
  });

  test('missing transport distanceKm is ignored', () => {
    expect(calculateCO2e({ transport: { mode: 'car' } })).toBe(0);
  });

  test('missing diet days is ignored', () => {
    expect(calculateCO2e({ diet: { type: 'vegan' } })).toBe(0);
  });

  test('null transport is ignored', () => {
    expect(calculateCO2e({ transport: null, diet: { type: 'vegan', days: 1 } })).toBe(2.0);
  });

  test('null diet is ignored', () => {
    expect(calculateCO2e({ transport: { mode: 'car', distanceKm: 10 }, diet: null })).toBe(2.0);
  });

  test('returns a number, not a string', () => {
    expect(typeof calculateCO2e({ transport: { mode: 'car', distanceKm: 10 } })).toBe('number');
  });
});

// ─────────────────────────────────────────────
// Emission factor constants
// ─────────────────────────────────────────────
describe('EMISSION_FACTORS constants', () => {
  test('all transport modes are defined', () => {
    ['car', 'bus', 'train', 'bike', 'walk'].forEach(mode => {
      expect(EMISSION_FACTORS.transport[mode]).toBeDefined();
    });
  });

  test('all diet types are defined', () => {
    ['vegan', 'vegetarian', 'omnivore', 'meat_heavy'].forEach(type => {
      expect(EMISSION_FACTORS.diet[type]).toBeDefined();
    });
  });

  test('emission factors are non-negative numbers', () => {
    Object.values(EMISSION_FACTORS.transport).forEach(v => expect(v).toBeGreaterThanOrEqual(0));
    Object.values(EMISSION_FACTORS.diet).forEach(v => expect(v).toBeGreaterThanOrEqual(0));
    expect(EMISSION_FACTORS.energy.electricity).toBeGreaterThan(0);
  });

  test('meat_heavy > omnivore > vegetarian > vegan (diet ranking)', () => {
    const d = EMISSION_FACTORS.diet;
    expect(d.meat_heavy).toBeGreaterThan(d.omnivore);
    expect(d.omnivore).toBeGreaterThan(d.vegetarian);
    expect(d.vegetarian).toBeGreaterThan(d.vegan);
  });

  test('car > bus > train (transport ranking)', () => {
    const t = EMISSION_FACTORS.transport;
    expect(t.car).toBeGreaterThan(t.bus);
    expect(t.bus).toBeGreaterThan(t.train);
    expect(t.train).toBeGreaterThan(0);
  });
});
