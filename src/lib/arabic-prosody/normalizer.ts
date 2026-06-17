/*
  @file normalizer.ts
  @description معالج التطبيع العروضي للنصوص العربية
  يُعدّ الطبقة الأساسية لكل عمليات المقارنة الصوتية
*/

// ===== ثوابت التطبيع =====

const ARABICDIACRITICSREGEX = /[\u064B-\u065F\u0670]/g;
const TATWEELREGEX = /\u0640/g;
const ALEFVARIANTSREGEX = /[\u0622\u0623\u0625\u0671]/g;
const YAVARIANTSREGEX = /[\u0649\u06CC]/g;
const TAMARBUTAREGEX = /\u0629/g;
const WAWHAMZAREGEX = /\u0624/g;
const YAHAMZAREGEX = /\u0626/g;

/**
  تطبيع أساسي للمقارنة النصية
 */
export const normalizeArabic = (text: string): string => {
  if (!text) return "";
  return text
    .replace(ARABICDIACRITICSREGEX, "")  // إزالة التشكيل
    .replace(TATWEELREGEX, "")             // إزالة التطويل
    .replace(ALEFVARIANTSREGEX, "\u0627") // توحيد الألف
    .replace(YAVARIANTSREGEX, "\u064A")   // توحيد الياء
    .replace(TAMARBUTAREGEX, "\u0647")    // تاء مربوطة → هاء
    .replace(WAWHAMZAREGEX, "\u0648")     // واو همزة → واو
    .replace(YAHAMZAREGEX, "\u064A")      // ياء همزة → ياء
    .trim();
};

/**
  تطبيع عروضي متقدم — يحافظ على التشكيل للتحليل الوزني
 */
export const normalizeProsodic = (text: string): string => {
  if (!text) return "";
  return text
    .replace(TATWEELREGEX, "")
    .replace(ALEFVARIANTSREGEX, "\u0627")
    .replace(YAVARIANTSREGEX, "\u064A")
    .trim();
};

/**
  استخراج نواة القافية (آخر مقطع صوتي محمّل)
  المنطق: آخر حرف ساكن + ما قبله من صوائت + حرف المد
 */
export const extractRhymeCore = (text: string): string => {
  const normalized = normalizeArabic(text);
  if (!normalized) return "";

  // استخراج آخر كلمة
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const lastWord = words[words.length - 1];

  // نمط القافية: آخر 2-4 أحرف صوتية جوهرية
  const rhymeMatch = lastWord.match(/[\u0627\u0648\u064A]?.{1,3}$/);
  return rhymeMatch ? rhymeMatch[0] : lastWord.slice(-2);
};

/*
  تحليل المقاطع الصوتية العربية
  مقطع قصير (V) = صامت + صائت قصير
  مقطع طويل (VV) = صامت + صائت طويل أو تنوين
  مقطع مغلق (VC) = صامت + صائت + صامت
 */
export const syllabify = (text: string): string => {
  // تمثيل مبسّط للأنماط المقطعية — يُستبدل بمحلل كامل
  const normalized = normalizeProsodic(text);
  let pattern = "";

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const isLongVowel = /[\u0627\u0648\u064A]/.test(char);
    const isShortVowelMark = /[\u064E\u064F\u0650]/.test(char);
    const isSukun = char === "\u0652";
    const isConsonant = /[\u0621-\u063A\u0641-\u064A]/.test(char) && !isLongVowel;

    if (isLongVowel) {
      pattern += "L"; // Long
    } else if (isShortVowelMark) {
      if (isSukun) pattern += "S"; // Sukun = closed
      else pattern += "s"; // short vowel
    } else if (isConsonant) {
      pattern += "C"; // Consonant
    }
  }
  return pattern;
};

/**
  buildHighlightMap
  يُنتج خريطة تمييز بصري للمقاطع المتطابقة بين بارين
  يُستخدم من مكوّن BarCard لتلوين المناطق المتشابهة
 
  @returns مصفوفة من { start, end, type } بإحداثيات الحروف في النص الأصلي
 */
export const buildHighlightMap = (
  text: string,
  matchedVowels: string[],
  matchedWindow?: { start: number; end: number }
): Array<{
  start: number;
  end: number;
  type: "vowel" | "rhythm" | "groove";
  intensity: number; // 0-1
}> => {
  if (!text || matchedVowels.length === 0) return [];

  const highlights: Array<{
    start: number;
    end: number;
    type: "vowel" | "rhythm" | "groove";
    intensity: number;
  }> = [];

  const LONGVOWELREGEX = /[\u0627\u0648\u064A]/g;
  let match: RegExpExecArray | null;
  let vowelIndex = 0;

  // تمييز الصوائت المتطابقة
  while ((match = LONGVOWELREGEX.exec(text)) !== null) {
    if (
      matchedWindow &&
      vowelIndex >= matchedWindow.start &&
      vowelIndex <= matchedWindow.end
    ) {
      highlights.push({
        start: match.index,
        end: match.index + 1,
        type: "vowel",
        intensity: 0.85,
      });
    }
    vowelIndex++;
  }

  return highlights;
};
