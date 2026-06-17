import { v4 as uuidv4 } from "uuid";
import {
  IntonationCurvePoint,
  IntonationProfile,
  EmotionType,
} from "../types/flowEngine.types";

// ─── أنماط التنغيم الافتراضية للمشاعر المختلفة ───────────────────────

export const DEFAULT_EMOTION_CURVES: Record<EmotionType, { pitch: number; label: string }[]> = {
  rage: [
    { pitch: 85, label: "هجوم حاد" },
    { pitch: 90, label: "غضب متصاعد" },
    { pitch: 70, label: "تفريغ الطاقة" },
    { pitch: 95, label: "قمة القوة" },
  ],
  melancholy: [
    { pitch: 35, label: "حزن منخفض" },
    { pitch: 30, label: "نواح خافت" },
    { pitch: 45, label: "تأوه عابر" },
    { pitch: 25, label: "انكسار أخير" },
  ],
  triumph: [
    { pitch: 75, label: "كبرياء بدائي" },
    { pitch: 80, label: "فخر متصل" },
    { pitch: 85, label: "صدح كاسر" },
    { pitch: 90, label: "خاتمة النصر" },
  ],
  sarcasm: [
    { pitch: 65, label: "نبرة مستهزئة" },
    { pitch: 80, label: "قفزة متهكمة" },
    { pitch: 50, label: "هبوط ساخر" },
    { pitch: 75, label: "سخرية مستترة" },
  ],
  storytelling: [
    { pitch: 50, label: "سرد متزن" },
    { pitch: 55, label: "كشف العقدة" },
    { pitch: 52, label: "تعليق درامي" },
    { pitch: 48, label: "قرار حاسم" },
  ],
  hype: [
    { pitch: 80, label: "حماس انطلاقة" },
    { pitch: 85, label: "شحن جماهيري" },
    { pitch: 90, label: "تفجير حركي" },
    { pitch: 95, label: "قمة الأدرينالين" },
  ],
  introspective: [
    { pitch: 40, label: "تأمل داخلي" },
    { pitch: 42, label: "بوح ذاتي" },
    { pitch: 38, label: "تساؤل وجودي" },
    { pitch: 35, label: "صمت معبّر" },
  ],
  defiant: [
    { pitch: 70, label: "تحدي معلن" },
    { pitch: 75, label: "صلابة السد" },
    { pitch: 80, label: "مواجهة صريحة" },
    { pitch: 85, label: "ثبات جبل" },
  ],
};

const REFERENCE_ARTISTS: Record<EmotionType, string> = {
  rage: "المروكي — السبع",
  melancholy: "السينابتيك — الرماد",
  triumph: "دبل كليك — المعلم",
  sarcasm: "أبو الأنوار — الكوميديا السوداء",
  storytelling: "شب جديد — كابتن",
  hype: "مروان بابلو — الجميزة",
  introspective: "ويجز — البخت",
  defiant: "شاهين — سيري",
};

/**
 * توليد منحنى نغمي افتراضي لمشاعر معينة.
 */
export function generateDefaultCurve(emotion: EmotionType): IntonationCurvePoint[] {
  const points = DEFAULT_EMOTION_CURVES[emotion] || DEFAULT_EMOTION_CURVES.storytelling;
  return points.map((p, index) => ({
    time: index / (points.length - 1),
    pitch: p.pitch,
    emotion,
    label: p.label,
  }));
}

/**
 * توليد ملف تنغيم كامل لمشاعر معينة.
 */
export function generateIntonationProfile(emotion: EmotionType): IntonationProfile {
  const curve = generateDefaultCurve(emotion);
  const minMax: [number, number] = [
    Math.min(...curve.map((p) => p.pitch)),
    Math.max(...curve.map((p) => p.pitch)),
  ];

  const defaultBreaths = {
    rage: [0.1, 0.9],
    melancholy: [0.3, 0.7, 0.9],
    triumph: [0.5, 0.9],
    sarcasm: [0.2, 0.8],
    storytelling: [0.25, 0.5, 0.75],
    hype: [0.15, 0.85],
    introspective: [0.4, 0.8],
    defiant: [0.3, 0.7],
  };

  return {
    id: uuidv4(),
    emotion,
    curve,
    breathPattern: defaultBreaths[emotion] || [0.5],
    dynamicRange: minMax,
    referenceArtist: REFERENCE_ARTISTS[emotion],
    practiceNotes: `تدرّب على محاكاة انحناء النبرة من ${minMax[0]}Hz إلى ${minMax[1]}Hz لتحقيق العاطفة المحددة.`,
  };
}

/**
 * تنعيم المنحنى النغمي (Interpolation).
 * تفيد في تمرير المنحنى على نقاط زمنية أدق لمحاكاة التدفق الصوتي المستمر.
 */
export function interpolatePitch(curve: IntonationCurvePoint[], t: number): number {
  if (curve.length === 0) return 50;
  if (curve.length === 1) return curve[0].pitch;

  // تأمين الترتيب تصاعدياً حسب الوقت
  const sorted = [...curve].sort((a, b) => a.time - b.time);

  if (t <= sorted[0].time) return sorted[0].pitch;
  if (t >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].pitch;

  // العثور على النقطتين اللتين بينهما الزمن t
  let i = 0;
  while (i < sorted.length - 1 && sorted[i + 1].time < t) {
    i++;
  }

  const p0 = sorted[i];
  const p1 = sorted[i + 1];

  const factor = (t - p0.time) / (p1.time - p0.time);
  return p0.pitch + factor * (p1.pitch - p0.pitch);
}
