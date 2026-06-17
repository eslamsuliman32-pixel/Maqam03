// ════════════════════════════════════════════════════════════════════
// ██  src/services/scattingEngine.ts
// ██  MAQAM RAP — Scatting Engine (Royal Elite Edition v4.0)
// ██  محرك التصميم الصوتي: الهمهمة، محاكاة الآلات، الهندسة العكسية
// ════════════════════════════════════════════════════════════════════

import { v4 as uuidv4 } from "uuid";
import type {
  ScatPattern,
  ScattingSession,
  InstrumentType,
  BeatPattern,
} from "../types/flowEngine.types";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 1: قاموس المقاطع الصوتية — SYLLABLE LIBRARY          ║
// ╚══════════════════════════════════════════════════════════════════╝

/**
 * مكتبة المقاطع الصوتية لكل آلة إيقاعية.
 * كل آلة ترتبط بمجموعة حروف عربية تحاكي صوتها الحقيقي.
 */
export const SCAT_SYLLABLE_LIBRARY: Record<InstrumentType, string[]> = {
  hihat: [
    "تس", "تسس", "تك", "شك", "تش", "تسك",
    "شش", "تشك", "سك", "تسش",
  ],
  kick: [
    "دم", "بم", "دب", "طم", "بوم", "دمم",
    "طب", "بمم", "دطم", "بوف",
  ],
  snare: [
    "كا", "تا", "باف", "كاك", "تاك", "بات",
    "كات", "طاخ", "باك", "داك",
  ],
  bass: [
    "بوو", "دوو", "بووم", "موو", "دووم",
    "بوون", "زووم", "غووم",
  ],
  melody: [
    "لا", "نا", "دا", "را", "ها",
    "لالا", "نانا", "دادا", "رارا", "هاها",
  ],
  "vocal-chop": [
    "آه", "أوه", "إيه", "يو", "وو",
    "آآه", "أووه", "إييه", "هيي", "واو",
  ],
};

/**
 * المقاطع المتقدمة — تجمع بين آلتين (Hybrid Syllables)
 * تُستخدم في المستوى 3-4 من الإتقان.
 */
export const HYBRID_SYLLABLE_MAP: Record<string, string[]> = {
  "kick+hihat":   ["دمتس", "بمشك", "طمتك", "بومتش"],
  "kick+snare":   ["دمكا", "بمتا", "طمباف", "بومكاك"],
  "snare+hihat":  ["كاتس", "تاشك", "بافتك", "كاكتش"],
  "bass+melody":  ["بوولا", "دوونا", "بوومدا", "موورا"],
  "kick+melody":  ["دملا", "بمنا", "طمدا", "بومها"],
  "snare+melody": ["كالا", "تانا", "بافدا", "كاكra"],
};

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 2: ثوابت الأنماط الإيقاعية — RHYTHM CONSTANTS        ║
// ╚══════════════════════════════════════════════════════════════════╝

/**
 * أنماط إيقاعية مُعرَّفة مسبقاً لكل نوع بيت.
 * كل نمط يحدد أي آلة تعزف على أي دقة.
 */
export const BEAT_PATTERN_TEMPLATES: Record<
  BeatPattern,
  {
    kickPositions: number[];
    snarePositions: number[];
    hihatPattern: ("closed" | "open" | "none")[];
    swingFactor: number;
    defaultBpm: number;
    description: string;
  }
> = {
  "boom-bap": {
    kickPositions: [1, 3],
    snarePositions: [2, 4],
    hihatPattern: ["closed", "closed", "closed", "closed"],
    swingFactor: 15,
    defaultBpm: 90,
    description: "الأساس الكلاسيكي — Kick على 1,3 و Snare على 2,4",
  },
  trap: {
    kickPositions: [1],
    snarePositions: [3],
    hihatPattern: ["closed", "closed", "open", "closed"],
    swingFactor: 5,
    defaultBpm: 140,
    description: "إيقاع ثقيل — Kick مفرد و HiHat سريع",
  },
  drill: {
    kickPositions: [1, 2],
    snarePositions: [2, 4],
    hihatPattern: ["closed", "none", "closed", "open"],
    swingFactor: 0,
    defaultBpm: 145,
    description: "إيقاع عدواني — طبقات متراكبة",
  },
  "lo-fi": {
    kickPositions: [1, 3],
    snarePositions: [2, 4],
    hihatPattern: ["closed", "none", "closed", "none"],
    swingFactor: 35,
    defaultBpm: 75,
    description: "إيقاع مسترخٍ مع سوينغ عالٍ",
  },
  "jazz-rap": {
    kickPositions: [1],
    snarePositions: [4],
    hihatPattern: ["open", "closed", "open", "closed"],
    swingFactor: 50,
    defaultBpm: 85,
    description: "إيقاع جاز مع حرية إيقاعية",
  },
  "arabic-fusion": {
    kickPositions: [1, 3],
    snarePositions: [2],
    hihatPattern: ["closed", "open", "closed", "closed"],
    swingFactor: 20,
    defaultBpm: 95,
    description: "دمج إيقاعات شرقية مع الراب الحديث",
  },
};

