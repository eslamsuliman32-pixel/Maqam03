// src/maqam/engines/beatGrid.engine.ts
// v5.0 — Elite Rhythmic Grid Engine
// يعتمد على المحرك الفونيمي الحقيقي بدلاً من التخمين العددي

import type { BarInput } from "../types/maqam.types";
import type {
  BeatGridAnalysis,
  BeatGridConfig,
  BeatPosition,
  BarBeatFit,
} from "../types/beatGrid.types";
import {
  analyzeLinePhonemics,
  type LinePhonemicProfile,
  type ArabicSyllable,
} from "./arabicPhonemics.engine";
import { clampScore, weightedAverage, average, variance } from "../utils/scoring.utils";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES v5
// ─────────────────────────────────────────────────────────────────────────────

export interface SyllableGridCell {
  wordIndex:        number;
  word:             string;
  syllable:         ArabicSyllable;
  startBeat:        number;
  endBeat:          number;
  gridColumn:       number;
  onStrongBeat:     boolean;
  deviation:        number;   // 0–100
  syncopationLevel: "none" | "mild" | "heavy";
  impactScore:      number;   // 0–1 from phonemics
}

export interface BreathGap {
  afterWordIndex: number;
  durationBeats:  number;
  durationMs:     number;
  natural:        boolean;
  adequate:       boolean;   // >= 200ms threshold
}

export interface BeatAlignmentProfile {
  strongBeatWords:   string[];
  weakBeatWords:     string[];
  syncopatedWords:   string[];
  primaryAnchor:     string | null;   // heaviest-stressed word on strong beat
  anchorBeatIndex:   number;
}

export interface BarBeatFitV5 extends Omit<BarBeatFit, "timingUnits"> {
  phonemicProfile:      LinePhonemicProfile;
  syllableGrid:         SyllableGridCell[];
  densityMap:           number[];
  breathGaps:           BreathGap[];
  overflowRisk:         boolean;
  overflowSeverity:     "none" | "mild" | "critical";
  beatAlignmentProfile: BeatAlignmentProfile;
  recommendedRewrite:   RewriteRecommendation | null;
  timingUnits:          TimingUnit[];
  // v5 additions
  phonemicImpact:       number;   // 0–100 weighted phoneme impact
  rhythmComplexity:     number;   // variance score
  rhymeFingerprint:     string;
}

export interface TimingUnit {
  tokenIndex:     number;
  token:          string;
  beatIndexStart: number;
  beatPhaseStart: number;
  stressScore:    number;
  durationMs:     number;
}

export interface RewriteRecommendation {
  priority:   "critical" | "moderate" | "minor";
  issue:      string;
  suggestion: string;
  examples:   string[];
}

export interface GlobalRhythmProfile {
  averageDensity:     number;
  averageWeight:      number;
  peakDensityBarId:   string;
  lowestScoreBarId:   string;
  rhythmicVariance:   number;
  grooveConsistency:  number;
  recommendedTempo:   number;
  phonemicImpactAvg:  number;
}

export interface BeatGridVisualRow {
  barIndex:     number;
  barId:        string;
  section:      string;
  densityScore: number;
  cells:        BeatGridVisualCell[];
}

export interface BeatGridVisualCell {
  position:   number;
  type:       "downbeat" | "strong" | "weak" | "pickup" | "rest";
  occupied:   boolean;
  word?:      string;
  weight?:    number;
  stress?:    "primary" | "secondary" | "unstressed";
  impact?:    number;
}

