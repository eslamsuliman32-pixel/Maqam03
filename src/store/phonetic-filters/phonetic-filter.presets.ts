// ─── phonetic-filter.presets.ts ─────────────────────────────────────────────

import { PhoneticFilter, ArabicMeter, ArabicFoot } from "./phonetic-filter.types";

/* مصنع الفلاتر الصوتية الجاهزة */
export const PhoneticFilterPresets = {

  // ══════════════════════════════════════════════════════
  //  الفلاتر الفردية (Single Filters)
  // ══════════════════════════════════════════════════════

  /* فلتر فردي: القافية التامة */
  byPerfectRhyme: (
    rhymeCore: string,
    tolerance: PhoneticFilter["matchTolerance"] = "relaxed",
  ): PhoneticFilter => ({
    mode: "single",
    params: ["perfectrhyme"],
    values: { perfectRhymeCore: rhymeCore },
    matchTolerance: tolerance,
    operator: "AND",
  }),

  /* فلتر فردي: القافية المائلة */
  byObliqueRhyme: (
    rhymeConsonant: string,
    tolerance: PhoneticFilter["matchTolerance"] = "relaxed",
  ): PhoneticFilter => ({
    mode: "single",
    params: ["obliquerhyme"],
    values: { obliqueRhymeConsonant: rhymeConsonant },
    matchTolerance: tolerance,
    operator: "AND",
  }),

  /* فلتر فردي: القافية الداخلية */
  byInternalRhyme: (
    rhymeCore?: string,
  ): PhoneticFilter => ({
    mode: "single",
    params: ["internalrhyme"],
    values: {
      requireInternalRhyme: true,
      internalRhymeCore: rhymeCore,
    },
    matchTolerance: "relaxed",
    operator: "AND",
  }),

  /* فلتر فردي: النبر الصوتي */
  byStressPattern: (
    pattern: string,
    tolerance = 1,
  ): PhoneticFilter => ({
    mode: "single",
    params: ["stresspattern"],
    values: {
      targetStressPattern: pattern,
      stressPatternTolerance: tolerance,
    },
    matchTolerance: "relaxed",
    operator: "AND",
  }),

  /* فلتر فردي: الوزن الإيقاعي (بحر + تفعيلة) */
  byRhythmicWeight: (
    meter?: ArabicMeter,
    foot?: ArabicFoot,
    options?: {
      minDensity?: number;
      maxDensity?: number;
      minRegularity?: number;
    },
  ): PhoneticFilter => ({
    mode: "single",
    params: ["rhythmicweight"],
    values: {
      targetMeter: meter,
      targetDominantFoot: foot,
      minRhythmicDensity: options?.minDensity,
      maxRhythmicDensity: options?.maxDensity,
      minRegularityIndex: options?.minRegularity,
    },
    matchTolerance: "relaxed",
    operator: "AND",
  }),

  /* فلتر فردي: عدد المقاطع الصوتية */
  bySyllableCount: (
    count: number,
    tolerance = 1,
  ): PhoneticFilter => ({
    mode: "single",
    params: ["syllablecount"],
    values: {
      targetSyllableCount: count,
      syllableCountTolerance: tolerance,
    },
    matchTolerance: "relaxed",
    operator: "AND",
  }),

  /* فلتر فردي: عدد الموراء */
  byMoraCount: (
    count: number,
    tolerance = 2,
  ): PhoneticFilter => ({
    mode: "single",
    params: ["moracount"],
    values: {
      targetMoraCount: count,
      moraTolerance: tolerance,
    },
    matchTolerance: "relaxed",
    operator: "AND",
  }),

  /* فلتر فردي: عائلة القافية */
  byRhymeFamily: (
    familyId: string,
  ): PhoneticFilter => ({
    mode: "single",
    params: ["rhymefamily"],
    values: { rhymeFamilyId: familyId },
    matchTolerance: "relaxed",
    operator: "AND",
  }),

  // ══════════════════════════════════════════════════════
  //  الفلاتر المزدوجة (Dual Filters)
  // ══════════════════════════════════════════════════════

  /* فلتر مزدوج: القافية التامة + الوزن الإيقاعي */
  byPerfectRhymeAndRhythmicWeight: (
    rhymeCore: string,
    meter?: ArabicMeter,
    foot?: ArabicFoot,
  ): PhoneticFilter => ({
    mode: "dual",
    params: ["perfectrhyme", "rhythmicweight"],
    values: {
      perfectRhymeCore: rhymeCore,
      targetMeter: meter,
      targetDominantFoot: foot,
    },
    matchTolerance: "relaxed",
    operator: "WEIGHTED",
  }),

  /* فلتر مزدوج: الوزن الإيقاعي + عدد المقاطع */
  byRhythmicWeightAndSyllables: (
    meter: ArabicMeter,
    syllableCount: number,
    syllableTolerance = 1,
  ): PhoneticFilter => ({
    mode: "dual",
    params: ["rhythmicweight", "syllablecount"],
    values: {
      targetMeter: meter,
      targetSyllableCount: syllableCount,
      syllableCountTolerance: syllableTolerance,
    },
    matchTolerance: "relaxed",
    operator: "WEIGHTED",
  }),

  /* فلتر مزدوج: القافية التامة + عدد المقاطع */
  byPerfectRhymeAndSyllables: (
    rhymeCore: string,
    syllableCount: number,
    syllableTolerance = 1,
  ): PhoneticFilter => ({
    mode: "dual",
    params: ["perfectrhyme", "syllablecount"],
    values: {
      perfectRhymeCore: rhymeCore,
      targetSyllableCount: syllableCount,
      syllableCountTolerance: syllableTolerance,
    },
    matchTolerance: "relaxed",
    operator: "WEIGHTED",
  }),

  /* فلتر مزدوج: الوزن الإيقاعي + القافية المائلة */
  byRhythmicWeightAndObliqueRhyme: (
    meter: ArabicMeter,
    rhymeConsonant: string,
  ): PhoneticFilter => ({
    mode: "dual",
    params: ["rhythmicweight", "obliquerhyme"],
    values: {
      targetMeter: meter,
      obliqueRhymeConsonant: rhymeConsonant,
    },
    matchTolerance: "relaxed",
    operator: "WEIGHTED",
  }),

  /* فلتر مزدوج: القافية المائلة + عدد المقاطع */
  byObliqueRhymeAndSyllables: (
    rhymeConsonant: string,
    syllableCount: number,
    syllableTolerance = 1,
  ): PhoneticFilter => ({
    mode: "dual",
    params: ["obliquerhyme", "syllablecount"],
    values: {
      obliqueRhymeConsonant: rhymeConsonant,
      targetSyllableCount: syllableCount,
      syllableCountTolerance: syllableTolerance,
    },
    matchTolerance: "relaxed",
    operator: "WEIGHTED",
  }),

  /* فلتر مزدوج: القافية التامة + القافية المائلة */
  byPerfectAndObliqueRhyme: (
    rhymeCore: string,
    rhymeConsonant: string,
  ): PhoneticFilter => ({
    mode: "dual",
    params: ["perfectrhyme", "obliquerhyme"],
    values: {
      perfectRhymeCore: rhymeCore,
      obliqueRhymeConsonant: rhymeConsonant,
    },
    matchTolerance: "relaxed",
    operator: "WEIGHTED",
  }),

  /* فلتر مزدوج: عائلة القوافي + الوزن الإيقاعي */
  byRhymeFamilyAndRhythmicWeight: (
    familyId: string,
    meter: ArabicMeter,
  ): PhoneticFilter => ({
    mode: "dual",
    params: ["rhymefamily", "rhythmicweight"],
    values: {
      rhymeFamilyId: familyId,
      targetMeter: meter,
    },
    matchTolerance: "relaxed",
    operator: "WEIGHTED",
  }),

  /* فلتر مزدوج: عائلة القوافي + عدد المقاطع الصوتية */
  byRhymeFamilyAndSyllables: (
    familyId: string,
    syllableCount: number,
    syllableTolerance = 1,
  ): PhoneticFilter => ({
    mode: "dual",
    params: ["rhymefamily", "syllablecount"],
    values: {
      rhymeFamilyId: familyId,
      targetSyllableCount: syllableCount,
      syllableCountTolerance: syllableTolerance,
    },
    matchTolerance: "relaxed",
    operator: "WEIGHTED",
  }),

  // ══════════════════════════════════════════════════════
  //  الفلاتر الثلاثية (Triple Filters)
  // ══════════════════════════════════════════════════════

  /* فلتر ثلاثي: القافية التامة + الوزن الإيقاعي + عدد المقاطع */
  byPerfectRhymeWeightAndSyllables: (
    rhymeCore: string,
    meter: ArabicMeter,
    syllableCount: number,
    syllableTolerance = 1,
  ): PhoneticFilter => ({
    mode: "triple",
    params: ["perfectrhyme", "rhythmicweight", "syllablecount"],
    values: {
      perfectRhymeCore: rhymeCore,
      targetMeter: meter,
      targetSyllableCount: syllableCount,
      syllableCountTolerance: syllableTolerance,
    },
    matchTolerance: "relaxed",
    operator: "WEIGHTED",
  }),

  /* فلتر ثلاثي: النبر الصوتي + القافية + الوزن الإيقاعي */
  byStressRhymeAndWeight: (
    stressPattern: string,
    rhymeCore: string,
    meter: ArabicMeter,
    stressTolerance = 1,
  ): PhoneticFilter => ({
    mode: "triple",
    params: ["stresspattern", "perfectrhyme", "rhythmicweight"],
    values: {
      targetStressPattern: stressPattern,
      stressPatternTolerance: stressTolerance,
      perfectRhymeCore: rhymeCore,
      targetMeter: meter,
    },
    matchTolerance: "relaxed",
    operator: "WEIGHTED",
  }),

  /* فلتر ثلاثي: القافية المائلة + القافية التامة + الوزن الإيقاعي */
  byObliqueAndPerfectRhymeWithWeight: (
    rhymeConsonant: string,
    rhymeCore: string,
    meter: ArabicMeter,
  ): PhoneticFilter => ({
    mode: "triple",
    params: ["obliquerhyme", "perfectrhyme", "rhythmicweight"],
    values: {
      obliqueRhymeConsonant: rhymeConsonant,
      perfectRhymeCore: rhymeCore,
      targetMeter: meter,
    },
    matchTolerance: "relaxed",
    operator: "WEIGHTED",
  }),

  /* فلتر ثلاثي: القافية التامة + القافية المائلة + عدد المقاطع */
  byPerfectObliqueRhymeAndSyllables: (
    rhymeCore: string,
    rhymeConsonant: string,
    syllableCount: number,
    syllableTolerance = 1,
  ): PhoneticFilter => ({
    mode: "triple",
    params: ["perfectrhyme", "obliquerhyme", "syllablecount"],
    values: {
      perfectRhymeCore: rhymeCore,
      obliqueRhymeConsonant: rhymeConsonant,
      targetSyllableCount: syllableCount,
      syllableCountTolerance: syllableTolerance,
    },
    matchTolerance: "relaxed",
    operator: "WEIGHTED",
  }),

  /* فلتر ثلاثي: عائلة القوافي + الوزن الإيقاعي + عدد المقاطع الصوتية */
  byRhymeFamilyWeightAndSyllables: (
    familyId: string,
    meter: ArabicMeter,
    syllableCount: number,
    syllableTolerance = 1,
  ): PhoneticFilter => ({
    mode: "triple",
    params: ["rhymefamily", "rhythmicweight", "syllablecount"],
    values: {
      rhymeFamilyId: familyId,
      targetMeter: meter,
      targetSyllableCount: syllableCount,
      syllableCountTolerance: syllableTolerance,
    },
    matchTolerance: "relaxed",
    operator: "WEIGHTED",
  }),

  /* فلتر ثلاثي: عائلة القوافي + القافية التامة + القافية المائلة */
  byRhymeFamilyPerfectAndObliqueRhyme: (
    familyId: string,
    rhymeCore: string,
    rhymeConsonant: string,
  ): PhoneticFilter => ({
    mode: "triple",
    params: ["rhymefamily", "perfectrhyme", "obliquerhyme"],
    values: {
      rhymeFamilyId: familyId,
      perfectRhymeCore: rhymeCore,
      obliqueRhymeConsonant: rhymeConsonant,
    },
    matchTolerance: "relaxed",
    operator: "WEIGHTED",
  }),
} as const;
