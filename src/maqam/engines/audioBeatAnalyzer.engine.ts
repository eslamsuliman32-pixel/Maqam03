import type {
  AudioAnalysisConfig,
  AudioBeatAnalysisResult,
  AudioBeatTrackingResult,
  AudioDecodedBufferInfo,
  AudioEnergyFrame,
  AudioOnset,
  BpmCandidate,
} from "../types/audioAnalysis.types";
import type { BeatPosition } from "../types/beatGrid.types";
import { clampScore } from "../utils/scoring.utils";

const DEFAULT_AUDIO_ANALYSIS_CONFIG: AudioAnalysisConfig = {
  minBpm: 60,
  maxBpm: 180,
  onsetSensitivity: 1.45,
  frameSize: 2048,
  hopSize: 512,
  smoothingFrames: 4,
  beatsPerBar: 4,
  beatOffsetMs: undefined,
};

function mergeConfig(
  input?: Partial<AudioAnalysisConfig>
): AudioAnalysisConfig {
  return {
    ...DEFAULT_AUDIO_ANALYSIS_CONFIG,
    ...input,
    minBpm: Math.max(40, input?.minBpm ?? DEFAULT_AUDIO_ANALYSIS_CONFIG.minBpm),
    maxBpm: Math.min(240, input?.maxBpm ?? DEFAULT_AUDIO_ANALYSIS_CONFIG.maxBpm),
    onsetSensitivity: Math.max(
      0.7,
      Math.min(3.5, input?.onsetSensitivity ?? DEFAULT_AUDIO_ANALYSIS_CONFIG.onsetSensitivity)
    ),
    frameSize: input?.frameSize ?? DEFAULT_AUDIO_ANALYSIS_CONFIG.frameSize,
    hopSize: input?.hopSize ?? DEFAULT_AUDIO_ANALYSIS_CONFIG.hopSize,
    smoothingFrames: Math.max(
      1,
      input?.smoothingFrames ?? DEFAULT_AUDIO_ANALYSIS_CONFIG.smoothingFrames
    ),
    beatsPerBar: Math.max(
      2,
      Math.min(8, input?.beatsPerBar ?? DEFAULT_AUDIO_ANALYSIS_CONFIG.beatsPerBar)
    ),
  };
}

function getAudioContext(): AudioContext {
  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextCtor) {
    throw new Error("Web Audio API is not supported in this browser.");
  }

  return new AudioContextCtor();
}

async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = getAudioContext();

  try {
    return await audioContext.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await audioContext.close().catch(() => undefined);
  }
}

function audioBufferInfo(buffer: AudioBuffer): AudioDecodedBufferInfo {
  return {
    durationMs: buffer.duration * 1000,
    sampleRate: buffer.sampleRate,
    numberOfChannels: buffer.numberOfChannels,
    length: buffer.length,
  };
}

function toMono(buffer: AudioBuffer): Float32Array {
  const mono = new Float32Array(buffer.length);

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);

    for (let i = 0; i < buffer.length; i += 1) {
      mono[i] += data[i] / buffer.numberOfChannels;
    }
  }

  return mono;
}

function rms(samples: Float32Array, start: number, size: number): number {
  let sum = 0;
  const end = Math.min(samples.length, start + size);

  for (let i = start; i < end; i += 1) {
    sum += samples[i] * samples[i];
  }

  const count = Math.max(1, end - start);

  return Math.sqrt(sum / count);
}

function median(values: number[]): number {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(values: number[]): number {
  if (!values.length) return 0;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;

  const avg = mean(values);
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) /
    values.length;

  return Math.sqrt(variance);
}

function smoothFlux(
  frames: AudioEnergyFrame[],
  smoothingFrames: number
): AudioEnergyFrame[] {
  return frames.map((frame, index) => {
    const from = Math.max(0, index - smoothingFrames);
    const to = Math.min(frames.length, index + smoothingFrames + 1);
    const local = frames.slice(from, to);

    return {
      ...frame,
      smoothedFlux: mean(local.map((item) => item.flux)),
    };
  });
}

function calculateEnergyFrames(params: {
  mono: Float32Array;
  sampleRate: number;
  frameSize: number;
  hopSize: number;
  smoothingFrames: number;
}): AudioEnergyFrame[] {
  const frames: AudioEnergyFrame[] = [];

  let previousRms = 0;
  let frameIndex = 0;

  for (
    let start = 0;
    start + params.frameSize <= params.mono.length;
    start += params.hopSize
  ) {
    const frameRms = rms(params.mono, start, params.frameSize);
    const positiveFlux = Math.max(0, frameRms - previousRms);
    const timeMs = (start / params.sampleRate) * 1000;

    frames.push({
      index: frameIndex,
      timeMs,
      rms: frameRms,
      flux: positiveFlux,
      smoothedFlux: positiveFlux,
    });

    previousRms = frameRms;
    frameIndex += 1;
  }

  return smoothFlux(frames, params.smoothingFrames);
}

