export type FlowLayer =
  | "skeleton"
  | "scatting"
  | "intonation"
  | "advanced"
  | "transitions"
  | "layered"
  | "upcoming";

export type MethodologyTab = FlowLayer;

export type RhymeScheme =
  | "AABB"
  | "ABAB"
  | "ABBA"
  | "AAAA"
  | "FREE"
  | "AXAX"
  | "ABCB"
  | "AABA";

export type SyncopationLevel = 1 | 2 | 3 | 4;

export type EmotionType =
  | "rage"
  | "melancholy"
  | "triumph"
  | "sarcasm"
  | "storytelling"
  | "hype"
  | "introspective"
  | "defiant";

export type InstrumentType =
  | "hihat"
  | "kick"
  | "snare"
  | "bass"
  | "melody"
  | "vocal-chop";

export type BeatPattern =
  | "boom-bap"
  | "trap"
  | "drill"
  | "lo-fi"
  | "jazz-rap"
  | "arabic-fusion";

export type TransitionStrategy =
  | "rhythmic"
  | "tonal"
  | "breath"
  | "spillover"
  | "compound";

export type MasteryLevelValue = 1 | 2 | 3 | 4;

// ─── Beat & Bar ───────────────────────────────────────────────────

export interface Beat {
  readonly id: string;
  position: 1 | 2 | 3 | 4;
  syllable: string;
  hasVowel: boolean;
  isSpike: boolean;
  velocity: number;        // 0-100 شدة النطق
  duration: number;        // بالمللي ثانية
  pitchOffset: number;     // انحراف النغمة -12 إلى +12
  instrumentLayer: InstrumentType | null;
  emotionTag: EmotionType | null;
  isRest: boolean;         // سكتة
  isTied: boolean;         // ربط بالدقة التالية
  accent: "strong" | "weak" | "ghost" | "none";
  microTimingOffset: number; // -50ms إلى +50ms (swing/groove)
}

export interface Bar {
  readonly id: string;
  beats: Beat[];
  rhymeEndSound: string;
  flowLayer: FlowLayer;
  bpm: number;
  timeSignature: [number, number]; // e.g. [4, 4]
  swingAmount: number;             // 0-100
  intensityScore: number;          // 0-100 محسوب تلقائياً
  syllableCount: number;
  isAnchor: boolean;               // بار مرجعي
}

export interface Quatrain {
  readonly id: string;
  bars: [Bar, Bar, Bar, Bar];
  rhymeScheme: RhymeScheme;
  overallEmotion: EmotionType;
  transitionIn: TransitionConfig | null;
  transitionOut: TransitionConfig | null;
  coherenceScore: number;  // 0-100
  densityScore: number;    // 0-100 كثافة المقاطع
  dynamicRange: number;    // 0-100 التباين الديناميكي
}

// ─── Syncopation ──────────────────────────────────────────────────

export interface SyncopationConfig {
  level: SyncopationLevel;
  offbeatEmphasis: number;     // 0-100
  ghostNoteFrequency: number;  // 0-100
  swingFactor: number;         // 0-100
  polyrhythmEnabled: boolean;
  tupletMode: "none" | "triplet" | "quintuplet";
}

// ─── Tonal Spikes ─────────────────────────────────────────────────

export interface TonalSpike {
  readonly id: string;
  barId: string;
  beatPosition: 1 | 2 | 3 | 4;
  spikeType: "pitch-rise" | "pitch-drop" | "volume-burst" | "rasp" | "whisper" | "cry";
  intensity: number;      // 0-100
  duration: number;        // ms
  targetSyllable: string;
  emotionIntent: EmotionType;
  visualColor: string;     // للعرض في الـ UI
}

// ─── Beat Ride ────────────────────────────────────────────────────

export interface BeatRideConfig {
  pattern: BeatPattern;
  kickBeats: number[];
  snareBeats: number[];
  hihatPattern: ("closed" | "open" | "none")[];
  explosiveConsonants: string[];
  melodicVowels: string[];
  rideIntensity: number;   // 0-100
  consonantAlignment: number; // 0-100 مدى تطابق الحروف مع الإيقاع
}

// ─── Transitions ──────────────────────────────────────────────────

export interface TransitionConfig {
  readonly id: string;
  strategy: TransitionStrategy;
  fromQuatrainId: string;
  toQuatrainId: string;
  blendDuration: number;    // عدد الدقات للدمج
  smoothness: number;       // 0-100
  breathMarkPosition: number | null;
  spilloverSyllables: string[];
  pitchBridge: number[];    // منحنى الربط النغمي
}

// ─── Scatting ─────────────────────────────────────────────────────

export interface ScatPattern {
  readonly id: string;
  instrument: InstrumentType;
  syllables: string[];
  rhythm: number[];        // نمط زمني
  intensity: number;
  isLooping: boolean;
}

export interface ScattingSession {
  readonly id: string;
  patterns: ScatPattern[];
  targetBpm: number;
  activeInstruments: InstrumentType[];
  recordingBlob: Blob | null;
  confidence: number;      // 0-100
}

