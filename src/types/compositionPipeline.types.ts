// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// types/compositionPipeline.types.ts
// أنواع خط أنابيب التأليف الكامل - من المود إلى البار النهائي
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ╔══════════════════════════════════════════════════════════════╗
// ║ 1. المودات / الحالات العاطفية ║
// ╚══════════════════════════════════════════════════════════════╝

export type MoodId =
  | "sadness"
  | "longing"
  | "anger"
  | "pride"
  | "street"
  | "determination"
  | "joy"
  | "reflection";

export interface MoodEnergyRange {
  min: number; // 1-10
  max: number; // 1-10
}

export interface MoodProfile {
  id: MoodId;
  label: string;
  emoji: string;
  description: string;
  energy: MoodEnergyRange;
  bpmRange: { min: number; max: number };
  colorHex: string;
  keywords: string[];
  preferredPhonemes: PhonemePreference;
  preferredRhymes: RhymeEndingId[];
  preferredTechniques: TechniqueId[];
  preferredStructures: SectionType[];
  avoidTechniques: TechniqueId[];
  lyricalDensity: LyricalDensity;
  referenceArtists: string[];
}

export type LyricalDensity = "sparse" | "moderate" | "dense";

export interface PhonemePreference {
  type: PhonemeType;
  weight: number; // 0-1 نسبة التفضيل
}

// ╔══════════════════════════════════════════════════════════════╗
// ║ 2. الفونيمات / الأصوات ║
// ╚══════════════════════════════════════════════════════════════╝

export type PhonemeType =
  | "soft"
  | "hard"
  | "explosive"
  | "fricative"
  | "nasal"
  | "liquid"
  | "emphatic";

export interface PhonemeGroup {
  type: PhonemeType;
  label: string;
  letters: string[];
  emotionalEffect: string;
  examples: string[];
}

export interface PhonemeAnalysisResult {
  dominantGroup: PhonemeType;
  distribution: Record<PhonemeType, number>; // نسبة مئوية لكل مجموعة
  totalPhonemes: number;
  matchScore: number; // 0-100 توافق مع المود المطلوب
  suggestions: string[];
}

// ╔══════════════════════════════════════════════════════════════╗
// ║ 3. القوافي ║
// ╚══════════════════════════════════════════════════════════════╝

export type RhymeEndingId =
  | "ai"
  | "aya"
  | "oof"
  | "an"
  | "ak"
  | "am"
  | "een"
  | "eer"
  | "oo"
  | "na"
  | "ar"
  | "ah";

export interface RhymeEnding {
  id: RhymeEndingId;
  label: string;
  phonetic: string;
  pattern: string;
  examples: string[];
  moodFit: Record<MoodId, number>; // 0-100 توافق مع كل مود
  difficulty: number; // 1-5
  versatility: number; // 1-10
  chainLength: number; // عدد الكلمات المتاحة تقريباً
}

export type RhymeScheme =
  | "AABB" // قافية مزدوجة
  | "ABAB" // قافية متقاطعة
  | "ABBA" // قافية محتضنة
  | "AAAA" // قافية موحدة
  | "ABCB" // قافية حرة جزئية
  | "FREE"; // حرة تماماً

export interface RhymeChain {
  endingId: RhymeEndingId;
  words: string[];
  scheme: RhymeScheme;
  strength: number; // 0-100 قوة الترابط الصوتي
}

export interface RhymeAnalysisResult {
  detectedEnding: RhymeEndingId | null;
  detectedScheme: RhymeScheme;
  consistency: number; // 0-100
  internalRhymes: InternalRhymeMatch[];
  suggestions: RhymeEndingId[];
}

export interface InternalRhymeMatch {
  wordA: string;
  wordB: string;
  positionA: number; // index داخل البار
  positionB: number;
  matchType: "perfect" | "near" | "assonance" | "consonance";
}

// ╔══════════════════════════════════════════════════════════════╗
// ║ 4. التقنيات ║
// ╚══════════════════════════════════════════════════════════════╝

export type TechniqueId =
  | "anaphora"
  | "internal-rhyme"
  | "structural-parallel"
  | "lang-switch"
  | "echo-repeat"
  | "graduated-rhyme"
  | "stretched-hook"
  | "name-drop"
  | "wisdom-close"
  | "tail-rhyme"
  | "soft-phonemes"
  | "hard-phonemes"
  | "long-vowels";

export type TechniqueDifficulty = 1 | 2 | 3 | 4 | 5;

export interface TechniqueDefinition {
  id: TechniqueId;
  label: string;
  emoji: string;
  description: string;
  howTo: string;
  examples: TechniqueExample[];
  difficulty: TechniqueDifficulty;
  moodAffinity: Record<MoodId, number>; // 0-100
  synergiesWith: TechniqueId[];
  conflictsWith: TechniqueId[];
  minBarsNeeded: number;
  tags: string[];
}