function detectOnsets(params: {
  frames: AudioEnergyFrame[];
  sensitivity: number;
  minDistanceMs: number;
}): AudioOnset[] {
  const fluxValues = params.frames.map((frame) => frame.smoothedFlux);
  const med = median(fluxValues);
  const sd = standardDeviation(fluxValues);
  const threshold = med + sd * params.sensitivity;

  const onsets: AudioOnset[] = [];
  let lastOnsetTimeMs = -Infinity;

  for (let i = 1; i < params.frames.length - 1; i += 1) {
    const previous = params.frames[i - 1];
    const current = params.frames[i];
    const next = params.frames[i + 1];

    const isLocalPeak =
      current.smoothedFlux > previous.smoothedFlux &&
      current.smoothedFlux >= next.smoothedFlux;

    const isAboveThreshold = current.smoothedFlux > threshold;
    const isFarEnough = current.timeMs - lastOnsetTimeMs >= params.minDistanceMs;

    if (!isLocalPeak || !isAboveThreshold || !isFarEnough) continue;

    const confidence =
      sd <= 0
        ? 0.5
        : Math.min(1, (current.smoothedFlux - threshold) / (sd * 3));

    onsets.push({
      index: onsets.length,
      timeMs: current.timeMs,
      strength: current.smoothedFlux,
      confidence,
    });

    lastOnsetTimeMs = current.timeMs;
  }

  return onsets;
}

function normalizeIntervalToBpm(params: {
  intervalMs: number;
  minBpm: number;
  maxBpm: number;
}): number | null {
  if (params.intervalMs <= 0) return null;

  let bpm = 60000 / params.intervalMs;

  while (bpm < params.minBpm) bpm *= 2;
  while (bpm > params.maxBpm) bpm /= 2;

  if (bpm < params.minBpm || bpm > params.maxBpm) return null;

  return bpm;
}

