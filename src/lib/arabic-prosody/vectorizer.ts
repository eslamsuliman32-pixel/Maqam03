/**
  @file vectorizer.ts
  @description محرك التحويل إلى بصمة رقمية ثلاثية الأبعاد
  يُنتج ثلاث مصفوفات مستقلة لكل بار:
    - MoraArray:       الوزن الزمني المورائي
    - VowelMatrix:     التسلسل الصوتي الخالص
    - PercussiveClass: البصمة الإقرعية
  تُحسب مرة واحدة عند الحفظ وتُخزَّن في الـ payload.
*/

import { normalizeProsodic, normalizeArabic } from "./normalizer";

// ===== ثوابت الخريطة الصوتية =====

/**
  تصنيف الحروف العربية إيقاعياً
  P = Plosive  (انفجاري)  — يُنتج ضربة قوية (Kick)
  F = Fricative (احتكاكي) — يُنتج شعوراً بالاحتكاك
  L = Liquid    (سائل)    — انتقال سلس
  N = Nasal     (أنفي)    — رنين داخلي
  S = Sibilant  (صفيري)   — حدة وحضور
  V = Vowel carrier
*/
export type PercussiveClass = "P" | "F" | "L" | "N" | "S" | "V";

const PERCUSSIVEMAP: Record<string, PercussiveClass> = {
  // انفجاريات
  "\u0628": "P", // ب
  "\u062A": "P", // ت
  "\u062F": "P", // د
  "\u0637": "P", // ط
  "\u0638": "P", // ظ
  "\u0642": "P", // ق
  "\u0643": "P", // ك
  "\u062C": "P", // ج (في العربية شبه انفجاري)

  // احتكاكيات
  "\u062B": "F", // ث
  "\u062D": "F", // ح
  "\u062E": "F", // خ
  "\u0630": "F", // ذ
  "\u0632": "F", // ز
  "\u0633": "F", // س
  "\u0634": "F", // ش
  "\u0635": "F", // ص
  "\u0636": "F", // ض
  "\u0639": "F", // ع
  "\u063A": "F", // غ
  "\u0641": "F", // ف
  "\u0647": "F", // ه

  // سوائل
  "\u0644": "L", // ل
  "\u0631": "L", // ر
  "\u0648": "L", // و (شبه صائت)
  "\u064A": "L", // ي (شبه صائت)

  // أنفيات
  "\u0645": "N", // م
  "\u0646": "N", // ن

  // صفيريات
  // ص س ش ز مضافة في الأعلى كاحتكاكيات ولكن يمكن تخصيصها كصفيريات إذا لزم الأمر
  // التزمنا بـ PERCUSSIVEMAP المذكور في الطلب

  // صوائت (Vowel carriers)
  "\u0627": "V", // ا
  "\u0621": "V", // ء
  "\u0626": "V", // ئ
  "\u0624": "V", // ؤ
};

/**
  وزن المقطع المورائي
  1 = مقطع خفيف   (CVC  قصير)
  2 = مقطع متوسط  (CV   طويل)
  3 = مقطع ثقيل   (CVVC ممتد أو مُقفَّل بصامتين)
*/
export type MoraWeight = 1 | 2 | 3;

// ===== أنواع البصمة الرقمية =====

export interface DigitalSignature {
  /** مصفوفة الوزن الزمني: تسلسل أوزان المقاطع */
  moraArray: MoraWeight[];
  /** مصفوفة القافية المركبة: تسلسل الصوائت الطويلة */
  vowelMatrix: string[];
  /** مصفوفة البصمة الإقرعية: تصنيف صوتي لكل حرف صامت */
  percussiveArray: PercussiveClass[];
  /** الطول المورائي الكلي */
  totalMora: number;
  /** كثافة الانفجاريات (0-1) — مؤشر قوة الـ Punch */
  plosiveDensity: number;
  /** كثافة الصوائت (0-1) — مؤشر الانسياب */
  vowelDensity: number;
}

// ===== المستخرجات الأولية =====

