// ─── prosodic-analyzer.engine.ts ────────────────────────────────────────────

import {
  Syllable,
  MoraWeight,
  RhymeSignature,
  InternalRhyme,
  ProsodicSignature,
  ArabicFoot,
  ArabicMeter,
  SingleFilterParam,
  BarPhoneticProfile,
} from "./phonetic-filter.types";

/*
  خريطة الأصوات المتماثلة لتجميع عائلات القوافي
  كل مجموعة تمثل أصوات متشابهة مخرجاً وصفةً
 */
export const RHYMEFAMILYMAP: Record<string, string> = {
  // الأصوات الشفوية
  ب: "labial", م: "labial", و: "labial-w",
  // الأصوات الأسنانية
  ت: "dental", د: "dental", ط: "dental-emp",
  ذ: "interdental", ث: "interdental", ظ: "interdental-emp",
  // الأصوات اللثوية
  ن: "alveolar-n", ل: "alveolar-l", ر: "alveolar-r",
  س: "sibilant", ز: "sibilant", ص: "sibilant-emp",
  // الأصوات الحنكية
  ج: "palatal", ش: "palatal-sh", ي: "palatal-y",
  // الأصوات الطبقية
  ك: "velar", خ: "velar-fric", غ: "velar-uvular",
  ق: "uvular",
  // الأصوات الحلقية
  ع: "pharyngeal", ح: "pharyngeal-h",
  // الأصوات الحنجرية
  ه: "glottal-h", ء: "glottal-stop", ا: "glottal-a",
  // الأصوات المطبقة
  ض: "emphatic-d",
};

/* جدول تحويل المقاطع إلى موراء */
const MORAVALUES: Record<Syllable["pattern"], number> = {
  cv: 1,
  cvv: 2,
  cvc: 2,
  cvvc: 3,
};

/* وزن المقطع */
const MORAWEIGHTMAP: Record<Syllable["pattern"], MoraWeight> = {
  cv: "light",
  cvv: "heavy",
  cvc: "heavy",
  cvvc: "superheavy",
};

// ─── تطبيع النص العربي ──────────────────────────────────────────────────────
export const normalizeArabic = (text: string): string =>
  text
    .replace(/[أإآ]/g, "ا")
    .replace(/[ىئ]/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ة/g, "ه")
    .replace(/[ًٌٍَُِّْ]/g, "") // إزالة التشكيل للمعالجة الأساسية
    .trim();

// ─── استخراج التشكيل إذا وُجد ───────────────────────────────────────────────
const extractDiacritics = (text: string): string =>
  text.replace(/[^\u064B-\u0652]/g, "");

// ─── استخراج الكلمة الأخيرة من البار ────────────────────────────────────────
const extractFinalWord = (barText: string): string => {
  const cleaned = barText.trim().replace(/[،؛:.!?،؟]+$/, "");
  const words = cleaned.split(/\s+/);
  return words[words.length - 1] ?? "";
};

// ─── استخراج الروي من الكلمة الأخيرة ────────────────────────────────────────
const extractRhymeCore = (word: string): string => {
  const normalized = normalizeArabic(word);
  if (normalized.length === 0) return "";

  // الروي هو آخر صامت في الكلمة + ما قبله من حركة أو مد
  // نأخذ آخر 3-4 أحرف كنواة للقافية
  const core = normalized.slice(-Math.min(4, normalized.length));
  return core;
};

// ─── تحديد حرف الروي (الصامت الجوهري للقافية) ───────────────────────────────
const extractRhymeConsonant = (word: string): string => {
  const normalized = normalizeArabic(word);
  // إيجاد آخر صامت (غير الهاء في نهاية المؤنث والألف الزائدة)
  const withoutSuffix = normalized.replace(/[هاي]$/, "");
  return withoutSuffix.slice(-1);
};

// ─── تحديد عائلة القافية ─────────────────────────────────────────────────────
export const extractRhymeFamily = (rhymeConsonant: string): string =>
  RHYMEFAMILYMAP[rhymeConsonant] ?? "unknown";

