// src/maqam/engines/sonicSemantic.engine.ts
import type { BarInput, EmotionTarget } from "../types/maqam.types";
import { analyzeArabicPhonetics } from "./arabicPhonetics.engine";
import { tokenizeArabic } from "../utils/arabicText.utils";
import { clampScore, weightedAverage } from "../utils/scoring.utils";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface PhoneticProfile {
  impact: number;
  smoothness: number;
  bounce: number;
  heaviness: number;
  breathLoad: number;
  elongation: number;
  sibilance: number;
  gutturalWeight: number;
  syllableEstimate: number;
}

export interface SonicSemanticLine {
  barId: string;
  index: number;
  text: string;
  emotion: EmotionTarget;
  sonicFitScore: number;
  alignmentBreakdown: AlignmentBreakdown;
  recommendedSoundField: string[];
  missingPhonemes: string[];
  surplusPhonemes: string[];
  actualStrengths: string[];
  improvements: string[];
  rewriteSuggestion: string | null;
  visualGrid: SonicVisualCell[];
}

export interface AlignmentBreakdown {
  emotionPhoneticFit: number;
  semanticLexicalFit: number;
  breathRhythmFit: number;
  overallFit: number;
}

export interface SonicVisualCell {
  char: string;
  phonemeClass: "impact" | "smooth" | "sibilant" | "guttural" | "vowel" | "neutral";
  strength: number; // 0–100
  contributes: boolean;
}

export interface SonicSemanticSongResult {
  lines: SonicSemanticLine[];
  globalScore: number;
  emotionArc: EmotionTarget[];
  dominantEmotion: EmotionTarget;
  coherenceScore: number;
  sonicJourneyMap: SonicJourneyPoint[];
  globalImprovements: string[];
}

export interface SonicJourneyPoint {
  index: number;
  barId: string;
  emotion: EmotionTarget;
  sonicFitScore: number;
  trend: "rising" | "falling" | "stable";
}

// ─────────────────────────────────────────────
// CONSTANTS — PHONETIC FIELDS & LEXICONS
// ─────────────────────────────────────────────

const EMOTION_SOUND_FIELDS: Record<EmotionTarget, string[]> = {
  anger:     ["ق", "ط", "ض", "ص", "ك", "ت", "ج"],
  sadness:   ["ا", "و", "ي", "ه", "م", "ن", "ل"],
  pride:     ["ق", "ر", "ج", "د", "ط", "ع"],
  love:      ["ل", "م", "ن", "ه", "ي", "و", "ا"],
  tension:   ["س", "ش", "ح", "خ", "ق", "ز"],
  hope:      ["ن", "و", "ر", "ا", "ي", "ل"],
  defiance:  ["ق", "ك", "ت", "ض", "ر", "ج"],
  melancholy:["م", "ن", "ه", "ا", "و", "ي"],
  triumph:   ["ق", "ط", "ر", "د", "ج", "ع"],
  neutral:   ["ل", "ر", "م", "ن"],
};

const EMOTION_WORDS: Record<EmotionTarget, string[]> = {
  anger:     ["غضب", "نار", "حرب", "اكسر", "دم", "صرخه", "ثوره", "هجوم"],
  sadness:   ["حزن", "جرح", "دمع", "ليل", "برد", "وحده", "بكاء", "فراق"],
  pride:     ["فخر", "تاج", "ملك", "قمه", "اسمي", "هيبه", "عرش", "مجد"],
  love:      ["حب", "قلب", "روح", "عين", "حنين", "قرب", "عشق", "وله"],
  tension:   ["خوف", "قلق", "ضغط", "سقوط", "توتر", "ارتعاش", "حافه"],
  hope:      ["امل", "نور", "حلم", "صبح", "طريق", "فجر", "ايمان"],
  defiance:  ["رغم", "ضد", "ارفض", "اقاوم", "اكمل", "ابني", "اتحدى"],
  melancholy:["ذكرى", "غبار", "غياب", "مطر", "صمت", "عتمه", "زمن"],
  triumph:   ["نصر", "فوز", "وصلت", "رفعت", "انتصار", "قمت", "تخطيت"],
  neutral:   [],
};