/**
  يُجزّئ النص إلى مقاطع صوتية ويُعيّن وزناً مورائياً لكل منها
  المنطق: نبحث عن أنماط (صامت + صائت قصير/طويل + صامت اختياري)
*/
export const buildMoraArray = (text: string): MoraWeight[] => {
  const normalized = normalizeProsodic(text);
  const moraWeights: MoraWeight[] = [];

  const LONGVOWEL = /[\u0627\u0648\u064A]/;
  const SHORTVOWELMARK = /[\u064E\u064F\u0650]/;
  const SUKUN = /\u0652/;
  const SHADDA = /\u0651/;
  const CONSONANT = /[\u0621-\u063A\u0641-\u064A]/;

  let i = 0;
  while (i < normalized.length) {
    const char = normalized[i];
    const next1 = normalized[i + 1] || "";
    const next2 = normalized[i + 2] || "";

    if (!CONSONANT.test(char)) {
      i++;
      continue;
    }

    // الشدة = مقطعان ثقيلان
    if (SHADDA.test(next1)) {
      moraWeights.push(3);
      i += 2;
      continue;
    }

    // صامت + صائت طويل + صامت = ثقيل (3)
    if (SHORTVOWELMARK.test(next1) && LONGVOWEL.test(next2)) {
      moraWeights.push(3);
      i += 3;
      continue;
    }

    // صامت + صائت طويل = متوسط (2)
    if (LONGVOWEL.test(next1)) {
      moraWeights.push(2);
      i += 2;
      continue;
    }

    // صامت + صائت قصير + سكون = متوسط (2)
    if (SHORTVOWELMARK.test(next1) && SUKUN.test(next2)) {
      moraWeights.push(2);
      i += 3;
      continue;
    }

    // صامت + صائت قصير = خفيف (1)
    if (SHORTVOWELMARK.test(next1)) {
      moraWeights.push(1);
      i += 2;
      continue;
    }

    // صامت منفرد (بدون تشكيل) — تخمين بناءً على الموضع
    // إذا تبعه صائت طويل مباشرة = متوسط
    if (LONGVOWEL.test(next1)) {
      moraWeights.push(2);
      i += 2;
    } else {
      moraWeights.push(1);
      i++;
    }
  }

  return moraWeights.length > 0 ? moraWeights : [1];
};

/**
  يستخلص تسلسل الصوائت الطويلة من النص
  يمثل "روح" النص الصوتية بمعزل عن الصوامت
*/
export const buildVowelMatrix = (text: string): string[] => {
  const normalized = normalizeProsodic(text);
  const LONGVOWELS = /[\u0627\u0648\u064A]/;
  const SHORTVOWELMARKS: Record<string, string> = {
    "\u064E": "a", // فتحة
    "\u064F": "u", // ضمة
    "\u0650": "i", // كسرة
  };

  const vowels: string[] = [];

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (LONGVOWELS.test(char)) {
      if (char === "\u0627") vowels.push("aa");
      else if (char === "\u0648") vowels.push("uu");
      else if (char === "\u064A") vowels.push("ii");
    } else if (SHORTVOWELMARKS[char]) {
      vowels.push(SHORTVOWELMARKS[char]);
    }
  }

  // Fallback: إذا لم يكن النص مُشكَّلاً، نستخدم الصوائت الطويلة فقط
  if (vowels.length === 0) {
    for (const char of normalized) {
      if (char === "\u0627") vowels.push("aa");
      else if (char === "\u0648") vowels.push("uu");
      else if (char === "\u064A") vowels.push("ii");
    }
  }

  return vowels;
};

/**
  يبني مصفوفة التصنيف الإقرعي
  يُعيد قائمة بتصنيفات الحروف الصامتة فقط (يتجاهل الصوائت)
*/
export const buildPercussiveArray = (text: string): PercussiveClass[] => {
  const normalized = normalizeArabic(text);
  const classes: PercussiveClass[] = [];

  for (const char of normalized) {
    const cls = PERCUSSIVEMAP[char];
    if (cls) classes.push(cls);
  }

  return classes.length > 0 ? classes : ["F"];
};

// ===== الدالة الرئيسية =====

/**
  computeDigitalSignature — المدخل الوحيد لحساب البصمة
  تُستدعى مرة واحدة عند إنشاء/تعديل البار
*/
export const computeDigitalSignature = (text: string): DigitalSignature => {
  if (!text?.trim()) {
    return {
      moraArray: [1],
      vowelMatrix: [],
      percussiveArray: ["F"],
      totalMora: 1,
      plosiveDensity: 0,
      vowelDensity: 0,
    };
  }

  const moraArray = buildMoraArray(text);
  const vowelMatrix = buildVowelMatrix(text);
  const percussiveArray = buildPercussiveArray(text);

  const totalMora = moraArray.reduce((sum, w) => sum + w, 0);

  const plosiveCount = percussiveArray.filter((c) => c === "P").length;
  const plosiveDensity =
    percussiveArray.length > 0 ? plosiveCount / percussiveArray.length : 0;

  const consonantCount = percussiveArray.filter((c) => c !== "V").length;
  const vowelDensity =
    consonantCount + vowelMatrix.length > 0
      ? vowelMatrix.length / (consonantCount + vowelMatrix.length)
      : 0;

  return {
    moraArray,
    vowelMatrix,
    percussiveArray,
    totalMora,
    plosiveDensity,
    vowelDensity,
  };
};
