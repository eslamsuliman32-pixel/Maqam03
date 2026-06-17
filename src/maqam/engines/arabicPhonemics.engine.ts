// src/maqam/engines/arabicPhonemics.engine.ts
// v5.0 — Elite Arabic Phonemic Analysis Engine
// يعتمد على قواعد الصوتيات العربية (IPA-mapped) بدلاً من التخمين العددي

// ─────────────────────────────────────────────────────────────────────────────
// PHONEME DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export type PhonemeClass =
  | "stopvelar"      // ك، ق
  | "stopdental"     // ت، د، ط، ض
  | "stopglottal"    // ء، أ، إ
  | "fricativesibilant"  // س، ش، ص، ز
  | "fricativepharyngeal" // ح، ع
  | "fricativeuvular"    // خ، غ
  | "fricativeglottal"   // ه
  | "nasal"           // م، ن
  | "lateral"         // ل
  | "trill"           // ر
  | "approximant"     // و، ي (consonantal)
  | "longvowel"      // ا، و، ي (vocalic)
  | "shortvowel"     // فتحة، ضمة، كسرة (مُستنتجة)
  | "geminate"        // شدة
  | "silent";         // حروف صامتة في السياق

export type SyllableType =
  | "CV"    // حرف + حركة قصيرة  (خَ)       — وزن 1
  | "CVV"   // حرف + حركة طويلة (خا)        — وزن 2
  | "CVC"   // حرف + حركة + ساكن (خَلْ)     — وزن 2
  | "CVVC"  // حرف + حركة طويلة + ساكن (خال) — وزن 3
  | "CVCC"; // حرف + حركة + ساكنان (بَرْد)  — وزن 3

export interface Phoneme {
  char:       string;
  class:      PhonemeClass;
  ipaSymbol:  string;
  weight:     number;   // 1 = خفيف، 2 = ثقيل، 3 = فائق الثقل
  duration:   number;   // نسبية — 1.0 = أساسي
  impactScore: number;  // 0–1: تأثير إيقاعي
}

export interface ArabicSyllable {
  text:       string;
  type:       SyllableType;
  phonemes:   Phoneme[];
  weight:     number;       // الوزن العروضي المُحسوب
  stress:     "primary" | "secondary" | "unstressed";
  onset:      string;       // الحرف الصامت الافتتاحي
  nucleus:    string;       // الصائت (مركز المقطع)
  coda:       string;       // الختام الصامت
  durationMs: number;       // مدة زمنية تقديرية بالـ ms عند BPM معين
}

export interface WordPhonemicProfile {
  word:              string;
  normalized:        string;
  syllables:         ArabicSyllable[];
  totalWeight:       number;
  dominantClass:     PhonemeClass;
  rhymeFingerprint:  string;  // للمطابقة الصوتية (آخر مقطع + نواته)
  rhythmicSignature: number[]; // مصفوفة الأوزان [1,2,1,3] للمطابقة الأنماطية
}

// ─────────────────────────────────────────────────────────────────────────────
// PHONEME MAP — Arabic IPA Reference
// ─────────────────────────────────────────────────────────────────────────────