// Character → phoneme class mapping
const PHONEME_CLASS_MAP: Record<string, SonicVisualCell["phonemeClass"]> = {
  "ق": "impact", "ط": "impact", "ض": "impact", "ص": "impact",
  "ك": "impact", "ت": "impact", "د": "impact", "ج": "impact",
  "ل": "smooth", "م": "smooth", "ن": "smooth", "ر": "smooth",
  "و": "smooth", "ي": "smooth",
  "س": "sibilant", "ش": "sibilant", "ز": "sibilant",
  "ح": "guttural", "خ": "guttural", "ع": "guttural", "غ": "guttural", "ه": "guttural",
  "ا": "vowel", "ى": "vowel", "ة": "vowel",
};

const PHONEME_STRENGTH: Record<SonicVisualCell["phonemeClass"], number> = {
  impact:   90,
  guttural: 75,
  sibilant: 65,
  smooth:   55,
  vowel:    40,
  neutral:  30,
};

// ─────────────────────────────────────────────
// CORE UTILITIES
// ─────────────────────────────────────────────

export function detectEmotionFromText(text: string): EmotionTarget {
  const tokens = tokenizeArabic(text);
  let best: EmotionTarget = "neutral";
  let topScore = 0;

  for (const [emotion, words] of Object.entries(EMOTION_WORDS) as Array<[EmotionTarget, string[]]>) {
    const hits = tokens.filter((t) => words.includes(t)).length;
    if (hits > topScore) {
      best = emotion;
      topScore = hits;
    }
  }
  return best;
}

function buildVisualGrid(text: string, emotion: EmotionTarget): SonicVisualCell[] {
  const field = new Set(EMOTION_SOUND_FIELDS[emotion]);
  const cells: SonicVisualCell[] = [];

  for (const char of text) {
    if (char.trim() === "") continue;
    const phonemeClass = PHONEME_CLASS_MAP[char] ?? "neutral";
    const strength = PHONEME_STRENGTH[phonemeClass];
    cells.push({
      char,
      phonemeClass,
      strength,
      contributes: field.has(char),
    });
  }
  return cells;
}

function computePhoneticAlignment(
  phonetics: PhoneticProfile,
  emotion: EmotionTarget
): number {
  const intense = ["anger", "defiance", "triumph", "pride"] as EmotionTarget[];
  const soft    = ["sadness", "love", "melancholy", "hope"] as EmotionTarget[];

  if (intense.includes(emotion)) {
    return weightedAverage([
      { value: phonetics.impact,                  weight: 0.35 },
      { value: phonetics.heaviness,               weight: 0.25 },
      { value: phonetics.bounce,                  weight: 0.20 },
      { value: 100 - phonetics.breathLoad,        weight: 0.20 },
    ]);
  }

  if (soft.includes(emotion)) {
    return weightedAverage([
      { value: phonetics.smoothness,              weight: 0.35 },
      { value: phonetics.elongation,              weight: 0.25 },
      { value: 100 - phonetics.heaviness,         weight: 0.15 },
      { value: 100 - phonetics.breathLoad,        weight: 0.25 },
    ]);
  }

  if (emotion === "tension") {
    return weightedAverage([
      { value: phonetics.sibilance,               weight: 0.30 },
      { value: phonetics.gutturalWeight,          weight: 0.25 },
      { value: phonetics.impact,                  weight: 0.20 },
      { value: phonetics.breathLoad,              weight: 0.25 },
    ]);
  }

  return weightedAverage([
    { value: phonetics.bounce,                    weight: 0.35 },
    { value: phonetics.smoothness,                weight: 0.35 },
    { value: 100 - phonetics.breathLoad,          weight: 0.30 },
  ]);
}

function computeSemanticAlignment(text: string, emotion: EmotionTarget): number {
  const tokens = tokenizeArabic(text);
  const words = EMOTION_WORDS[emotion];
  if (!words.length) return 50;
  const hits = tokens.filter((t) => words.includes(t)).length;
  return clampScore((hits / Math.max(1, words.length)) * 100 * 2.5);
}

