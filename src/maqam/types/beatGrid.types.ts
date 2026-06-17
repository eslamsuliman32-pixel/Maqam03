import type { SongSectionType } from "./maqam.types";

export interface BeatGridConfig {
  bpm: number;
  beatOffsetMs: number;
  beatsPerBar: number;
  subdivision: 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16;
  swing?: number;
}

export interface BeatPosition {
  beatIndex: number;
  barIndex: number;
  beatInBar: number;
  timeMs: number;
  strength: "downbeat" | "strong" | "weak" | "pickup";
}

export interface SyllableTimingUnit {
  token: string;
  tokenIndex: number;
  estimatedSyllables: number;
  startMs: number;
  endMs: number;
  durationMs: number;
  beatIndexStart: number;
  beatIndexEnd: number;
  beatPhaseStart: number;
  beatPhaseEnd: number;
  stressScore: number;
}

export interface BarBeatFit {
  barId: string;
  section: SongSectionType;
  index: number;
  text: string;
  bpm: number;
  startMs: number;
  endMs: number;
  durationMs: number;
  estimatedSyllables: number;
  syllablesPerBeat: number;
  densityScore: number;
  downbeatAlignmentScore: number;
  cadenceLandingScore: number;
  breathWindowScore: number;
  syncopationScore: number;
  grooveScore: number;
  overallBeatFitScore: number;
  timingUnits: SyllableTimingUnit[];
  warnings: string[];
  suggestions: string[];
}

export interface BeatGridAnalysis {
  config: BeatGridConfig;
  beatPositions: BeatPosition[];
  barFits: BarBeatFit[];
  globalBeatFitScore: number;
  averageSyllablesPerBeat: number;
  highestDensityBarId?: string;
  weakestBarId?: string;
  suggestions: string[];
}
