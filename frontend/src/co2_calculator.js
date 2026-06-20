// Emission factors (DEFRA/EPA-style, same as backend)
const EMISSION_FACTORS = {
  transport: { car: 0.20, bus: 0.10, train: 0.05, bike: 0.0, walk: 0.0 },
  diet: { vegan: 2.0, vegetarian: 3.0, omnivore: 5.0, meat_heavy: 7.0 },
  energy: { electricity: 0.4 }
};

export function calculateCO2e(data) {
  let total = 0;
  if (data.transport && data.transport.mode && data.transport.distanceKm !== undefined) {
    const factor = EMISSION_FACTORS.transport[data.transport.mode.toLowerCase()] || 0;
    total += factor * data.transport.distanceKm;
  }
  if (data.diet && data.diet.type && data.diet.days !== undefined) {
    const factor = EMISSION_FACTORS.diet[data.diet.type.toLowerCase()] || 0;
    total += factor * data.diet.days;
  }
  if (data.energy && data.energy.kwh !== undefined) {
    total += EMISSION_FACTORS.energy.electricity * data.energy.kwh;
  }
  return Math.round(total * 100) / 100;
}
