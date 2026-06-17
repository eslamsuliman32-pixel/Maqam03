// ============================================================
// MAQAM RAP - Alignment Layer Types v1.0
// نظام الإحداثيات المزدوج: كل حدث يحمل توقيتاً موسيقياً (PPQ) وفيزيائياً (Seconds)
// ============================================================

export const PPQ_RESOLUTION = 960 as const; // الدقة الداخلية الثابتة للمشروع

// ---------- الطبقة 1: خريطة الزمن الموسيقي ----------
export interface TempoAnchor {
  ppq: number; // الموقع الموسيقي (floating-point)
  absoluteTimeSeconds: number; // الموقع الفيزيائي المقابل
  bpm: number; // السرعة عند نقطة الارتكاز
}

export interface TimeSignatureChange {
  ppq: number;
  numerator: number; // البسط (عدد النبضات في البار)
  denominator: number; // المقام (4 = نغمة ربعية)
}

export interface BeatGrid {
  ppqResolution: typeof PPQ_RESOLUTION;
  tempoMap: TempoAnchor[];
  signatureMap: TimeSignatureChange[];
  detectedDownbeats: number[]; // مواقع الضربات القوية (PPQ) من Essentia.js
}

// ---------- الطبقة 2: الهرم اللفظي ----------
export interface Phoneme {
  id: string;
  symbol: string; // رمز صوتي (IPA أو نظام عربي مخصص)
  onsetPPQ: number;
  offsetPPQ: number;
  onsetSeconds: number;
  offsetSeconds: number;
  confidence: number; // 0-1 من خوارزمية Viterbi
}

export interface Syllable {
  id: string;
  text: string;
  phonemes: Phoneme[]; // متسلسلة، غير متداخلة
  onsetPPQ: number;
  offsetPPQ: number;
  onsetSeconds: number;
  offsetSeconds: number;
  stress: number; // درجة النبر
  confidence: number; // متوسط ثقة الفونيمات
  isManuallyAdjusted: boolean;
}

export interface Word {
  id: string;
  text: string;
  syllableIds: string[]; // مراجع IDs - حفاظاً على المصدر الوحيد للحقيقة
  onsetPPQ: number;
  offsetPPQ: number;
}

// ---------- الطبقة 3: طبقة الربط (قلب التطبيق) ----------
export type AlignmentSource = 'auto' | 'manual';

export interface SyllableAlignment {
  id: string;
  syllableId: string;
  barId: string;
  nearestBeatPPQ: number;
  beatIndexInBar: number;
  subdivision: number; // 4 = 1/16، 3 = triplet ...
  offsetFromBeatMs: number; // + متأخر (laid-back) / - متقدّم (pushing)
  isOnBeat: boolean;
  alignmentSource: AlignmentSource;
}

// ---------- الطبقة 4: طبقتا الطاقة (منفصلتان) ----------
export interface AudioEnergyFrame {
  ppq: number;
  rmsEnergy: number; // 0-1
}

export interface FlowDensityFrame {
  ppq: number;
  syllablesPerBeat: number;
  deliverySpeed: number;
}
