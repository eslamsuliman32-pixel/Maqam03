// ═══════════════════════════════════════════════════════════════
// MAQAM RAP | المحرك الصوتي المتقدم
// Pure Functions Only — لا آثار جانبية
// ═══════════════════════════════════════════════════════════════

import type {
  PhoneticTail,
  SyllableUnit,
  SarfWeight,
  ArabicVowel,
  RhymeQuality,
} from '../types/flow.types';

// ────────────────────────────────────────────────────────────────
// ثوابت أنماط الحروف العربية
// ────────────────────────────────────────────────────────────────
const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670]/g;
const ARABIC_LETTERS = /[\u0621-\u064A\u0671-\u06FF]/;
const FATHA_PATTERNS = /[\u064E\u0627\u0649]/;   // فتحة / ألف / ألف مقصورة
const KASRA_PATTERNS = /[\u0650\u064A]/;           // كسرة / ياء
const DAMMA_PATTERNS = /[\u064F\u0648]/;           // ضمة / واو
const SUKUN_PATTERN = /\u0652/;                    // سكون
const SHADDA_PATTERN = /\u0651/;                   // شدة
const MADD_PATTERN = /[\u0622\u0623\u0625]/;       // مد

// ────────────────────────────────────────────────────────────────
// 🔹 تطبيع النص العربي
// ────────────────────────────────────────────────────────────────
export const normalizeArabicText = (text: string): string => {
  return text
    .trim()
    .replace(ARABIC_DIACRITICS, '')           // إزالة التشكيل
    .replace(/[\u0622\u0623\u0625]/g, '\u0627') // توحيد الألف
    .replace(/\u0629/g, '\u0647')              // تاء مربوطة → هاء
    .replace(/\s+/g, ' ');
};

// ────────────────────────────────────────────────────────────────
// 🔹 استخراج المقاطع الصوتية (Syllable Extraction)
// الخوارزمية: CV / CVC / CVCC (خفيف/ثقيل/ثقيل جداً)
// ────────────────────────────────────────────────────────────────
export const extractSyllables = (arabicText: string): SyllableUnit[] => {
  const normalized = normalizeArabicText(arabicText);
  const words = normalized.split(' ').filter(Boolean);
  const syllables: SyllableUnit[] = [];
  let position = 0;

  for (const word of words) {
    const wordSyllables = extractWordSyllables(word, position);
    syllables.push(...wordSyllables);
    position += wordSyllables.length;
  }

  // تحديد مواضع التركيز الصوتي
  return markStressPositions(syllables);
};

const extractWordSyllables = (word: string, startPos: number): SyllableUnit[] => {
  const syllables: SyllableUnit[] = [];
  const chars = [...word];
  let i = 0;
  let pos = startPos;

  while (i < chars.length) {
    if (!ARABIC_LETTERS.test(chars[i])) { i++; continue; }

    const consonant = chars[i];
    let syllableText = consonant;
    let type: SyllableUnit['type'] = 'light';

    i++;

    // فحص الحرف التالي (الحركة أو الحرف الساكن)
    if (i < chars.length) {
      const next = chars[i];

      if (FATHA_PATTERNS.test(next) || KASRA_PATTERNS.test(next) || DAMMA_PATTERNS.test(next)) {
        // CV — مقطع خفيف
        syllableText += next;
        i++;
        type = 'light';

        // فحص إضافي للمد أو الساكن (CVC / CVCC)
        if (i < chars.length && ARABIC_LETTERS.test(chars[i])) {
          if (i + 1 < chars.length && SUKUN_PATTERN.test(chars[i + 1])) {
            syllableText += chars[i];
            type = 'heavy';
            i++;
          }
        }
      } else if (SUKUN_PATTERN.test(next)) {
        // C مع سكون — جزء من مقطع سابق أو ثقيل جداً
        syllableText += next;
        type = 'superheavy';
        i++;
      }
    }

    syllables.push({
      text: syllableText,
      type,
      position: pos++,
      stress: false,
    });
  }

  return syllables;
};

const markStressPositions = (syllables: SyllableUnit[]): SyllableUnit[] => {
  // قاعدة التركيز: المقطع الثقيل قبل الأخير يأخذ التركيز
  if (syllables.length === 0) return syllables;

  const mutable = [...syllables];
  let stressed = false;

  for (let i = mutable.length - 1; i >= 0; i--) {
    if (mutable[i].type === 'heavy' || mutable[i].type === 'superheavy') {
      mutable[i] = { ...mutable[i], stress: true };
      stressed = true;
      break;
    }
  }

  // إذا لم يجد ثقيل، يُعطى التركيز للأخير
  if (!stressed && mutable.length > 0) {
    mutable[mutable.length - 1] = { ...mutable[mutable.length - 1], stress: true };
  }

  return mutable;
};

// ────────────────────────────────────────────────────────────────
// 🔹 تحليل الذيل الصوتي (Phonetic Tail Analysis)
// ────────────────────────────────────────────────────────────────
export const analyzePhoneticTail = (word: string): PhoneticTail => {
  const normalized = normalizeArabicText(word);
  if (!normalized) {
    return createEmptyTail();
  }

  const chars = [...normalized];
  const lastChar = chars[chars.length - 1] ?? '';
  const secondLast = chars[chars.length - 2] ?? '';

  const vowel = detectVowel(secondLast, lastChar);
  const consonant = lastChar;
  const syllableShape = detectSyllableShape(normalized);
  const weight = detectSarfWeight(normalized);
  const phoneticHash = generatePhoneticHash(vowel, consonant, syllableShape);

  return { vowel, consonant, weight, syllableShape, phoneticHash };
};