/**
 * خريطة الحروف الانفجارية والحروف الرنانة لكل نمط
 */
export const CONSONANT_VOWEL_MAP: Record<
  BeatPattern,
  { explosiveConsonants: string[]; melodicVowels: string[] }
> = {
  "boom-bap": {
    explosiveConsonants: ["ب", "ك", "ت", "ط", "د", "ق"],
    melodicVowels: ["آ", "او", "اي", "يـ"],
  },
  trap: {
    explosiveConsonants: ["ك", "ت", "ق", "غ", "خ"],
    melodicVowels: ["اي", "آ", "ي", "وو"],
  },
  drill: {
    explosiveConsonants: ["ط", "ك", "ق", "ض", "ت"],
    melodicVowels: ["اي", "آ", "او"],
  },
  "lo-fi": {
    explosiveConsonants: ["ب", "د", "م", "ن"],
    melodicVowels: ["آ", "او", "وو", "هـ"],
  },
  "jazz-rap": {
    explosiveConsonants: ["ب", "د", "ج", "ز"],
    melodicVowels: ["آ", "او", "اي", "يـ", "وو"],
  },
  "arabic-fusion": {
    explosiveConsonants: ["ع", "ق", "ط", "ض", "ك", "خ"],
    melodicVowels: ["آ", "او", "يـ", "اي"],
  },
};

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 3: إنشاء الأنماط — PATTERN CREATION                  ║
// ╚══════════════════════════════════════════════════════════════════╝

/**
 * إنشاء نمط سكاتينج فارغ.
 */
export function createEmptyScatPattern(
  instrument: InstrumentType = "kick"
): ScatPattern {
  return {
    id: uuidv4(),
    instrument,
    syllables: [],
    rhythm: [],
    intensity: 70,
    isLooping: false,
  };
}

/**
 * إنشاء جلسة سكاتينج جديدة.
 */