export interface TechniqueExample {
  text: string;
  breakdown?: string;
  source?: string;
}

export interface TechniqueUsageRecord {
  techniqueId: TechniqueId;
  barIndex: number;
  sectionIndex: number;
  effectiveness: number; // 0-100 تقييم بعد التوليد
}

// ╔══════════════════════════════════════════════════════════════╗
// ║ 5. الأقسام / البنية ║
// ╚══════════════════════════════════════════════════════════════╝

export type SectionType =
  | "confessional-intro"
  | "hook"
  | "showcase-verse"
  | "rhythmic-escalation"
  | "bridge"
  | "emotional-close"
  | "outro";

export type SectionPosition = "start" | "middle" | "end" | "any";

export interface SectionConfig {
  type: SectionType;
  label: string;
  emoji: string;
  description: string;
  barCount: { min: number; max: number };
  defaultBarCount: number;
  purpose: string;
  requiredTechniques: TechniqueId[];
  suggestedTechniques: TechniqueId[];
  forbiddenTechniques: TechniqueId[];
  intonationGuide: string;
  energyLevel: number; // 1-10
  position: SectionPosition;
}

export interface SectionInstance {
  config: SectionConfig;
  index: number;
  bars: BarInstance[];
  rhymeScheme: RhymeScheme;
  primaryRhyme: RhymeEndingId;
  secondaryRhyme?: RhymeEndingId;
  appliedTechniques: TechniqueId[];
  energyArc: number[]; // مستوى الطاقة لكل بار
  notes?: string;
}

// ╔══════════════════════════════════════════════════════════════╗
// ║ 6. البارات ║
// ╚══════════════════════════════════════════════════════════════╝

export interface BarTemplate {
  id: string;
  label: string;
  skeleton: string; // هيكل البار بمتغيرات
  syllableTarget: { min: number; max: number };
  technique: TechniqueId;
  example: string;
}

export interface BarInstance {
  index: number;
  text: string;
  template?: BarTemplate;
  syllableCount: number;
  rhymeWord: string;
  rhymeEnding: RhymeEndingId | null;
  techniques: TechniqueId[];
  phonemeProfile: PhonemeAnalysisResult;
  internalRhymes: InternalRhymeMatch[];
  energyLevel: number; // 1-10
  language: BarLanguage;
  metadata: BarMetadata;
}

export type BarLanguage = "ar" | "en" | "mixed";

export interface BarMetadata {
  generatedAt: string; // ISO timestamp
  model?: string;
  iteration: number; // عدد مرات إعادة التوليد
  score: BarScore;
  isManuallyEdited: boolean;
  editHistory?: string[];
}

export interface BarScore {
  overall: number; // 0-100
  rhyme: number;
  flow: number;
  meaning: number;
  technique: number;
  phonemeMatch: number;
  moodMatch: number;
}

// ╔══════════════════════════════════════════════════════════════╗
// ║ 7. هيكل التراك الكامل ║
// ╚══════════════════════════════════════════════════════════════╝

export interface TrackBlueprint {
  id: string;
  title: string;
  mood: MoodProfile;
  bpm: number;
  totalBars: number;
  sections: SectionInstance[];
  globalRhymeScheme: RhymeScheme;
  primaryRhyme: RhymeEndingId;
  secondaryRhymes: RhymeEndingId[];
  techniques: TechniqueId[];
  phonemeStrategy: PhonemeType;
  energyCurve: EnergyCurve;
  metadata: TrackMetadata;
}

export interface TrackMetadata {
  createdAt: string;
  updatedAt: string;
  version: number;
  dialect: ArabicDialect;
  targetAudience?: string;
  theme?: string;
  tags: string[];
}

export type ArabicDialect =
  | "msa" // فصحى
  | "egyptian" // مصري
  | "levantine" // شامي
  | "gulf" // خليجي
  | "maghrebi" // مغاربي
  | "iraqi" // عراقي
  | "mixed"; // مختلط

export interface EnergyCurve {
  type: EnergyCurveType;
  points: EnergyCurvePoint[];
}

export type EnergyCurveType =
  | "ascending" // تصاعدي
  | "descending" // تنازلي
  | "wave" // موجي
  | "peak-valley" // قمة ووادي
  | "flat" // ثابت
  | "custom"; // مخصص

export interface EnergyCurvePoint {
  sectionIndex: number;
  barIndex: number;
  energy: number; // 1-10
}

// ╔══════════════════════════════════════════════════════════════╗
// ║ 8. مدخلات ومخرجات خط الأنابيب ║
// ╚══════════════════════════════════════════════════════════════╝

