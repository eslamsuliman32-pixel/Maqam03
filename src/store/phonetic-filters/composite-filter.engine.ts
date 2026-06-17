// ─── composite-filter.engine.ts (المحرك المُطوَّر) ──────────────────────────

import { Bar, ThematicVector } from "../../types";
import { PhoneticFilter, ArabicMeter } from "./phonetic-filter.types";
import { getOrBuildPhoneticProfile, applyPhoneticFilter } from "./phonetic-filter.engine";
import { computePhoneticMatchScore, scoreParam } from "./phonetic-score.engine";
import {
  computeDigitalSignature,
  DigitalSignature,
} from "../../lib/arabic-prosody/vectorizer";
import {
  rankBarsByMatch,
  TolerancePreset,
  MatchBreakdown,
} from "../../lib/arabic-prosody/matching-engine";

/*
  تعريف الفلتر المُركّب الموسَّع ليدعم الفلاتر الصوتية
 */
export interface CompositeFilter {
  // ── الحقول الأصلية ──────────────────────────────────────────────────────
  narrativeArcs?: string[];
  barRoles?: string[];
  resonanceCharacters?: string[];
  semanticTags?: string[];
  dominantFeet?: string[];
  thematicMinima?: Partial<ThematicVector>;

  minQalqala?: number;
  maxQalqala?: number;
  minRakhwa?: number;
  minResonance?: number;
  minMetaphoricalDepth?: number;
  minPolyrhythmIndex?: number;
  minCompositeSemanticScore?: number;
  minLyricDensity?: number;

  operator: "AND" | "OR";

  // ── الحقول الصوتية الجديدة ───────────────────────────────────────────────
  /* فلتر صوتي موحّد (فردي/مزدوج/ثلاثي) */
  phoneticFilter?: PhoneticFilter;

  /* فلتر سريع للقافية التامة بدون إنشاء PhoneticFilter كامل */
  quickPerfectRhyme?: string;

  /* فلتر سريع لعدد المقاطع */
  quickSyllableCount?: { target: number; tolerance?: number };

  /* فلتر سريع للبحر الشعري */
  quickMeter?: ArabicMeter;
}

// ─── مساعدة للبحث ────────────────────────────────────────────────────────────
const normalizeText = (text: string) => text.replace(/[^\u0621-\u064A\s]/g, "").trim();

// ─── حساب نقاط التطابق الإجمالية مع دعم الفلاتر الصوتية ─────────────────────
export const computeBarMatchScore = (bar: Bar, filter: CompositeFilter): number => {
  const criteria: Array<{ weight: number; satisfied: boolean }> = [];

  const addCriterion = (satisfied: boolean, weight = 1) => {
    criteria.push({ weight, satisfied });
  };

  // ── المعاملات الأصلية ────────────────────────────────────────────────────
  if (filter.narrativeArcs?.length) {
    addCriterion(
      filter.narrativeArcs.includes(bar.narrativeArc ?? "unclassified"),
      1.5,
    );
  }
  if (filter.barRoles?.length) {
    addCriterion(
      filter.barRoles.includes(bar.suggestedBarRole ?? "verse_body"),
      1.3,
    );
  }
  if (filter.resonanceCharacters?.length) {
    addCriterion(
      filter.resonanceCharacters.includes(
        bar.dominantAcousticCharacter ?? "balanced",
      ),
      1.2,
    );
  }
  if (filter.semanticTags?.length) {
    const barTags = (bar.semanticTags ?? []).map((t) => t.tag.toLowerCase());
    const hasMatch = filter.semanticTags.some((tag) =>
      barTags.some((c) => c.includes(tag.toLowerCase())),
    );
    addCriterion(hasMatch, 1.4);
  }

  if (filter.minQalqala !== undefined)
    addCriterion((bar.qalqalaIntensity ?? 0) >= filter.minQalqala, 1);
  if (filter.maxQalqala !== undefined)
    addCriterion((bar.qalqalaIntensity ?? 0) <= filter.maxQalqala, 1);
  if (filter.minRakhwa !== undefined)
    addCriterion((bar.rakhwaIndex ?? 0) >= filter.minRakhwa, 1);
  if (filter.minResonance !== undefined)
    addCriterion((bar.overallResonance ?? 0) >= filter.minResonance, 1);
  if (filter.minMetaphoricalDepth !== undefined)
    addCriterion(
      (bar.metaphoricalDepth ?? 0) >= filter.minMetaphoricalDepth,
      1.2,
    );
  if (filter.dominantFeet?.length) {
    addCriterion(
      filter.dominantFeet.includes(bar.fingerprintCode?.split("-")[0] ?? ""),
      1,
    );
  }
  if (filter.minPolyrhythmIndex !== undefined)
    addCriterion((bar.polyrhythmIndex ?? 0) >= filter.minPolyrhythmIndex, 1);
  if (filter.minCompositeSemanticScore !== undefined)
    addCriterion(
      (bar.compositeSemanticScore ?? 0) >= filter.minCompositeSemanticScore,
      1.1,
    );
  if (filter.minLyricDensity !== undefined)
    addCriterion((bar.lyricDensity ?? 0) >= filter.minLyricDensity, 1);
  if (filter.thematicMinima && bar.thematicVector) {
    for (const [axis, minVal] of Object.entries(filter.thematicMinima) as [
      keyof ThematicVector,
      number,
    ][]) {
      addCriterion((bar.thematicVector[axis] ?? 0) >= minVal, 1.1);
    }
  }

  // ── المعاملات الصوتية الجديدة ────────────────────────────────────────────

  // الفلتر الصوتي الكامل
  if (filter.phoneticFilter) {
    const profile = getOrBuildPhoneticProfile(bar);
    const scored = computePhoneticMatchScore(profile, filter.phoneticFilter);
    // نضيف كمعيار واحد موزون بأعلى وزن (الأهم صوتياً)
    addCriterion(scored.matchScore >= 80, 2.0);
    // وأيضاً نقاط التطابق التفصيلية لكل معامل
    for (const param of filter.phoneticFilter.params) {
      const paramScore = scored.paramScores[param] ?? 0;
      addCriterion(paramScore >= 80, 1.6);
    }
  }

  // الفلاتر السريعة
  if (filter.quickPerfectRhyme) {
    const profile = getOrBuildPhoneticProfile(bar);
    const rhymeScore = scoreParam(
      "perfectrhyme",
      profile,
      { perfectRhymeCore: filter.quickPerfectRhyme },
      "relaxed",
    );
    addCriterion(rhymeScore >= 80, 1.8);
  }

  if (filter.quickSyllableCount) {
    const profile = getOrBuildPhoneticProfile(bar);
    const syllableScore = scoreParam(
      "syllablecount",
      profile,
      {
        targetSyllableCount: filter.quickSyllableCount.target,
        syllableCountTolerance: filter.quickSyllableCount.tolerance ?? 1,
      },
      "relaxed",
    );
    addCriterion(syllableScore >= 70, 1.5);
  }

  if (filter.quickMeter) {
    const profile = getOrBuildPhoneticProfile(bar);
    const meterScore = scoreParam(
      "meter",
      profile,
      { targetMeter: filter.quickMeter },
      "relaxed",
    );
    addCriterion(meterScore >= 80, 1.7);
  }

  if (criteria.length === 0) return 100;

  const totalWeight = criteria.reduce((sum, item) => sum + item.weight, 0);
  const satisfiedWeight = criteria
    .filter((item) => item.satisfied)
    .reduce((sum, item) => sum + item.weight, 0);

  return Math.round((satisfiedWeight / totalWeight) * 100);
};

