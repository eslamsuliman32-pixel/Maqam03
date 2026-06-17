// ─── phonetic-filter.types.ts ───────────────────────────────────────────────

import { DigitalSignature } from "../../lib/arabic-prosody/vectorizer";
import { TolerancePreset } from "../../lib/arabic-prosody/matching-engine";

/* وحدة المورا: الوحدة الزمنية الإيقاعية لقياس الثقل الصوتي */
export type MoraWeight = "light" | "heavy" | "superheavy";

/* تصنيف المقطع الصوتي وفق العروض العربي */
export interface Syllable {
  text: string;
  /* cv=متحرك+صامت, cvv=متحرك+مد, cvc=متحرك+صامت+صامت, cvvc=مد+تنوين */
  pattern: "cv" | "cvv" | "cvc" | "cvvc";
  mora: MoraWeight;
  /* موقع النبر: هل هذا المقطع منبور؟ */
  stressed: boolean;
  position: number;
}

/* بصمة القافية الصوتية */
export interface RhymeSignature {
  /* الكلمة الأخيرة في البار */
  finalWord: string;
  /* الصوائت والصوامت الجوهرية في القافية (رويّ + وصل + خروج) */
  rhymeCore: string;
  /* الحرف الأساسي للروي */
  rhymeConsonant: string;
  /* حركة الروي */
  rhymeVowel: string;
  /* عائلة القافية الصوتية (مجموعة أصوات متشابهة) */
  rhymeFamily: string;
  /* نوع القافية */
  rhymeType: RhymeType;
  /* القوافي الداخلية المكتشفة */
  internalRhymes: InternalRhyme[];
  /* نقاط التقطيع الصوتي للقافية */
  rhymeSyllables: Syllable[];
}

export type RhymeType =
  | "perfect"    // قافية تامة: توافق الروي + الردف + التأسيس
  | "oblique"    // قافية مائلة: توافق جزئي
  | "assonance"  // جناس صوتي: توافق الصوائت
  | "consonance" // توافق الصوامت
  | "internal"   // قافية داخلية
  | "none";

export interface InternalRhyme {
  word: string;
  position: number; // موقع الكلمة في البار
  matchesEndRhyme: boolean;
  rhymeCore: string;
}

/* بصمة الوزن الإيقاعي الكاملة للبار */
export interface ProsodicSignature {
  /* التفعيلة المهيمنة */
  dominantFoot: ArabicFoot;
  /* عدد التفعيلات */
  footCount: number;
  /* البحر الشعري المقترح */
  meter: ArabicMeter;
  /* عدد المقاطع الكلية */
  totalSyllables: number;
  /* عدد المقاطع الثقيلة */
  heavySyllables: number;
  /* عدد المقاطع الخفيفة */
  lightSyllables: number;
  /* مجموع الموراء */
  totalMoras: number;
  /* الكثافة الإيقاعية (نسبة المقاطع الثقيلة) */
  rhythmicDensity: number;
  /* نمط النبر (سلسلة من S=stressed, U=unstressed) */
  stressPattern: string;
  /* مؤشر الانتظام الإيقاعي [0-1] */
  regularityIndex: number;
  /* نمط المقاطع الكامل (H=heavy, L=light, SH=superheavy) */
  syllablePattern: string;
}

/* التفعيلات العربية */
export type ArabicFoot =
  | "فَعُولُن"
  | "مَفَاعِيلُن"
  | "فَاعِلاتُن"
  | "مُسْتَفْعِلُن"
  | "مَفَاعِلُن"
  | "فَاعِلُن"
  | "مُتَفَاعِلُن"
  | "مُفَاعَلَتُن"
  | "مَفْعُولاتُ"
  | "unknown";

/* بحور الشعر العربي */
export type ArabicMeter =
  | "طويل" | "مديد" | "بسيط" | "وافر" | "كامل" | "هزج"
  | "رجز" | "رمل" | "سريع" | "منسرح" | "خفيف"
  | "مضارع" | "مقتضب" | "مجتث" | "متقارب" | "متدارك"
  | "free" | "unknown";

