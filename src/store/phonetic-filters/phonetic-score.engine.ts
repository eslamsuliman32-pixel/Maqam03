// ─── phonetic-score.engine.ts ────────────────────────────────────────────────

import { Bar } from "../../types";
import {
  SingleFilterParam,
  BarPhoneticProfile,
  PhoneticFilterValues,
  PhoneticFilter
} from "./phonetic-filter.types";
import { normalizeArabic, extractRhymeFamily } from "./prosodic-analyzer.engine";
import {
  computeDigitalSignature,
} from "../../lib/arabic-prosody/vectorizer";
import {
  computeMatchScore,
  TolerancePreset,
} from "../../lib/arabic-prosody/matching-engine";

/**
  مسافة هامينغ المعيارية (0-1) لدعم الأنماط متفاوتة الطول
 */
const normalizedHammingDistance = (a: string, b: string): number => {
  if (!a || !b) return 1;
  const maxLen = Math.max(a.length, b.length);
  const paddedA = a.padStart(maxLen, "0");
  const paddedB = b.padStart(maxLen, "0");

  let mismatches = 0;
  for (let i = 0; i < maxLen; i++) {
    if (paddedA[i] !== paddedB[i]) mismatches++;
  }
  return mismatches / maxLen;
};

/**
  تشابه جيب التمام للأنماط النصية (أدق للأنماط الطويلة)
 */
const patternCosineSimilarity = (a: string, b: string): number => {
  if (!a || !b) return 0;
  const toBigrams = (s: string): Map<string, number> => {
    const map = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2);
      map.set(bg, (map.get(bg) || 0) + 1);
    }
    return map;
  };
  const vecA = toBigrams(a);
  const vecB = toBigrams(b);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  vecA.forEach((valA, key) => {
    const valB = vecB.get(key) || 0;
    dotProduct += valA * valB;
    normA += valA * valA;
  });
  vecB.forEach((valB) => { normB += valB * valB; });
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
};