const PHONEMEREGISTRY: Record<string, Omit<Phoneme, "char">> = {
  // Stop consonants
  "ب": { class: "stopdental",    ipaSymbol: "b",  weight: 2, duration: 1.0, impactScore: 0.70 },
  "ت": { class: "stopdental",    ipaSymbol: "t",  weight: 2, duration: 0.9, impactScore: 0.65 },
  "ث": { class: "fricativesibilant", ipaSymbol: "θ", weight: 1, duration: 1.1, impactScore: 0.40 },
  "ج": { class: "stopdental",    ipaSymbol: "dʒ", weight: 2, duration: 1.2, impactScore: 0.80 },
  "ح": { class: "fricativepharyngeal", ipaSymbol: "ħ", weight: 2, duration: 1.3, impactScore: 0.55 },
  "خ": { class: "fricativeuvular", ipaSymbol: "x", weight: 2, duration: 1.1, impactScore: 0.60 },
  "د": { class: "stopdental",    ipaSymbol: "d",  weight: 2, duration: 1.0, impactScore: 0.75 },
  "ذ": { class: "fricativesibilant", ipaSymbol: "ð", weight: 1, duration: 1.0, impactScore: 0.45 },
  "ر": { class: "trill",          ipaSymbol: "r",  weight: 2, duration: 1.4, impactScore: 0.85 },
  "ز": { class: "fricativesibilant", ipaSymbol: "z", weight: 2, duration: 1.1, impactScore: 0.70 },
  "س": { class: "fricativesibilant", ipaSymbol: "s", weight: 1, duration: 1.1, impactScore: 0.55 },
  "ش": { class: "fricativesibilant", ipaSymbol: "ʃ", weight: 2, duration: 1.2, impactScore: 0.65 },
  "ص": { class: "fricativesibilant", ipaSymbol: "sˤ",weight: 3, duration: 1.3, impactScore: 0.80 },
  "ض": { class: "stopdental",    ipaSymbol: "dˤ", weight: 3, duration: 1.3, impactScore: 0.90 },
  "ط": { class: "stopdental",    ipaSymbol: "tˤ", weight: 3, duration: 1.2, impactScore: 0.88 },
  "ظ": { class: "fricativesibilant", ipaSymbol: "ðˤ",weight: 3, duration: 1.3, impactScore: 0.75 },
  "ع": { class: "fricativepharyngeal", ipaSymbol: "ʕ",weight: 3, duration: 1.5, impactScore: 0.92 },
  "غ": { class: "fricativeuvular", ipaSymbol: "ɣ", weight: 2, duration: 1.2, impactScore: 0.70 },
  "ف": { class: "fricativesibilant", ipaSymbol: "f", weight: 1, duration: 1.0, impactScore: 0.50 },
  "ق": { class: "stopvelar",     ipaSymbol: "q",  weight: 3, duration: 1.1, impactScore: 0.95 },
  "ك": { class: "stopvelar",     ipaSymbol: "k",  weight: 2, duration: 1.0, impactScore: 0.80 },
  "ل": { class: "lateral",        ipaSymbol: "l",  weight: 1, duration: 1.0, impactScore: 0.45 },
  "م": { class: "nasal",          ipaSymbol: "m",  weight: 2, duration: 1.1, impactScore: 0.60 },
  "ن": { class: "nasal",          ipaSymbol: "n",  weight: 1, duration: 1.0, impactScore: 0.55 },
  "ه": { class: "fricativeglottal", ipaSymbol: "h", weight: 1, duration: 0.9, impactScore: 0.30 },
  "و": { class: "approximant",    ipaSymbol: "w",  weight: 1, duration: 1.0, impactScore: 0.40 },
  "ي": { class: "approximant",    ipaSymbol: "j",  weight: 1, duration: 1.0, impactScore: 0.40 },
  // Long vowels
  "ا": { class: "longvowel",     ipaSymbol: "aː", weight: 2, duration: 1.8, impactScore: 0.50 },
  "ى": { class: "longvowel",     ipaSymbol: "aː", weight: 2, duration: 1.8, impactScore: 0.50 },
  "ة": { class: "fricativeglottal", ipaSymbol: "t/h", weight: 1, duration: 0.8, impactScore: 0.30 },
  "أ": { class: "stopglottal",   ipaSymbol: "ʔa", weight: 1, duration: 0.9, impactScore: 0.55 },
  "إ": { class: "stopglottal",   ipaSymbol: "ʔi", weight: 1, duration: 0.9, impactScore: 0.55 },
  "ء": { class: "stopglottal",   ipaSymbol: "ʔ",  weight: 1, duration: 0.8, impactScore: 0.60 },
  "آ": { class: "longvowel",     ipaSymbol: "ʔaː",weight: 3, duration: 2.0, impactScore: 0.65 },
};

// ─────────────────────────────────────────────────────────────────────────────
// TEXT NORMALIZATION
// ─────────────────────────────────────────────────────────────────────────────

const DIACRITICSPATTERN = /[\u064B-\u065F\u0670]/g;
const TATWEELPATTERN    = /\u0640/g;
const ALEFVARIANTS      = /[أإآ]/g;

export function normalizeArabic(text: string): string {
  return text
    .replace(TATWEELPATTERN, "")
    .replace(ALEFVARIANTS, "ا")
    .trim();
}

export function stripDiacritics(text: string): string {
  return text.replace(DIACRITICSPATTERN, "");
}

// ─────────────────────────────────────────────────────────────────────────────
// PHONEME RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