function estimateBpmCandidates(params: {
  onsets: AudioOnset[];
  minBpm: number;
  maxBpm: number;
}): BpmCandidate[] {
  const bucketSize = 1;
  const buckets = new Map<number, { bpm: number; score: number; intervalMs: number }>();

  for (let i = 0; i < params.onsets.length; i += 1) {
    for (let j = i + 1; j < Math.min(params.onsets.length, i + 12); j += 1) {
      const intervalMs = params.onsets[j].timeMs - params.onsets[i].timeMs;

      if (intervalMs < 180 || intervalMs > 2500) continue;

      const bpm = normalizeIntervalToBpm({
        intervalMs,
        minBpm: params.minBpm,
        maxBpm: params.maxBpm,
      });

      if (!bpm) continue;

      const bucket = Math.round(bpm / bucketSize) * bucketSize;
      const onsetStrength =
        params.onsets[i].confidence * params.onsets[j].confidence;
      const distanceWeight = 1 / Math.sqrt(j - i);
      const score = Math.max(0.01, onsetStrength * distanceWeight);

      const existing = buckets.get(bucket);

      if (existing) {
        existing.score += score;
      } else {
        buckets.set(bucket, {
          bpm: bucket,
          score,
          intervalMs: 60000 / bucket,
        });
      }
    }
  }

  const candidates = [...buckets.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const topScore = candidates[0]?.score ?? 1;

  return candidates.map((candidate) => ({
    ...candidate,
    score: clampScore((candidate.score / topScore) * 100),
  }));
}

function findBestBeatOffset(params: {
  onsets: AudioOnset[];
  bpm: number;
  fallbackOffsetMs: number;
}): { offsetMs: number; confidence: number } {
  if (!params.onsets.length) {
    return {
      offsetMs: params.fallbackOffsetMs,
      confidence: 0,
    };
  }

  const beatMs = 60000 / params.bpm;
  const firstSearchWindowMs = Math.min(beatMs, 1000);
  const candidateStepMs = 10;

  let bestOffsetMs = params.fallbackOffsetMs;
  let bestScore = -Infinity;

  for (
    let candidateOffset = 0;
    candidateOffset <= firstSearchWindowMs;
    candidateOffset += candidateStepMs
  ) {
    let score = 0;

    for (const onset of params.onsets) {
      const rawBeat = (onset.timeMs - candidateOffset) / beatMs;
      const nearestBeat = Math.round(rawBeat);
      const distance = Math.abs(rawBeat - nearestBeat);
      const closeness = Math.max(0, 1 - distance * 2.5);

      score += closeness * onset.confidence;
    }

    if (score > bestScore) {
      bestScore = score;
      bestOffsetMs = candidateOffset;
    }
  }

  const maxPossible = Math.max(
    1,
    params.onsets.reduce((sum, onset) => sum + onset.confidence, 0)
  );

  return {
    offsetMs: bestOffsetMs,
    confidence: Math.min(1, bestScore / maxPossible),
  };
}

function beatStrength(
  beatIndex: number,
  beatsPerBar: number
): BeatPosition["strength"] {
  const beatInBar = beatIndex % beatsPerBar;

  if (beatInBar === 0) return "downbeat";
  if (beatInBar === 2) return "strong";
  if (beatInBar === beatsPerBar - 1) return "pickup";

  return "weak";
}

function createRealBeatPositions(params: {
  bpm: number;
  beatOffsetMs: number;
  durationMs: number;
  beatsPerBar: number;
}): BeatPosition[] {
  const beatMs = 60000 / params.bpm;
  const totalBeats = Math.ceil(
    Math.max(1, (params.durationMs - params.beatOffsetMs) / beatMs)
  );

  return Array.from({ length: totalBeats }).map((_, beatIndex) => ({
    beatIndex,
    barIndex: Math.floor(beatIndex / params.beatsPerBar),
    beatInBar: beatIndex % params.beatsPerBar,
    timeMs: params.beatOffsetMs + beatIndex * beatMs,
    strength: beatStrength(beatIndex, params.beatsPerBar),
  }));
}

function trackBeats(params: {
  onsets: AudioOnset[];
  durationMs: number;
  config: AudioAnalysisConfig;
}): AudioBeatTrackingResult {
  const bpmCandidates = estimateBpmCandidates({
    onsets: params.onsets,
    minBpm: params.config.minBpm,
    maxBpm: params.config.maxBpm,
  });

  const bestCandidate = bpmCandidates[0];
  const fallbackBpm = 90;

  const bpm = bestCandidate?.bpm ?? fallbackBpm;

  const offset = findBestBeatOffset({
    onsets: params.onsets,
    bpm,
    fallbackOffsetMs: params.config.beatOffsetMs ?? params.onsets[0]?.timeMs ?? 0,
  });

  const beatPositions = createRealBeatPositions({
    bpm,
    beatOffsetMs: params.config.beatOffsetMs ?? offset.offsetMs,
    durationMs: params.durationMs,
    beatsPerBar: params.config.beatsPerBar,
  });

  const bpmConfidence = (bestCandidate?.score ?? 0) / 100;
  const confidence = Math.min(1, bpmConfidence * 0.65 + offset.confidence * 0.35);

  return {
    bpm,
    confidence,
    beatOffsetMs: params.config.beatOffsetMs ?? offset.offsetMs,
    beatsPerBar: params.config.beatsPerBar,
    beatPositions,
    bpmCandidates,
  };
}

export async function analyzeAudioBeatFile(
  file: File,
  inputConfig?: Partial<AudioAnalysisConfig>
): Promise<AudioBeatAnalysisResult> {
  const config = mergeConfig(inputConfig);
  const buffer = await decodeAudioFile(file);
  const info = audioBufferInfo(buffer);
  const mono = toMono(buffer);

  const energyFrames = calculateEnergyFrames({
    mono,
    sampleRate: buffer.sampleRate,
    frameSize: config.frameSize,
    hopSize: config.hopSize,
    smoothingFrames: config.smoothingFrames,
  });

  const onsets = detectOnsets({
    frames: energyFrames,
    sensitivity: config.onsetSensitivity,
    minDistanceMs: 95,
  });

  const beatTracking = trackBeats({
    onsets,
    durationMs: info.durationMs,
    config,
  });

  const warnings: string[] = [];

  if (onsets.length < 8) {
    warnings.push(
      "عدد الـ transients المكتشفة قليل؛ قد يكون الملف هادئًا أو يحتاج حساسية أعلى."
    );
  }

  if (beatTracking.confidence < 0.45) {
    warnings.push(
      "ثقة تقدير الـ BPM منخفضة؛ جرّب تحديد beat offset يدويًا أو استخدام instrumental أو drum stem أوضح."
    );
  }

  return {
    audioInfo: info,
    config,
    energyFrames,
    onsets,
    beatTracking,
    warnings,
  };
}
