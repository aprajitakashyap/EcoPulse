const { calculateCO2e } = require('./co2_calculator');

describe('CO2e Calculator', () => {
  test('calculates transport emissions correctly', () => {
    const data = { transport: { mode: 'car', distanceKm: 10 } };
    expect(calculateCO2e(data)).toBe(2.0); // 0.20 * 10
  });

  test('calculates diet emissions correctly', () => {
    const data = { diet: { type: 'vegan', days: 2 } };
    expect(calculateCO2e(data)).toBe(4.0); // 2.0 * 2
  });

  test('calculates energy emissions correctly', () => {
    const data = { energy: { kwh: 10 } };
    expect(calculateCO2e(data)).toBe(4.0); // 0.4 * 10
  });

  test('calculates combined emissions correctly', () => {
    const data = {
      transport: { mode: 'bus', distanceKm: 15 }, // 0.10 * 15 = 1.5
      diet: { type: 'omnivore', days: 1 },        // 5.0 * 1 = 5.0
      energy: { kwh: 5 }                          // 0.4 * 5 = 2.0
    };
    expect(calculateCO2e(data)).toBe(8.5); // 1.5 + 5.0 + 2.0
  });

  test('handles missing or invalid inputs gracefully', () => {
    expect(calculateCO2e({})).toBe(0);
    expect(calculateCO2e({ transport: { mode: 'unknown', distanceKm: 10 } })).toBe(0);
  });
});