// ─── اكتشاف القوافي الداخلية ─────────────────────────────────────────────────
const detectInternalRhymes = (
  barText: string,
  endRhymeCore: string,
): InternalRhyme[] => {
  const words = barText.trim().split(/\s+/);
  const endIndex = words.length - 1;
  const internalRhymes: InternalRhyme[] = [];

  for (let i = 0; i < endIndex - 1; i++) {
    const word = words[i];
    const core = extractRhymeCore(word);

    // مطابقة تامة مع القافية الختامية
    if (core === endRhymeCore && word.length >= 2) {
      internalRhymes.push({
        word,
        position: i,
        matchesEndRhyme: true,
        rhymeCore: core,
      });
      continue;
    }

    // مطابقة جزئية (آخر حرفان)
    if (
      core.slice(-2) === endRhymeCore.slice(-2) &&
      core !== endRhymeCore &&
      word.length >= 3
    ) {
      internalRhymes.push({
        word,
        position: i,
        matchesEndRhyme: false,
        rhymeCore: core,
      });
    }
  }

  return internalRhymes;
};

// ─── تقطيع المقاطع الصوتية ───────────────────────────────────────────────────
/*
  تقطيع مبسّط للمقاطع يعتمد على بنية الكلمة العربية
  يستخدم التشكيل إذا توفر، وإلا يعتمد على أنماط الكلمات الشائعة
 */
const segmentSyllables = (barText: string): Syllable[] => {
  const syllables: Syllable[] = [];
  const words = barText
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  let position = 0;

  for (const word of words) {
    const hasDiacritics = extractDiacritics(word).length > 0;
    const wordSyllables = hasDiacritics
      ? segmentWithDiacritics(word, position)
      : segmentWithoutDiacritics(word, position);

    syllables.push(...wordSyllables);
    position += wordSyllables.length;
  }

  return syllables;
};

/* تقطيع الكلمة ذات التشكيل إلى مقاطع */
const segmentWithDiacritics = (
  word: string,
  startPos: number,
): Syllable[] => {
  const syllables: Syllable[] = [];
  let i = 0;
  let pos = startPos;

  while (i < word.length) {
    const char = word[i];

    // تجاوز الأحرف غير العربية
    if (!char.match(/[\u0600-\u06FF]/)) {
      i++;
      continue;
    }

    const nextChar = word[i + 1] ?? "";
    const charAfterNext = word[i + 2] ?? "";

    // فتحة + حرف = مقطع خفيف (CV)
    if (nextChar === "\u064E" || (!nextChar.match(/[\u064B-\u0652]/) && nextChar)) {
      // تحقق من مدّ بعد الفتحة
      const afterVowel = word[i + 2] ?? "";
      if (nextChar === "\u064E" && afterVowel === "ا") {
        // CV + ا = مقطع ثقيل CVV
        syllables.push(buildSyllable(word.slice(i, i + 3), "cvv", pos));
        i += 3;
      } else if (nextChar === "\u064F" && afterVowel === "و") {
        syllables.push(buildSyllable(word.slice(i, i + 3), "cvv", pos));
        i += 3;
      } else if (nextChar === "\u0650" && afterVowel === "ي") {
        syllables.push(buildSyllable(word.slice(i, i + 3), "cvv", pos));
        i += 3;
      } else {
        syllables.push(buildSyllable(word.slice(i, i + 2), "cv", pos));
        i += 2;
      }
      pos++;
      continue;
    }

    // سكون = نهاية مقطع (CVC أو CVVC)
    if (nextChar === "\u0652") {
      const prevSyl = syllables[syllables.length - 1];
      if (prevSyl?.pattern === "cvv") {
        // CVVC
        const updated = buildSyllable(prevSyl.text + char, "cvvc", prevSyl.position);
        syllables[syllables.length - 1] = updated;
      } else if (prevSyl) {
        // CVC
        const updated = buildSyllable(prevSyl.text + char, "cvc", prevSyl.position);
        syllables[syllables.length - 1] = updated;
      }
      i += 2;
      continue;
    }

    i++;
  }

  return syllables.length > 0
    ? syllables
    : estimateSyllablesFromWordShape(word, startPos);
};

/* تقدير المقاطع من شكل الكلمة (بدون تشكيل) */
const segmentWithoutDiacritics = (
  word: string,
  startPos: number,
): Syllable[] => estimateSyllablesFromWordShape(word, startPos);

