export type BeatStrength = "downbeat" | "strong" | "weak" | "pickup";
export type SubdivisionRole = "kick" | "snare" | "ghost" | "rest" | "vocal";
export type SectionType = "verse" | "hook" | "bridge" | "intro" | "outro";

export interface SubdivisionSlot {
  position: number;          // 1–16
  symbol: "●" | "○" | "·"; // رمز الشبكة
  role: SubdivisionRole;
  syllable?: string;         // المقطع الصوتي الموزَّع هنا
  wordPart?: string;         // الكلمة المنتمي إليها المقطع
  isRhymeAnchor?: boolean;   // هل هو موقع قافية؟
  isBreathPoint?: boolean;   // هل هو فراغ نَفَس؟
  weight: number;            // ثقل إيقاعي 0–1
}

export interface RhythmicBar {
  barId: string;
  barIndex: number;           // 0-based
  displayIndex: number;       // 1-based للعرض
  section: SectionType;
  text: string;
  slots: SubdivisionSlot[];  // 16 خانة دائماً
  syllableMap: SyllableMapping[];
  beatData: BarBeatMetrics;
  warnings: string[];
  suggestions: string[];
}

export interface SyllableMapping {
  syllable: string;
  word: string;
  wordIndex: number;
  syllableIndex: number;
  assignedSlot: number;       // 1–16
  slotSymbol: "●" | "○" | "·";
  isStressed: boolean;
  durationSlots: number;      // عدد الخانات التي يشغلها
}

export interface BarBeatMetrics {
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
  densityLevel: "sparse" | "balanced" | "dense" | "overflow";
}

export interface RhythmicGridAnalysis {
  config: BeatGridConfig;
  totalBars: number;
  section: SectionType;
  bars: RhythmicBar[];
  globalScore: number;
  averageSyllablesPerBeat: number;
  densityProfile: DensityProfile;
  visualGrid: string;          // الشبكة المرئية الكاملة كنص
  suggestions: string[];
}

export interface DensityProfile {
  sparseCount: number;
  balancedCount: number;
  denseCount: number;
  overflowCount: number;
  peakBarIndex: number;
  weakestBarIndex: number;
}

export interface BeatGridConfig {
  bpm: number;
  beatOffsetMs: number;
  beatsPerBar: number;
  subdivision: number;
  swing: number;
}
