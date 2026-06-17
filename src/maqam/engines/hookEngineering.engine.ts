// src/maqam/engines/hookEngineering.engine.ts
import type { BarInput } from "../types/maqam.types";
import type { HookAnalysis, HookTechnique } from "../types/hook.types";
import { analyzeArabicPhonetics } from "./arabicPhonetics.engine";
import {
  endingSoundSimilarity,
  getRhymeTail,
  lexicalOverlap,
  tokenizeArabic,
  estimateArabicSyllables,
} from "../utils/arabicText.utils";
import {
  average,
  clampScore,
  variance,
  weightedAverage,
} from "../utils/scoring.utils";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface HookScoreBreakdown {
  symmetry:    number;
  compression: number;
  paradox:     number;
  cadence:     number;
  repetition:  number;
  keyword:     number;
  harmony:     number;
  sensory:     number;
  cultural:    number;
  transition:  number;
}

export interface HookWordAnnotation {
  word:        string;
  role:        "anchor" | "paradox" | "sensory" | "cultural" | "rhyme" | "filler" | "neutral";
  strength:    number; // 0–100
  suggestion?: string;
}

export interface HookLineAnalysis {
  text:        string;
  annotations: HookWordAnnotation[];
  cadenceMap:  CadenceUnit[];
  lineScore:   number;
}

export interface CadenceUnit {
  word:          string;
  syllables:     number;
  beatPosition:  number; // normalised 0.0–1.0 within bar
  stress:        "heavy" | "medium" | "light";
  rhymes:        boolean;
}

export interface HookAlternativeVariant {
  label:       string;
  text:        string;
  score:       number;
  improvement: string;
}

export interface HookEngineeringResult extends HookAnalysis {
  scoreBreakdown:     HookScoreBreakdown;
  lineAnalyses:       HookLineAnalysis[];
  alternativeVariants: HookAlternativeVariant[];
  structureMap:       HookStructureSegment[];
  memorabilityGrade:  "S" | "A" | "B" | "C" | "D";
}