export function createScattingSession(
  bpm: number = 90,
  instruments: InstrumentType[] = ["kick", "snare", "hihat"]
): ScattingSession {
  return {
    id: uuidv4(),
    patterns: instruments.map((inst) => createEmptyScatPattern(inst)),
    targetBpm: bpm,
    activeInstruments: instruments,
    recordingBlob: null,
    confidence: 0,
  };
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 4: توليد الأنماط التلقائي — AUTO-GENERATION           ║
// ╚══════════════════════════════════════════════════════════════════╝

/**
 * توليد نمط سكاتينج عشوائي لآلة محددة.
 * @param instrument - الآلة المستهدفة
 * @param length - عدد المقاطع (4, 8, 16)
 * @param intensity - شدة النمط 0-100
 */
export function generateRandomPattern(
  instrument: InstrumentType,
  length: 4 | 8 | 16 = 8,
  intensity: number = 70
): ScatPattern {
  const library = SCAT_SYLLABLE_LIBRARY[instrument];
  if (!library || library.length === 0) {
    throw new Error(`[ScattingEngine] لا توجد مقاطع للآلة: ${instrument}`);
  }

  const syllables: string[] = [];
  const rhythm: number[] = [];

  for (let i = 0; i < length; i++) {
    const availablePool = library.filter(
      (s) => !syllables.slice(-2).includes(s)
    );
    const pool = availablePool.length > 0 ? availablePool : library;
    const syllable = pool[Math.floor(Math.random() * pool.length)];
    syllables.push(syllable);

    const baseTime = 250; 
    const variance = ((100 - intensity) / 100) * 150;
    const time = baseTime + (Math.random() * variance - variance / 2);
    rhythm.push(Math.round(time));
  }

  return {
    id: uuidv4(),
    instrument,
    syllables,
    rhythm,
    intensity: Math.max(0, Math.min(100, intensity)),
    isLooping: length >= 8,
  };
}

/**
 * توليد نمط سكاتينج مبني على نمط إيقاعي محدد.
 * يربط كل دقة بالآلة المناسبة تلقائياً.
 */
export function generatePatternFromBeat(
  beatPattern: BeatPattern,
  barsCount: number = 2
): ScatPattern[] {
  const template = BEAT_PATTERN_TEMPLATES[beatPattern];
  if (!template) {
    throw new Error(`[ScattingEngine] نمط إيقاعي غير معروف: ${beatPattern}`);
  }

  const patterns: ScatPattern[] = [];
  const totalBeats = barsCount * 4;

  // نمط الكيك
  const kickSyllables: string[] = [];
  const kickRhythm: number[] = [];
  for (let i = 0; i < totalBeats; i++) {
    const beatPos = (i % 4) + 1;
    if (template.kickPositions.includes(beatPos)) {
      const lib = SCAT_SYLLABLE_LIBRARY.kick;
      kickSyllables.push(lib[Math.floor(Math.random() * lib.length)]);
      kickRhythm.push(60000 / template.defaultBpm / 4);
    } else {
      kickSyllables.push("·"); 
      kickRhythm.push(60000 / template.defaultBpm / 4);
    }
  }
  patterns.push({
    id: uuidv4(),
    instrument: "kick",
    syllables: kickSyllables,
    rhythm: kickRhythm,
    intensity: 85,
    isLooping: true,
  });

  // نمط السنير
  const snareSyllables: string[] = [];
  const snareRhythm: number[] = [];
  for (let i = 0; i < totalBeats; i++) {
    const beatPos = (i % 4) + 1;
    if (template.snarePositions.includes(beatPos)) {
      const lib = SCAT_SYLLABLE_LIBRARY.snare;
      snareSyllables.push(lib[Math.floor(Math.random() * lib.length)]);
      snareRhythm.push(60000 / template.defaultBpm / 4);
    } else {
      snareSyllables.push("·");
      snareRhythm.push(60000 / template.defaultBpm / 4);
    }
  }
  patterns.push({
    id: uuidv4(),
    instrument: "snare",
    syllables: snareSyllables,
    rhythm: snareRhythm,
    intensity: 80,
    isLooping: true,
  });

  // نمط الهاي هات
  const hihatSyllables: string[] = [];
  const hihatRhythm: number[] = [];
  for (let i = 0; i < totalBeats; i++) {
    const beatPos = i % 4;
    const hatType = template.hihatPattern[beatPos];
    if (hatType !== "none") {
      const lib = SCAT_SYLLABLE_LIBRARY.hihat;
      const syllable =
        hatType === "open"
          ? lib.find((s) => s.length > 2) ?? lib[0]
          : lib.find((s) => s.length <= 2) ?? lib[0];
      hihatSyllables.push(syllable || "تك");
    } else {
      hihatSyllables.push("·");
    }
    hihatRhythm.push(60000 / template.defaultBpm / 4);
  }
  patterns.push({
    id: uuidv4(),
    instrument: "hihat",
    syllables: hihatSyllables,
    rhythm: hihatRhythm,
    intensity: 60,
    isLooping: true,
  });

  return patterns;
}

/**
 * توليد نمط هجين (Hybrid) يجمع بين آلتين.
 */
export function generateHybridPattern(
  instrument1: InstrumentType,
  instrument2: InstrumentType,
  length: number = 8
): ScatPattern {
  const key1 = `${instrument1}+${instrument2}`;
  const key2 = `${instrument2}+${instrument1}`;
  const hybridLib = HYBRID_SYLLABLE_MAP[key1] ?? HYBRID_SYLLABLE_MAP[key2];

  const syllablePool = hybridLib
    ? hybridLib
    : [
        ...SCAT_SYLLABLE_LIBRARY[instrument1].slice(0, 5),
        ...SCAT_SYLLABLE_LIBRARY[instrument2].slice(0, 5),
      ];

  const syllables: string[] = [];
  const rhythm: number[] = [];

  for (let i = 0; i < length; i++) {
    syllables.push(
      syllablePool[Math.floor(Math.random() * syllablePool.length)]
    );
    rhythm.push(250 + Math.floor(Math.random() * 100));
  }

  return {
    id: uuidv4(),
    instrument: instrument1, 
    syllables,
    rhythm,
    intensity: 75,
    isLooping: true,
  };
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 5: الهندسة العكسية — REVERSE ENGINEERING              ║
// ╚══════════════════════════════════════════════════════════════════╝

/**
 * نتيجة تحليل الهندسة العكسية لكلمة أو جملة.
 */
export interface ReverseEngineeringResult {
  originalText: string;
  detectedInstruments: {
    instrument: InstrumentType;
    confidence: number;       
    matchedSyllables: string[];
  }[];
  suggestedPattern: ScatPattern;
  rhythmicBreakdown: {
    syllable: string;
    instrument: InstrumentType;
    isExplosive: boolean;
    isMelodic: boolean;
    weight: number;           
  }[];
  overallConfidence: number;  
}

const ARABIC_HARD_EXPLOSIVES = new Set([
  "ب", "ت", "ط", "ك", "ق", "د", "ض",
]);

const ARABIC_MELODIC_VOWELS = new Set([
  "ا", "آ", "و", "ي", "ى", "ة", "أ", "إ", "ؤ", "ئ"
]);

const ARABIC_NASAL_CONSONANTS = new Set(["م", "ن"]);

const ARABIC_FRICATIVES = new Set([
  "س", "ش", "ص", "ز", "ف", "ث", "ذ", "ظ", "هـ", "ه"
]);

/**
 * تصنيف حرف عربي إلى فئة صوتية.
 */
export function classifyArabicChar(
  char: string
): "explosive" | "melodic" | "nasal" | "fricative" | "neutral" {
  if (ARABIC_HARD_EXPLOSIVES.has(char)) return "explosive";
  if (ARABIC_MELODIC_VOWELS.has(char)) return "melodic";
  if (ARABIC_NASAL_CONSONANTS.has(char)) return "nasal";
  if (ARABIC_FRICATIVES.has(char)) return "fricative";
  return "neutral";
}

/**
 * تحديد الآلة الأقرب لحرف معين بناءً على خصائصه الصوتية.
 */
export function mapCharToInstrument(char: string): {
  instrument: InstrumentType;
  confidence: number;
} {
  const charClass = classifyArabicChar(char);

  switch (charClass) {
    case "explosive":
      if (["ب", "د", "ط"].includes(char)) {
        return { instrument: "kick", confidence: 90 };
      }
      return { instrument: "snare", confidence: 85 };

    case "melodic":
      return { instrument: "melody", confidence: 88 };

    case "nasal":
      return { instrument: "bass", confidence: 80 };

    case "fricative":
      return { instrument: "hihat", confidence: 85 };

    default:
      return { instrument: "vocal-chop", confidence: 50 };
  }
}

/**
 * تحليل كلمة عربية وتحويلها إلى نمط سكاتينج (الهندسة العكسية).
 */
export function reverseEngineerWord(
  word: string
): ReverseEngineeringResult {
  const cleanedWord = word.trim().replace(/\s+/g, "");
  if (cleanedWord.length === 0) {
    return {
      originalText: word,
      detectedInstruments: [],
      suggestedPattern: createEmptyScatPattern(),
      rhythmicBreakdown: [],
      overallConfidence: 0,
    };
  }

  const syllables = segmentIntoSyllables(cleanedWord);

  const breakdown = syllables.map((syllable) => {
    const firstChar = syllable[0] || "";
    const mapping = mapCharToInstrument(firstChar);
    const charClass = classifyArabicChar(firstChar);

    return {
      syllable,
      instrument: mapping.instrument,
      isExplosive: charClass === "explosive",
      isMelodic: charClass === "melodic",
      weight: mapping.confidence / 100,
    };
  });

  const instrumentGroups: Record<
    string,
    { instrument: InstrumentType; count: number; syllables: string[] }
  > = {};

  breakdown.forEach(({ instrument, syllable }) => {
    if (!instrumentGroups[instrument]) {
      instrumentGroups[instrument] = {
        instrument,
        count: 0,
        syllables: [],
      };
    }
    instrumentGroups[instrument].count++;
    instrumentGroups[instrument].syllables.push(syllable);
  });

  const detectedInstruments = Object.values(instrumentGroups)
    .map((group) => ({
      instrument: group.instrument,
      confidence: Math.round((group.count / breakdown.length) * 100),
      matchedSyllables: group.syllables,
    }))
    .sort((a, b) => b.confidence - a.confidence);

  const primaryInstrument =
    detectedInstruments[0]?.instrument ?? "kick";
  const suggestedPattern: ScatPattern = {
    id: uuidv4(),
    instrument: primaryInstrument,
    syllables: syllables.map((s) => {
      const lib = SCAT_SYLLABLE_LIBRARY[primaryInstrument] || ["دم"];
      return findClosestSyllable(s, lib);
    }),
    rhythm: syllables.map(() => 250),
    intensity: 75,
    isLooping: false,
  };

  const overallConfidence = Math.round(
    (breakdown.reduce((sum, b) => sum + b.weight, 0) /
      Math.max(breakdown.length, 1)) *
      100
  );

  return {
    originalText: word,
    detectedInstruments,
    suggestedPattern,
    rhythmicBreakdown: breakdown,
    overallConfidence,
  };
}

/**
 * الهندسة العكسية لجملة كاملة.
 */
export function reverseEngineerSentence(
  sentence: string
): ReverseEngineeringResult[] {
  const words = sentence
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
  return words.map(reverseEngineerWord);
}

/**
 * تقطيع كلمة عربية إلى مقاطع صوتية.
 */
export function segmentIntoSyllables(word: string): string[] {
  const chars = Array.from(word);
  const syllables: string[] = [];
  let current = "";

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const isVowel = ARABIC_MELODIC_VOWELS.has(char);

    current += char;

    if (isVowel && current.length >= 1) {
      syllables.push(current);
      current = "";
    } else if (
      !isVowel &&
      current.length >= 2 &&
      i < chars.length - 1
    ) {
      syllables.push(current);
      current = "";
    }
  }

  if (current.length > 0) {
    if (syllables.length > 0 && current.length === 1) {
      syllables[syllables.length - 1] += current;
    } else {
      syllables.push(current);
    }
  }

  return syllables.length > 0 ? syllables : [word];
}

/**
 * إيجاد أقرب مقطع في المكتبة لمقطع مدخل.
 */
export function findClosestSyllable(
  input: string,
  library: string[]
): string {
  if (library.length === 0) return input;

  let bestMatch = library[0] || "";
  let bestScore = Infinity;

  for (const candidate of library) {
    const distance = levenshteinDistance(input, candidate);
    if (distance < bestScore) {
      bestScore = distance;
      bestMatch = candidate;
    }
    if (distance === 0) break; 
  }

  return bestMatch;
}

/**
 * حساب مسافة Levenshtein بين نصين.
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,     
        dp[i][j - 1] + 1,     
        dp[i - 1][j - 1] + cost 
      );
    }
  }

  return dp[m][n];
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 6: معالجة الأنماط — PATTERN PROCESSING                ║
// ╚══════════════════════════════════════════════════════════════════╝

/**
 * دمج نمطين في نمط واحد (مزج طبقي).
 */
export function mergePatterns(
  pattern1: ScatPattern,
  pattern2: ScatPattern,
  strategy: "interleave" | "overlay" | "sequential" = "interleave"
): ScatPattern {
  let mergedSyllables: string[] = [];
  let mergedRhythm: number[] = [];

  switch (strategy) {
    case "interleave": {
      const maxLen = Math.max(
        pattern1.syllables.length,
        pattern2.syllables.length
      );
      for (let i = 0; i < maxLen; i++) {
        if (i < pattern1.syllables.length) {
          mergedSyllables.push(pattern1.syllables[i] || "دم");
          mergedRhythm.push(pattern1.rhythm[i] ?? 250);
        }
        if (i < pattern2.syllables.length) {
          mergedSyllables.push(pattern2.syllables[i] || "دم");
          mergedRhythm.push(pattern2.rhythm[i] ?? 250);
        }
      }
      break;
    }

    case "overlay": {
      const maxLen = Math.max(
        pattern1.syllables.length,
        pattern2.syllables.length
      );
      for (let i = 0; i < maxLen; i++) {
        const s1 = pattern1.syllables[i];
        const s2 = pattern2.syllables[i];

        if (s1 !== undefined && s2 !== undefined) {
          if (s1 === "·" && s2 !== "·") {
            mergedSyllables.push(s2);
            mergedRhythm.push(pattern2.rhythm[i] ?? 250);
          } else if (s2 === "·" && s1 !== "·") {
            mergedSyllables.push(s1);
            mergedRhythm.push(pattern1.rhythm[i] ?? 250);
          } else {
            if (pattern1.intensity >= pattern2.intensity) {
              mergedSyllables.push(s1);
              mergedRhythm.push(pattern1.rhythm[i] ?? 250);
            } else {
              mergedSyllables.push(s2);
              mergedRhythm.push(pattern2.rhythm[i] ?? 250);
            }
          }
        } else {
          mergedSyllables.push(s1 ?? s2 ?? "·");
          mergedRhythm.push(
            pattern1.rhythm[i] ?? pattern2.rhythm[i] ?? 250
          );
        }
      }
      break;
    }

    case "sequential": {
      mergedSyllables = [...pattern1.syllables, ...pattern2.syllables];
      mergedRhythm = [...pattern1.rhythm, ...pattern2.rhythm];
      break;
    }
  }

  return {
    id: uuidv4(),
    instrument: pattern1.instrument,
    syllables: mergedSyllables,
    rhythm: mergedRhythm,
    intensity: Math.round(
      (pattern1.intensity + pattern2.intensity) / 2
    ),
    isLooping: pattern1.isLooping || pattern2.isLooping,
  };
}

/**
 * تحويل شدة نمط بنسبة مئوية.
 */
export function scalePatternIntensity(
  pattern: ScatPattern,
  newIntensity: number
): ScatPattern {
  const clamped = Math.max(0, Math.min(100, newIntensity));
  const ratio = clamped / Math.max(pattern.intensity, 1);

  return {
    ...pattern,
    id: uuidv4(),
    intensity: clamped,
    rhythm: pattern.rhythm.map((time) => {
      const adjusted = Math.round(time / Math.sqrt(ratio));
      return Math.max(80, Math.min(600, adjusted));
    }),
  };
}

/**
 * تغيير سرعة نمط (BPM) مع الحفاظ على النسب الإيقاعية.
 */
export function changePatternTempo(
  pattern: ScatPattern,
  fromBpm: number,
  toBpm: number
): ScatPattern {
  if (fromBpm <= 0 || toBpm <= 0) {
    throw new Error("[ScattingEngine] BPM يجب أن يكون أكبر من صفر");
  }
  const ratio = fromBpm / toBpm;

  return {
    ...pattern,
    id: uuidv4(),
    rhythm: pattern.rhythm.map((time) => Math.round(time * ratio)),
  };
}

/**
 * عكس نمط (تشغيل من النهاية للبداية).
 */
export function reversePattern(pattern: ScatPattern): ScatPattern {
  return {
    ...pattern,
    id: uuidv4(),
    syllables: [...pattern.syllables].reverse(),
    rhythm: [...pattern.rhythm].reverse(),
  };
}

/**
 * تقليم النمط — إزالة السكتات من البداية والنهاية.
 */
export function trimPattern(pattern: ScatPattern): ScatPattern {
  let start = 0;
  let end = pattern.syllables.length - 1;

  while (start < end && pattern.syllables[start] === "·") start++;
  while (end > start && pattern.syllables[end] === "·") end--;

  return {
    ...pattern,
    id: uuidv4(),
    syllables: pattern.syllables.slice(start, end + 1),
    rhythm: pattern.rhythm.slice(start, end + 1),
  };
}

/**
 * تكرار نمط عدداً محدداً من المرات.
 */
export function repeatPattern(
  pattern: ScatPattern,
  times: number
): ScatPattern {
  const clampedTimes = Math.max(1, Math.min(8, times));
  const syllables: string[] = [];
  const rhythm: number[] = [];

  for (let t = 0; t < clampedTimes; t++) {
    syllables.push(...pattern.syllables);
    rhythm.push(...pattern.rhythm);
  }

  return {
    ...pattern,
    id: uuidv4(),
    syllables,
    rhythm,
    isLooping: true,
  };
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 7: التحقق والتقييم — VALIDATION & SCORING            ║
// ╚══════════════════════════════════════════════════════════════════╝

/**
 * نتيجة التحقق من صحة النمط.
 */
export interface PatternValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalSyllables: number;
    activeSyllables: number;
    silentBeats: number;
    uniqueSyllables: number;
    densityPercent: number;
    estimatedDurationMs: number;
  };
}