/* حساب درجة مطابقة معامل واحد */
export const scoreParam = (
  param: SingleFilterParam,
  profile: BarPhoneticProfile,
  values: PhoneticFilterValues,
  tolerance: PhoneticFilter["matchTolerance"],
  bar?: Bar
): number => {
  const { rhymeSignature: rs, prosodicSignature: ps } = profile;

  switch (param) {
    // ── القافية التامة ───────────────────────────────────────────────────────
    case "perfectrhyme": {
      if (!values.perfectRhymeCore) return 0;
      const target = normalizeArabic(values.perfectRhymeCore);
      const actual = normalizeArabic(rs.rhymeCore);

      if (actual.endsWith(target) || target.endsWith(actual)) return 100;

      // مطابقة عروضية أعمق باستخدام المقاطع الختامية
      const actualLastSyllable = rs.rhymeSyllables[rs.rhymeSyllables.length - 1];
      if (actualLastSyllable && target.length >= 2) {
         if (actualLastSyllable.text.includes(target.slice(-1))) {
            return tolerance === "relaxed" ? 70 : 0;
         }
      }

      const targetLast2 = target.slice(-2);
      const actualLast2 = actual.slice(-2);
      if (tolerance !== "strict" && actualLast2 === targetLast2) return 80;

      return 0;
    }

    // ── القافية المائلة ──────────────────────────────────────────────────────
    case "obliquerhyme":
    case "slantrhyme": {
      if (!values.obliqueRhymeConsonant) return 0;
      const target = values.obliqueRhymeConsonant;

      if (rs.rhymeConsonant === target) return 100;

      const targetFamily = extractRhymeFamily(target);
      const actualFamily = rs.rhymeFamily;
      // استخدام تشابه جيب التمام للتحقق من العائلة إذا لم يكن هناك تطابق مباشر
      if (tolerance !== "strict") {
         if (actualFamily === targetFamily && actualFamily !== "unknown") return 80;
         const sim = patternCosineSimilarity(target, rs.rhymeConsonant);
         if (sim > 0.8) return 70;
      }

      return 0;
    }

    // ── القافية الداخلية ─────────────────────────────────────────────────────
    case "internalrhyme": {
      if (!values.requireInternalRhyme && !values.internalRhymeCore) return 0;

      if (values.requireInternalRhyme && rs.internalRhymes.length === 0) return 0;

      if (values.internalRhymeCore) {
        const target = normalizeArabic(values.internalRhymeCore);
        const hasMatch = rs.internalRhymes.some((ir) =>
          normalizeArabic(ir.rhymeCore).includes(target),
        );
        if (hasMatch) return 100;
        return 0;
      }

      return rs.internalRhymes.length > 0 ? 100 : 0;
    }

    // ── عائلة القافية ────────────────────────────────────────────────────────
    case "rhymefamily": {
      if (!values.rhymeFamilyId) return 0;
      if (rs.rhymeFamily === values.rhymeFamilyId) return 100;

      if (tolerance === "fuzzy") {
        if (rs.rhymeFamily.split("-")[0] === values.rhymeFamilyId.split("-")[0]) {
          return 60;
        }
      }
      return 0;
    }

    // ── النبر الصوتي ─────────────────────────────────────────────────────────
    case "stresspattern": {
      if (!values.targetStressPattern) return 0;
      const target = values.targetStressPattern;
      const actual = ps.stressPattern;

      if (actual === target) return 100;

      // استخدام مسافة هامينغ المعيارية الجديدة
      const dist = normalizedHammingDistance(actual, target);
      const similarity = 1 - dist;

      if (dist <= 0.1 && tolerance !== "strict") return Math.round(similarity * 100);
      if (dist <= 0.2 && tolerance === "relaxed") return 75;
      if (dist <= 0.35 && tolerance === "fuzzy") return 50;
      return 0;
    }

    // ── الوزن الإيقاعي (التفعيلة والبحر) ────────────────────────────────────
    case "rhythmicweight": {
      let score = 0;
      let checks = 0;

      if (values.targetMeter) {
        checks++;
        if (ps.meter === values.targetMeter) score += 100;
        else if (ps.meter === "unknown") score += 0;
        else score += tolerance === "fuzzy" ? 30 : 0;
      }

      if (values.targetDominantFoot) {
        checks++;
        if (ps.dominantFoot === values.targetDominantFoot) score += 100;
      }

      if (values.minRhythmicDensity !== undefined) {
        checks++;
        if (ps.rhythmicDensity >= values.minRhythmicDensity) score += 100;
        else score += 0;
      }

      if (values.targetFootCount !== undefined) {
        checks++;
        const diff = Math.abs(ps.footCount - values.targetFootCount);
        if (diff === 0) score += 100;
        else if (diff === 1 && tolerance !== "strict") score += 60;
      }

      return checks > 0 ? Math.round(score / checks) : 0;
    }

    // ── عدد المقاطع الصوتية ──────────────────────────────────────────────────
    case "syllablecount": {
      if (values.targetSyllableCount === undefined) return 100;
      const target = values.targetSyllableCount;
      const actual = ps.totalSyllables;
      const tol = values.syllableCountTolerance ?? (tolerance === "strict" ? 0 : 1);

      const diff = Math.abs(actual - target);
      if (diff === 0) return 100;
      if (diff <= tol) return 90 - diff * 10;
      if (tolerance === "fuzzy" && diff <= tol + 2)
        return Math.round(80 - diff * 15);

      return 0;
    }

    // ── عدد الموراء ──────────────────────────────────────────────────────────
    case "moracount":
    case "mora": {
      if (values.targetMoraCount === undefined) return 100;
      const target = values.targetMoraCount;
      const actual = ps.totalMoras;
      const tol = values.moraTolerance ?? (tolerance === "strict" ? 0 : 2);

      const diff = Math.abs(actual - target);
      if (diff === 0) return 100;
      if (diff <= tol) return Math.round(100 - (diff / tol) * 30);
      if (tolerance === "fuzzy" && diff <= tol * 2)
        return Math.round(60 - diff * 5);

      return 0;
    }

    // ── البحر الشعري ─────────────────────────────────────────────────────────
    case "meter": {
      if (!values.targetMeter) return 100;
      if (ps.meter === values.targetMeter) return 100;
      if (tolerance !== "strict" && ps.meter !== "unknown") return 20;
      return 0;
    }

    // ── الوزن الصوتي الإجمالي ──────────────────────────────────────────────
    case "weight": {
      if (values.targetSonicWeight === undefined) return 100;
      // نفترض وجود sonicWeight في الـ profile أو استخراجه
      // من أجل هذا التحقق، سنقوم بالمقارنة المباشرة إذا كانت متوفرة
      const actual = (profile as any).sonicWeight ?? 0;
      const target = values.targetSonicWeight;
      const diff = Math.abs(actual - target);
      
      if (diff <= 5) return 100;
      if (diff <= 15 && tolerance !== "strict") return 75;
      if (tolerance === "fuzzy" && diff <= 30) return 50;
      return 0;
    }

    // ── انسيابية التدفق ─────────────────────────────────────────────────────
    case "flow": {
      if (values.minFlowScore === undefined) return 100;
      // نفترض وجود flowScore في الـ ps أو الحساب من regularityIndex
      const actual = (ps as any).flowScore ?? (ps.regularityIndex * 100);
      if (actual >= values.minFlowScore) return 100;
      if (tolerance !== "strict" && actual >= values.minFlowScore - 15) return 60;
      return 0;
    }

    case "signature": {
      // Feature v3.0: Use pre-calculated signature match if available on the bar object
      // We return 100 here if it passed so it survives the AND operator's minScore check.
      if (bar?.signatureMatch) {
        return bar.signatureMatch.passed ? 100 : 0;
      }

      if (!values.sourceSignature) return 0;

      // بناء بصمة البار الحالي من rhymeCore + syllablePattern
      // في الحالة المثالية: Bar يمتلك signature مُخزَّنة مسبقاً
      const targetText = rs.rhymeCore + " " + ps.syllablePattern;
      const targetSig  = computeDigitalSignature(targetText);

      const preset: TolerancePreset =
        tolerance === "strict"  ? "strict"   :
        tolerance === "relaxed" ? "balanced" : "loose";

      const matchResult = computeMatchScore(
        values.sourceSignature,
        targetSig,
        preset
      );

      return matchResult.passed ? 100 : 0;
    }

    default:
      return 100;
  }
};