/* تقدير المقاطع من شكل الكلمة العربية (نسخة مطورة لزيادة الدقة العروضية) */
const estimateSyllablesFromWordShape = (
  word: string,
  startPos: number,
): Syllable[] => {
  const syllables: Syllable[] = [];
  const normalized = normalizeArabic(word);

  if (normalized.length === 0) return [];

  let pos = startPos;
  let i = 0;

  while (i < normalized.length) {
    const char = normalized[i];
    const next = normalized[i + 1] ?? "";
    const afterNext = normalized[i + 2] ?? "";

    // حالة المد (CVV): صامت + (ا/و/ي)
    if (!"اوي".includes(char) && "اوي".includes(next)) {
      syllables.push(buildSyllable(char + next, "cvv", pos));
      i += 2;
      pos++;
      continue;
    }

    // حالة الصامت المنفرد (CV): نفترض وجود حركة قصيرة
    if (!"اوي".includes(char)) {
      // إذا كان الصامت متبوعاً بصامت آخر في نهاية الكلمة، نعتبره CVC (ثقيل)
      if (next && !"اوي".includes(next) && !afterNext) {
        syllables.push(buildSyllable(char + next, "cvc", pos));
        i += 2;
      } else {
        syllables.push(buildSyllable(char, "cv", pos));
        i++;
      }
      pos++;
      continue;
    }

    // الحروف الهوائية في بداية الكلمة (مثل الـ التعريف)
    if (i === 0 && "اوي".includes(char)) {
      syllables.push(buildSyllable(char, "cv", pos));
      i++;
      pos++;
      continue;
    }

    i++;
  }

  if (syllables.length === 0) {
    syllables.push(buildSyllable(normalized, "cv", startPos));
  }

  return syllables;
};

const buildSyllable = (
  text: string,
  pattern: Syllable["pattern"],
  position: number,
): Syllable => ({
  text,
  pattern,
  mora: MORAWEIGHTMAP[pattern],
  stressed: pattern !== "cv", // المقاطع الثقيلة منبورة بشكل عام
  position,
});

// ─── حساب نمط النبر ──────────────────────────────────────────────────────────
const computeStressPattern = (syllables: Syllable[]): string =>
  syllables.map((s) => (s.stressed ? "S" : "U")).join("");