// ─── تطبيق الفلتر المُركّب الموسَّع ─────────────────────────────────────────
export const applyCompositeFilterToPool = (
  bars: Bar[],
  filter: CompositeFilter,
): Bar[] => {
  const scored = bars.map((bar) => {
    const score = computeBarMatchScore(bar, filter);
    return {
      bar: { ...bar, compositeMatchScore: score } as Bar,
      score,
    };
  });

  if (filter.operator === "AND") {
    return scored.filter((item) => item.score === 100).map((item) => item.bar);
  }

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.bar);
};

// ─── البحث النصي ─────────────────────────────────────────────────────────────
const matchesSearchQuery = (bar: Bar, query: string): boolean => {
  const q = normalizeText(query);
  if (!q) return true;

  return (
    normalizeText(bar.text).includes(q) ||
    (bar.tags ?? []).some((tag) => normalizeText(tag).includes(q)) ||
    normalizeText(bar.fingerprintCode ?? "").includes(q) ||
    normalizeText(bar.serialNumber ?? "").includes(q) ||
    (bar.semanticTags ?? []).some((st) =>
      normalizeText(st.tag).includes(q),
    ) ||
    normalizeText(bar.dominantMood ?? "").includes(q)
  );
};

export interface FilterState {
  searchQuery: string;
  narrativeArcFilter: string;
  barRoleFilter: string;
  resonanceCharacterFilter: string;
  semanticTagFilter: string;
  dialectFilter?: string;
  themeFilter?: string;
  minQualityScore?: number;
  dateRangeFilter?: { from: Date; to: Date };
  compositeFilter: CompositeFilter | null;
  phoneticFilter?: PhoneticFilter;
  passingThreshold?: number; // عتبة النجاح الديناميكية
  signatureFilter?: {
    sourceSignature: DigitalSignature;
    preset: TolerancePreset;
    topK?: number;
  };
}

/**
  applySignatureFilter — المرحلة الرابعة الجديدة
  تُطبّق محرك المطابقة الثلاثي على البارات المُقلَّصة
  تُضاف بعد المرحلة 3 (البحث النصي) في applyDerivedFilters
 */
