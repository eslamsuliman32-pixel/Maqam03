// src/maqam/engines/barBeatMatcher.engine.ts
// v5.0 — Contextual & Sequential Bar Matching Engine
// إضافة: السياق التسلسلي، الذاكرة الإيقاعية، والتحليل الفونيمي

import type { AudioBeatAnalysisResult } from "../types/audioAnalysis.types";
import type { BeatPosition } from "../types/beatGrid.types";
import { computeRhymeSimilarity } from "./arabicPhonemics.engine";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type FlowMode =
  | "slowride" | "melodic" | "midtempo" | "storytelling"
  | "aggressive" | "choppy" | "triplet" | "double-time";

export type SonicWeightLevel = "low" | "medium" | "high" | "ultra";

export type DominantRange = "sub-bass" | "bass" | "low-mid" | "mid" | "high-mid" | "high";

export interface BarCandidate {
  id:              string;
  text:            string;
  syllableCount:   number;
  totalWeight:     number;        // phonemic weight (from arabicPhonemics.engine)
  rhythmicWeight:  number;        // 0–1
  flowMode:        FlowMode;
  sonicWeight:     SonicWeightLevel;
  rhymeFingerprint: string;       // for rhyme continuity scoring
  section?:        string;
  emotion?:        string;
  phonemicImpact?: number;        // 0–1
}

export interface BeatWindowContext {
  bpm:              number;
  beatsAvailable:   number;
  transientDensity: number;       // 0–1
  dominantRange:    DominantRange;
  windowStartMs:    number;
  windowEndMs:      number;
  energyLevel:      number;       // 0–1 — bar energy
  prevBarFingerprint?: string;    // for rhyme continuity
  nextBarFingerprint?: string;    // for lookahead rhyme planning
}

export interface MatchReasonDetail {
  syllableScore:   number;   // 0–25
  rhythmicScore:   number;   // 0–25
  flowScore:       number;   // 0–30
  sonicScore:      number;   // 0–20
  // v5 additions
  rhymeContinuity: number;   // 0–10 bonus
  energyMatch:     number;   // 0–10 bonus
  summary:         string;
  warnings:        string[];
}

export interface BarMatchResult {
  bar:         BarCandidate;
  matchScore:  number;        // 0–100
  matchReason: MatchReasonDetail;
}