function detectMissingPhonemes(
  text: string,
  field: string[],
  threshold = 0.15
): string[] {
  const chars = new Set(text.replace(/\s/g, "").split(""));
  return field.filter((ph) => !chars.has(ph));
}

function detectSurplusPhonemes(
  text: string,
  field: string[]
): string[] {
  const fieldSet = new Set(field);
  const chars = new Set(text.replace(/\s/g, "").split(""));
  const opposing: string[] = [];
  for (const char of chars) {
    if (PHONEME_CLASS_MAP[char] && !fieldSet.has(char)) {
      opposing.push(char);
    }
  }
  return [...new Set(opposing)].slice(0, 4);
}

function generateRewriteSuggestion(
  text: string,
  emotion: EmotionTarget,
  missingPhonemes: string[],
  sonicFitScore: number
): string | null {
  if (sonicFitScore >= 70 || !missingPhonemes.length) return null;

  const fieldLabel: Record<EmotionTarget, string> = {
    anger:     "حروف الاندفاع والقوة (ق، ط، ض)",
    sadness:   "حروف المد والحنين (ا، و، ي، ن)",
    pride:     "حروف الهيبة والجلال (ق، ر، ع، ط)",
    love:      "حروف الرقة والقرب (ل، م، ن، ي)",
    tension:   "حروف الاحتكاك والضغط (س، ش، ح، خ)",
    hope:      "حروف النور والانفتاح (ن، و، ر، ا)",
    defiance:  "حروف الصمود والتحدي (ق، ك، ض، ر)",
    melancholy:"حروف الشجن والعمق (م، ن، ه، ا)",
    triumph:   "حروف الانتصار والإعلان (ق، ط، ر، ع)",
    neutral:   "حروف متوازنة (ل، ر، م، ن)",
  };

  return `البار يفتقر إلى ${fieldLabel[emotion]}. أعد صياغة بحيث تظهر هذه الحروف في الكلمات المحورية وليس في حروف الجر أو المساعدة.`;
}

// ─────────────────────────────────────────────
// MAIN LINE ANALYZER
// ─────────────────────────────────────────────

export function analyzeSonicSemanticLine(bar: BarInput): SonicSemanticLine {
  const phoneticResult = analyzeArabicPhonetics(bar);
  const phonetics = phoneticResult.phonetics as PhoneticProfile;
  const emotion = detectEmotionFromText(bar.text);
  const field = EMOTION_SOUND_FIELDS[emotion];

  const emotionPhoneticFit  = clampScore(computePhoneticAlignment(phonetics, emotion));
  const semanticLexicalFit  = clampScore(computeSemanticAlignment(bar.text, emotion));
  const breathRhythmFit     = clampScore(100 - phonetics.breathLoad * 0.85);

  const overallFit = clampScore(
    weightedAverage([
      { value: emotionPhoneticFit, weight: 0.45 },
      { value: semanticLexicalFit, weight: 0.30 },
      { value: breathRhythmFit,    weight: 0.25 },
    ])
  );

  const alignmentBreakdown: AlignmentBreakdown = {
    emotionPhoneticFit,
    semanticLexicalFit,
    breathRhythmFit,
    overallFit,
  };

  const missingPhonemes = detectMissingPhonemes(bar.text, field);
  const surplusPhonemes = detectSurplusPhonemes(bar.text, field);
  const visualGrid      = buildVisualGrid(bar.text, emotion);

  // ── Strengths ──────────────────────────────
  const actualStrengths: string[] = [];
  if (phonetics.impact > 70)       actualStrengths.push("ضربة صوتية قوية — حروف القوة حاضرة");
  if (phonetics.smoothness > 70)   actualStrengths.push("انسياب ناعم — مناسب للشعور اللحني");
  if (phonetics.bounce > 70)       actualStrengths.push("قلقلة وحيوية إيقاعية عالية");
  if (phonetics.heaviness > 70)    actualStrengths.push("ثقل صوتي مناسب للـ Punchline");
  if (phonetics.elongation > 65)   actualStrengths.push("مدود تعبيرية واسعة");
  if (semanticLexicalFit > 65)     actualStrengths.push("الكلمات تدعم الحالة المشاعرية بقوة");

  // ── Improvements ───────────────────────────
  const improvements: string[] = [];
  if (overallFit < 55) {
    improvements.push(`عزز التوافق بحروف: ${field.slice(0, 4).join(" / ")} — ضعها في الكلمات المحورية.`);
  }
  if (phonetics.breathLoad > 80) {
    improvements.push("حمل النفس ثقيل — أضف وقفة صوتية بعد الكلمة المحورية أو احذف كلمة رابطة.");
  }
  if (semanticLexicalFit < 40) {
    improvements.push(`المعجم الشعوري ضعيف — أدخل كلمات من حقل: ${EMOTION_WORDS[emotion].slice(0, 4).join("، ")}.`);
  }
  if (surplusPhonemes.length > 2) {
    improvements.push(`حروف (${surplusPhonemes.join("، ")}) تضعف الحالة الصوتية — قلّل استخدامها في الكلمات الأساسية.`);
  }

  const rewriteSuggestion = generateRewriteSuggestion(
    bar.text, emotion, missingPhonemes, overallFit
  );

  return {
    barId:                bar.id,
    index:                bar.index,
    text:                 bar.text,
    emotion,
    sonicFitScore:        overallFit,
    alignmentBreakdown,
    recommendedSoundField: field,
    missingPhonemes,
    surplusPhonemes,
    actualStrengths,
    improvements,
    rewriteSuggestion,
    visualGrid,
  };
}