export interface BeatGridAnalysisV5 extends Omit<BeatGridAnalysis, "barFits"> {
  barFits:             BarBeatFitV5[];
  visualRows:          BeatGridVisualRow[];
  densityHeatmap:      number[][];
  globalRhythmProfile: GlobalRhythmProfile;
  rewriteSuggestions:  (RewriteRecommendation & { barId: string; barIndex: number })[];
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULTCONFIG: BeatGridConfig = {
  bpm:          90,
  beatOffsetMs: 0,
  beatsPerBar:  4,
  subdivision:  4,
  swing:        0,
};

// Section-specific density targets (syllables/beat)
// Derived from analysis of Arabic rap corpus
const SECTIONDENSITYTARGET: Record<string, number> = {
  hook:    2.0,   // open, melodic
  verse:   3.2,   // standard rap density
  bridge:  2.6,
  intro:   1.8,
  outro:   2.0,
  chorus:  2.2,
  pre:     3.5,   // pre-chorus — high density
};

// ─────────────────────────────────────────────────────────────────────────────
// TIMING UTILS
// ─────────────────────────────────────────────────────────────────────────────

export function beatDurationMs(bpm: number): number {
  return 60000 / bpm;
}

export function barDurationMs(config: BeatGridConfig): number {
  return beatDurationMs(config.bpm) * config.beatsPerBar;
}

function sanitizeConfig(cfg: Partial<BeatGridConfig>): BeatGridConfig {
  return {
    bpm:          Math.max(40, Math.min(220, cfg.bpm         ?? DEFAULTCONFIG.bpm)),
    beatOffsetMs: cfg.beatOffsetMs ?? 0,
    beatsPerBar:  cfg.beatsPerBar  ?? 4,
    subdivision:  cfg.subdivision  ?? 4,
    swing:        Math.max(0, Math.min(0.40, cfg.swing ?? 0)),
  };
}

function applySwing(beatPosition: number, swing: number, beatDuration: number): number {
  if (swing === 0) return beatPosition;
  const subBeat = beatPosition % 1;
  if (subBeat > 0.45 && subBeat < 0.55) {
    return beatPosition + swing * beatDuration;
  }
  return beatPosition;
}

// ─────────────────────────────────────────────────────────────────────────────
// BEAT POSITIONS
// ─────────────────────────────────────────────────────────────────────────────

export function createBeatPositions(
  config:    BeatGridConfig,
  totalBars: number
): BeatPosition[] {
  const beatMs     = beatDurationMs(config.bpm);
  const totalBeats = (totalBars + 1) * config.beatsPerBar + 4;

  return Array.from({ length: totalBeats }, (_, beatIndex) => {
    const beatInBar = beatIndex % config.beatsPerBar;
    let timeMs      = config.beatOffsetMs + beatIndex * beatMs;

    if (config.swing > 0 && beatInBar % 2 === 1) {
      timeMs += config.swing * beatMs;
    }

    const strength: BeatPosition["strength"] =
      beatInBar === 0                          ? "downbeat"
      : beatInBar === 2                        ? "strong"
      : beatInBar === config.beatsPerBar - 1   ? "pickup"
      : "weak";

    return {
      beatIndex,
      barIndex: Math.floor(beatIndex / config.beatsPerBar),
      beatInBar,
      timeMs,
      strength,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SYLLABLE GRID BUILDER — phonemically accurate
// ─────────────────────────────────────────────────────────────────────────────

function buildSyllableGrid(
  profile: LinePhonemicProfile,
  config:  BeatGridConfig
): SyllableGridCell[] {
  const beatMs      = beatDurationMs(config.bpm);
  const grid: SyllableGridCell[] = [];
  let   currentBeat = 0;

  profile.words.forEach((wordProfile, wordIndex) => {
    for (const syllable of wordProfile.syllables) {
      // Duration based on actual phonemic weight
      const syllableDurationBeats = syllable.weight / (profile.syllablesPerBeat || 3.0);
      const startBeat             = applySwing(currentBeat, config.swing, 1);
      const endBeat               = startBeat + syllableDurationBeats;

      // Beat deviation
      const nearestBeat = Math.round(startBeat);
      const deviation   = clampScore(Math.abs(startBeat - nearestBeat) * 200);

      // Strong beat check
      const beatInBar   = startBeat % config.beatsPerBar;
      const onStrongBeat =
        beatInBar < 0.20 ||
        Math.abs(beatInBar - 2) < 0.20;

      // Grid column (subdivision resolution)
      const gridColumn = Math.min(
        Math.round(startBeat * config.subdivision),
        config.beatsPerBar * config.subdivision - 1
      );

      // Syncopation level
      const syncopationLevel: SyllableGridCell["syncopationLevel"] =
        !onStrongBeat && syllable.stress === "primary"   ? "heavy"
        : !onStrongBeat && syllable.stress === "secondary" ? "mild"
        : "none";

      // Impact from phonemics
      const impactScore =
        syllable.phonemes.reduce((s, p) => s + p.impactScore, 0) /
        Math.max(1, syllable.phonemes.length);

      grid.push({
        wordIndex,
        word:          wordProfile.word,
        syllable,
        startBeat,
        endBeat,
        gridColumn,
        onStrongBeat,
        deviation,
        syncopationLevel,
        impactScore,
      });

      currentBeat = endBeat;
    }
  });

  return grid;
}

// ─────────────────────────────────────────────────────────────────────────────
// DENSITY MAP — per beat, normalized 0–100
// ─────────────────────────────────────────────────────────────────────────────

function buildDensityMap(
  grid:        SyllableGridCell[],
  beatsPerBar: number
): number[] {
  const density = new Array<number>(beatsPerBar).fill(0);

  for (const cell of grid) {
    const beat = Math.floor(cell.startBeat) % beatsPerBar;
    if (beat >= 0 && beat < beatsPerBar) {
      // Weight by syllable weight AND impact
      density[beat]! += cell.syllable.weight * (0.7 + 0.3 * cell.impactScore);
    }
  }

  const max = Math.max(...density, 1);
  return density.map((d) => clampScore((d / max) * 100));
}

// ─────────────────────────────────────────────────────────────────────────────
// BREATH GAP DETECTION
// ─────────────────────────────────────────────────────────────────────────────

function detectBreathGaps(
  grid:        SyllableGridCell[],
  config:      BeatGridConfig
): BreathGap[] {
  const beatMs = beatDurationMs(config.bpm);
  const gaps: BreathGap[] = [];

  for (let i = 0; i < grid.length - 1; i++) {
    const current = grid[i]!;
    const next    = grid[i + 1]!;
    const gapBeats = next.startBeat - current.endBeat;

    if (gapBeats >= 0.20) {
      const gapMs    = gapBeats * beatMs;
      const natural  = (current.endBeat % 1) < 0.15 || gapBeats >= 0.5;
      const adequate = gapMs >= 200;
      gaps.push({
        afterWordIndex: current.wordIndex,
        durationBeats:  gapBeats,
        durationMs:     gapMs,
        natural,
        adequate,
      });
    }
  }

  // End-of-bar gap
  const lastCell = grid.at(-1);
  if (lastCell) {
    const tailBeats = config.beatsPerBar - lastCell.endBeat;
    if (tailBeats >= 0.20) {
      gaps.push({
        afterWordIndex: lastCell.wordIndex,
        durationBeats:  tailBeats,
        durationMs:     tailBeats * beatMs,
        natural:        true,
        adequate:       tailBeats * beatMs >= 200,
      });
    }
  }

  return gaps;
}

// ─────────────────────────────────────────────────────────────────────────────
// BEAT ALIGNMENT PROFILE
// ─────────────────────────────────────────────────────────────────────────────

function buildBeatAlignmentProfile(
  grid:    SyllableGridCell[],
  config:  BeatGridConfig
): BeatAlignmentProfile {
  const strongBeatWords:  string[] = [];
  const weakBeatWords:    string[] = [];
  const syncopatedWords:  string[] = [];

  for (const cell of grid) {
    const beatInBar = cell.startBeat % config.beatsPerBar;
    const onStrong  = beatInBar < 0.20 || Math.abs(beatInBar - 2) < 0.20;
    const onWeak    = Math.abs(beatInBar - 1) < 0.20 || Math.abs(beatInBar - 3) < 0.20;

    if (onStrong) strongBeatWords.push(cell.word);
    else if (onWeak) weakBeatWords.push(cell.word);

    if (cell.syncopationLevel === "heavy") syncopatedWords.push(cell.word);
  }

  // Primary anchor: primary-stressed syllable on strong beat with highest impact
  const anchorCell = grid
    .filter((c) => c.onStrongBeat && c.syllable.stress === "primary")
    .sort((a, b) => b.impactScore - a.impactScore)[0];

  return {
    strongBeatWords,
    weakBeatWords,
    syncopatedWords,
    primaryAnchor:   anchorCell?.word ?? null,
    anchorBeatIndex: anchorCell ? Math.floor(anchorCell.startBeat) : -1,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMING UNITS (for UI display)
// ─────────────────────────────────────────────────────────────────────────────

function buildTimingUnits(
  profile: LinePhonemicProfile,
  grid:    SyllableGridCell[],
  config:  BeatGridConfig
): TimingUnit[] {
  return grid.map((cell, i) => ({
    tokenIndex:     i,
    token:          cell.syllable.text || cell.word,
    beatIndexStart: Math.floor(cell.startBeat),
    beatPhaseStart: cell.startBeat % 1,
    stressScore:    cell.syllable.stress === "primary"   ? 100
                  : cell.syllable.stress === "secondary" ? 65
                  : 30,
    durationMs:     cell.syllable.durationMs,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORING FUNCTIONS v5
// ─────────────────────────────────────────────────────────────────────────────

function scoreDensity(syllablesPerBeat: number, target: number): number {
  const diff = Math.abs(syllablesPerBeat - target);
  // Gaussian-shaped scoring — drops off faster for extreme values
  return clampScore(100 * Math.exp(-0.8 * diff * diff));
}

function scoreDownbeat(startMs: number, config: BeatGridConfig): number {
  const beatMs     = beatDurationMs(config.bpm);
  const rawBeat    = (startMs - config.beatOffsetMs) / beatMs;
  const nearestBar = Math.round(rawBeat / config.beatsPerBar) * config.beatsPerBar;
  const distBeats  = Math.abs(rawBeat - nearestBar);
  return clampScore(100 - distBeats * 80);
}

function scoreCadence(endMs: number, config: BeatGridConfig): number {
  const beatMs    = beatDurationMs(config.bpm);
  const rawBeat   = (endMs - config.beatOffsetMs) / beatMs;
  const beatInBar = ((rawBeat % config.beatsPerBar) + config.beatsPerBar) % config.beatsPerBar;
  // Strong landing zones: beat 0, 2, 3.5, and just before bar end
  const strongZones = [0, 2, 3.5, config.beatsPerBar - 0.5];
  const bestDist    = Math.min(...strongZones.map((z) => Math.abs(beatInBar - z)));
  return clampScore(100 - bestDist * 60);
}

function scoreBreath(breathGaps: BreathGap[]): number {
  if (breathGaps.length === 0) return 20;  // No gaps = bad

  const adequateGaps = breathGaps.filter((g) => g.adequate).length;
  const naturalGaps  = breathGaps.filter((g) => g.natural).length;
  const gapRatio     = breathGaps.reduce((s, g) => s + g.durationBeats, 0);

  // Sweet spot: 0.5–1.5 beats of breathing room per bar
  const gapScore  = clampScore(100 * Math.exp(-2 * Math.abs(gapRatio - 1.0)));
  const qualScore = clampScore(((adequateGaps + naturalGaps * 0.5) / breathGaps.length) * 100);

  return clampScore(weightedAverage([
    { value: gapScore,  weight: 0.55 },
    { value: qualScore, weight: 0.45 },
  ]));
}

function scoreSyncopation(grid: SyllableGridCell[]): number {
  if (grid.length === 0) return 50;

  const heavySynco    = grid.filter((c) => c.syncopationLevel === "heavy").length;
  const mildSynco     = grid.filter((c) => c.syncopationLevel === "mild").length;
  const primaryOnBeat = grid.filter((c) => c.onStrongBeat && c.syllable.stress === "primary").length;

  // Effective syncopation ratio
  const syncoRatio = (heavySynco * 1.0 + mildSynco * 0.5) / (grid.length || 1);

  // Sweet spot: 0.25–0.40
  const sweetSpotScore = clampScore(100 - Math.abs(syncoRatio - 0.32) * 220);
  const anchorBonus    = Math.min(30, primaryOnBeat * 10);

  return clampScore(sweetSpotScore + anchorBonus);
}

function scorePhonemicImpact(profile: LinePhonemicProfile): number {
  // Rewards high-impact consonants on strong syllables
  const weightedImpact = profile.words.flatMap((w) =>
    w.syllables.map((s) => {
      const syllableImpact = s.phonemes.reduce((sum, p) => sum + p.impactScore, 0) /
        Math.max(1, s.phonemes.length);
      const stressMultiplier =
        s.stress === "primary" ? 1.5 : s.stress === "secondary" ? 1.2 : 1.0;
      return syllableImpact * stressMultiplier;
    })
  );

  const avg = weightedImpact.length
    ? weightedImpact.reduce((a, b) => a + b, 0) / weightedImpact.length
    : 0;

  return clampScore(avg * 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// REWRITE RECOMMENDATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

function generateRewrite(
  profile:     LinePhonemicProfile,
  grid:        SyllableGridCell[],
  config:      BeatGridConfig,
  scores:      { density: number; breath: number; synco: number; overall: number }
): RewriteRecommendation | null {
  if (scores.overall >= 75) return null;

  // Priority 1: critical overflow
  if (profile.syllablesPerBeat > 4.5) {
    const excess     = profile.syllablesPerBeat - 3.5;
    const bpmSuggest = Math.round(config.bpm + excess * 15);
    return {
      priority: "critical",
      issue:    `كثافة ${profile.syllablesPerBeat.toFixed(1)} مقطع/بيت — تتجاوز الطاقة الزمنية`,
      suggestion: `احذف ${Math.ceil(excess * config.beatsPerBar)} مقطع أو ارفع BPM إلى ${bpmSuggest}`,
      examples: ["اختصر الكلمات المركبة", "استبدل الجمل الوصفية بأفعال مباشرة"],
    };
  }

  // Priority 2: primary stress on weak beats
  const misplacedStress = grid.filter(
    (c) => !c.onStrongBeat && c.syllable.stress === "primary" && c.syncopationLevel === "heavy"
  );
  if (misplacedStress.length >= 2) {
    const words = [...new Set(misplacedStress.map((c) => c.word))].slice(0, 3);
    return {
      priority: "moderate",
      issue:    `الكلمات (${words.join("، ")}) تقع نبراتها الرئيسية على بيتات ضعيفة`,
      suggestion: "أعد ترتيب الكلمات بحيث تبدأ البارات بمقاطع ثقيلة على Beat 1 أو 3",
      examples: ["ابدأ بالفعل بدل الاسم", "حرّك المفردة الثقيلة للأمام"],
    };
  }

  // Priority 3: no breath room
  if (scores.breath < 35) {
    return {
      priority: "moderate",
      issue:    "لا توجد مساحة كافية للتنفس بين الكلمات",
      suggestion: "أضف وقفة بعد الكلمة المحورية — أو اختصر الجملة الأخيرة بـ 2 مقاطع",
      examples: ["استخدم كلمات أقصر في النهاية", "أنهِ البار بمقطع CV خفيف"],
    };
  }

  // General
  return {
    priority: "minor",
    issue:    `الشبكة الإيقاعية ${scores.overall}/100`,
    suggestion: "راجع توزيع المقاطع الثقيلة على البيتات القوية",
    examples: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// VISUAL ROW BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function buildVisualRow(
  fit:    BarBeatFitV5,
  config: BeatGridConfig
): BeatGridVisualRow {
  const totalCells = config.beatsPerBar * config.subdivision;

  const cells: BeatGridVisualCell[] = Array.from({ length: totalCells }, (_, pos) => {
    const beatInBar = Math.floor(pos / config.subdivision);
    const subPos    = pos % config.subdivision;
    const type: BeatGridVisualCell["type"] =
      beatInBar === 0 && subPos === 0                                           ? "downbeat"
      : beatInBar === 2 && subPos === 0                                         ? "strong"
      : beatInBar === config.beatsPerBar - 1 && subPos === config.subdivision - 1 ? "pickup"
      : "weak";
    return { position: pos, type, occupied: false };
  });

  for (const cell of fit.syllableGrid) {
    const col = Math.min(cell.gridColumn, totalCells - 1);
    if (col >= 0 && cells[col]) {
      cells[col]!.occupied = true;
      cells[col]!.word     = cell.word;
      cells[col]!.weight   = cell.syllable.weight;
      cells[col]!.stress   = cell.syllable.stress;
      cells[col]!.impact   = cell.impactScore;
    }
  }

  for (const c of cells) {
    if (!c.occupied) c.type = "rest";
  }

  return {
    barIndex:     fit.index,
    barId:        fit.barId,
    section:      fit.section,
    densityScore: fit.densityScore,
    cells,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BAR ANALYSIS — MAIN
// ─────────────────────────────────────────────────────────────────────────────

function analyzeBarBeatFitV5(
  bar:    BarInput,
  config: BeatGridConfig
): BarBeatFitV5 {
  const beatMs       = beatDurationMs(config.bpm);
  const barMs        = barDurationMs(config);
  const densityTarget = SECTIONDENSITYTARGET[bar.section ?? "verse"] ?? 3.2;

  // Phonemic analysis (the real engine now)
  const phonemicProfile = analyzeLinePhonemics(bar.text, config.bpm, config.beatsPerBar);

  // Build grids
  const syllableGrid = buildSyllableGrid(phonemicProfile, config);
  const densityMap   = buildDensityMap(syllableGrid, config.beatsPerBar);
  const breathGaps   = detectBreathGaps(syllableGrid, config);
  const alignment    = buildBeatAlignmentProfile(syllableGrid, config);

  // Timing
  const startMs = config.beatOffsetMs + bar.index * config.beatsPerBar * beatMs;
  const performedBeats = Math.min(
    config.beatsPerBar * 1.05,
    Math.max(0.5, phonemicProfile.totalWeight / densityTarget)
  );
  const performedDurationMs = performedBeats * beatMs;
  const endMs = startMs + performedDurationMs;

  // Scores
  const densityScore    = scoreDensity(phonemicProfile.syllablesPerBeat, densityTarget);
  const downbeatScore   = scoreDownbeat(startMs, config);
  const cadenceScore    = scoreCadence(endMs, config);
  const breathScore     = scoreBreath(breathGaps);
  const syncoScore      = scoreSyncopation(syllableGrid);
  const phonemicImpact  = scorePhonemicImpact(phonemicProfile);

  const grooveScore = clampScore(
    weightedAverage([
      { value: densityScore,  weight: 0.25 },
      { value: cadenceScore,  weight: 0.25 },
      { value: syncoScore,    weight: 0.25 },
      { value: breathScore,   weight: 0.25 },
    ])
  );

  const overallBeatFitScore = clampScore(
    weightedAverage([
      { value: densityScore,   weight: 0.20 },
      { value: downbeatScore,  weight: 0.15 },
      { value: cadenceScore,   weight: 0.18 },
      { value: breathScore,    weight: 0.15 },
      { value: grooveScore,    weight: 0.20 },
      { value: phonemicImpact, weight: 0.12 },
    ])
  );

  const overflowSeverity: BarBeatFitV5["overflowSeverity"] =
    phonemicProfile.syllablesPerBeat > 4.5 ? "critical"
    : phonemicProfile.syllablesPerBeat > 4.0 ? "mild"
    : "none";

  const warnings:    string[] = [];
  const suggestions: string[] = [];

  if (overflowSeverity === "critical")
    warnings.push(`⚡ كثافة حرجة: ${phonemicProfile.syllablesPerBeat.toFixed(1)} مقطع/beat`);
  if (overflowSeverity === "mild")
    warnings.push(`⚠️ كثافة مرتفعة: ${phonemicProfile.syllablesPerBeat.toFixed(1)} مقطع/beat`);
  if (cadenceScore < 50)
    suggestions.push("أنهِ البار على Beat 1 أو 3 للحصول على Landing أقوى.");
  if (breathScore < 40)
    warnings.push("⚠️ مساحة النَّفَس ضيقة جداً — خطر الاختناق الأدائي.");
  if (phonemicImpact < 40)
    suggestions.push("الحروف المستخدمة خفيفة الأثر — أدخل حروف صوتية ثقيلة (ق، ع، ر) في المواقع المحورية.");
  if (alignment.anchorBeatIndex === -1)
    suggestions.push("لا يوجد 'مرساة' إيقاعية — ضع مقطعاً أولياً على Downbeat.");

  const timingUnits      = buildTimingUnits(phonemicProfile, syllableGrid, config);
  const recommendedRewrite = generateRewrite(
    phonemicProfile, syllableGrid, config,
    { density: densityScore, breath: breathScore, synco: syncoScore, overall: overallBeatFitScore }
  );

  const lastWord = phonemicProfile.words.at(-1);
  const rhymeFingerprint = lastWord?.rhymeFingerprint ?? "";

  return {
    barId:                  bar.id,
    section:                bar.section,
    index:                  bar.index,
    text:                   bar.text,
    bpm:                    config.bpm,
    startMs,
    endMs,
    durationMs:             performedDurationMs,
    estimatedSyllables:     phonemicProfile.totalSyllables,
    syllablesPerBeat:       phonemicProfile.syllablesPerBeat,
    densityScore,
    downbeatAlignmentScore: downbeatScore,
    cadenceLandingScore:    cadenceScore,
    breathWindowScore:      breathScore,
    syncopationScore:       syncoScore,
    grooveScore,
    overallBeatFitScore,
    timingUnits,
    warnings,
    suggestions,
    phonemicProfile,
    syllableGrid,
    densityMap,
    breathGaps,
    overflowRisk:           overflowSeverity !== "none",
    overflowSeverity,
    beatAlignmentProfile:   alignment,
    recommendedRewrite,
    phonemicImpact,
    rhythmComplexity:       phonemicProfile.rhythmComplexity,
    rhymeFingerprint,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL RHYTHM PROFILE
// ─────────────────────────────────────────────────────────────────────────────

function buildGlobalRhythmProfile(
  fits:   BarBeatFitV5[],
  config: BeatGridConfig
): GlobalRhythmProfile {
  const scores       = fits.map((f) => f.overallBeatFitScore);
  const densities    = fits.map((f) => f.syllablesPerBeat);
  const weights      = fits.map((f) => f.phonemicProfile.totalWeight);
  const impacts      = fits.map((f) => f.phonemicImpact);

  const avgDensity   = average(densities);
  const avgWeight    = average(weights);
  const avgImpact    = average(impacts);
  const rhythmVar    = variance(scores);
  const grooveVar    = variance(fits.map((f) => f.grooveScore));

  const peakFit    = fits.reduce((a, b) => a.syllablesPerBeat > b.syllablesPerBeat ? a : b);
  const lowestFit  = fits.reduce((a, b) => a.overallBeatFitScore < b.overallBeatFitScore ? a : b);

  let recommendedTempo = config.bpm;
  if (avgDensity > 4.0)
    recommendedTempo = Math.min(220, config.bpm + Math.round((avgDensity - 3.5) * 14));
  if (avgDensity < 1.8)
    recommendedTempo = Math.max(60, config.bpm - Math.round((2.0 - avgDensity) * 12));

  return {
    averageDensity:    parseFloat(avgDensity.toFixed(2)),
    averageWeight:     parseFloat(avgWeight.toFixed(2)),
    peakDensityBarId:  peakFit.barId,
    lowestScoreBarId:  lowestFit.barId,
    rhythmicVariance:  parseFloat(rhythmVar.toFixed(2)),
    grooveConsistency: clampScore(100 - grooveVar * 2),
    recommendedTempo,
    phonemicImpactAvg: parseFloat(avgImpact.toFixed(1)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export function analyzeBeatGrid(
  bars:        BarInput[],
  inputConfig: Partial<BeatGridConfig>
): BeatGridAnalysisV5 {
  const config      = sanitizeConfig(inputConfig);
  const orderedBars = [...bars].sort((a, b) => a.index - b.index);
  const totalBars   = Math.max(orderedBars.length, (orderedBars.at(-1)?.index ?? 0) + 1);

  const beatPositions = createBeatPositions(config, totalBars);
  const barFits       = orderedBars.map((bar) => analyzeBarBeatFitV5(bar, config));

  const globalBeatFitScore = clampScore(average(barFits.map((f) => f.overallBeatFitScore)));
  const visualRows         = barFits.map((fit) => buildVisualRow(fit, config));
  const densityHeatmap     = barFits.map((fit) => fit.densityMap);
  const globalRhythmProfile = buildGlobalRhythmProfile(barFits, config);

  const rewriteSuggestions = barFits
    .filter((f) => f.recommendedRewrite !== null)
    .map((f) => ({
      ...f.recommendedRewrite!,
      barId:    f.barId,
      barIndex: f.index,
    }))
    .sort((a, b) => {
      const p = { critical: 0, moderate: 1, minor: 2 };
      return p[a.priority] - p[b.priority];
    });

  const globalSuggestions: string[] = [];

  if (globalBeatFitScore < 60)
    globalSuggestions.push("⚡ ابدأ بالبارات المحددة كـ critical — إصلاحها يرفع الدرجة الكلية بشكل ملحوظ.");
  if (globalRhythmProfile.recommendedTempo !== config.bpm)
    globalSuggestions.push(
      `🎚️ BPM الحالي ${config.bpm} — الأمثل لكثافة النص الفعلية هو ${globalRhythmProfile.recommendedTempo} BPM.`
    );
  if (globalRhythmProfile.grooveConsistency < 55)
    globalSuggestions.push("🔄 الـ Groove متذبذب بين البارات — استهدف كثافة مقاطع متقاربة في الأقسام المتشابهة.");
  if (globalRhythmProfile.phonemicImpactAvg < 45)
    globalSuggestions.push("🎤 الصوت الكلي خفيف — أثرِ النص بحروف تأثيرية: (ق، ع، ر، ض، ط).");

  return {
    config,
    beatPositions,
    barFits,
    globalBeatFitScore,
    averageSyllablesPerBeat: globalRhythmProfile.averageDensity,
    highestDensityBarId:     globalRhythmProfile.peakDensityBarId,
    weakestBarId:            rewriteSuggestions[0]?.barId ?? "N/A",
    suggestions:             globalSuggestions,
    visualRows,
    densityHeatmap,
    globalRhythmProfile,
    rewriteSuggestions,
  };
}
