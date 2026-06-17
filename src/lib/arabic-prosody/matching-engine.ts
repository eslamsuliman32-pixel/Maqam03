/**
  @file matching-engine.ts
  @description محرك المطابقة الثلاثية للبصمة الرقمية
  يُطبّق ثلاث خوارزميات مستقلة على المصفوفات الثلاث
  ثم يدمجها في درجة مطابقة إجمالية واحدة مُوزَّنة.

  الصيغة:
    totalMatchScore = (rhythmScore × 0.50)
                    + (vowelScore  × 0.35)
                    + (grooveScore × 0.15)
*/

import type { DigitalSignature, MoraWeight, PercussiveClass } from "./vectorizer";

// ===== الثوابت =====

export const MATCHWEIGHTS = {
  rhythm: 0.5,
  vowel: 0.35,
  groove: 0.15,
} as const;

export type TolerancePreset = "strict" | "balanced" | "loose";

const TOLERANCETHRESHOLDS: Record<
  TolerancePreset,
  { rhythm: number; vowel: number; groove: number }
> = {
  strict:   { rhythm: 0.92, vowel: 0.90, groove: 0.80 },
  balanced: { rhythm: 0.80, vowel: 0.75, groove: 0.65 },
  loose:    { rhythm: 0.65, vowel: 0.55, groove: 0.45 },
};

// ===== خوارزمية 1: مسافة ليفنشتاين المُعيَّرة =====

/**
  levenshteinNormalized
  تحسب مسافة التحرير بين تسلسلين ثم تُعيّرها إلى [0, 1]
  حيث 1 = تطابق تام، 0 = تعارض تام
*/
const levenshteinNormalized = <T>(a: T[], b: T[]): number => {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const m = a.length;
  const n = b.length;

  // مصفوفة DP مُحسَّنة ذاكرةً (صفّان فقط)
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,      // حذف
        prev[j] + 1,           // إدراج
        prev[j - 1] + cost     // استبدال
      );
    }
    [prev, curr] = [curr, prev];
  }

  const distance = prev[n];
  const maxLen = Math.max(m, n);
  return 1 - distance / maxLen;
};

// ===== خوارزمية 2: تشابه جيب التمام للصوائت =====

/**
  vowelCosineSimilarity
  تُحوّل مصفوفتَي الصوائت إلى مُتجهَي trigram ثم تحسب
  تشابه جيب التمام — أدق من levenshtein للأنماط الصوتية المتغيرة الطول
*/
const vowelCosineSimilarity = (a: string[], b: string[]): number => {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  // تركيز على آخر 6 عناصر (نهاية البار — موضع القافية)
  const tailA = a.slice(-6);
  const tailB = b.slice(-6);

  const toTrigrams = (arr: string[]): Map<string, number> => {
    const map = new Map<string, number>();
    const joined = arr.join("-");
    for (let i = 0; i < joined.length - 2; i++) {
      const tg = joined.slice(i, i + 3);
      map.set(tg, (map.get(tg) || 0) + 1);
    }
    return map;
  };

  const vecA = toTrigrams(tailA);
  const vecB = toTrigrams(tailB);

  let dot = 0;
  let normA = 0;
  let normB = 0;

  vecA.forEach((val, key) => {
    dot += val * (vecB.get(key) || 0);
    normA += val * val;
  });
  vecB.forEach((val) => {
    normB += val * val;
  });

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
};

// ===== خوارزمية 3: مطابقة الإيقاع الإقرعي =====

/**
  grooveSimilarity
  تُقارن أنماط bigram للحروف الإقرعية
  مع تعزيز تطابق الانفجاريات (P) لأهميتها في الـ Punch
*/
const grooveSimilarity = (
  a: PercussiveClass[],
  b: PercussiveClass[]
): number => {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  // تحويل إلى سلسلة وحساب bigrams مع ترجيح
  const toWeightedBigrams = (arr: PercussiveClass[]): Map<string, number> => {
    const map = new Map<string, number>();
    for (let i = 0; i < arr.length - 1; i++) {
      const bg = `${arr[i]}${arr[i + 1]}`;
      // مكافأة ضعف للـ bigrams التي تبدأ بانفجاري
      const weight = arr[i] === "P" ? 2 : 1;
      map.set(bg, (map.get(bg) || 0) + weight);
    }
    return map;
  };

  const vecA = toWeightedBigrams(a);
  const vecB = toWeightedBigrams(b);

  let dot = 0;
  let normA = 0;
  let normB = 0;

  vecA.forEach((val, key) => {
    dot += val * (vecB.get(key) || 0);
    normA += val * val;
  });
  vecB.forEach((val) => {
    normB += val * val;
  });

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
};

// ===== أنواع النتائج =====

export interface MatchBreakdown {
  rhythmScore: number;     // [0-100] نتيجة تطابق الوزن الزمني
  vowelScore: number;      // [0-100] نتيجة تطابق التناغم الصوتي
  grooveScore: number;     // [0-100] نتيجة تطابق البصمة الإقرعية
  totalScore: number;      // [0-100] الدرجة المُوزَّنة الإجمالية
  passed: boolean;
  dominantMatch: "rhythm" | "vowel" | "groove" | "none";
  /** موضع أفضل تطابق صوتي (للتمييز البصري) */
  bestVowelWindow?: { start: number; end: number };
}

