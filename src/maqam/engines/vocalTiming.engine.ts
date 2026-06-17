// src/maqam/engines/vocalTiming.engine.ts
// v5.0 — Psychoacoustic Timing Analysis Engine
// يعتمد على منحنى Gaussian للإدراك البشري بدلاً من الخطي

import type { RhythmicBar, BeatGridConfig } from "../types/rhythmicGrid.types";
import type { BarInput } from "../types/maqam.types";
import type { AudioOnset } from "../types/audioAnalysis.types";
import type { BeatPosition } from "../types/beatGrid.types";
import { clampScore, weightedAverage } from "../utils/scoring.utils";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type TimingTag =
  | "perfectpocket"  // ±30ms
  | "inpocket"       // ±60ms
  | "slightlylate"   // +60..+140ms
  | "slightlyearly"  // -60..-140ms
  | "late"            // > +140ms
  | "early"           // < -140ms
  | "absent";         // no onset detected

export interface RhythmicVocalTimingMatch {
  barId:            string;
  barIndex:         number;
  text:             string;
  detectedStartMs:  number;
  detectedEndMs:    number;
  timingDeltaMs:    number;
  entryScore:       number;      // 0–100
  landingScore:     number;      // 0–100
  alignmentScore:   number;      // 0–100
  timingTag:        TimingTag;
  breathGapMs:      number;
  onsetConfidence:  number;      // 0–1 — how confident the onset detection is
  ghostOnsets:      number;      // detected onsets without text anchor (ghost notes)
  notes:            string[];
}

export interface RhythmicVocalTimingAnalysis {
  bars:               RhythmicVocalTimingMatch[];
  globalAlignment:    number;   // 0–100
  averageDeltaMs:     number;
  medianDeltaMs:      number;   // more robust than average
  deltaStdDev:        number;   // consistency measure
  lateEntryCount:     number;
  earlyEntryCount:    number;
  perfectPocketCount: number;
  inPocketCount:      number;
  consistencyScore:   number;   // 0–100 — how consistent timing is across bars
  suggestions:        string[];
  rawDeltaDistribution: number[]; // for UI histogram
}

// ─────────────────────────────────────────────────────────────────────────────
// PSYCHOACOUSTIC TIMING SCORER
// Based on human perception thresholds — Gaussian falloff
// ─────────────────────────────────────────────────────────────────────────────

/*
  Human timing perception follows a Gaussian distribution around the target.
  Perfect zone: ±30ms  (sub-perceptual)
  Good zone:    ±60ms  (barely perceptible)
  Acceptable:   ±120ms (clearly perceptible but forgivable)
  Poor:         ±220ms (disrupts groove)
  Critical:     >220ms (breaks the pocket entirely)
 */
export function scoreTimingDeltaPsychoacoustic(deltaMs: number): number {
  const abs = Math.abs(deltaMs);

  // Perfect pocket — human cannot distinguish from ideal
  if (abs <= 30)  return 100;
  // Gaussian decay from 30ms to 60ms
  if (abs <= 60)  return 100 * Math.exp(-0.5 * ((abs - 30) / 18) ** 2);
  // Steeper decay from 60ms to 140ms
  if (abs <= 140) return 82 * Math.exp(-0.5 * ((abs - 60) / 42) ** 2);
  // Further decay 140ms to 280ms
  if (abs <= 280) return 45 * Math.exp(-0.5 * ((abs - 140) / 80) ** 2);
  // Beyond 280ms — exponential collapse
  return clampScore(15 * Math.exp(-(abs - 280) / 120));
}

function classifyTimingTag(deltaMs: number, entryScore: number): TimingTag {
  if (entryScore >= 97)          return "perfectpocket";
  if (entryScore >= 82)          return "inpocket";
  if (deltaMs > 60  && deltaMs <= 140)  return "slightlylate";
  if (deltaMs < -60 && deltaMs >= -140) return "slightlyearly";
  if (deltaMs > 140)             return "late";
  if (deltaMs < -140)            return "early";
  return "inpocket";
}

// ─────────────────────────────────────────────────────────────────────────────
// BAR WINDOW
// ─────────────────────────────────────────────────────────────────────────────