const applySignatureFilter = (
  bars: Bar[],
  sourceSignature: DigitalSignature,
  preset: TolerancePreset,
  topK?: number
): Bar[] => {
  if (bars.length === 0) return [];

  // بناء قائمة المرشحين مع بصماتهم
  const candidates = bars.map((bar) => ({
    id: bar.id,
    bar,
    signature:
      // استخدام البصمة المُخزَّنة إذا كانت موجودة
      (bar.digitalSignature as DigitalSignature | undefined) ??
      computeDigitalSignature(bar.text),
  }));

  const ranked = rankBarsByMatch(
    sourceSignature,
    candidates.map(({ id, signature }) => ({ id, signature })),
    preset,
    topK
  );

  // خريطة سريعة للبارات
  const barMap = new Map(candidates.map(({ id, bar }) => [id, bar]));

  // إرجاع البارات مُرتَّبةً مع إرفاق نتيجة المطابقة
  return ranked
    .map(({ barId, breakdown }) => {
      const bar = barMap.get(barId);
      if (!bar) return null;
      return {
        ...bar,
        signatureMatch: breakdown,
      } as Bar & { signatureMatch: MatchBreakdown };
    })
    .filter(Boolean) as Bar[];
};

// ─── المحرك الأساسي للفلاتر المُشتقة (موسَّع ومُطوَّر) ────────────────────────
export const applyDerivedFilters = (
  bars: Bar[],
  state: FilterState,
): Bar[] => {
  if (!bars || bars.length === 0) return [];

  let result = bars.filter((bar) => !bar.deleted);

  // 1. فلاتر البيانات الوصفية (الخارقة والسريعة)
  if (state.dialectFilter && state.dialectFilter !== "all") {
    result = result.filter(bar => bar.dialect === state.dialectFilter);
  }

  if (state.themeFilter && state.themeFilter !== "all") {
    const q = state.themeFilter.toLowerCase();
    result = result.filter(bar => (bar.tags ?? []).some(t => t.toLowerCase().includes(q)));
  }

  if (state.minQualityScore !== undefined) {
    result = result.filter(bar => (bar.alignmentScore ?? 0) >= (state.minQualityScore || 0));
  }

  // 2. فلاتر الهوية السردية والوظيفية
  if (state.narrativeArcFilter && state.narrativeArcFilter !== "all") {
    result = result.filter(
      (bar) => bar.narrativeArc === state.narrativeArcFilter,
    );
  }

  if (state.barRoleFilter && state.barRoleFilter !== "all") {
    result = result.filter(
      (bar) => bar.suggestedBarRole === state.barRoleFilter,
    );
  }

  if (
    state.resonanceCharacterFilter &&
    state.resonanceCharacterFilter !== "all"
  ) {
    result = result.filter(
      (bar) =>
        bar.dominantAcousticCharacter === state.resonanceCharacterFilter,
    );
  }

  // 3. البحث النصي والدلالي
  if (state.searchQuery?.trim()) {
    result = result.filter((bar) =>
      matchesSearchQuery(bar, state.searchQuery),
    );
  }

  if (state.semanticTagFilter?.trim()) {
    const lowered = state.semanticTagFilter.trim().toLowerCase();
    result = result.filter(
      (bar) =>
        (bar.semanticTags ?? []).some((t) =>
          t.tag.toLowerCase().includes(lowered),
        ),
    );
  }

  // ===== المرحلة 3.5: مطابقة البصمة الرقمية الثلاثية =====
  const activeSignatureFilter = state.signatureFilter || (
    state.phoneticFilter?.params.includes("signature") && state.phoneticFilter.values.sourceSignature
      ? {
          sourceSignature: state.phoneticFilter.values.sourceSignature,
          preset: state.phoneticFilter.values.signaturePreset || "balanced",
          topK: state.phoneticFilter.values.signatureTopK
        }
      : null
  );

  if (activeSignatureFilter) {
    result = applySignatureFilter(
      result,
      activeSignatureFilter.sourceSignature,
      activeSignatureFilter.preset,
      activeSignatureFilter.topK,
    );
  }

  // 4. الفلتر الصوتي المتقدم (بما في ذلك عتبة الصرامة الديناميكية)
  if (state.phoneticFilter) {
    // تحديث عتبة الصرامة إذا كانت موجودة في الحالة
    const activeFilter = state.passingThreshold 
      ? { ...state.phoneticFilter, minScore: state.passingThreshold }
      : state.phoneticFilter;

    const phoneticResult = applyPhoneticFilter(result, activeFilter);
    result = phoneticResult.bars.map(({ phoneticProfile, ...bar }) => ({
      ...bar,
      phoneticProfile,
    })) as Bar[];
  }

  // 5. الفلتر المُركّب النهائي (الأكثر شمولاً)
  if (state.compositeFilter) {
    result = applyCompositeFilterToPool(result, state.compositeFilter);
  }

  return result;
};

export const getSignatureFilterStats = (
  bars: Bar[]
): {
  withSignature: number;
  withoutSignature: number;
  coverageRate: string;
} => {
  const withSig = bars.filter((b) => b.digitalSignature).length;
  return {
    withSignature: withSig,
    withoutSignature: bars.length - withSig,
    coverageRate:
      bars.length > 0
        ? `${((withSig / bars.length) * 100).toFixed(1)}%`
        : "0%",
  };
};