// ─────────────────────────────────────────────
// SONG-LEVEL ANALYZER
// ─────────────────────────────────────────────

export function analyzeSonicSemanticSong(bars: BarInput[]): SonicSemanticSongResult {
  const lines = bars.map(analyzeSonicSemanticLine);

  const globalScore = clampScore(
    lines.reduce((sum, l) => sum + l.sonicFitScore, 0) / Math.max(1, lines.length)
  );

  const emotionArc = lines.map((l) => l.emotion);

  // Dominant emotion
  const freq = new Map<EmotionTarget, number>();
  for (const e of emotionArc) freq.set(e, (freq.get(e) ?? 0) + 1);
  const dominantEmotion = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "neutral";

  // Coherence — penalise abrupt emotional jumps
  let coherenceScore = 100;
  for (let i = 1; i < emotionArc.length; i++) {
    if (emotionArc[i] !== emotionArc[i - 1]) coherenceScore -= 8;
  }
  coherenceScore = clampScore(coherenceScore);

  // Journey map
  const sonicJourneyMap: SonicJourneyPoint[] = lines.map((line, idx) => {
    const prev = lines[idx - 1]?.sonicFitScore ?? line.sonicFitScore;
    const diff = line.sonicFitScore - prev;
    return {
      index:       line.index,
      barId:       line.barId,
      emotion:     line.emotion,
      sonicFitScore: line.sonicFitScore,
      trend:       diff > 4 ? "rising" : diff < -4 ? "falling" : "stable",
    };
  });

  // Global improvements
  const globalImprovements: string[] = [];
  if (globalScore < 60) {
    globalImprovements.push("النص بشكل عام يفتقر إلى التوافق الصوتي مع مشاعره — راجع الحروف المحورية في كل بار.");
  }
  if (coherenceScore < 55) {
    globalImprovements.push("التحولات المشاعرية مفاجئة — اعمل على ربط الحالات بجمل انتقالية أو تدرج صوتي.");
  }

  const weakLines = lines.filter((l) => l.sonicFitScore < 50);
  if (weakLines.length) {
    globalImprovements.push(`البارات الأضعف صوتيًا: [${weakLines.map((l) => `#${l.index}`).join(", ")}] — ابدأ بتطويرها.`);
  }

  return {
    lines,
    globalScore,
    emotionArc,
    dominantEmotion,
    coherenceScore,
    sonicJourneyMap,
    globalImprovements,
  };
}