// ─── مسافة هامينغ لمقارنة أنماط النبر ───────────────────────────────────────
export const hammingDistance = (a: string, b: string): number => {
  const len = Math.min(a.length, b.length);
  let dist = Math.abs(a.length - b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
};

// ─── تحديد البحر من نمط التفعيلات ────────────────────────────────────────────
const inferMeterFromSyllablePattern = (
  syllablePattern: string,
  footCount: number,
): ArabicMeter => {
  // أنماط دقيقة للبحور الشعرية (منظومة الخليل)
  const patterns: Array<{ pattern: RegExp; meter: ArabicMeter }> = [
    { pattern: /^(LHH|LHHH)+$/, meter: "طويل" },
    { pattern: /^(HLH|HLHH)+$/, meter: "بسيط" },
    { pattern: /^(LLHL)+$/, meter: "وافر" },
    { pattern: /^(LLLHL|HHHL)+$/, meter: "كامل" },
    { pattern: /^(HLHH)+$/, meter: "رمل" },
    { pattern: /^(HHHL)+$/, meter: "رجز" },
    { pattern: /^(LHH)+$/, meter: "هزج" },
    { pattern: /^(HLH|HHL)+$/, meter: "سريع" },
    { pattern: /^(HLHH|HLHL)+$/, meter: "خفيف" },
    { pattern: /^(LHL)+$/, meter: "متقارب" },
    { pattern: /^(HLL)+$/, meter: "متدارك" },
  ];

  for (const { pattern, meter } of patterns) {
    if (pattern.test(syllablePattern)) return meter;
  }

  return footCount <= 2 ? "free" : "unknown";
};

// ─── المحلل الصوتي العروضي الرئيسي ──────────────────────────────────────────
export const analyzeBarPhoneticsAndProsody = (bar: {
  id: string;
  text: string;
  fingerprintCode?: string;
}): BarPhoneticProfile => {
  const syllables = segmentSyllables(bar.text);
  const finalWord = extractFinalWord(bar.text);
  const rhymeCore = extractRhymeCore(finalWord);
  const rhymeConsonant = extractRhymeConsonant(finalWord);

  const totalMoras = syllables.reduce(
    (sum, s) => sum + MORAVALUES[s.pattern],
    0,
  );
  const heavyCount = syllables.filter(
    (s) => s.mora === "heavy" || s.mora === "superheavy",
  ).length;
  const lightCount = syllables.filter((s) => s.mora === "light").length;

  const syllablePattern = syllables
    .map((s) =>
      s.mora === "superheavy" ? "SH" : s.mora === "heavy" ? "H" : "L",
    )
    .join("");

  const footCount = Math.max(1, Math.round(syllables.length / 3));
  const dominantFoot = inferDominantFoot(syllablePattern, footCount);
  const meter = inferMeterFromSyllablePattern(syllablePattern, footCount);
  const stressPattern = computeStressPattern(syllables);

  const rhythmicDensity =
    syllables.length > 0 ? heavyCount / syllables.length : 0;

  // حساب انتظام الإيقاع عبر تناوب H/L
  const regularityIndex = computeRegularityIndex(syllables);

  const rhymeSignature: RhymeSignature = {
    finalWord,
    rhymeCore,
    rhymeConsonant,
    rhymeVowel: extractRhymeVowel(finalWord),
    rhymeFamily: extractRhymeFamily(rhymeConsonant),
    rhymeType: "perfect", // يُعاد تحديده عند المقارنة
    internalRhymes: detectInternalRhymes(bar.text, rhymeCore),
    rhymeSyllables: syllables.slice(-Math.min(2, syllables.length)),
  };

  const prosodicSignature: ProsodicSignature = {
    dominantFoot,
    footCount,
    meter,
    totalSyllables: syllables.length,
    heavySyllables: heavyCount,
    lightSyllables: lightCount,
    totalMoras,
    rhythmicDensity,
    stressPattern,
    regularityIndex,
    syllablePattern,
  };

  return {
    barId: bar.id,
    rhymeSignature,
    prosodicSignature,
    matchScore: 0,
    paramScores: {} as Record<SingleFilterParam, number>,
    satisfiedParams: [],
    partialParams: [],
  };
};

const extractRhymeVowel = (word: string): string => {
  const vowels = word.match(/[\u064E\u064F\u0650]/g);
  return vowels ? vowels[vowels.length - 1] : "";
};

const inferDominantFoot = (
  syllablePattern: string,
  footCount: number,
): ArabicFoot => {
  const footPatterns: Array<{ pattern: string; foot: ArabicFoot }> = [
    { pattern: "LHHL", foot: "فَعُولُن" },
    { pattern: "LHHHL", foot: "مَفَاعِيلُن" },
    { pattern: "HLHL", foot: "فَاعِلاتُن" },
    { pattern: "HHHL", foot: "مُسْتَفْعِلُن" },
    { pattern: "LHHL", foot: "مَفَاعِلُن" },
    { pattern: "HHL", foot: "فَاعِلُن" },
    { pattern: "LLLHL", foot: "مُتَفَاعِلُن" },
    { pattern: "LLL", foot: "مُفَاعَلَتُن" },
  ];

  // قسّم النمط إلى وحدات من 3-5 أحرف
  const unitSize = Math.ceil(syllablePattern.length / Math.max(footCount, 1));
  const firstUnit = syllablePattern.slice(0, Math.min(unitSize, 5));

  for (const { pattern, foot } of footPatterns) {
    if (firstUnit.startsWith(pattern.slice(0, Math.min(pattern.length, 3)))) {
      return foot;
    }
  }
  return "unknown";
};

const computeRegularityIndex = (syllables: Syllable[]): number => {
  if (syllables.length < 2) return 1;

  let alternations = 0;
  for (let i = 1; i < syllables.length; i++) {
    if (syllables[i].mora !== syllables[i - 1].mora) alternations++;
  }
  return alternations / (syllables.length - 1);
};