// ── 8.1 مدخل المستخدم الأولي ──

export interface UserInput {
  topic: string;
  mood?: MoodId;
  keywords?: string[];
  preferredRhyme?: RhymeEndingId;
  preferredTechniques?: TechniqueId[];
  dialect?: ArabicDialect;
  barCount?: number;
  bpm?: number;
  referenceTrack?: string;
  freeNotes?: string;
  constraints?: CompositionConstraints;
}

export interface CompositionConstraints {
  maxSyllablesPerBar?: number;
  minSyllablesPerBar?: number;
  forbiddenWords?: string[];
  requiredWords?: string[];
  forcedRhymeScheme?: RhymeScheme;
  avoidTechniques?: TechniqueId[];
  languageRestriction?: BarLanguage;
}

// ── 8.2 مراحل خط الأنابيب ──

export type PipelineStage =
  | "input-parsing"
  | "mood-detection"
  | "structure-planning"
  | "rhyme-selection"
  | "technique-assignment"
  | "bar-generation"
  | "phoneme-analysis"
  | "quality-check"
  | "refinement"
  | "finalization";

export interface PipelineState {
  currentStage: PipelineStage;
  completedStages: PipelineStage[];
  stageResults: Partial<Record<PipelineStage, StageResult>>;
  errors: PipelineError[];
  startedAt: string;
  lastUpdatedAt: string;
  isComplete: boolean;
  progress: number; // 0-100
}

export interface StageResult {
  stage: PipelineStage;
  success: boolean;
  data: unknown;
  duration: number; // بالمللي ثانية
  timestamp: string;
}

export interface PipelineError {
  stage: PipelineStage;
  code: string;
  message: string;
  severity: "warning" | "error" | "fatal";
  recoverable: boolean;
  timestamp: string;
}

// ── 8.3 نتائج المراحل المحددة ──

export interface MoodDetectionResult extends StageResult {
  stage: "mood-detection";
  data: {
    detectedMood: MoodId;
    confidence: number; // 0-1
    secondaryMood?: MoodId;
    reasoning: string;
  };
}

export interface StructurePlanResult extends StageResult {
  stage: "structure-planning";
  data: {
    sections: SectionConfig[];
    totalBars: number;
    energyCurve: EnergyCurve;
  };
}

export interface RhymeSelectionResult extends StageResult {
  stage: "rhyme-selection";
  data: {
    primaryRhyme: RhymeEnding;
    secondaryRhymes: RhymeEnding[];
    scheme: RhymeScheme;
    rhymeChains: RhymeChain[];
  };
}

export interface TechniqueAssignmentResult extends StageResult {
  stage: "technique-assignment";
  data: {
    assignments: SectionTechniqueAssignment[];
    globalTechniques: TechniqueId[];
  };
}

export interface SectionTechniqueAssignment {
  sectionIndex: number;
  sectionType: SectionType;
  techniques: TechniqueId[];
  reasoning: string;
}

export interface BarGenerationResult extends StageResult {
  stage: "bar-generation";
  data: {
    sections: SectionInstance[];
    totalBarsGenerated: number;
    averageScore: number;
  };
}

export interface QualityCheckResult extends StageResult {
  stage: "quality-check";
  data: {
    overallScore: number;
    sectionScores: SectionQualityScore[];
    issues: QualityIssue[];
    passedThreshold: boolean;
  };
}

export interface SectionQualityScore {
  sectionIndex: number;
  scores: BarScore;
  weakBars: number[]; // indexes
}

export interface QualityIssue {
  type: QualityIssueType;
  severity: "low" | "medium" | "high" | "critical";
  barIndex?: number;
  sectionIndex?: number;
  description: string;
  suggestedFix: string;
}

export type QualityIssueType =
  | "broken-rhyme"
  | "syllable-mismatch"
  | "weak-phoneme-match"
  | "technique-missing"
  | "technique-conflict"
  | "energy-inconsistency"
  | "repetitive-vocabulary"
  | "mood-drift"
  | "low-meaning-score"
  | "flow-disruption";

// ╔══════════════════════════════════════════════════════════════╗
// ║ 9. المخرج النهائي ║
// ╚══════════════════════════════════════════════════════════════╝

export interface CompositionOutput {
  track: TrackBlueprint;
  pipeline: PipelineState;
  qualityReport: QualityCheckResult;
  formattedLyrics: FormattedLyrics;
  suggestions: RefinementSuggestion[];
}

export interface FormattedLyrics {
  plain: string; // نص عادي
  markdown: string; // مع تنسيق
  annotated: AnnotatedLine[];
  html?: string;
}