export function resolvePhoneme(char: string): Phoneme {
  const entry = PHONEMEREGISTRY[char];
  if (entry) return { char, ...entry };

  // Fallback for unknown chars
  return {
    char,
    class: "silent",
    ipaSymbol: "",
    weight: 0,
    duration: 0,
    impactScore: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SYLLABIFICATION ENGINE
// Core algorithm: applies Classical Arabic syllable rules
// CV, CVV, CVC, CVVC, CVCC
// ─────────────────────────────────────────────────────────────────────────────

const LONGVOWELS  = new Set(["ا", "و", "ي", "ى", "آ"]);
const ALLVOWELS   = new Set(["ا", "و", "ي", "ى", "آ", "أ", "إ"]);
const CONSONANTS   = new Set(Object.keys(PHONEMEREGISTRY).filter(
  (k) => !LONGVOWELS.has(k)
));

export function syllabifyArabicWord(word: string): ArabicSyllable[] {
  const normalized = normalizeArabic(stripDiacritics(word));
  const chars      = [...normalized];
  const syllables: ArabicSyllable[] = [];

  let i = 0;

  while (i < chars.length) {
    const c0 = chars[i] ?? "";
    const c1 = chars[i + 1] ?? "";
    const c2 = chars[i + 2] ?? "";
    const c3 = chars[i + 3] ?? "";

    // Skip pure silent/connector chars
    if (!CONSONANTS.has(c0) && !ALLVOWELS.has(c0)) {
      i++;
      continue;
    }

    // Case: long vowel at word start (e.g., اسم)
    if (LONGVOWELS.has(c0)) {
      const phonemes = [resolvePhoneme(c0)];
      const nextIsConsonant = c1 && CONSONANTS.has(c1) && !ALLVOWELS.has(c1);
      const type: SyllableType = nextIsConsonant ? "CVC" : "CVV";
      syllables.push(buildSyllable(c0, type, phonemes, "", c0, ""));
      i++;
      continue;
    }

    // Standard: starts with consonant
    if (CONSONANTS.has(c0)) {
      // CVVC: C + LongVowel + C
      if (LONGVOWELS.has(c1) && c2 && CONSONANTS.has(c2) && !LONGVOWELS.has(c2)) {
        const ph = [c0, c1, c2].map(resolvePhoneme);
        syllables.push(buildSyllable(c0 + c1 + c2, "CVVC", ph, c0, c1, c2));
        i += 3;
        continue;
      }

      // CVV: C + LongVowel
      if (LONGVOWELS.has(c1)) {
        const ph = [c0, c1].map(resolvePhoneme);
        syllables.push(buildSyllable(c0 + c1, "CVV", ph, c0, c1, ""));
        i += 2;
        continue;
      }

      // CVC: C + ShortVowel-implied + C (two consonants in sequence)
      if (CONSONANTS.has(c1) && !ALLVOWELS.has(c1) && c1 !== "") {
        const ph = [c0, c1].map(resolvePhoneme);
        syllables.push(buildSyllable(c0 + c1, "CVC", ph, c0, "", c1));
        i += 2;
        continue;
      }

      // CV: single consonant (short vowel implied)
      const ph = [resolvePhoneme(c0)];
      syllables.push(buildSyllable(c0, "CV", ph, c0, "", ""));
      i++;
      continue;
    }

    i++;
  }

  // Post-processing: assign stress
  return assignStress(syllables);
}

function buildSyllable(
  text:     string,
  type:     SyllableType,
  phonemes: Phoneme[],
  onset:    string,
  nucleus:  string,
  coda:     string
): ArabicSyllable {
  const weightMap: Record<SyllableType, number> = {
    CV: 1, CVV: 2, CVC: 2, CVVC: 3, CVCC: 3,
  };

  return {
    text,
    type,
    phonemes,
    weight:     weightMap[type],
    stress:     "unstressed",  // will be assigned later
    onset,
    nucleus,
    coda,
    durationMs: 0,             // populated by timing engine
  };
}

function assignStress(syllables: ArabicSyllable[]): ArabicSyllable[] {
  if (syllables.length === 0) return syllables;
  if (syllables.length === 1) {
    syllables[0]!.stress = "primary";
    return syllables;
  }

  // Arabic stress rules (MSA / simplified):
  // 1. If a superheavy syllable (CVVC/CVCC) exists → it takes primary stress
  // 2. Else: penultimate heavy syllable
  // 3. Else: antepenultimate
  // Rule 1: superheavy (CVVC/CVCC) takes primary stress
  let superheavyIdx = -1;
  for (let i = syllables.length - 1; i >= 0; i--) {
    const t = syllables[i]!.type;
    if (t === "CVVC" || t === "CVCC") { superheavyIdx = i; break; }
  }

  if (superheavyIdx >= 0) {
    syllables[superheavyIdx]!.stress = "primary";
    if (superheavyIdx > 0) syllables[superheavyIdx - 1]!.stress = "secondary";
    return syllables;
  }

  const penultimate = syllables.length - 2;
  if (penultimate >= 0 && syllables[penultimate]!.weight >= 2) {
    syllables[penultimate]!.stress = "primary";
    if (penultimate > 0) syllables[penultimate - 1]!.stress = "secondary";
    return syllables;
  }

  const antepenultimate = Math.max(0, syllables.length - 3);
  syllables[antepenultimate]!.stress = "primary";
  return syllables;
}

// ─────────────────────────────────────────────────────────────────────────────
// WORD PROFILE BUILDER
// ─────────────────────────────────────────────────────────────────────────────

export function buildWordPhonemicProfile(
  word:  string,
  bpm:   number
): WordPhonemicProfile {
  const normalized  = normalizeArabic(stripDiacritics(word));
  const syllables   = syllabifyArabicWord(word);
  const beatMs      = 60000 / bpm;

  // Assign timing based on syllable weights
  const totalWeight = syllables.reduce((s, syl) => s + syl.weight, 0) || 1;
  let accumulated   = 0;
  for (const syl of syllables) {
    syl.durationMs = (syl.weight / totalWeight) * beatMs;
    accumulated   += syl.durationMs;
  }

  // Dominant phoneme class
  const classCounts = new Map<PhonemeClass, number>();
  for (const syl of syllables) {
    for (const ph of syl.phonemes) {
      classCounts.set(ph.class, (classCounts.get(ph.class) ?? 0) + ph.impactScore);
    }
  }
  const dominantClass = [...classCounts.entries()]
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "nasal";

  // Rhyme fingerprint: last syllable nucleus + coda
  const lastSyl = syllables.at(-1);
  const rhymeFingerprint = lastSyl
    ? `${lastSyl.nucleus}${lastSyl.coda}`
    : normalized.slice(-2);

  return {
    word,
    normalized,
    syllables,
    totalWeight,
    dominantClass,
    rhymeFingerprint,
    rhythmicSignature: syllables.map((s) => s.weight),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LINE PROFILE — processes a full bar text
// ─────────────────────────────────────────────────────────────────────────────

export interface LinePhonemicProfile {
  words:              WordPhonemicProfile[];
  totalSyllables:     number;
  totalWeight:        number;
  syllablesPerBeat:   number;
  rhymeScheme:        string[];    // fingerprints of last word per phrase
  dominantImpact:     number;      // 0–1 average impact score
  hasGeminate:        boolean;
  phonemicDensity:    number;      // phonemes per second at given BPM
  rhythmComplexity:   number;      // variance in syllable weights — higher = more complex
}

export function analyzeLinePhonemics(
  text:         string,
  bpm:          number,
  beatsPerBar:  number
): LinePhonemicProfile {
  const rawWords = text
    .split(/\s+/)
    .map((w) => w.replace(/[^\u0600-\u06FF]/g, ""))
    .filter(Boolean);

  const words = rawWords.map((w) => buildWordPhonemicProfile(w, bpm));

  const totalSyllables  = words.reduce((s, w) => s + w.syllables.length, 0);
  const totalWeight     = words.reduce((s, w) => s + w.totalWeight, 0);
  const syllablesPerBeat = beatsPerBar > 0 ? totalSyllables / beatsPerBar : 0;

  const allImpacts = words.flatMap((w) =>
    w.syllables.flatMap((s) => s.phonemes.map((p) => p.impactScore))
  );
  const dominantImpact = allImpacts.length
    ? allImpacts.reduce((a, b) => a + b, 0) / allImpacts.length
    : 0;

  const hasGeminate = words.some((w) =>
    w.syllables.some((s) => s.phonemes.some((p) => p.class === "geminate"))
  );

  const barMs          = (60000 / bpm) * beatsPerBar;
  const totalPhonemes  = words.flatMap((w) =>
    w.syllables.flatMap((s) => s.phonemes)
  ).filter((p) => p.class !== "silent").length;
  const phonemicDensity = (totalPhonemes / barMs) * 1000;

  const weights         = words.flatMap((w) => w.rhythmicSignature);
  const mean            = weights.reduce((a, b) => a + b, 0) / (weights.length || 1);
  const rhythmComplexity = Math.sqrt(
    weights.reduce((s, w) => s + (w - mean) ** 2, 0) / (weights.length || 1)
  );

  return {
    words,
    totalSyllables,
    totalWeight,
    syllablesPerBeat,
    rhymeScheme: words.map((w) => w.rhymeFingerprint),
    dominantImpact,
    hasGeminate,
    phonemicDensity,
    rhythmComplexity,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// RHYME MATCHING UTILITY
// ─────────────────────────────────────────────────────────────────────────────

export function computeRhymeSimilarity(
  fingerprintA: string,
  fingerprintB: string
): number {
  if (fingerprintA === fingerprintB) return 1.0;
  if (!fingerprintA || !fingerprintB) return 0;

  // Shared suffix length
  let shared = 0;
  const a = [...fingerprintA].reverse();
  const b = [...fingerprintB].reverse();
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) shared++;
    else break;
  }

  return shared / Math.max(a.length, b.length);
}