export interface HookStructureSegment {
  lineIndex: number;
  role:      "opener" | "pivot" | "closer" | "echo";
  text:      string;
  score:     number;
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const PARADOX_PAIRS: Array<[string, string]> = [
  ["اغرق", "هواء"],  ["اتنفس", "ماء"],   ["نجاح", "فشل"],
  ["قوه",  "ضعف"],   ["نور",   "ظلام"],  ["ضحك",  "بكاء"],
  ["حياه", "موت"],   ["صعود",  "سقوط"],  ["بارد", "نار"],
  ["صمت",  "صراخ"],  ["ارتاح", "تعب"],   ["سلام", "حرب"],
];

const SENSORY_WORDS = new Set([
  "اشوف","عين","لون","صوت","اسمع","لمس","برد","حر",
  "طعم","ريح","عطر","نار","مطر","ضوء","ظل","دفا",
  "قسوه","ناعم","خشن","مبلل","جاف","مضيء","معتم",
]);

const CULTURAL_MARKERS = new Set([
  "عنتر","زليخه","قيس","ليلى","فرعون","موسى","نيل",
  "اهرام","بابل","اندلس","معلقات","سندباد","شهرزاد",
  "ابوزيد","سيف","كليلة","قرطاجة","صلاح","خالد",
]);

const FILLER_WORDS = new Set([
  "انا","انت","في","من","على","الى","ما","لا","كان","كنت",
  "ده","دي","يا","وانا","وانت","لما","لو","اه","يعني",
]);

// ─────────────────────────────────────────────
// WORD ANNOTATION
// ─────────────────────────────────────────────

function annotateWords(
  text: string,
  rhymeTail: string
): HookWordAnnotation[] {
  const tokens = tokenizeArabic(text);

  return tokens.map((word) => {
    if (CULTURAL_MARKERS.has(word)) {
      return { word, role: "cultural", strength: 85,
        suggestion: "علامة ثقافية قوية — أبقها في موقع محوري." };
    }
    if (SENSORY_WORDS.has(word)) {
      return { word, role: "sensory", strength: 72 };
    }
    // Paradox check
    const inPair = PARADOX_PAIRS.some(([a, b]) => word === a || word === b);
    if (inPair) {
      return { word, role: "paradox", strength: 80,
        suggestion: "جزء من ثنائية متناقضة — تأكد أن النقيض حاضر في نفس البار." };
    }
    if (getRhymeTail(word, 2).includes(rhymeTail)) {
      return { word, role: "rhyme", strength: 68 };
    }
    if (FILLER_WORDS.has(word)) {
      return { word, role: "filler", strength: 15,
        suggestion: "كلمة حشو — يمكن حذفها لتقليص الهوك ورفع كثافته." };
    }
    return { word, role: "neutral", strength: 40 };
  });
}

// ─────────────────────────────────────────────
// CADENCE MAP
// ─────────────────────────────────────────────

function buildCadenceMap(
  bar: BarInput,
  rhymeTail: string
): CadenceUnit[] {
  const tokens = tokenizeArabic(bar.text);

  const totalSyllables = tokens.reduce(
    (s: number, w: string) => s + estimateArabicSyllables(w), 0
  );

  let position = 0;
  return tokens.map((word: string) => {
    const syllables = estimateArabicSyllables(word);
    const beatPosition = totalSyllables > 0 ? position / totalSyllables : 0;
    position += syllables;

    const stress: CadenceUnit["stress"] =
      syllables >= 3 ? "heavy" : syllables === 2 ? "medium" : "light";

    return {
      word,
      syllables,
      beatPosition: parseFloat(beatPosition.toFixed(3)),
      stress,
      rhymes: getRhymeTail(word, 2).includes(rhymeTail),
    };
  });
}

// ─────────────────────────────────────────────
// SCORING FUNCTIONS
// ─────────────────────────────────────────────

function symmetryScore(lines: string[]): number {
  if (lines.length < 2) return 45;
  const first  = lines.slice(0, Math.ceil(lines.length / 2));
  const second = lines.slice(Math.floor(lines.length / 2)).reverse();
  const scores = first.map((line, i) => {
    const opp = second[i];
    if (!opp) return 0;
    return endingSoundSimilarity(line, opp) * 55 + lexicalOverlap(line, opp) * 45;
  });
  return clampScore(average(scores));
}

function semanticCompressionScore(text: string): number {
  const tokens  = tokenizeArabic(text);
  const unique  = new Set(tokens);
  if (!tokens.length) return 0;
  const brevity    = tokens.length <= 8 ? 100 : Math.max(0, 130 - tokens.length * 6);
  const uniqueness = (unique.size / tokens.length) * 100;
  const fillerRatio = tokens.filter((t) => FILLER_WORDS.has(t)).length / tokens.length;
  return clampScore(brevity * 0.5 + uniqueness * 0.35 + (1 - fillerRatio) * 15);
}

function paradoxScore(text: string): number {
  const tokens = new Set(tokenizeArabic(text));
  let hits = 0;
  for (const [a, b] of PARADOX_PAIRS) {
    if (tokens.has(a) && tokens.has(b)) hits++;
  }
  return clampScore(hits * 48);
}

function cadenceScore(lines: string[], bars: BarInput[]): number {
  const analyses   = bars.map(analyzeArabicPhonetics);
  const syllables  = analyses.map((a) => a.phonetics.syllableEstimate);
  const breathLoads = analyses.map((a) => a.phonetics.breathLoad);

  const syllableVariance = variance(syllables);
  const balance          = Math.max(0, 100 - syllableVariance * 8);
  const breathControl    = Math.max(0, 100 - average(breathLoads) * 0.6);
  const rhymeConsistency =
    lines.length > 1
      ? average(lines.map((line, i) => {
          const next = lines[i + 1];
          if (!next) return 0;
          return endingSoundSimilarity(line, next) * 100;
        }))
      : 40;

  return clampScore(balance * 0.35 + breathControl * 0.25 + rhymeConsistency * 0.4);
}

function repetitionEvolutionScore(lines: string[]): number {
  if (lines.length < 2) return 30;
  const overlaps = lines.map((line, i) => {
    const prev = lines[i - 1];
    if (!prev) return 0;
    return lexicalOverlap(prev, line);
  });
  const sweetSpot = average(overlaps) * 100;
  return clampScore(100 - Math.abs(52 - sweetSpot) * 1.5);
}

function resonantKeywordScore(text: string): number {
  const tokens = tokenizeArabic(text);
  const scored = tokens
    .filter((w) => !FILLER_WORDS.has(w) && w.length >= 3)
    .sort((a, b) => b.length - a.length);

  if (!scored.length) return 0;
  const best     = scored[0];
  const tail     = getRhymeTail(best, 2);
  const echoes   = tokens.filter((w) => getRhymeTail(w, 2).includes(tail)).length;
  return clampScore(best.length * 9 + echoes * 14);
}

function sonicHarmonyScore(bars: BarInput[]): number {
  const analyses = bars.map(analyzeArabicPhonetics);
  return clampScore(
    average(analyses.map((a) =>
      weightedAverage([
        { value: a.phonetics.smoothness, weight: 0.25 },
        { value: a.phonetics.bounce,     weight: 0.25 },
        { value: a.phonetics.impact,     weight: 0.25 },
        { value: 100 - a.phonetics.breathLoad, weight: 0.25 },
      ])
    ))
  );
}

function sensoryScore(text: string): number {
  const tokens = tokenizeArabic(text);
  const hits   = tokens.filter((t) => SENSORY_WORDS.has(t)).length;
  return clampScore(hits * 20);
}

function culturalSurpriseScore(text: string): number {
  const tokens        = tokenizeArabic(text);
  const hits          = tokens.filter((t) => CULTURAL_MARKERS.has(t)).length;
  const unexpectedness = new Set(tokens).size / Math.max(1, tokens.length);
  return clampScore(hits * 25 + unexpectedness * 35);
}

function transitionScore(hookBars: BarInput[], allBars: BarInput[]): number {
  if (!hookBars.length) return 0;
  const hookText = hookBars.map((b) => b.text).join(" ");
  const prev     = allBars.filter((b) => b.index < hookBars[0].index);
  const next     = allBars.filter((b) => b.index > hookBars.at(-1)!.index);
  const pO = prev.length ? average(prev.map((b) => lexicalOverlap(b.text, hookText))) : 0;
  const nO = next.length ? average(next.map((b) => lexicalOverlap(b.text, hookText))) : 0;
  return clampScore((pO + nO) * 72);
}

// ─────────────────────────────────────────────
// STRUCTURE MAP
// ─────────────────────────────────────────────

function buildStructureMap(
  hookBars: BarInput[],
  scores: HookScoreBreakdown
): HookStructureSegment[] {
  return hookBars.map((bar, i) => {
    const isFirst = i === 0;
    const isLast  = i === hookBars.length - 1;
    const isMid   = !isFirst && !isLast;

    const role: HookStructureSegment["role"] =
      isFirst ? "opener"
      : isLast ? "closer"
      : isMid && hookBars.length > 2 && i === Math.floor(hookBars.length / 2)
        ? "pivot"
        : "echo";

    const score =
      role === "opener"  ? scores.symmetry * 0.5 + scores.compression * 0.5
      : role === "closer" ? scores.cadence  * 0.5 + scores.repetition * 0.5
      : role === "pivot"  ? scores.paradox  * 0.6 + scores.cultural * 0.4
      : scores.harmony;

    return { lineIndex: i, role, text: bar.text, score: clampScore(score) };
  });
}

// ─────────────────────────────────────────────
// ALTERNATIVE VARIANTS GENERATOR
// ─────────────────────────────────────────────

function generateAlternativeVariants(
  hookText: string,
  scores: HookScoreBreakdown
): HookAlternativeVariant[] {
  const variants: HookAlternativeVariant[] = [];

  if (scores.paradox < 45) {
    variants.push({
      label: "نسخة المفارقة اللفظية",
      text:  `${hookText} — [أضف ثنائية: ارفع / اسقط | نور / ظلام | ضحك / جرح]`,
      score: clampScore(scores.paradox + 30),
      improvement: "إضافة مفارقة لفظية ترفع الـ Memorability بشكل فوري.",
    });
  }

  if (scores.compression < 55) {
    const tokens  = tokenizeArabic(hookText);
    const trimmed = tokens.filter((t) => !FILLER_WORDS.has(t)).join(" ");
    variants.push({
      label: "نسخة الضغط الدلالي",
      text:  trimmed,
      score: clampScore(scores.compression + 25),
      improvement: "حذف الكلمات الزائدة يرفع كثافة المعنى ويسهل الحفظ.",
    });
  }

  if (scores.symmetry < 55) {
    variants.push({
      label: "نسخة التماثل الصوتي",
      text:  `[افتح بنفس صوت النهاية] ${hookText} [أغلق بصدى البداية]`,
      score: clampScore(scores.symmetry + 28),
      improvement: "الهوك الذي يفتح ويغلق بنفس الصوت يبقى في الذاكرة أطول.",
    });
  }

  return variants;
}

// ─────────────────────────────────────────────
// GRADE
// ─────────────────────────────────────────────

function gradeMemorability(score: number): HookEngineeringResult["memorabilityGrade"] {
  if (score >= 88) return "S";
  if (score >= 74) return "A";
  if (score >= 60) return "B";
  if (score >= 45) return "C";
  return "D";
}

// ─────────────────────────────────────────────
// TECHNIQUE DETECTOR
// ─────────────────────────────────────────────

function detectHookTechniques(scores: HookScoreBreakdown): HookTechnique[] {
  const detected: HookTechnique[] = [];
  if (scores.symmetry    >= 58) detected.push("symmetricalsoniccondensation");
  if (scores.compression >= 65) detected.push("concentratedsemanticreduction");
  if (scores.paradox     >= 45) detected.push("astonishingverbalparadox");
  if (scores.cadence     >= 62) detected.push("exceptionalrhythmiccadence");
  if (scores.repetition  >= 62) detected.push("evolvingdynamicrepetition");
  if (scores.keyword     >= 58) detected.push("resonantkeyword");
  if (scores.harmony     >= 62) detected.push("multilayeredsonicharmony");
  if (scores.sensory     >= 45) detected.push("integratedsensoryhook");
  if (scores.cultural    >= 45) detected.push("culturallyextendedsurprise");
  if (scores.transition  >= 50) detected.push("rhythmicsemantictransition");
  return detected;
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────

export function analyzeHookEngineering(
  allBars:  BarInput[],
  hookBars: BarInput[]
): HookEngineeringResult {
  const hookText = hookBars.map((b) => b.text).join("\n");
  const lines    = hookBars.map((b) => b.text).filter(Boolean);

  // Core scores
  const symmetry    = symmetryScore(lines);
  const compression = semanticCompressionScore(hookText);
  const paradox     = paradoxScore(hookText);
  const cadence     = cadenceScore(lines, hookBars);
  const repetition  = repetitionEvolutionScore(lines);
  const keyword     = resonantKeywordScore(hookText);
  const harmony     = sonicHarmonyScore(hookBars);
  const sensory     = sensoryScore(hookText);
  const cultural    = culturalSurpriseScore(hookText);
  const transition  = transitionScore(hookBars, allBars);

  const scoreBreakdown: HookScoreBreakdown = {
    symmetry, compression, paradox, cadence,
    repetition, keyword, harmony, sensory, cultural, transition,
  };

  const memorabilityScore = clampScore(
    weightedAverage([
      { value: symmetry,    weight: 0.13 },
      { value: compression, weight: 0.13 },
      { value: paradox,     weight: 0.10 },
      { value: cadence,     weight: 0.13 },
      { value: repetition,  weight: 0.11 },
      { value: keyword,     weight: 0.10 },
      { value: harmony,     weight: 0.13 },
      { value: sensory,     weight: 0.07 },
      { value: cultural,    weight: 0.05 },
      { value: transition,  weight: 0.05 },
    ])
  );

  // Line-level analyses
  const primaryRhymeTail = hookBars.length
    ? getRhymeTail(lines.at(-1) ?? "", 2)
    : "";

  const lineAnalyses: HookLineAnalysis[] = hookBars.map((bar) => {
    const annotations = annotateWords(bar.text, primaryRhymeTail);
    const cadenceMap  = buildCadenceMap(bar, primaryRhymeTail);
    const lineScore   = clampScore(
      average(annotations.map((a) => a.strength))
    );
    return { text: bar.text, annotations, cadenceMap, lineScore };
  });

  // Structure map
  const structureMap = buildStructureMap(hookBars, scoreBreakdown);

  // Suggestions
  const suggestions: string[] = [];
  if (symmetry   < 55) suggestions.push("اجعل بداية الهوك ونهايته يتشاركان نفس الصوت أو الكلمة المفتاحية.");
  if (compression< 60) suggestions.push("اختصر الهوك إلى جملة أقل كلمات وأعلى كثافة — احذف أي كلمة ربط غير ضرورية.");
  if (paradox    < 40) suggestions.push("أضف مفارقة لفظية مثل: أضحك من جرحي / أغرق في الهواء.");
  if (cadence    < 60) suggestions.push("وازن عدد المقاطع بين سطور الهوك واجعل القافية أكثر انتظامًا.");
  if (keyword    < 55) suggestions.push("اختر كلمة مركزية رنانة وكرر صوتها أو اشتقاقاتها داخل الهوك.");
  if (transition < 45) suggestions.push("اجعل الهوك يعكس فكرة الفيرس ويفتح الباب للقسم التالي في آن واحد.");
  if (sensory    < 35) suggestions.push("أضف صورة حسية واحدة قوية (بصرية أو لمسية) لتعميق التأثير.");
  if (cultural   < 30) suggestions.push("استدعِ مرجعًا ثقافيًا أو أسطوريًا مفاجئًا لخلق بصمة معرفية.");

  const alternativeVariants = generateAlternativeVariants(hookText, scoreBreakdown);

  return {
    hookText,
    memorabilityScore,
    symmetryScore:            symmetry,
    semanticCompressionScore: compression,
    paradoxScore:             paradox,
    cadenceScore:             cadence,
    repetitionEvolutionScore: repetition,
    resonantKeywordScore:     keyword,
    sonicHarmonyScore:        harmony,
    sensoryScore:             sensory,
    culturalSurpriseScore:    cultural,
    transitionScore:          transition,
    detectedTechniques:       detectHookTechniques(scoreBreakdown),
    keywords:                 lineAnalyses.flatMap((l) =>
                                l.annotations.filter((a) => a.role !== "filler").map((a) => a.word)
                              ).slice(0, 8),
    suggestions,
    // Extended fields
    scoreBreakdown,
    lineAnalyses,
    alternativeVariants,
    structureMap,
    memorabilityGrade: gradeMemorability(memorabilityScore),
  };
}
