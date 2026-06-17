import { v4 as uuidv4 } from "uuid";
import {
  Bar,
  Beat,
  Quatrain,
  RhymeScheme,
  SyncopationLevel,
  EmotionType,
} from "../types/flowEngine.types";

// ─── ثوابت ────────────────────────────────────────────────────────

const DEFAULT_BPM = 90;
const DEFAULT_TIME_SIGNATURE: [number, number] = [4, 4];

const RHYME_SCHEME_MAP: Record<RhymeScheme, string[]> = {
  AABB: ["A", "A", "B", "B"],
  ABAB: ["A", "B", "A", "B"],
  ABBA: ["A", "B", "B", "A"],
  AAAA: ["A", "A", "A", "A"],
  FREE: ["X", "X", "X", "X"],
  AXAX: ["A", "X", "A", "X"],
  ABCB: ["A", "B", "C", "B"],
  AABA: ["A", "A", "B", "A"],
};

// ─── إنشاء دقة فارغة ─────────────────────────────────────────────

export function createEmptyBeat(position: 1 | 2 | 3 | 4): Beat {
  return {
    id: uuidv4(),
    position,
    syllable: "",
    hasVowel: false,
    isSpike: false,
    velocity: 70,
    duration: 250,
    pitchOffset: 0,
    instrumentLayer: null,
    emotionTag: null,
    isRest: false,
    isTied: false,
    accent: "none",
    microTimingOffset: 0,
  };
}

// ─── إنشاء بار فارغ ──────────────────────────────────────────────

export function createEmptyBar(rhymeEnd: string = ""): Bar {
  return {
    id: uuidv4(),
    beats: [
      createEmptyBeat(1),
      createEmptyBeat(2),
      createEmptyBeat(3),
      createEmptyBeat(4),
    ],
    rhymeEndSound: rhymeEnd,
    flowLayer: "skeleton",
    bpm: DEFAULT_BPM,
    timeSignature: DEFAULT_TIME_SIGNATURE,
    swingAmount: 0,
    intensityScore: 0,
    syllableCount: 0,
    isAnchor: false,
  };
}

// ─── إنشاء رباعية ─────────────────────────────────────────────────

export function generateQuatrain(
  scheme: RhymeScheme,
  emotion: EmotionType = "storytelling"
): Quatrain {
  const pattern = RHYME_SCHEME_MAP[scheme];
  const rhymeEnds: Record<string, string> = {
    A: "ـار",
    B: "ـين",
    C: "ـوم",
    X: "",
  };

  const bars = pattern.map((letter) =>
    createEmptyBar(rhymeEnds[letter] ?? "")
  ) as [Bar, Bar, Bar, Bar];

  return {
    id: uuidv4(),
    bars,
    rhymeScheme: scheme,
    overallEmotion: emotion,
    transitionIn: null,
    transitionOut: null,
    coherenceScore: 0,
    densityScore: 0,
    dynamicRange: 0,
  };
}

// ─── حساب شدة البار ──────────────────────────────────────────────

export function calculateBarIntensity(bar: Bar): number {
  const beats = bar.beats;
  let score = 0;

  const filledBeats = beats.filter((b) => b.syllable.length > 0 && !b.isRest);
  score += (filledBeats.length / beats.length) * 30;

  const spikeCount = beats.filter((b) => b.isSpike).length;
  score += spikeCount * 10;

  const avgVelocity =
    beats.reduce((sum, b) => sum + b.velocity, 0) / beats.length;
  score += (avgVelocity / 100) * 20;

  const hasVowels = beats.filter((b) => b.hasVowel).length;
  score += (hasVowels / beats.length) * 15;

  const accentedBeats = beats.filter(
    (b) => b.accent === "strong" || b.accent === "ghost"
  ).length;
  score += accentedBeats * 5;

  const tiedBeats = beats.filter((b) => b.isTied).length;
  score += tiedBeats * 2.5;

  return Math.min(100, Math.round(score));
}

// ─── حساب كثافة المقاطع ──────────────────────────────────────────

export function calculateSyllableDensity(bar: Bar): number {
  const totalSyllables = bar.beats.reduce(
    (sum, b) => sum + (b.syllable ? b.syllable.split(/[\s-]/).length : 0),
    0
  );
  return totalSyllables;
}

// ─── تطبيق السنكبة - المستوى 1 ───────────────────────────────────

export function applySyncopationLevel1(bar: Bar): Bar {
  const updatedBeats = bar.beats.map((beat) => ({
    ...beat,
    hasVowel: true,
    isSpike: beat.position === 4,
    accent: beat.position === 1 ? ("strong" as const) : ("weak" as const),
    velocity: beat.position === 1 || beat.position === 3 ? 85 : 65,
  }));

  const updatedBar: Bar = {
    ...bar,
    beats: updatedBeats,
    flowLayer: "skeleton",
  };

  return {
    ...updatedBar,
    intensityScore: calculateBarIntensity(updatedBar),
    syllableCount: calculateSyllableDensity(updatedBar),
  };
}

// ─── تطبيق السنكبة - المستوى 2 ───────────────────────────────────