export interface AnnotatedLine {
  sectionIndex: number;
  sectionType: SectionType;
  barIndex: number;
  text: string;
  rhymeWord: string;
  rhymeEndingId: RhymeEndingId | null;
  techniques: TechniqueId[];
  syllableCount: number;
  annotations: LineAnnotation[];
}

export interface LineAnnotation {
  startChar: number;
  endChar: number;
  type: AnnotationType;
  label: string;
  detail?: string;
}

export type AnnotationType =
  | "rhyme-end"
  | "internal-rhyme"
  | "anaphora-anchor"
  | "lang-switch"
  | "name-drop"
  | "echo"
  | "stretch"
  | "wisdom"
  | "phoneme-cluster"
  | "emphasis";

// ╔══════════════════════════════════════════════════════════════╗
// ║ 10. التحسين والتعديل ║
// ╚══════════════════════════════════════════════════════════════╝

export interface RefinementSuggestion {
  id: string;
  type: RefinementType;
  targetBar?: number;
  targetSection?: number;
  currentText?: string;
  suggestedText?: string;
  reason: string;
  impact: number; // 0-100 مقدار التحسن المتوقع
  autoApplicable: boolean;
}

export type RefinementType =
  | "replace-bar"
  | "fix-rhyme"
  | "adjust-syllables"
  | "strengthen-phonemes"
  | "add-technique"
  | "remove-repetition"
  | "boost-energy"
  | "reduce-energy"
  | "improve-meaning"
  | "fix-flow";

export interface RefinementRequest {
  trackId: string;
  targetBars?: number[];
  targetSections?: number[];
  refinementType: RefinementType;
  userFeedback?: string;
  maxIterations?: number;
}

export interface RefinementResult {
  originalBars: BarInstance[];
  refinedBars: BarInstance[];
  scoreDelta: number; // الفرق في النتيجة
  changesApplied: RefinementChange[];
}

export interface RefinementChange {
  barIndex: number;
  field: string;
  oldValue: string;
  newValue: string;
  reason: string;
}

// ╔══════════════════════════════════════════════════════════════╗
// ║ 11. التحليل الإحصائي ║
// ╚══════════════════════════════════════════════════════════════╝

export interface TrackAnalytics {
  trackId: string;
  totalBars: number;
  totalSyllables: number;
  avgSyllablesPerBar: number;
  uniqueWords: number;
  vocabularyRichness: number; // 0-1
  rhymeConsistency: number; // 0-100
  phonemeDistribution: Record<PhonemeType, number>;
  techniqueUsage: Record<TechniqueId, number>;
  moodConsistency: number; // 0-100
  energyVariance: number;
  languageMix: Record<BarLanguage, number>; // نسبة مئوية
  topRhymes: Array<{ ending: RhymeEndingId; count: number }>;
  topWords: Array<{ word: string; count: number }>;
}

// ╔══════════════════════════════════════════════════════════════╗
// ║ 12. أنواع الأحداث (للتتبع والـ UI) ║
// ╚══════════════════════════════════════════════════════════════╝

export type PipelineEventType =
  | "stage:start"
  | "stage:complete"
  | "stage:error"
  | "bar:generated"
  | "bar:refined"
  | "section:complete"
  | "quality:checked"
  | "pipeline:complete"
  | "pipeline:failed";

export interface PipelineEvent {
  type: PipelineEventType;
  stage?: PipelineStage;
  timestamp: string;
  data?: unknown;
  message?: string;
}

export type PipelineEventHandler = (event: PipelineEvent) => void;

// ╔══════════════════════════════════════════════════════════════╗
// ║ 13. إعدادات الضبط العام ║
// ╚══════════════════════════════════════════════════════════════╝

export interface PipelineConfig {
  qualityThreshold: number; // 0-100 الحد الأدنى للقبول
  maxRefinementIterations: number;
  enablePhonemeAnalysis: boolean;
  enableInternalRhymeDetection: boolean;
  strictRhymeMode: boolean; // true = قافية دقيقة فقط
  defaultDialect: ArabicDialect;
  defaultRhymeScheme: RhymeScheme;
  energyCurveType: EnergyCurveType;
  syllableStrictness: "loose" | "moderate" | "strict";
  temperature: number; // 0-1 إبداعية التوليد
  logging: boolean;
  onEvent?: PipelineEventHandler;
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  qualityThreshold: 70,
  maxRefinementIterations: 3,
  enablePhonemeAnalysis: true,
  enableInternalRhymeDetection: true,
  strictRhymeMode: false,
  defaultDialect: "mixed",
  defaultRhymeScheme: "AABB",
  energyCurveType: "wave",
  syllableStrictness: "moderate",
  temperature: 0.7,
  logging: true,
};