/* أنواع الفلاتر */
export type FilterMode =
  | "single"   // فلتر فردي
  | "dual"     // فلتر مزدوج
  | "triple";  // فلتر ثلاثي

/* معاملات الفلتر الصوتي الفردي */
export type SingleFilterParam =
  | "perfectrhyme"       // القافية التامة
  | "internalrhyme"      // القافية الداخلية
  | "obliquerhyme"       // القافية المائلة
  | "slantrhyme"         // القافية المائلة (alias)
  | "stresspattern"      // النبر الصوتي
  | "rhythmicweight"     // الوزن الإيقاعي
  | "syllablecount"      // عدد المقاطع
  | "moracount"          // عدد الموراء
  | "mora"               // عدد الموراء (alias)
  | "rhymefamily"        // عائلة القافية
  | "meter"              // البحر الشعري
  | "weight"             // الوزن الصوتي الإجمالي
  | "flow"               // انسيابية التدفق
  | "signature";         // مطابقة البصمة الرقمية الثلاثية

/* تعريف الفلتر الصوتي الموحّد (فردي/مزدوج/ثلاثي) */
export interface PhoneticFilter {
  mode: FilterMode;
  /* المعاملات النشطة (1 أو 2 أو 3) */
  params: SingleFilterParam[];
  /* قيم الفلتر لكل معامل */
  values: PhoneticFilterValues;
  /* دقة المطابقة: strict=100% | relaxed=تسامح | fuzzy=تقريبي */
  matchTolerance: "strict" | "relaxed" | "fuzzy";
  /* الحد الأدنى لنقاط التطابق عند OR */
  minScore?: number;
  /* آلية دمج النتائج */
  operator: "AND" | "OR" | "WEIGHTED";
}

export interface PhoneticFilterValues {
  // القافية
  perfectRhymeCore?: string;        // الكود الصوتي للقافية التامة
  obliqueRhymeConsonant?: string;   // الصامت للقافية المائلة
  rhymeFamilyId?: string;           // معرّف عائلة القافية
  requireInternalRhyme?: boolean;   // وجود قافية داخلية
  internalRhymeCore?: string;       // كود القافية الداخلية

  // الوزن والإيقاع
  targetSyllableCount?: number;             // عدد المقاطع المستهدف
  syllableCountTolerance?: number;          // هامش التسامح (+/-)
  targetMoraCount?: number;                 // عدد الموراء المستهدف
  moraTolerance?: number;                   // هامش الموراء
  targetMeter?: ArabicMeter;               // البحر المستهدف
  targetDominantFoot?: ArabicFoot;         // التفعيلة المستهدفة
  minRhythmicDensity?: number;             // الحد الأدنى للكثافة الإيقاعية
  maxRhythmicDensity?: number;             // الحد الأقصى للكثافة الإيقاعية
  targetStressPattern?: string;            // نمط النبر المستهدف
  stressPatternTolerance?: number;         // تسامح نمط النبر (Hamming Distance)
  minRegularityIndex?: number;             // حد أدنى للانتظام الإيقاعي
  targetFootCount?: number;                // عدد التفعيلات
  footCountTolerance?: number;             // هامش عدد التفعيلات
  targetSonicWeight?: number;              // الوزن الصوتي المستهدف
  minFlowScore?: number;                  // الحد الأدنى للانسيابية
  sourceSignature?: DigitalSignature;     // بصمة البار المرجعي
  signaturePreset?: TolerancePreset;      // مستوى تسامح المحرك الجديد
  signatureTopK?: number;                 // عدد أفضل النتائج المطلوبة
  referenceText?: string;                 // النص المرجعي للمطابقة (UI only)
}

/* نتيجة تحليل البار صوتياً وعروضياً */
export interface BarPhoneticProfile {
  barId: string;
  rhymeSignature: RhymeSignature;
  prosodicSignature: ProsodicSignature;
  /* درجة المطابقة الإجمالية مع الفلتر [0-100] */
  matchScore: number;
  /* تفاصيل كل معامل في الفلتر */
  paramScores: Record<SingleFilterParam, number>;
  /* المعاملات المستوفاة */
  satisfiedParams: SingleFilterParam[];
  /* المعاملات الجزئية */
  partialParams: SingleFilterParam[];
}