export function applySyncopationLevel2(bar: Bar): Bar {
  const updatedBeats = bar.beats.map((beat) => ({
    ...beat,
    hasVowel: true,
    isSpike: beat.position === 2 || beat.position === 4,
    accent:
      beat.position === 2
        ? ("strong" as const)
        : beat.position === 4
        ? ("ghost" as const)
        : ("weak" as const),
    velocity: beat.position === 2 ? 95 : beat.position === 4 ? 55 : 70,
    microTimingOffset: beat.position % 2 === 0 ? 15 : -10,
  }));

  const updatedBar: Bar = {
    ...bar,
    beats: updatedBeats,
    flowLayer: "skeleton",
    swingAmount: 25,
  };

  return {
    ...updatedBar,
    intensityScore: calculateBarIntensity(updatedBar),
    syllableCount: calculateSyllableDensity(updatedBar),
  };
}

// ─── تطبيق السنكبة - المستوى 3 ───────────────────────────────────

export function applySyncopationLevel3(bar: Bar): Bar {
  const updatedBeats = bar.beats.map((beat, i) => ({
    ...beat,
    hasVowel: true,
    isSpike: i === 1 || i === 3,
    accent:
      i === 1
        ? ("strong" as const)
        : i === 3
        ? ("ghost" as const)
        : ("none" as const),
    velocity: [60, 95, 50, 85][i],
    microTimingOffset: [0, 20, -15, 25][i],
    isTied: i === 2,
  }));

  const updatedBar: Bar = {
    ...bar,
    beats: updatedBeats,
    flowLayer: "skeleton",
    swingAmount: 45,
  };

  return {
    ...updatedBar,
    intensityScore: calculateBarIntensity(updatedBar),
    syllableCount: calculateSyllableDensity(updatedBar),
  };
}

// ─── تطبيق السنكبة - المستوى 4 (النخبة) ─────────────────────────

export function applySyncopationLevel4(bar: Bar): Bar {
  const updatedBeats = bar.beats.map((beat, i) => ({
    ...beat,
    hasVowel: true,
    isSpike: true,
    accent: (["ghost", "strong", "ghost", "strong"] as const)[i],
    velocity: [45, 100, 55, 90][i],
    microTimingOffset: [-25, 30, -20, 35][i],
    isTied: i === 0 || i === 2,
    pitchOffset: [2, -3, 4, -2][i],
  }));

  const updatedBar: Bar = {
    ...bar,
    beats: updatedBeats,
    flowLayer: "skeleton",
    swingAmount: 65,
  };

  return {
    ...updatedBar,
    intensityScore: calculateBarIntensity(updatedBar),
    syllableCount: calculateSyllableDensity(updatedBar),
  };
}

// ─── تطبيق السنكبة حسب المستوى ───────────────────────────────────

export function applySyncopation(bar: Bar, level: SyncopationLevel): Bar {
  switch (level) {
    case 1:
      return applySyncopationLevel1(bar);
    case 2:
      return applySyncopationLevel2(bar);
    case 3:
      return applySyncopationLevel3(bar);
    case 4:
      return applySyncopationLevel4(bar);
  }
}

// ─── حساب تماسك الرباعية ──────────────────────────────────────────

export function calculateQuatrainCoherence(quatrain: Quatrain): number {
  const { bars, rhymeScheme } = quatrain;
  let score = 0;

  // تطابق القوافي
  const pattern = RHYME_SCHEME_MAP[rhymeScheme];
  const rhymeGroups: Record<string, string[]> = {};
  pattern.forEach((letter, i) => {
    if (letter !== "X") {
      if (!rhymeGroups[letter]) rhymeGroups[letter] = [];
      rhymeGroups[letter].push(bars[i].rhymeEndSound);
    }
  });

  let rhymeMatch = 0;
  let rhymeTotal = 0;
  Object.values(rhymeGroups).forEach((group) => {
    for (let i = 1; i < group.length; i++) {
      rhymeTotal++;
      if (group[i] === group[0] && group[i] !== "") rhymeMatch++;
    }
  });
  score += rhymeTotal > 0 ? (rhymeMatch / rhymeTotal) * 40 : 0;

  // تناسق الشدة
  const intensities = bars.map((b) => b.intensityScore);
  const avgIntensity =
    intensities.reduce((a, b) => a + b, 0) / intensities.length;
  const variance =
    intensities.reduce((sum, v) => sum + Math.pow(v - avgIntensity, 2), 0) /
    intensities.length;
  const consistencyScore = Math.max(0, 30 - variance / 10);
  score += consistencyScore;

  // ملء المقاطع
  const fillRate =
    bars.reduce(
      (sum, bar) =>
        sum +
        bar.beats.filter((b) => b.syllable.length > 0).length /
          bar.beats.length,
      0
    ) / bars.length;
  score += fillRate * 30;

  return Math.min(100, Math.round(score));
}

// ─── حساب التباين الديناميكي ──────────────────────────────────────

export function calculateDynamicRange(quatrain: Quatrain): number {
  const velocities = quatrain.bars.flatMap((bar) =>
    bar.beats.map((b) => b.velocity)
  );
  if (velocities.length === 0) return 0;
  const min = Math.min(...velocities);
  const max = Math.max(...velocities);
  return Math.round(max - min);
}
