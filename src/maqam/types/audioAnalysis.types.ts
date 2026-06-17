import type { BeatPosition } from "./beatGrid.types";

export interface AudioAnalysisConfig {
  minBpm: number;
  maxBpm: number;
  onsetSensitivity: number;
  frameSize: number;
  hopSize: number;
  smoothingFrames: number;
  beatsPerBar: number;
  beatOffsetMs?: number;
}

export interface AudioDecodedBufferInfo {
  durationMs: number;
  sampleRate: number;
  numberOfChannels: number;
  length: number;
}

export interface AudioOnset {
  index: number;
  timeMs: number;
  strength: number;
  confidence: number;
}

export interface AudioEnergyFrame {
  index: number;
  timeMs: number;
  rms: number;
  flux: number;
  smoothedFlux: number;
}

export interface BpmCandidate {
  bpm: number;
  score: number;
  intervalMs: number;
}

export interface AudioBeatTrackingResult {
  bpm: number;
  confidence: number;
  beatOffsetMs: number;
  beatsPerBar: number;
  beatPositions: BeatPosition[];
  bpmCandidates: BpmCandidate[];
}

export interface AudioBeatAnalysisResult {
  audioInfo: AudioDecodedBufferInfo;
  config: AudioAnalysisConfig;
  energyFrames: AudioEnergyFrame[];
  onsets: AudioOnset[];
  beatTracking: AudioBeatTrackingResult;
  warnings: string[];
}

export interface VocalTimingMatch {
  barId: string;
  barIndex: number;
  text: string;
  expectedStartMs: number;
  expectedEndMs: number;
  detectedStartMs: number | null;
  detectedEndMs: number | null;
  timingDeltaMs: number | null;
  confidence: number;
  alignmentScore: number;
  notes: string[];
}

export interface VocalTimingAnalysis {
  matches: VocalTimingMatch[];
  globalVocalAlignmentScore: number;
  detectedVocalOnsets: AudioOnset[];
  suggestions: string[];
}
