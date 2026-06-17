// src/workers/audioAnalysis.worker.ts
// ─── Elite Web Worker — Off-Thread Audio Engine ──────────

interface AnalyzeMessage {
  type: "ANALYZEFULL";
  channelData: Float32Array;
  sampleRate: number;
}

interface BeatInfo {
  timeMs: number;
  strength: "downbeat" | "strong" | "medium" | "weak";
  bpm: number;
  confidence: number;
}

interface OnsetInfo {
  timeMs: number;
  energy: number;
  spectralFlux: number;
}

interface SectionInfo {
  startMs: number;
  endMs: number;
  label: "intro" | "verse" | "hook" | "bridge" | "outro";
  averageEnergy: number;
}

// ─── FFT Utilities ────────────────────────────────────────
function computeFFT(signal: Float32Array, fftSize: number): Float32Array {
  // Cooley-Tukey Radix-2 DIT FFT
  const n = fftSize;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  const magnitude = new Float32Array(n / 2);

  // Apply Hann window
  for (let i = 0; i < n; i++) {
    const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
    real[i] = (signal[i] ?? 0) * window;
  }

  // Bit-reversal permutation
  let j = 0;
  for (let i = 1; i < n; i++) {
    let bit = n >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;
    if (i < j) {
      const tempReal = real[i]!;
      real[i] = real[j]!;
      real[j] = tempReal;
      const tempImag = imag[i]!;
      imag[i] = imag[j]!;
      imag[j] = tempImag;
    }
  }

  // FFT butterfly operations
  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len;
    const wReal = Math.cos(angle);
    const wImag = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let curReal = 1;
      let curImag = 0;

      for (let k = 0; k < len / 2; k++) {
        const uReal = real[i + k]!;
        const uImag = imag[i + k]!;
        const vReal = real[i + k + len / 2]! * curReal - imag[i + k + len / 2]! * curImag;
        const vImag = real[i + k + len / 2]! * curImag + imag[i + k + len / 2]! * curReal;

        real[i + k] = uReal + vReal;
        imag[i + k] = uImag + vImag;
        real[i + k + len / 2] = uReal - vReal;
        imag[i + k + len / 2] = uImag - vImag;

        const newReal = curReal * wReal - curImag * wImag;
        curImag = curReal * wImag + curImag * wReal;
        curReal = newReal;
      }
    }
  }

  for (let i = 0; i < n / 2; i++) {
    magnitude[i] = Math.sqrt(real[i]! * real[i]! + imag[i]! * imag[i]!);
  }

  return magnitude;
}

// ─── BPM Detection (Autocorrelation Method) ───────────────
function detectBPM(channelData: Float32Array, sampleRate: number): {
  bpm: number;
  confidence: number;
} {
  const hopSize = 512;
  const frameSize = 2048;
  const energyFrames: number[] = [];

  // Compute energy envelope
  for (let i = 0; i + frameSize < channelData.length; i += hopSize) {
    let energy = 0;
    for (let j = i; j < i + frameSize; j++) {
      energy += channelData[j]! * channelData[j]!;
    }
    energyFrames.push(Math.sqrt(energy / frameSize));
  }

  // Autocorrelation for BPM in 60-200 range
  const minLag = Math.floor((sampleRate * 60) / (200 * hopSize));
  const maxLag = Math.floor((sampleRate * 60) / (60 * hopSize));

  let bestLag = minLag;
  let bestCorr = -Infinity;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0;
    const n = energyFrames.length - lag;
    for (let i = 0; i < n; i++) {
      corr += (energyFrames[i] ?? 0) * (energyFrames[i + lag] ?? 0);
    }
    corr /= n;
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  const bpm = (sampleRate * 60) / (bestLag * hopSize);
  const maxEnergy = Math.max(...energyFrames.map(Math.abs));
  const confidence = Math.min(1, bestCorr / (maxEnergy * 2 + 1e-10));

  return { bpm: Math.round(bpm * 10) / 10, confidence };
}