// ─── Intonation ───────────────────────────────────────────────────

export interface IntonationCurvePoint {
  time: number;            // 0-1 normalized
  pitch: number;           // 0-100
  emotion: EmotionType;
  label: string;
}

export interface IntonationProfile {
  readonly id: string;
  emotion: EmotionType;
  curve: IntonationCurvePoint[];
  breathPattern: number[];
  dynamicRange: [number, number]; // min-max pitch
  referenceArtist: string;
  practiceNotes: string;
}

// ─── Layered Flow Matrix ──────────────────────────────────────────

export interface LayeredFlowCell {
  beat: Beat;
  skeletonLayer: boolean;
  scattingLayer: ScatPattern | null;
  intonationLayer: IntonationCurvePoint | null;
  tonalSpikeLayer: TonalSpike | null;
  compositeScore: number;  // 0-100
  layerCount: number;      // عدد الطبقات النشطة
  visualIntensity: number; // 0-1 للتلوين
}

export interface LayeredFlowRow {
  bar: Bar;
  cells: LayeredFlowCell[];
}

export interface LayeredFlowMatrix {
  rows: LayeredFlowRow[];
  overallCoherence: number;
  masterySuggestions: string[];
  totalActiveLayers: number;
  weakPoints: { rowIndex: number; cellIndex: number; reason: string }[];
}

// ─── Exercise & Training ──────────────────────────────────────────

export interface FlowExercise {
  readonly id: string;
  title: string;
  description: string;
  targetSkill: FlowLayer;
  difficulty: MasteryLevelValue;
  steps: string[];
  bpmRange: [number, number];
  duration: number;        // بالثواني
  completionCriteria: string;
  isCompleted: boolean;
}

// ─── Analytics ────────────────────────────────────────────────────

export interface FlowAnalytics {
  totalBarsCreated: number;
  averageCoherence: number;
  averageDensity: number;
  strongestLayer: FlowLayer;
  weakestLayer: FlowLayer;
  practiceTimeMinutes: number;
  exercisesCompleted: number;
  lastSessionDate: string;
}

// ─── Store Actions ────────────────────────────────────────────────

export interface FlowMethodologyActions {
  // الهيكل العظمي
  setRhymeScheme: (scheme: RhymeScheme) => void;
  addQuatrain: (quatrain: Quatrain) => void;
  removeQuatrain: (id: string) => void;
  updateBar: (quatrainId: string, barIndex: number, bar: Partial<Bar>) => void;
  setSyncopationLevel: (level: SyncopationLevel) => void;
  updateSyncopationConfig: (config: Partial<SyncopationConfig>) => void;

  // التصميم الصوتي
  addScatPattern: (pattern: ScatPattern) => void;
  removeScatPattern: (id: string) => void;
  updateScattingSession: (session: Partial<ScattingSession>) => void;

  // التنغيم
  setIntonationCurve: (curve: IntonationCurvePoint[]) => void;
  addIntonationProfile: (profile: IntonationProfile) => void;
  removeIntonationProfile: (id: string) => void;

  // التقنيات المتقدمة
  addTonalSpike: (spike: TonalSpike) => void;
  removeTonalSpike: (id: string) => void;
  updateTonalSpike: (id: string, updates: Partial<TonalSpike>) => void;
  setBeatRideConfig: (config: Partial<BeatRideConfig>) => void;

  // الانتقالات
  addTransition: (config: TransitionConfig) => void;
  removeTransition: (id: string) => void;
  updateTransition: (id: string, updates: Partial<TransitionConfig>) => void;

  // الدمج الطبقي
  computeMatrix: () => void;
  refreshMatrix: () => void;

  // عام
  setActiveTab: (tab: MethodologyTab) => void;
  calculateMasteryLevel: () => void;
  resetMethodology: (tab?: MethodologyTab) => void;
  exportState: () => string;
  importState: (json: string) => void;

  // التمارين
  completeExercise: (id: string) => void;
  resetExercises: () => void;

  // التحليلات
  updateAnalytics: () => void;
}

// ─── Root State ───────────────────────────────────────────────────

export interface FlowMethodologyState {
  // الهيكل العظمي
  activeRhymeScheme: RhymeScheme;
  activeQuatrains: Quatrain[];
  syncopationConfig: SyncopationConfig;

  // التصميم الصوتي
  scattingSession: ScattingSession;

  // التنغيم
  intonationCurve: IntonationCurvePoint[];
  intonationProfiles: IntonationProfile[];

  // التقنيات المتقدمة
  tonalSpikes: TonalSpike[];
  beatRideConfig: BeatRideConfig;

  // الانتقالات
  transitionConfigs: TransitionConfig[];

  // الدمج الطبقي
  layeredMatrix: LayeredFlowMatrix | null;

  // حالة UI
  activeMethodologyTab: MethodologyTab;
  masteryLevel: MasteryLevelValue;

  // التمارين
  exercises: FlowExercise[];

  // التحليلات
  analytics: FlowAnalytics;

  // الإجراءات
  actions: FlowMethodologyActions;
}
