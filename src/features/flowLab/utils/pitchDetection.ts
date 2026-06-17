export function detectYinPitch(signal: Float32Array, sampleRate: number): number {
  // Simple Autocorrelation as pitch estimation fallback
  let bestPeriod = -1;
  let bestR = -1;
  const maxShift = Math.floor(sampleRate / 50); // Min 50 Hz
  const minShift = Math.floor(sampleRate / 2000); // Max 2000 Hz
  
  for (let shift = minShift; shift < maxShift; shift++) {
    let r = 0;
    for (let i = 0; i < signal.length - shift; i++) {
      r += signal[i] * signal[i + shift];
    }
    if (r > bestR) {
      bestR = r;
      bestPeriod = shift;
    }
  }
  
  if (bestPeriod === -1) return 0;
  return sampleRate / bestPeriod;
}