/*
  حساب نقاط مطابقة البار مع الفلتر الصوتي
  يدعم الفلاتر الفردية والمزدوجة والثلاثية
 */
export const computePhoneticMatchScore = (
  profile: BarPhoneticProfile,
  filter: PhoneticFilter,
  bar?: Bar
): BarPhoneticProfile => {
  if (filter.params.length === 0) {
    return { ...profile, matchScore: 100, paramScores: {} as Record<SingleFilterParam, number>, satisfiedParams: [], partialParams: [] };
  }

  const paramScores = {} as Record<SingleFilterParam, number>;
  const satisfiedParams: SingleFilterParam[] = [];
  const partialParams: SingleFilterParam[] = [];

  for (const param of filter.params) {
    const score = scoreParam(
      param,
      profile,
      filter.values,
      filter.matchTolerance,
      bar
    );
    paramScores[param] = score;

    if (score === 100) satisfiedParams.push(param);
    else if (score > 0) partialParams.push(param);
  }

  let matchScore: number;

  switch (filter.operator) {
    case "AND": {
      // كل المعاملات يجب أن تُستوفى
      const allSatisfied = filter.params.every(
        (p) => paramScores[p] >= 100,
      );
      matchScore = allSatisfied
        ? 100
        : Math.min(...filter.params.map((p) => paramScores[p]));
      break;
    }

    case "OR": {
      // الأعلى نقاطاً يفوز
      matchScore = Math.max(...filter.params.map((p) => paramScores[p]));
      break;
    }

    case "WEIGHTED": {
      // أوزان المعاملات حسب الأهمية الصوتية
      const weights: Partial<Record<SingleFilterParam, number>> = {
        perfectrhyme: 2.0,
        rhythmicweight: 1.8,
        syllablecount: 1.6,
        moracount: 1.5,
        obliquerhyme: 1.4,
        rhymefamily: 1.3,
        internalrhyme: 1.2,
        stresspattern: 1.1,
        meter: 1.0,
      };

      const totalWeight = filter.params.reduce(
        (sum, p) => sum + (weights[p] ?? 1),
        0,
      );
      const weightedSum = filter.params.reduce(
        (sum, p) => sum + (weights[p] ?? 1) * (paramScores[p] ?? 0),
        0,
      );
      matchScore = Math.round(weightedSum / totalWeight);
      break;
    }
  }

  return {
    ...profile,
    matchScore,
    paramScores,
    satisfiedParams,
    partialParams,
  };
};