export interface SuggestBarsParams {
  bars:        BarCandidate[];
  beatWindow:  BeatWindowContext;
  topN?:       number;
  filterBySection?: string;
  excludeIds?: Set<string>;    // already-placed bars
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOW MODE MAPPING — extended for Arabic rap subgenres
// ─────────────────────────────────────────────────────────────────────────────

const BPMTOFLOW: { max: number; flows: FlowMode[] }[] = [
  { max: 75,  flows: ["slowride", "melodic"] },
  { max: 95,  flows: ["melodic", "midtempo"] },
  { max: 115, flows: ["midtempo", "storytelling"] },
  { max: 135, flows: ["storytelling", "aggressive"] },
  { max: 160, flows: ["aggressive", "choppy"] },
  { max: 220, flows: ["choppy", "double-time"] },
];

export function getPreferredFlowModes(bpm: number): FlowMode[] {
  return BPMTOFLOW.find((r) => bpm <= r.max)?.flows ?? ["aggressive", "choppy"];
}

// ─────────────────────────────────────────────────────────────────────────────
// SONIC WEIGHT MAPPING — extended range
// ─────────────────────────────────────────────────────────────────────────────

export function getPreferredSonicWeight(
  dominantRange: DominantRange
): SonicWeightLevel {
  const map: Record<DominantRange, SonicWeightLevel> = {
    "sub-bass":  "ultra",
    "bass":      "high",
    "low-mid":   "high",
    "mid":       "medium",
    "high-mid":  "low",
    "high":      "low",
  };
  return map[dominantRange];
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE COMPONENTS v5
// ─────────────────────────────────────────────────────────────────────────────

/*
  Syllable score (0–25) — now uses totalWeight instead of raw count
  to account for long vs. short syllables in Arabic
 */
export function scoreSyllableMatch(
  syllableCount:  number,
  totalWeight:    number,
  beatsAvailable: number
): number {
  // Weight-based ideal density: 2.5 units per beat
  const idealWeight = beatsAvailable * 2.5;
  const diff        = Math.abs(totalWeight - idealWeight) / idealWeight;

  if (diff <= 0.08)  return 25;
  if (diff <= 0.18)  return 20;
  if (diff <= 0.30)  return 14;
  if (diff <= 0.45)  return 7;
  if (diff <= 0.60)  return 3;
  return 0;
}

/*
  Rhythmic score (0–25) — uses tighter Gaussian around target
 */
export function scoreRhythmicWeight(
  rhythmicWeight:   number,
  transientDensity: number
): number {
  const diff   = Math.abs(rhythmicWeight - transientDensity);
  // Gaussian with σ=0.12
  return Math.round(25 * Math.exp(-0.5 * (diff / 0.12) ** 2));
}

/*
  Flow score (0–30) — graded: perfect=30, adjacent=18, partial=8
 */
export function scoreFlowMode(flowMode: FlowMode, bpm: number): number {
  const preferred = getPreferredFlowModes(bpm);
  if (preferred.includes(flowMode)) return 30;

  const adjacentMap: Record<FlowMode, FlowMode[]> = {
    slowride:     ["melodic"],
    melodic:      ["slowride", "midtempo"],
    midtempo:     ["melodic", "storytelling"],
    storytelling: ["midtempo", "melodic"],
    aggressive:   ["choppy", "midtempo"],
    choppy:       ["aggressive", "double-time"],
    "triplet":    ["aggressive", "choppy"],
    "double-time": ["choppy", "aggressive"],
  };

  const partialMap: Record<FlowMode, FlowMode[]> = {
    slowride:     ["midtempo"],
    melodic:      ["storytelling"],
    midtempo:     ["aggressive"],
    storytelling: ["choppy"],
    aggressive:   ["storytelling"],
    choppy:       ["midtempo"],
    "triplet":    ["midtempo"],
    "double-time": ["midtempo"],
  };

  const adjacent = adjacentMap[flowMode] ?? [];
  const partial  = partialMap[flowMode]  ?? [];

  if (adjacent.some((f) => preferred.includes(f))) return 18;
  if (partial.some((f) => preferred.includes(f)))  return 8;
  return 0;
}

/*
  Sonic score (0–20) — extended for ultra weight
 */
export function scoreSonicWeight(
  sonicWeight:   SonicWeightLevel,
  dominantRange: DominantRange
): number {
  const preferred = getPreferredSonicWeight(dominantRange);
  if (sonicWeight === preferred) return 20;

  const levels: SonicWeightLevel[] = ["low", "medium", "high", "ultra"];
  const diff = Math.abs(levels.indexOf(sonicWeight) - levels.indexOf(preferred));
  if (diff === 1) return 12;
  if (diff === 2) return 5;
  return 0;
}

/*
  Rhyme continuity bonus (0–10)
  Rewards bars whose last rhyme continues the sequence
 */
export function scoreRhymeContinuity(
  barFingerprint:  string,
  prevFingerprint: string | undefined,
  nextFingerprint: string | undefined
): number {
  let score = 0;
  if (prevFingerprint) {
    score += computeRhymeSimilarity(barFingerprint, prevFingerprint) * 5;
  }
  if (nextFingerprint) {
    score += computeRhymeSimilarity(barFingerprint, nextFingerprint) * 5;
  }
  return Math.min(10, Math.round(score));
}

/*
  Energy match bonus (0–10)
 */
export function scoreEnergyMatch(
  phonemicImpact: number,  // 0–1
  energyLevel:    number   // 0–1
): number {
  const diff = Math.abs(phonemicImpact - energyLevel);
  return Math.round(10 * Math.exp(-0.5 * (diff / 0.25) ** 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function buildSummary(
  bar:     BarCandidate,
  context: BeatWindowContext,
  detail:  Omit<MatchReasonDetail, "summary" | "warnings">
): { summary: string; warnings: string[] } {
  const parts:    string[] = [];
  const warnings: string[] = [];

  if (detail.syllableScore >= 20)
    parts.push(`وزن المقاطع (${bar.totalWeight.toFixed(1)}) يتناسب مع النافذة (${context.beatsAvailable} beats)`);
  else if (detail.syllableScore >= 10)
    parts.push(`وزن المقاطع مقبول مع بعض الضغط`);
  else {
    parts.push(`فجوة في الوزن`);
    warnings.push(`الوزن الفعلي (${bar.totalWeight.toFixed(1)}) بعيد عن المطلوب`);
  }

  if (detail.rhythmicScore >= 20)
    parts.push(`الإيقاع الداخلي متوافق مع كثافة الـ transients`);
  else if (detail.rhythmicScore < 10)
    warnings.push(`عدم توافق إيقاعي — الكثافة الداخلية تختلف عن الخارجية`);

  if (detail.flowScore === 30)
    parts.push(`Flow (${bar.flowMode}) مثالي لـ ${context.bpm} BPM`);
  else if (detail.flowScore === 0)
    warnings.push(`Flow (${bar.flowMode}) غير مناسب للـ BPM الحالي`);

  if (detail.sonicScore === 20)
    parts.push(`ثقل صوتي (${bar.sonicWeight}) يتوافق مع النطاق (${context.dominantRange})`);

  if (detail.rhymeContinuity >= 7)
    parts.push(`القافية تكمل المسلسل الصوتي السابق`);

  if (detail.energyMatch >= 7)
    parts.push(`طاقة الحروف تطابق طاقة البار الموسيقي`);

  return { summary: parts.join(" · "), warnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE MATCHING FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export function matchBarToBeat(
  bar:     BarCandidate,
  context: BeatWindowContext
): BarMatchResult {
  const syllableScore  = scoreSyllableMatch(
    bar.syllableCount, bar.totalWeight, context.beatsAvailable
  );
  const rhythmicScore  = scoreRhythmicWeight(bar.rhythmicWeight, context.transientDensity);
  const flowScore      = scoreFlowMode(bar.flowMode, context.bpm);
  const sonicScore     = scoreSonicWeight(bar.sonicWeight, context.dominantRange);
  const rhymeContinuity = scoreRhymeContinuity(
    bar.rhymeFingerprint,
    context.prevBarFingerprint,
    context.nextBarFingerprint
  );
  const energyMatch    = scoreEnergyMatch(
    bar.phonemicImpact ?? 0.5,
    context.energyLevel
  );

  // Base score is out of 100 (25+25+30+20), bonuses can push to 110 (capped)
  const rawScore   = syllableScore + rhythmicScore + flowScore + sonicScore
                   + rhymeContinuity + energyMatch;
  const matchScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  const detail = { syllableScore, rhythmicScore, flowScore, sonicScore, rhymeContinuity, energyMatch };
  const { summary, warnings } = buildSummary(bar, context, detail);

  return {
    bar,
    matchScore,
    matchReason: { ...detail, summary, warnings },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SUGGEST FUNCTION — with sequential context
// ─────────────────────────────────────────────────────────────────────────────

export function suggestBarsFromBeat(params: SuggestBarsParams): BarMatchResult[] {
  const { bars, beatWindow, topN = 10, filterBySection, excludeIds } = params;

  let candidates = bars;

  if (filterBySection)
    candidates = candidates.filter((b) => b.section === filterBySection);

  if (excludeIds)
    candidates = candidates.filter((b) => !excludeIds.has(b.id));

  return candidates
    .map((bar) => matchBarToBeat(bar, beatWindow))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, topN);
}

// ─────────────────────────────────────────────────────────────────────────────
// BEAT WINDOW EXTRACTOR — fully typed
// ─────────────────────────────────────────────────────────────────────────────

interface CompleteAudioAnalysis {
  metadata: Record<string, unknown>;
  tempo?: { bpm?: number; timeSignature?: string };
  rhythm?: { bars?: Array<{ startTime: number; endTime: number; durationSeconds?: number; onsets?: unknown[] }> };
  spectral?: { dominantRange?: string; bassEnergy?: number; midEnergy?: number; highEnergy?: number };
}

interface LegacyAudioAnalysis {
  beatTracking?: { bpm?: number; beatsPerBar?: number; beatPositions?: BeatPosition[] };
  onsets?: Array<{ timeMs: number }>;
  spectral?: { dominantRange?: DominantRange };
}

function mapDominantRange(raw: string | undefined): DominantRange {
  if (!raw) return "mid";
  if (raw.includes("sub"))  return "sub-bass";
  if (raw.includes("bass")) return "bass";
  if (raw.includes("low"))  return "low-mid";
  if (raw.includes("high") && raw.includes("mid")) return "high-mid";
  if (raw.includes("high")) return "high";
  return "mid";
}

export function extractBeatWindowFromAnalysis(
  analysis: CompleteAudioAnalysis | LegacyAudioAnalysis,
  barIndex: number,
  prevBarFingerprint?: string,
  nextBarFingerprint?: string
): BeatWindowContext {
  // CompleteAudioAnalysis (BeatBlueprint)
  if ("metadata" in analysis) {
    const complete   = analysis as CompleteAudioAnalysis;
    const bpmValue   = complete.tempo?.bpm ?? 90;
    const timeSig    = (complete.tempo?.timeSignature ?? "4/4").split("/");
    const beatsPerBar = parseInt(timeSig[0] ?? "4", 10);
    const bar        = complete.rhythm?.bars?.[barIndex];
    const beatMs     = 60000 / bpmValue;
    const barMs      = beatMs * beatsPerBar;

    if (!bar) {
      return {
        bpm: bpmValue, beatsAvailable: beatsPerBar,
        transientDensity: 0.5, dominantRange: "mid",
        windowStartMs: barIndex * barMs, windowEndMs: (barIndex + 1) * barMs,
        energyLevel: 0.5,
        prevBarFingerprint, nextBarFingerprint,
      };
    }

    const windowStartMs  = bar.startTime * 1000;
    const windowEndMs    = bar.endTime * 1000;
    const durationSec    = bar.durationSeconds ?? Math.max(0.001, (windowEndMs - windowStartMs) / 1000);
    const transientDensity = Math.min(1, (bar.onsets?.length ?? 0) / (durationSec * 8));

    const spectral    = complete.spectral;
    const dominantRange = mapDominantRange(spectral?.dominantRange);

    // Energy level: normalized mix of bass/mid/high presence
    const bassE  = spectral?.bassEnergy  ?? 0.33;
    const midE   = spectral?.midEnergy   ?? 0.33;
    const highE  = spectral?.highEnergy  ?? 0.33;
    const energyLevel = Math.min(1, (bassE * 0.5 + midE * 0.3 + highE * 0.2));

    return {
      bpm: bpmValue, beatsAvailable: beatsPerBar,
      transientDensity, dominantRange,
      windowStartMs, windowEndMs,
      energyLevel,
      prevBarFingerprint, nextBarFingerprint,
    };
  }

  // Legacy format
  const legacy        = analysis as LegacyAudioAnalysis;
  const bpmValue      = legacy.beatTracking?.bpm ?? 90;
  const beatsPerBar   = legacy.beatTracking?.beatsPerBar ?? 4;
  const beatMs        = 60000 / bpmValue;
  const barMs         = beatMs * beatsPerBar;

  const barBeats      = (legacy.beatTracking?.beatPositions ?? []).filter(
    (bp) => bp.barIndex === barIndex
  );
  const windowStartMs = barBeats[0]?.timeMs ?? barIndex * barMs;
  const windowEndMs   = barBeats.at(-1)?.timeMs ?? windowStartMs + barMs;

  const onsetsInWindow = (legacy.onsets ?? []).filter(
    (o) => o.timeMs >= windowStartMs && o.timeMs <= windowEndMs
  );
  const durationSec    = Math.max(0.001, (windowEndMs - windowStartMs) / 1000);
  const transientDensity = Math.min(1, onsetsInWindow.length / (durationSec * 8));

  return {
    bpm: bpmValue,
    beatsAvailable:   barBeats.length || beatsPerBar,
    transientDensity,
    dominantRange:    legacy.spectral?.dominantRange ?? "mid",
    windowStartMs,
    windowEndMs,
    energyLevel:      0.5,
    prevBarFingerprint,
    nextBarFingerprint,
  };
}
