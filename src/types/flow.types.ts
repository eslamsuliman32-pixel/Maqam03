// ═══════════════════════════════════════════════════════════════
// MAQAM RAP | Staccato Flow System - Type Definitions
// معيار TypeScript Strict Mode | النظام المعياري الكامل
// ═══════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────────────
// الوحدة الصوتية الأساسية (Phonetic Unit)
// ────────────────────────────────────────────────────────────────
export type ArabicVowel = 'fatha' | 'kasra' | 'damma' | 'sukun' | 'madd';
export type SarfWeight = 'fael' | 'faal' | 'mafool' | 'mufael' | 'tafeel' | 'unknown';
export type AdLibPlacement = 'end' | 'mid' | 'random' | 'none';
export type FlowState = 'idle' | 'composing' | 'analyzing' | 'complete' | 'error';
export type RhymeQuality = 'perfect' | 'near' | 'assonance' | 'none';

export interface PhoneticTail {
  readonly vowel: ArabicVowel;
  readonly consonant: string;
  readonly weight: SarfWeight;
  readonly syllableShape: string;   // CV, CVC, CVCC — الشكل المقطعي
  readonly phoneticHash: string;    // معرّف فريد للمطابقة السريعة
}

// ────────────────────────────────────────────────────────────────
// الوحدة المقطعية (Syllable Unit)
// ────────────────────────────────────────────────────────────────
export interface SyllableUnit {
  readonly text: string;
  readonly type: 'light' | 'heavy' | 'superheavy';  // خفيف / ثقيل / ثقيل جداً
  readonly position: number;
  readonly stress: boolean;         // هل هو الموقع المُركَّز عليه؟
}

// ────────────────────────────────────────────────────────────────
// البار الموسيقي (المصراع الواحد)
// ────────────────────────────────────────────────────────────────
export interface Bar {
  readonly id: string;
  content: string;
  syllableCount: number;
  syllableUnits: SyllableUnit[];
  phoneticTail: PhoneticTail;
  adLib: string | null;
  restDuration: number;             // بالملي ثانية
  intensity: 0 | 1 | 2 | 3 | 4 | 5; // شدة الإلقاء (0=هادئ, 5=هجومي)
  rhymeQuality: RhymeQuality;
  isLocked: boolean;                // قفل البار من التعديل
  metadata: BarMetadata;
}

export interface BarMetadata {
  readonly createdAt: number;
  lastModified: number;
  editCount: number;
  aiSuggested: boolean;
}

// ────────────────────────────────────────────────────────────────
// أنماط التدفق (Flow Patterns)
// ────────────────────────────────────────────────────────────────
export type FlowPatternType =
  | 'AAAA'            // الهجومي الكامل — تكرار القافية الكاملة
  | 'AABB'            // الزوجي السردي
  | 'ABAB'            // المتقاطع الكلاسيكي
  | 'ABBA'            // العكسي التوسيع
  | 'STACCATO'        // المتقطع — توقفات مكثفة بين المقاطع
  | 'PHONETIC_BEND'   // الانثناء الصوتي — مزج عربي/إنجليزي إيقاعي
  | 'FREE_FLOW'       // حر — بدون قيود صارمة
  | 'TRIPLET';        // ثلاثي — 3 مقاطع لكل بار بشكل ثلاثي الإيقاع

export interface PatternConfig {
  readonly id: FlowPatternType;
  readonly nameAr: string;
  readonly nameEn: string;
  readonly description: string;
  readonly bpmRange: [number, number];
  readonly barCount: number;
  readonly syllableTarget: [number, number]; // [min, max]
  readonly requiredAssonance: boolean;
  readonly adLibPlacement: AdLibPlacement;
  readonly intensityCurve: number[];        // مسار الشدة عبر البارات
  readonly color: string;                    // لون تمييزي للقالب
  readonly icon: string;                     // أيقونة
}

// ────────────────────────────────────────────────────────────────
// قالب التدفق الكامل (Flow Template)
// ────────────────────────────────────────────────────────────────
export interface FlowTemplate {
  readonly id: string;
  readonly pattern: FlowPatternType;
  readonly config: PatternConfig;
  readonly anchorRhyme: PhoneticTail;
  bars: Bar[];
  readonly createdAt: number;
  title: string;
  tags: string[];
}

// ────────────────────────────────────────────────────────────────
// نتيجة التحليل الصوتي
// ────────────────────────────────────────────────────────────────
export interface AssonanceAnalysis {
  readonly score: number;                   // 0-100
  readonly detectedPattern: FlowPatternType;
  readonly rhymingPairs: Array<[string, string, number]>; // [word1, word2, score]
  readonly weakBars: string[];              // معرّفات البارات الضعيفة
  readonly suggestions: string[];
  readonly phoneticBends: string[];         // مواقع الانثناء الصوتي
  readonly overallQuality: 'excellent' | 'good' | 'average' | 'weak';
}

// ────────────────────────────────────────────────────────────────
// حالة التحليل بالذكاء الاصطناعي
// ────────────────────────────────────────────────────────────────
export interface AIAnalysisState {
  readonly isLoading: boolean;
  readonly lastAnalysis: AssonanceAnalysis | null;
  readonly error: string | null;
  readonly suggestedWords: string[];
}
