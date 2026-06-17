// src/services/prosodyEngine.ts
import type { SyllableSegment } from "../types/sonic";

const HARAKAT = /[\u064B-\u0652\u0670]/g; // التشكيل
const TATWEEL = /\u0640/g; // التطويل
// تطبيع الحروف المتقاربة صوتياً (للتطابق "التقريبي" بند 5.4)
const PHONETIC_MAP: Record<string, string> = {
  "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا",
  "ى": "ي", "ئ": "ي", "ؤ": "و", "ة": "ه",
};

/** تحويل المقطع إلى هيكل صوتي مجرد للمطابقة */
export const toPhoneticKey = (raw: string): string =>
  raw
    .replace(HARAKAT, "")
    .replace(TATWEEL, "")
    .split("")
    .map((ch) => PHONETIC_MAP[ch] ?? ch)
    .join("")
    .trim();

/**
 * تقطيع البار عروضياً إلى مقاطع لفظية (كل مقطع = حرفين فأكثر).
 * منطق مبسّط قائم على بنية المقطع العربي (ساكن/متحرك).
 */
export const segmentBar = (text: string): SyllableSegment[] => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const segments: SyllableSegment[] = [];

  for (const word of words) {
    const chars = [...word];
    let buffer = "";

    for (let i = 0; i < chars.length; i++) {
      buffer += chars[i];
      const isVowelBreak = /[اويةه]/.test(chars[i]);
      // أغلق المقطع عند حرف مدّ/علّة وبشرط ألا يقل عن حرفين
      if (isVowelBreak && buffer.length >= 2) {
        segments.push(makeSegment(buffer));
        buffer = "";
      }
    }
    if (buffer) {
      // ضمّ البقية القصيرة للمقطع السابق حتى لا ننتج مقطعاً بحرف واحد
      if (buffer.length < 2 && segments.length) {
        const prev = segments[segments.length - 1];
        prev.raw += buffer;
        prev.phoneticKey = toPhoneticKey(prev.raw);
      } else {
        segments.push(makeSegment(buffer));
      }
    }
  }
  return segments;
};

const makeSegment = (raw: string): SyllableSegment => ({
  id: crypto.randomUUID(),
  raw,
  phoneticKey: toPhoneticKey(raw),
  startBeat: 0,
  span: 1,
  matchGroupId: null,
});