// ===== المحرك الرئيسي =====

/**
  computeMatchScore
  المدخل الوحيد لحساب التطابق بين بارَين
  @param source  بصمة البار المرجعي
  @param target  بصمة البار المُقارَن
  @param preset  مستوى التسامح
*/
export const computeMatchScore = (
  source: DigitalSignature,
  target: DigitalSignature,
  preset: TolerancePreset = "balanced"
): MatchBreakdown => {
  const thresholds = TOLERANCETHRESHOLDS[preset];

  // --- 1. الوزن الزمني ---
  const rhythmRaw = levenshteinNormalized<MoraWeight>(
    source.moraArray,
    target.moraArray
  );
  // تعديل إضافي بناءً على الفارق الكلي في عدد المورا
  const moraDiff = Math.abs(source.totalMora - target.totalMora);
  const moraPenalty = Math.min(moraDiff / Math.max(source.totalMora, 1), 0.2);
  const rhythmScore = Math.round(Math.max(0, rhythmRaw - moraPenalty) * 100);

  // --- 2. التناغم الصوتي ---
  const vowelRaw = vowelCosineSimilarity(source.vowelMatrix, target.vowelMatrix);
  const vowelScore = Math.round(vowelRaw * 100);

  // --- 3. البصمة الإقرعية ---
  const grooveRaw = grooveSimilarity(
    source.percussiveArray,
    target.percussiveArray
  );
  const grooveScore = Math.round(grooveRaw * 100);

  // --- 4. الدرجة المُوزَّنة ---
  const totalScore = Math.round(
    rhythmScore * MATCHWEIGHTS.rhythm +
    vowelScore  * MATCHWEIGHTS.vowel  +
    grooveScore * MATCHWEIGHTS.groove
  );

  // --- 5. اجتياز العتبات ---
  const rhythmPassed = rhythmScore / 100 >= thresholds.rhythm;
  const vowelPassed  = vowelScore  / 100 >= thresholds.vowel;
  const groovePassed = grooveScore / 100 >= thresholds.groove;
  
  // بدلاً من اشتراط اجتياز جميع المحاور (وهو أمر نادر وصعب جداً)، نكتفي باجتياز محور واحد على الأقل مع درجة كلية مقبولة،
  // أو أن تكون الدرجة الكلية أعلى من متوسط العتبات المصغر.
  const averageThreshold = (thresholds.rhythm + thresholds.vowel + thresholds.groove) / 3;
  const passed = (totalScore / 100) >= (averageThreshold * 0.8) || (rhythmPassed || vowelPassed || groovePassed);

  // --- 6. المحور المهيمن ---
  const scores = { rhythm: rhythmScore, vowel: vowelScore, groove: grooveScore };
  const dominantMatch = (
    Object.entries(scores).sort(([, a], [, b]) => b - a)[0]?.[0] as
      | "rhythm"
      | "vowel"
      | "groove"
  ) ?? "none";

  // --- 7. نافذة أفضل تطابق صوتي (للتمييز البصري) ---
  const bestVowelWindow = findBestVowelWindow(
    source.vowelMatrix,
    target.vowelMatrix
  );

  return {
    rhythmScore,
    vowelScore,
    grooveScore,
    totalScore,
    passed,
    dominantMatch,
    bestVowelWindow,
  };
};

/**
  findBestVowelWindow
  يُحدد نافذة sliding (طول 4) ذات أعلى تطابق في الصوائت
  مخصصة للتمييز البصري في الـ UI
*/
const findBestVowelWindow = (
  source: string[],
  target: string[]
): { start: number; end: number } | undefined => {
  const windowSize = Math.min(4, target.length);
  if (windowSize < 2) return undefined;

  let bestScore = 0;
  let bestStart = 0;

  for (let i = 0; i <= target.length - windowSize; i++) {
    const window = target.slice(i, i + windowSize);
    const score = vowelCosineSimilarity(source.slice(-windowSize), window);
    if (score > bestScore) {
      bestScore = score;
      bestStart = i;
    }
  }

  return bestScore > 0.6
    ? { start: bestStart, end: bestStart + windowSize - 1 }
    : undefined;
};

// ===== Pipeline الكامل =====

export interface RankedMatch {
  barId: string;
  breakdown: MatchBreakdown;
}

/**
  rankBarsByMatch
  يُرتّب مجموعة بارات تنازلياً بالتطابق مع بصمة مرجعية
  يطبّق المراحل الثلاث بالترتيب المحسوب
*/
export const rankBarsByMatch = (
  sourceSignature: DigitalSignature,
  candidates: Array<{ id: string; signature: DigitalSignature }>,
  preset: TolerancePreset = "balanced",
  topK?: number
): RankedMatch[] => {
  const scored = candidates
    .map(({ id, signature }) => ({
      barId: id,
      breakdown: computeMatchScore(sourceSignature, signature, preset),
    }))
    .filter((r) => r.breakdown.passed)
    .sort((a, b) => b.breakdown.totalScore - a.breakdown.totalScore);

  return topK ? scored.slice(0, topK) : scored;
};
