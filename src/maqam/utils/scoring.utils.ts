export function clampScore(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function average(values: number[]): number {
  const clean = values.filter((value) => Number.isFinite(value));

  if (!clean.length) return 0;

  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

export function weightedAverage(
  items: Array<{ value: number; weight: number }>
): number {
  const clean = items.filter(
    (item) => Number.isFinite(item.value) && Number.isFinite(item.weight)
  );

  const totalWeight = clean.reduce((sum, item) => sum + item.weight, 0);

  if (!totalWeight) return 0;

  return (
    clean.reduce((sum, item) => sum + item.value * item.weight, 0) /
    totalWeight
  );
}

export function variance(values: number[]): number {
  const clean = values.filter((value) => Number.isFinite(value));

  if (clean.length < 2) return 0;

  const avg = average(clean);

  return average(clean.map((value) => Math.pow(value - avg, 2)));
}

export function normalizeRatio(value: number, maxExpected: number): number {
  if (maxExpected <= 0) return 0;
  return clampScore((value / maxExpected) * 100);
}

export function scoreDistanceFromIdeal(params: {
  value: number;
  ideal: number;
  tolerance: number;
}): number {
  const distance = Math.abs(params.value - params.ideal);

  if (distance <= params.tolerance) return 100;

  return clampScore(100 - (distance - params.tolerance) * 8);
}
