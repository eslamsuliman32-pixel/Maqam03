// ═══════════════════════════════════════════════════════════════
//  MAQAM — Audio Analysis Type System
//  النظام الشامل لأنواع بيانات تحليل الصوت
// ═══════════════════════════════════════════════════════════════

export type SectionType = "intro" | "verse" | "hook" | "chorus" | "bridge" | "outro" | "drop";

export type EnergyLevel = "low" | "mid" | "high" | "peak";

export interface OnsetEvent {
  timeSeconds: number;
  barIndex: number;
  beatIndex: number;      // 1–4
  subdivisionIndex: number; // 0–3 (sixteenth notes)
  strength: number;       // 0.0 – 1.0
  type: "kick" | "snare" | "hihat" | "perc" | "unknown";
}

export interface Bar {
  index: number;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  onsets: OnsetEvent[];
  energyLevel: EnergyLevel;
  energyScore: number;    // 0.0 – 1.0
  bassEnergy: number;
  midEnergy: number;
  highEnergy: number;
  hasSilence: boolean;
  silenceRatio: number;   // 0.0 – 1.0
  rhymeSlots: RhymeSlot[];
}

export interface RhymeSlot {
  barIndex: number;
  beatPosition: number;   // 1.0 – 4.75 (beat + subdivision)
  timeSeconds: number;
  slotType: "landing" | "breath" | "pocket" | "ghost";
  confidence: number;
  suggestedSyllableCount: number;
}

export interface SongSection {
  id: string;
  type: SectionType;
  label: string;
  startBar: number;
  endBar: number;
  startTime: number;
  endTime: number;
  barCount: number;
  averageEnergy: number;
  dominantFrequency: "bass" | "mid" | "high";
  colorHex: string;
}

export interface BeatBlueprint {
  metadata: {
    filename: string;
    durationSeconds: number;
    totalBars: number;
    analyzedAt: number;
  };
  tempo: {
    bpm: number;
    bpmStability: number;    // 0.0 – 1.0
    timeSignature: "4/4" | "3/4" | "6/8";
    secondsPerBar: number;
    secondsPerBeat: number;
    gridResolution: number;  // ms per 16th note
  };
  spectral: {
    bassProfile:    number[];  // per bar
    midProfile:     number[];
    highProfile:    number[];
    energyCurve:    number[];  // normalized 0–1
    dominantRange:  "bass-heavy" | "mid-focused" | "high-sharp" | "balanced";
  };
  rhythm: {
    bars:              Bar[];
    kickPositions:     OnsetEvent[];
    snarePositions:    OnsetEvent[];
    hihatPositions:    OnsetEvent[];
    swingFactor:       number;   // 0 = straight, 1 = full swing
  };
  structure: {
    sections:      SongSection[];
    totalSections: number;
    hasIntro:      boolean;
    hasOutro:      boolean;
  };
  rhymeArchitecture: {
    allSlots:         RhymeSlot[];
    primaryLanding:   RhymeSlot[];   // strongest positions
    breathPoints:     RhymeSlot[];
    pocketZones:      RhymeSlot[];
    recommendedFlow:  "on-beat" | "off-beat" | "syncopated" | "triplet";
  };
}

export interface AnalysisState {
  status: "idle" | "loading" | "decoding" | "analyzing" | "complete" | "error";
  progress: number;   // 0–100
  stage: string;
  error?: string;
  blueprint?: BeatBlueprint;
}
