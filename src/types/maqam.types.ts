// src/types/maqam.types.ts
// ─── Shared Type System — Elite Edition ──────────────────

export interface BeatBlueprint {
  id: string;
  fileName: string;
  totalDurationMs: number;
  totalBars: number;
  bpm: number;
  timeSignature: [number, number]; // [4, 4]
  key: string | null;
  sections: SectionInfo[];
  createdAt: number;
}

export interface AudioAnalysisResult {
  bpm: number;
  bpmConfidence: number;
  beats: BeatInfo[];
  onsets: OnsetInfo[];
  sections: SectionInfo[];
  totalDurationMs: number;
  totalBars: number;
  sampleRate: number;
}

export interface BeatInfo {
  timeMs: number;
  strength: "downbeat" | "strong" | "medium" | "weak";
  bpm: number;
  confidence: number;
}

export interface OnsetInfo {
  timeMs: number;
  energy: number;
  spectralFlux: number;
}

export interface SectionInfo {
  startMs: number;
  endMs: number;
  label: "intro" | "verse" | "hook" | "bridge" | "outro";
  averageEnergy: number;
}

export interface GridCell {
  cellIndex: number;
  barIndex: number;
  beatInBar: number;
  strength: "downbeat" | "strong" | "medium" | "weak";
  timeMs: number;
  syllable: string;
  moraWeight: number;
  isActive: boolean;
  isPinned: boolean;
  confidence: number;
}

export interface SpectralProfile {
  bass: number;
  mid: number;
  high?: number;
  presence?: number;
}

export interface NarrativeArc {
  id: string;
  strategy: string;
  segments: NarrativeSegment[];
  totalIntensity: number;
}

export interface NarrativeSegment {
  id: string;
  label: string;
  startBar: number;
  endBar: number;
  intensity: number;
  emotionalTag: string;
}

export interface RhymeSlot {
  id: string;
  barIndex: number;
  beatIndex: number;
  timeMs: number;
  slotType: "landing" | "breath" | "pocket" | "ghost" | "anchor" | "echo";
  rhymeGroup: string;
  content: string;
  confidence: number;
  scheme?: string;
  phonemeEnding?: string;
  isLocked?: boolean;
}

export interface IntensityPoint {
  id: string;
  barIndex: number;
  intensity: number;
  label: string;
}

export interface SchemeAnalysis {
  scheme: string;
  matchRate: number;
  suggestions: string[];
}

export interface RewriteSuggestion {
  original: string;
  suggestion: string;
  reason: string;
  delta: number;
}

export interface MaqamError {
  id: string;
  message: string;
  severity: "warning" | "error" | "info";
}
