export function detectOnsetPeaks(energyHistory: number[], threshold: number): number[] {
  const peaks: number[] = [];
  for (let i = 1; i < energyHistory.length - 1; i++) {
    if (energyHistory[i] > energyHistory[i - 1] && energyHistory[i] > energyHistory[i + 1]) {
      if (energyHistory[i] > threshold) {
        peaks.push(i);
      }
    }
  }
  return peaks;
}