/**
 * التحقق من صحة نمط سكاتينج.
 */
export function validatePattern(
  pattern: ScatPattern
): PatternValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!pattern.syllables || pattern.syllables.length === 0) {
    errors.push("النمط فارغ — لا توجد مقاطع صوتية");
  }

  if (
    pattern.rhythm.length !== pattern.syllables.length &&
    pattern.syllables.length > 0
  ) {
    errors.push(
      `عدم تطابق: ${pattern.syllables.length} مقطع مقابل ${pattern.rhythm.length} توقيت`
    );
  }

  if (pattern.intensity < 0 || pattern.intensity > 100) {
    errors.push(`شدة غير صالحة: ${pattern.intensity} (يجب 0-100)`);
  }

  const activeSyllables = pattern.syllables.filter(
    (s) => s !== "·"
  ).length;
  const total = pattern.syllables.length;
  const density = total > 0 ? (activeSyllables / total) * 100 : 0;

  if (density < 25 && total > 0) {
    warnings.push(
      `كثافة منخفضة جداً (${density.toFixed(0)}%) — النمط قد يبدو فارغاً`
    );
  }

  if (density > 95 && total > 4) {
    warnings.push(
      "كثافة عالية جداً — أضف بعض السكتات للتنفس"
    );
  }

  const uniqueSyllables = new Set(
    pattern.syllables.filter((s) => s !== "·")
  ).size;

  if (uniqueSyllables === 1 && activeSyllables > 4) {
    warnings.push("تكرار مفرط — استخدم تنويعاً أكبر في المقاطع");
  }

  const invalidTimings = pattern.rhythm.filter(
    (t) => t < 50 || t > 2000
  );
  if (invalidTimings.length > 0) {
    warnings.push(
      `${invalidTimings.length} توقيت خارج النطاق المعقول (50-2000ms)`
    );
  }

  const estimatedDurationMs = pattern.rhythm.reduce(
    (sum, t) => sum + t,
    0
  );

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalSyllables: total,
      activeSyllables,
      silentBeats: total - activeSyllables,
      uniqueSyllables,
      densityPercent: Math.round(density),
      estimatedDurationMs,
    },
  };
}