const detectVowel = (secondLast: string, lastChar: string): ArabicVowel => {
  if (MADD_PATTERN.test(secondLast) || /[\u0622]/.test(lastChar)) return 'madd';
  if (FATHA_PATTERNS.test(secondLast) || lastChar === '\u0627') return 'fatha';
  if (KASRA_PATTERNS.test(secondLast) || lastChar === '\u064A') return 'kasra';
  if (DAMMA_PATTERNS.test(secondLast) || lastChar === '\u0648') return 'damma';
  return 'sukun';
};

const detectSyllableShape = (word: string): string => {
  const len = [...word].filter(c => ARABIC_LETTERS.test(c)).length;
  if (len <= 2) return 'CV';
  if (len === 3) return 'CVC';
  return 'CVCC';
};

const detectSarfWeight = (word: string): SarfWeight => {
  const len = [...word].filter(c => ARABIC_LETTERS.test(c)).length;
  if (len === 3) return 'fael';
  if (len === 4) return 'faal';
  if (len >= 5) return 'mafool';
  return 'unknown';
};

const generatePhoneticHash = (
  vowel: ArabicVowel,
  consonant: string,
  shape: string
): string => {
  return `${vowel}-${consonant.charCodeAt(0).toString(16)}-${shape}`;
};

const createEmptyTail = (): PhoneticTail => ({
  vowel: 'sukun',
  consonant: '',
  weight: 'unknown',
  syllableShape: 'CV',
  phoneticHash: 'empty-00-CV',
});

// ────────────────────────────────────────────────────────────────
// 🔹 مطابقة السجع (Assonance Matching Engine)
// نظام نقاط متدرّج: تطابق تام → قافية → سجع → لا مطابقة
// ────────────────────────────────────────────────────────────────
export const matchAssonance = (
  tail1: PhoneticTail,
  tail2: PhoneticTail
): { score: number; quality: RhymeQuality } => {
  // تطابق تام عبر الـ hash
  if (tail1.phoneticHash === tail2.phoneticHash) {
    return { score: 1.0, quality: 'perfect' };
  }

  let score = 0;
  let qualityScore = 0;

  // مطابقة الحرف الساكن الأخير (الأهم في القافية العربية)
  if (tail1.consonant === tail2.consonant) {
    score += 0.45;
    qualityScore++;
  }

  // مطابقة الحركة (السجع الصوتي)
  if (tail1.vowel === tail2.vowel) {
    score += 0.35;
    qualityScore++;
  }

  // مطابقة الشكل المقطعي
  if (tail1.syllableShape === tail2.syllableShape) {
    score += 0.15;
    qualityScore++;
  }

  // مطابقة الوزن الصرفي (إثراء إضافي)
  if (tail1.weight === tail2.weight) {
    score += 0.05;
  }

  const quality: RhymeQuality =
    qualityScore === 3 ? 'near' :
    qualityScore === 2 ? 'assonance' :
    qualityScore >= 1 ? 'assonance' : 'none';

  return { score: Math.min(score, 0.99), quality };
};

// ────────────────────────────────────────────────────────────────
// 🔹 حساب نقاط السجع الإجمالية للبارات
// ────────────────────────────────────────────────────────────────
export const calculateGlobalAssonance = (
  tails: PhoneticTail[]
): number => {
  if (tails.length < 2) return 0;

  let totalScore = 0;
  let comparisons = 0;

  for (let i = 0; i < tails.length - 1; i++) {
    for (let j = i + 1; j < tails.length; j++) {
      const { score } = matchAssonance(tails[i], tails[j]);
      totalScore += score;
      comparisons++;
    }
  }

  return comparisons > 0 ? Math.round((totalScore / comparisons) * 100) : 0;
};

// ────────────────────────────────────────────────────────────────
// 🔹 كشف الانثناء الصوتي (Phonetic Bending Detection)
// كلمات تجمع بين الحروف العربية والأصوات الإنجليزية
// ────────────────────────────────────────────────────────────────
export const detectPhoneticBends = (text: string): string[] => {
  const bends: string[] = [];
  const mixedPattern = /[\u0621-\u064A]+[a-zA-Z]+|[a-zA-Z]+[\u0621-\u064A]+/g;
  const matches = text.match(mixedPattern);
  if (matches) bends.push(...matches);
  return [...new Set(bends)];
};

// ────────────────────────────────────────────────────────────────
// 🔹 تقدير السرعة المثالية بناءً على عدد المقاطع
// ────────────────────────────────────────────────────────────────
export const estimateIdealBPM = (
  avgSyllablesPerBar: number,
  targetBeatsPerBar: number = 4
): number => {
  // المعادلة: BPM = (مقاطع لكل بار / نبضات لكل بار) × 60
  const syllablesPerBeat = avgSyllablesPerBar / targetBeatsPerBar;
  const idealBPM = Math.round(syllablesPerBeat * 60);
  return Math.max(80, Math.min(200, idealBPM));
};