function expectedBarWindow(
  barIndex: number,
  config:   BeatGridConfig
): { startMs: number; endMs: number; beatMs: number; barMs: number } {
  const beatMs  = 60000 / config.bpm;
  const barMs   = beatMs * config.beatsPerBar;
  const startMs = config.beatOffsetMs + barIndex * barMs;
  return { startMs, endMs: startMs + barMs, beatMs, barMs };
}

// ─────────────────────────────────────────────────────────────────────────────
// ONSET FILTERING — improved with confidence weighting
// ─────────────────────────────────────────────────────────────────────────────

function vocalOnsetsInWindow(
  onsets:      AudioOnset[],
  startMs:     number,
  endMs:       number,
  toleranceMs: number
): AudioOnset[] {
  return onsets
    .filter((o) =>
      o.timeMs >= startMs - toleranceMs &&
      o.timeMs <= endMs   + toleranceMs
    )
    .sort((a, b) => a.timeMs - b.timeMs);
}

// Ghost onset detection: onsets that don't align to any expected syllable anchor
function countGhostOnsets(onsets: AudioOnset[], beatMs: number): number {
  return onsets.filter((o) => {
    const beatPhase = (o.timeMs % beatMs) / beatMs;
    // Ghost = between the grid lines (0.35–0.65 phase) — intentional off-beat flourishes
    return beatPhase > 0.35 && beatPhase < 0.65;
  }).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE BAR ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

function analyzeSingleBarVocalTiming(params: {
  bar:            BarInput;
  config:         BeatGridConfig;
  vocalOnsets:    AudioOnset[];
  nextBarStartMs: number;
}): RhythmicVocalTimingMatch {
  const { bar, config, vocalOnsets, nextBarStartMs } = params;
  const window      = expectedBarWindow(bar.index, config);
  const localOnsets = vocalOnsetsInWindow(
    vocalOnsets,
    window.startMs,
    window.endMs,
    280  // generous tolerance — the scorer handles precision
  );

  if (localOnsets.length === 0) {
    return {
      barId:            bar.id,
      barIndex:         bar.index,
      text:             bar.text,
      detectedStartMs:  window.startMs,
      detectedEndMs:    window.endMs,
      timingDeltaMs:    0,
      entryScore:       0,
      landingScore:     0,
      alignmentScore:   0,
      timingTag:        "absent",
      breathGapMs:      0,
      onsetConfidence:  0,
      ghostOnsets:      0,
      notes:            ["⚠️ لم يُرصد أي صوت في نافذة هذا البار."],
    };
  }

  const first = localOnsets[0]!;
  const last  = localOnsets[localOnsets.length - 1]!;

  // Entry timing
  const timingDeltaMs = first.timeMs - window.startMs;
  const entryScore    = scoreTimingDeltaPsychoacoustic(timingDeltaMs);

  // Landing timing
  const endDeltaMs  = last.timeMs - window.endMs;
  const landingScore = scoreTimingDeltaPsychoacoustic(endDeltaMs);

  // Onset confidence: ratio of detected to expected (cap at 1.0)
  const expectedOnsets   = Math.max(1, Math.round(window.barMs / (window.beatMs * 0.5)));
  const onsetConfidence  = Math.min(1.0, localOnsets.length / expectedOnsets);

  // Ghost onsets
  const ghostOnsets = countGhostOnsets(localOnsets, window.beatMs);

  // Alignment score
  const alignmentScore = clampScore(
    weightedAverage([
      { value: entryScore,           weight: 0.50 },
      { value: landingScore,         weight: 0.28 },
      { value: onsetConfidence * 100, weight: 0.22 },
    ])
  );

  const breathGapMs = Math.max(0, nextBarStartMs - last.timeMs);
  const notes: string[] = [];

  // Contextual notes — richer than v4
  if (timingDeltaMs > 140)
    notes.push("🔴 دخول متأخر بشكل واضح — تدرّب على Downbeat الدقيق.");
  else if (timingDeltaMs > 60)
    notes.push("🟠 دخول متأخر طفيف — يمكن تعديله.");
  else if (timingDeltaMs < -140)
    notes.push("🟡 دخول مبكر كبير — قد يكون pickup، تحقق من القصد.");
  else if (timingDeltaMs < -60)
    notes.push("🟡 دخول مبكر طفيف — anticipation مقبولة إيقاعياً.");
  else if (Math.abs(timingDeltaMs) <= 30)
    notes.push("✅ Perfect Pocket — توقيت استثنائي.");
  else
    notes.push("✅ In The Pocket — توقيت جيد.");

  if (endDeltaMs > 150)
    notes.push("⚠️ القافية تمتد خارج حدود البار.");
  if (breathGapMs < 100 && breathGapMs >= 0)
    notes.push("⚠️ مساحة النَّفَس ضيقة جداً.");
  if (ghostOnsets > 0)
    notes.push(`🎵 ${ghostOnsets} Ghost Note(s) — إيقاع مضاعف متقدم.`);

  return {
    barId:            bar.id,
    barIndex:         bar.index,
    text:             bar.text,
    detectedStartMs:  first.timeMs,
    detectedEndMs:    last.timeMs,
    timingDeltaMs,
    entryScore,
    landingScore,
    alignmentScore,
    timingTag:        classifyTimingTag(timingDeltaMs, entryScore),
    breathGapMs,
    onsetConfidence,
    ghostOnsets,
    notes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STATISTICAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid    = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const sq   = arr.map((x) => (x - mean) ** 2);
  return Math.sqrt(sq.reduce((a, b) => a + b, 0) / arr.length);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export function analyzeVocalTiming(params: {
  bars:          BarInput[];
  config:        BeatGridConfig;
  beatPositions: BeatPosition[];
  vocalOnsets:   AudioOnset[];
}): RhythmicVocalTimingAnalysis {
  const { bars, config, vocalOnsets } = params;
  const orderedBars  = [...bars].sort((a, b) => a.index - b.index);
  const beatMs       = 60000 / config.bpm;
  const barMs        = beatMs * config.beatsPerBar;

  const results = orderedBars.map((bar) => {
    const nextBarStartMs = config.beatOffsetMs + (bar.index + 1) * barMs;
    return analyzeSingleBarVocalTiming({ bar, config, vocalOnsets, nextBarStartMs });
  });

  // Statistics
  const presentResults  = results.filter((r) => r.timingTag !== "absent");
  const deltas          = presentResults.map((r) => r.timingDeltaMs);

  const globalAlignment    = clampScore(
    results.reduce((s, r) => s + r.alignmentScore, 0) / Math.max(results.length, 1)
  );
  const averageDeltaMs     = deltas.length
    ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;
  const medianDeltaMs      = median(deltas);
  const deltaStdDev        = stdDev(deltas);

  // Consistency: lower std dev = more consistent timing
  const consistencyScore = clampScore(100 - (deltaStdDev / 3));

  const lateEntryCount    = results.filter((r) => r.timingTag === "late" || r.timingTag === "slightlylate").length;
  const earlyEntryCount   = results.filter((r) => r.timingTag === "early" || r.timingTag === "slightlyearly").length;
  const perfectPocketCount = results.filter((r) => r.timingTag === "perfectpocket").length;
  const inPocketCount     = results.filter((r) => r.timingTag === "inpocket").length;

  const suggestions: string[] = [];

  if (lateEntryCount > orderedBars.length * 0.3)
    suggestions.push(`🔴 ${lateEntryCount} بارات بدخول متأخر — شغّل Click Track وركّز على الـ Downbeat.`);

  if (medianDeltaMs > 70)
    suggestions.push(`⏱ المتوسط الإيقاعي متأخر ${medianDeltaMs.toFixed(0)}ms — استمع للموسيقى قبل الكلام بـ 2 بار.`);

  if (medianDeltaMs < -70)
    suggestions.push(`⚡ الأداء يتسابق الموسيقى — خفّف الإيقاع الداخلي قليلاً.`);

  if (deltaStdDev > 100)
    suggestions.push(`📊 التوقيت غير منتظم (انحراف معياري ${deltaStdDev.toFixed(0)}ms) — تدرّب على الثبات.`);

  if (consistencyScore >= 85)
    suggestions.push(`⭐ ثبات إيقاعي ممتاز — الانحراف المعياري ${deltaStdDev.toFixed(0)}ms.`);

  if (globalAlignment >= 88)
    suggestions.push(`✅ تزامن احترافي! ${perfectPocketCount} perfect + ${inPocketCount} in-pocket.`);

  return {
    bars:               results,
    globalAlignment,
    averageDeltaMs,
    medianDeltaMs,
    deltaStdDev,
    lateEntryCount,
    earlyEntryCount,
    perfectPocketCount,
    inPocketCount,
    consistencyScore,
    suggestions,
    rawDeltaDistribution: deltas,
  };
}
