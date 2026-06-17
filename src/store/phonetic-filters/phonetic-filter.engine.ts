// ─── phonetic-filter.engine.ts ───────────────────────────────────────────────

import { Bar } from "../../types";
import {
  FilterMode,
  SingleFilterParam,
  PhoneticFilter,
  BarPhoneticProfile,
  ArabicFoot
} from "./phonetic-filter.types";
import { analyzeBarPhoneticsAndProsody } from "./prosodic-analyzer.engine";
import { computePhoneticMatchScore } from "./phonetic-score.engine";

/*
  نتيجة تصفية البارات صوتياً مع البيانات الكاملة
 */
export interface PhoneticFilterResult {
  bars: Array<Bar & { phoneticProfile: BarPhoneticProfile }>;
  totalAnalyzed: number;
  totalMatched: number;
  filterSummary: {
    mode: FilterMode;
    params: SingleFilterParam[];
    operator: string;
    tolerance: string;
  };
}

// كاش لملفات التعريف الصوتية لتجنب إعادة التحليل
const phoneticProfileCache = new Map<string, BarPhoneticProfile>();

/*
  الحصول على ملف التعريف الصوتي للبار مع الكاش
 */
export const getOrBuildPhoneticProfile = (bar: Bar): BarPhoneticProfile => {
  // مفتاح الكاش يجمع المعرّف مع بصمة النص لضمان التحديث عند تغيير النص
  const cacheKey = `${bar.id}:${bar.text?.length}`;

  if (phoneticProfileCache.has(cacheKey)) {
    return phoneticProfileCache.get(cacheKey)!;
  }

  const profile = analyzeBarPhoneticsAndProsody({
    id: bar.id,
    text: bar.text,
    fingerprintCode: bar.fingerprintCode,
  });

  // تسقيط البيانات الموجودة في Bar على الملف الصوتي إذا كانت أكثر دقة
  const enrichedProfile = enrichProfileFromBarData(profile, bar);

  phoneticProfileCache.set(cacheKey, enrichedProfile);
  return enrichedProfile;
};

/*
  إثراء الملف الصوتي ببيانات Bar الموجودة (qalqalaIntensity, rakhwaIndex, etc.)
 */
const enrichProfileFromBarData = (
  profile: BarPhoneticProfile,
  bar: Bar,
): BarPhoneticProfile => {
  // إذا كانت بيانات العروض موجودة في Bar، نستخدمها لتحسين الملف الصوتي
  const enriched = { ...profile };

  // تحسين الكثافة الإيقاعية من بيانات Bar إذا توفرت
  if (bar.rakhwaIndex !== undefined) {
    enriched.prosodicSignature = {
      ...enriched.prosodicSignature,
      rhythmicDensity: Math.max(
        enriched.prosodicSignature.rhythmicDensity,
        bar.rakhwaIndex,
      ),
    };
  }

  // استخراج التفعيلة من fingerprintCode إذا كانت موجودة
  if (bar.fingerprintCode) {
    const footFromFingerprint = bar.fingerprintCode.split("-")[0] as ArabicFoot;
    if (footFromFingerprint && footFromFingerprint !== "unknown") {
      enriched.prosodicSignature = {
        ...enriched.prosodicSignature,
        dominantFoot: footFromFingerprint,
      };
    }
  }

  return enriched;
};

/*
  تطبيق الفلتر الصوتي (فردي/مزدوج/ثلاثي) على مجموعة البارات
 
  للفلاتر AND الصارمة: يُعيد فقط المطابقات الكاملة مرتبة تنازلياً
  للفلاتر WEIGHTED/OR: يُعيد النتائج مرتبة حسب نقاط التطابق الموزون
 */
export const applyPhoneticFilter = (
  bars: Bar[],
  filter: PhoneticFilter,
): PhoneticFilterResult => {
  const activeBars = bars.filter((bar) => !bar.deleted);

  const scored = activeBars.map((bar) => {
    const rawProfile = getOrBuildPhoneticProfile(bar);
    const scoredProfile = computePhoneticMatchScore(rawProfile, filter, bar);
    return {
      bar: { ...bar, phoneticProfile: scoredProfile },
      score: scoredProfile.matchScore,
    };
  });

  const minScore =
    filter.minScore ??
    (filter.operator === "AND"
      ? 100
      : filter.operator === "WEIGHTED"
        ? 75 // عتبة صارمة للنظام الموزون لضمان الجودة
        : 50); // حتى في حالة OR، نطلب حد ادنى من المطابقة المنطقية

  // تصفية وفرز النتائج
  const filtered = scored
    .filter((item) => item.score >= minScore)
    .sort((a, b) => {
      // الفرز الأولي حسب نقاط التطابق
      if (b.score !== a.score) return b.score - a.score;

      // الفرز الثانوي: عند التساوي نقدّم البارات ذات عدد المعاملات المستوفاة الأكثر
      const aSatisfied = a.bar.phoneticProfile.satisfiedParams.length;
      const bSatisfied = b.bar.phoneticProfile.satisfiedParams.length;
      if (bSatisfied !== aSatisfied) return bSatisfied - aSatisfied;

      // الفرز الثالث: عند التساوي التام (مثلاً بسبب فلتر البصمة الجديد) نرتب حسب البصمة
      const aSigScore = a.bar.signatureMatch?.totalScore || 0;
      const bSigScore = b.bar.signatureMatch?.totalScore || 0;
      return bSigScore - aSigScore;
    })
    .map((item) => item.bar);

  return {
    bars: filtered,
    totalAnalyzed: activeBars.length,
    totalMatched: filtered.length,
    filterSummary: {
      mode: filter.mode,
      params: filter.params,
      operator: filter.operator,
      tolerance: filter.matchTolerance,
    },
  };
};

/*
  مسح كاش الملفات الصوتية (عند تحديث البارات)
 */
export const invalidatePhoneticCache = (barId?: string): void => {
  if (barId) {
    for (const key of phoneticProfileCache.keys()) {
      if (key.startsWith(`${barId}:`)) {
        phoneticProfileCache.delete(key);
      }
    }
  } else {
    phoneticProfileCache.clear();
  }
};
