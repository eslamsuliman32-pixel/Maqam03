// src/types/sonic.ts

/** نظام الإيقاع الثابت وفق الوثيقة: 16 دقّة / بار */
export const BEATS_PER_BAR = 16 as const;

/** المقطع اللفظي: حرفين فأكثر (تعريف 4) */
export interface SyllableSegment {
  id: string;
  raw: string; // النص كما كتبه المستخدم
  phoneticKey: string; // الهيكل الصوتي المُطبّع للمطابقة
  startBeat: number; // 0..15 موضع البداية على الشبكة
  span: number; // عدد الدقّات التي يشغلها المقطع
  matchGroupId: string | null; // مجموعة التطابق الصوتي (للتلوين)
}

/** البار: الوحدة الإيقاعية الأساسية */
export interface Bar {
  id: string;
  index: number; // ترتيب البار داخل الفيرس
  text: string; // النص الخام للبار
  segments: SyllableSegment[];
}

/** الفيرس: مجموعة بارات (وحدة الإدخال الكاملة) */
export interface Verse {
  id: string;
  bars: Bar[];
}

/** مجموعة التطابق الصوتي التقريبي + اللون المخصص لها */
export interface SonicMatchGroup {
  id: string;
  phoneticKey: string;
  color: string; // توكن لون من نظام التصميم
  occurrences: number;
}

/** البصمة الصوتية الكاملة = مخرج النظام (بند 7) */
export interface SonicFingerprint {
  verseId: string;
  groups: SonicMatchGroup[];
  // خريطة سريعة: segmentId -> groupId لتلوين O(1)
  cellGroupMap: Record<string, string>;
}
