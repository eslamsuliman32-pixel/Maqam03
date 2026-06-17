import type { BarInput, MaqamAnalysisResult, PhoneticProfile } from "../types/maqam.types";
import {
  charFrequency,
  estimateArabicSyllables,
  getArabicLetters,
  getRhymeTail,
  tokenizeArabic,
} from "../utils/arabicText.utils";
import { clampScore } from "../utils/scoring.utils";

const HEAVY = new Set(["ص", "ض", "ط", "ظ", "ق", "غ", "خ"]);
const GUTTURAL = new Set(["ع", "ح", "ه", "ء", "خ", "غ", "ق"]);
const SIBILANT = new Set(["س", "ش", "ص", "ز"]);
const NASAL = new Set(["م", "ن"]);
const PLOSIVE = new Set(["ب", "ت", "د", "ط", "ق", "ك", "ج"]);
const SMOOTH = new Set(["ل", "م", "ن", "ر", "و", "ي", "ا", "ه"]);
const LONGVOWELS = new Set(["ا", "و", "ي"]);

function density(letters: string[], set: Set<string>): number {
  if (!letters.length) return 0;

  const count = letters.filter((char) => set.has(char)).length;
  return count / letters.length;
}

function buildEnergyCurve(words: string[]): number[] {
  return words.map((word) => {
    const letters = getArabicLetters(word);

    const plosive = density(letters, PLOSIVE) * 35;
    const heavy = density(letters, HEAVY) * 35;
    const long = density(letters, LONGVOWELS) * 15;
    const length = Math.min(15, letters.length * 2);

    return clampScore(plosive + heavy + long + length);
  });
}

export function analyzeArabicPhonetics(bar: BarInput): MaqamAnalysisResult {
  const words = tokenizeArabic(bar.text);
  const letters = getArabicLetters(bar.text);
  const totalLetters = Math.max(1, letters.length);

  const freq = charFrequency(bar.text);
  const uniqueLetters = Object.keys(freq).length;

  const syllableEstimate = words.reduce(
    (sum, word) => sum + estimateArabicSyllables(word),
    0
  );

  const plosiveDensity = density(letters, PLOSIVE);
  const heavyDensity = density(letters, HEAVY);
  const smoothDensity = density(letters, SMOOTH);
  const gutturalDensity = density(letters, GUTTURAL);
  const sibilanceDensity = density(letters, SIBILANT);
  const nasalDensity = density(letters, NASAL);
  const elongationDensity = density(letters, LONGVOWELS);

  const profile: PhoneticProfile = {
    impact: clampScore((plosiveDensity * 0.45 + heavyDensity * 0.35 + gutturalDensity * 0.2) * 180),
    smoothness: clampScore((smoothDensity * 0.75 + elongationDensity * 0.25) * 140),
    heaviness: clampScore((heavyDensity * 0.7 + gutturalDensity * 0.3) * 180),
    breathLoad: clampScore((syllableEstimate / 18) * 100 + (totalLetters / 90) * 30),
    bounce: clampScore((plosiveDensity * 0.55 + nasalDensity * 0.2 + uniqueLetters / totalLetters) * 160),
    sibilance: clampScore(sibilanceDensity * 180),
    gutturalWeight: clampScore(gutturalDensity * 180),
    nasalDensity: clampScore(nasalDensity * 180),
    plosiveDensity: clampScore(plosiveDensity * 180),
    elongation: clampScore(elongationDensity * 160),
    rhymeTail: getRhymeTail(bar.text),
    syllableEstimate,
    energyCurve: buildEnergyCurve(words),
  };

  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (profile.breathLoad > 82) {
    warnings.push("حمل النفس مرتفع وقد يحتاج البار إلى وقفة أو تقصير.");
    suggestions.push("قسّم الجملة إلى وحدتين أو أضف Pause قبل الكلمة المحورية.");
  }

  if (profile.impact < 35 && bar.section !== "hook") {
    suggestions.push("أضف حروفًا انفجارية مثل ب/ت/ق/ك في موضع البنشلاين لزيادة الضربة.");
  }

  if (profile.smoothness < 35) {
    suggestions.push("استخدم مدودًا أو حروفًا لينة مثل ا/و/ي/ل/م لتنعيم الانسياب.");
  }

  return {
    barId: bar.id,
    text: bar.text,
    phonetics: profile,
    warnings,
    suggestions,
  };
}