/**
 * نتيجة تقييم جودة أداء السكاتينج.
 */
export interface ScattingPerformanceScore {
  overall: number;          
  rhythmAccuracy: number;   
  syllableClarity: number;  
  varietyScore: number;      
  instrumentMatch: number;  
  densityBalance: number;   
  level: "مبتدئ" | "متوسط" | "متقدم" | "محترف" | "نخبة";
  feedback: string[];
}

/**
 * تقييم جودة نمط سكاتينج بناءً على معايير متعددة.
 */
export function scoreScattingPattern(
  pattern: ScatPattern,
  targetBpm: number = 90
): ScattingPerformanceScore {
  const validation = validatePattern(pattern);
  const feedback: string[] = [];

  if (!validation.isValid) {
    return {
      overall: 0,
      rhythmAccuracy: 0,
      syllableClarity: 0,
      varietyScore: 0,
      instrumentMatch: 0,
      densityBalance: 0,
      level: "مبتدئ",
      feedback: ["النمط غير صالح: " + validation.errors.join("، ")],
    };
  }

  const { stats } = validation;

  const expectedInterval = 60000 / targetBpm / 4; 
  const timingDeviations = pattern.rhythm.map((t) =>
    Math.abs(t - expectedInterval)
  );
  const avgDeviation =
    timingDeviations.reduce((s, d) => s + d, 0) /
    Math.max(timingDeviations.length, 1);
  const rhythmAccuracy = Math.max(
    0,
    Math.round(100 - (avgDeviation / expectedInterval) * 100)
  );

  const lib = SCAT_SYLLABLE_LIBRARY[pattern.instrument] ?? [];
  const activeSylls = pattern.syllables.filter((s) => s !== "·");
  const libraryMatches = activeSylls.filter((s) =>
    lib.includes(s)
  ).length;
  const syllableClarity =
    activeSylls.length > 0
      ? Math.round((libraryMatches / activeSylls.length) * 100)
      : 0;

  const varietyScore =
    activeSylls.length > 0
      ? Math.round(
          (stats.uniqueSyllables / Math.min(activeSylls.length, 8)) *
            100
        )
      : 0;

  const instrumentMatch = syllableClarity; 

  const idealDensity = 65;
  const densityDiff = Math.abs(stats.densityPercent - idealDensity);
  const densityBalance = Math.max(0, Math.round(100 - densityDiff * 2));

  const overall = Math.round(
    rhythmAccuracy * 0.3 +
      syllableClarity * 0.25 +
      varietyScore * 0.2 +
      instrumentMatch * 0.1 +
      densityBalance * 0.15
  );

  if (rhythmAccuracy < 50) {
    feedback.push("⏱️ حاول الالتزام أكثر بالإيقاع — استخدم المترونوم");
  }
  if (rhythmAccuracy >= 80) {
    feedback.push("⏱️ دقة إيقاعية ممتازة!");
  }
  if (syllableClarity < 50) {
    feedback.push(
      `🎤 استخدم مقاطع أوضح لآلة الـ${pattern.instrument}`
    );
  }
  if (varietyScore < 40) {
    feedback.push("🔄 أضف تنويعاً أكبر — لا تكرر نفس المقطع");
  }
  if (varietyScore >= 80) {
    feedback.push("🔄 تنويع ممتاز في المقاطع!");
  }
  if (densityBalance < 40) {
    feedback.push(
      stats.densityPercent > 80
        ? "💨 أضف فراغات للتنفس بين المقاطع"
        : "🔊 النمط فارغ جداً — أضف مقاطع أكثر"
    );
  }

  let level: ScattingPerformanceScore["level"];
  if (overall >= 90) level = "نخبة";
  else if (overall >= 75) level = "محترف";
  else if (overall >= 60) level = "متقدم";
  else if (overall >= 40) level = "متوسط";
  else level = "مبتدئ";

  return {
    overall: Math.min(100, overall),
    rhythmAccuracy,
    syllableClarity,
    varietyScore: Math.min(100, varietyScore),
    instrumentMatch,
    densityBalance,
    level,
    feedback,
  };
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 8: محاكاة الآلات — VOICE MIMICRY                     ║
// ╚══════════════════════════════════════════════════════════════════╝

/**
 * تمرين محاكاة صوتية — يحدد الآلة والمقاطع المطلوب تقليدها.
 */
export interface MimicryExercise {
  id: string;
  instrument: InstrumentType;
  difficulty: 1 | 2 | 3 | 4;
  targetSyllables: string[];
  rhythm: number[];
  tips: string[];
  description: string;
}

const MIMICRY_TIPS: Record<InstrumentType, string[]> = {
  kick: [
    "أغلق فمك وادفع الهواء من الحجاب الحاجز",
    "ركّز على حرف الباء الانفجاري: بُم",
    "اجعل الصوت يخرج من أسفل الحلق",
    "تخيل أنك تضرب طبلة كبيرة بقدمك",
  ],
  snare: [
    "استخدم طرف لسانك مع سقف الحلق",
    "الكاف الحادة: كاك — مع قطع سريع للهواء",
    "أضف هواءً بعد الحرف لمحاكاة الارتداد",
    "جرّب: تا — باف — كات",
  ],
  hihat: [
    "أطبق أسنانك وادفع الهواء: تسسس",
    "الهاي هات المفتوح = تسسسس (طويل)، المغلق = تس (قصير)",
    "استخدم الشين للتنويع: شك — شش",
    "سرعة الهواء تحدد حدة الصوت",
  ],
  bass: [
    "استخدم الهمهمة الأنفية: مممم",
    "ابدأ بـ بوو ثم مدّ الصوت مع خفض النبرة",
    "تنفس من البطن واجعل الصوت يرتجف قليلاً",
    "جرّب غلق الشفاه أثناء الهمهمة لمحاكاة الباص العميق",
  ],
  melody: [
    "استخدم حروف العلة الطويلة: لاااا — ناااا",
    "غيّر طبقة صوتك بين المقاطع",
    "اجعل كل مقطع يحمل نغمة مختلفة",
    "تدرّب على سلّم بسيط: دو — ري — مي",
  ],
  "vocal-chop": [
    "اقطع الصوت بشكل مفاجئ بعد كل مقطع",
    "جرّب: آه! — أوه! — إيه! مع توقف حاد",
    "استخدم الحنجرة لإغلاق الصوت بسرعة",
    "المفتاح هو التباين بين الصوت والصمت",
  ],
};

/**
 * توليد تمرين محاكاة لآلة محددة.
 */
export function generateMimicryExercise(
  instrument: InstrumentType,
  difficulty: 1 | 2 | 3 | 4 = 1
): MimicryExercise {
  const lib = SCAT_SYLLABLE_LIBRARY[instrument] || ["دم"];
  const tips = MIMICRY_TIPS[instrument] ?? [];

  const syllableCount = difficulty * 2 + 2; 
  const targetSyllables: string[] = [];

  if (difficulty <= 2) {
    for (let i = 0; i < syllableCount; i++) {
      const basicPool = lib.slice(0, 5); 
      targetSyllables.push(
        basicPool[Math.floor(Math.random() * basicPool.length)] || "دم"
      );
    }
  } else {
    for (let i = 0; i < syllableCount; i++) {
      targetSyllables.push(
        lib[Math.floor(Math.random() * lib.length)] || "دم"
      );
    }
  }

  const baseTime = 400 - difficulty * 60; 
  const rhythm = targetSyllables.map(
    () => baseTime + Math.floor(Math.random() * 60)
  );

  const descriptions: Record<number, string> = {
    1: `تمرين أساسي: تعلّم أصوات الـ${instrument} — كرّر ببطء`,
    2: `تمرين متوسط: سرعة معتدلة مع تنويع بسيط`,
    3: `تمرين متقدم: سرعة عالية وتنويع كامل`,
    4: `تحدي النخبة: أقصى سرعة مع مقاطع هجينة`,
  };

  return {
    id: uuidv4(),
    instrument,
    difficulty,
    targetSyllables,
    rhythm,
    tips: tips.slice(0, difficulty + 1),
    description: descriptions[difficulty] ?? descriptions[1],
  };
}

/**
 * توليد سلسلة تمارين تدريجية لآلة واحدة.
 */
export function generateMimicryProgram(
  instrument: InstrumentType
): MimicryExercise[] {
  return [
    generateMimicryExercise(instrument, 1),
    generateMimicryExercise(instrument, 2),
    generateMimicryExercise(instrument, 3),
    generateMimicryExercise(instrument, 4),
  ];
}

/**
 * توليد تمرين هجين يجمع آلتين.
 */
export function generateHybridMimicryExercise(
  instrument1: InstrumentType,
  instrument2: InstrumentType,
  difficulty: 1 | 2 | 3 | 4 = 2
): MimicryExercise {
  const hybridPattern = generateHybridPattern(
    instrument1,
    instrument2,
    difficulty <= 2 ? 4 : 8
  );

  return {
    id: uuidv4(),
    instrument: instrument1,
    difficulty,
    targetSyllables: hybridPattern.syllables,
    rhythm: hybridPattern.rhythm,
    tips: [
      `ابدأ بمقاطع الـ${instrument1} ثم أضف الـ${instrument2} تدريجياً`,
      "حاول الانتقال بسلاسة بين صوتي الآلتين",
      ...(MIMICRY_TIPS[instrument1]?.slice(0, 1) || []),
      ...(MIMICRY_TIPS[instrument2]?.slice(0, 1) || []),
    ],
    description: `تمرين هجين: ${instrument1} + ${instrument2}`,
  };
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║  SECTION 9: التصدير والعرض — EXPORT & DISPLAY                 ║
// ╚══════════════════════════════════════════════════════════════════╝

/**
 * تمثيل نصي لنمط سكاتينج.
 */
export function patternToDisplayString(
  pattern: ScatPattern,
  separator: string = " — "
): string {
  return pattern.syllables
    .map((s) => (s === "·" ? "⬝" : s))
    .join(separator);
}

/**
 * تمثيل نمط كسطر إيقاعي مرئي (Grid).
 */
export interface PatternGridCell {
  syllable: string;
  instrument: InstrumentType;
  isActive: boolean;
  isSilent: boolean;
  timingMs: number;
  intensityLevel: "low" | "medium" | "high";
  displayColor: string;
}

const INSTRUMENT_COLORS: Record<InstrumentType, string> = {
  kick:        "from-red-500 to-orange-500",
  snare:       "from-amber-500 to-yellow-500",
  hihat:       "from-cyan-500 to-blue-500",
  bass:        "from-indigo-500 to-purple-500",
  melody:      "from-emerald-500 to-green-500",
  "vocal-chop": "from-pink-500 to-rose-500",
};

/**
 * تحويل نمط إلى شبكة عرض مرئية.
 */
export function patternToGrid(
  pattern: ScatPattern
): PatternGridCell[] {
  return pattern.syllables.map((syllable, i) => {
    const isSilent = syllable === "·";
    const timingMs = pattern.rhythm[i] ?? 250;
    const intensityLevel: PatternGridCell["intensityLevel"] =
      pattern.intensity >= 80
        ? "high"
        : pattern.intensity >= 50
          ? "medium"
          : "low";

    return {
      syllable: isSilent ? "" : syllable,
      instrument: pattern.instrument,
      isActive: !isSilent,
      isSilent,
      timingMs,
      intensityLevel,
      displayColor: INSTRUMENT_COLORS[pattern.instrument] ?? "from-gray-500 to-gray-600",
    };
  });
}

/**
 * تحويل جلسة كاملة إلى نص تدريبي مُنسّق.
 */
export function sessionToTrainingScript(
  session: ScattingSession
): string {
  const lines: string[] = [];
  lines.push(`🎤 جلسة تدريب سكاتينج — BPM: ${session.targetBpm}`);
  lines.push("─".repeat(40));

  session.patterns.forEach((pattern, idx) => {
    lines.push(`[${idx + 1}] ${pattern.instrument}: ${patternToDisplayString(pattern)}`);
  });
  return lines.join("\n");
}