// ─── Beat Tracking ────────────────────────────────────────
function trackBeats(
  channelData: Float32Array,
  sampleRate: number,
  bpm: number
): BeatInfo[] {
  const beatIntervalMs = (60 / bpm) * 1000;
  const totalMs = (channelData.length / sampleRate) * 1000;
  const beats: BeatInfo[] = [];

  let timeMs = 0;
  let beatCount = 0;

  while (timeMs < totalMs) {
    const sampleIndex = Math.floor((timeMs / 1000) * sampleRate);
    const windowSize = Math.floor((20 / 1000) * sampleRate); // 20ms window
    let localEnergy = 0;

    for (let i = sampleIndex; i < Math.min(sampleIndex + windowSize, channelData.length); i++) {
      localEnergy += channelData[i]! * channelData[i]!;
    }
    localEnergy = Math.sqrt(localEnergy / windowSize);

    const beatInMeasure = beatCount % 4;
    let strength: BeatInfo["strength"];

    if (beatInMeasure === 0) strength = "downbeat";
    else if (beatInMeasure === 2) strength = "strong";
    else if (localEnergy > 0.3) strength = "medium";
    else strength = "weak";

    beats.push({
      timeMs,
      strength,
      bpm,
      confidence: Math.min(1, localEnergy * 3),
    });

    timeMs += beatIntervalMs;
    beatCount++;
  }

  return beats;
}

// ─── Onset Detection ──────────────────────────────────────
function detectOnsets(
  channelData: Float32Array,
  sampleRate: number
): OnsetInfo[] {
  const hopSize = 256;
  const fftSize = 1024;
  const onsets: OnsetInfo[] = [];

  let prevMagnitude = new Float32Array(fftSize / 2);

  for (let i = 0; i + fftSize < channelData.length; i += hopSize) {
    const frame = channelData.slice(i, i + fftSize);
    const magnitude = computeFFT(frame, fftSize);

    // Spectral flux (positive differences only — HFC)
    let spectralFlux = 0;
    for (let k = 0; k < fftSize / 2; k++) {
      const diff = magnitude[k]! - prevMagnitude[k]!;
      if (diff > 0) spectralFlux += diff;
    }

    const timeMs = (i / sampleRate) * 1000;
    let energy = 0;
    for (let j = 0; j < frame.length; j++) energy += frame[j]! * frame[j]!;
    energy = Math.sqrt(energy / frame.length);

    if (spectralFlux > 2.0 && energy > 0.01) {
      onsets.push({ timeMs, energy, spectralFlux });
    }

    prevMagnitude = magnitude;
  }

  // Suppress duplicates within 50ms
  return onsets.filter(
    (o, i) => i === 0 || o.timeMs - onsets[i - 1]!.timeMs > 50
  );
}

// ─── Section Detection ────────────────────────────────────
function detectSections(
  channelData: Float32Array,
  sampleRate: number,
  bpm: number
): SectionInfo[] {
  const barsPerSection = 8;
  const samplesPerBar = Math.floor((sampleRate * 60 * 4) / bpm);
  const sections: SectionInfo[] = [];
  const labels: SectionInfo["label"][] = ["intro", "verse", "hook", "bridge", "outro"];

  const totalBars = Math.floor(channelData.length / samplesPerBar);
  const totalSections = Math.min(labels.length, Math.ceil(totalBars / barsPerSection));

  for (let s = 0; s < totalSections; s++) {
    const startSample = s * barsPerSection * samplesPerBar;
    const endSample = Math.min((s + 1) * barsPerSection * samplesPerBar, channelData.length);
    const segment = channelData.slice(startSample, endSample);

    let avgEnergy = 0;
    for (let i = 0; i < segment.length; i++) avgEnergy += segment[i]! * segment[i]!;
    avgEnergy = Math.sqrt(avgEnergy / segment.length);

    sections.push({
      startMs: (startSample / sampleRate) * 1000,
      endMs: (endSample / sampleRate) * 1000,
      label: labels[s] ?? "verse",
      averageEnergy: avgEnergy,
    });
  }

  return sections;
}

// ─── Message Handler ──────────────────────────────────────
self.onmessage = (e: MessageEvent<AnalyzeMessage>) => {
  const { channelData, sampleRate } = e.data;

  try {
    const { bpm, confidence } = detectBPM(channelData, sampleRate);
    const beats = trackBeats(channelData, sampleRate, bpm);
    const onsets = detectOnsets(channelData, sampleRate);
    const sections = detectSections(channelData, sampleRate, bpm);

    const totalDuration = (channelData.length / sampleRate) * 1000;
    const totalBars = Math.floor(bpm * (totalDuration / 60000) * 0.25);

    self.postMessage({
      bpm,
      bpmConfidence: confidence,
      beats,
      onsets,
      sections,
      totalDurationMs: totalDuration,
      totalBars,
      sampleRate,
    });
  } catch (err) {
    self.postMessage({ error: (err as Error).message });
  }
};
