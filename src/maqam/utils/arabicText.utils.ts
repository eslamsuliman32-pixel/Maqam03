const ARABICDIACRITICS = /[\u064B-\u065F\u0670]/g;
const TATWEEL = /\u0640/g;

export function normalizeArabic(input: string): string {
  return input
    .replace(ARABICDIACRITICS, "")
    .replace(TATWEEL, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeArabic(input: string): string[] {
  const clean = normalizeArabic(input);
  return clean
    .split(/[\s،,.!?؛:|]+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

export function getArabicLetters(input: string): string[] {
  return normalizeArabic(input)
    .replace(/[^\u0600-\u06FF]/g, "")
    .split("");
}

export function estimateArabicSyllables(word: string): number {
  const normalized = normalizeArabic(word);

  if (!normalized) return 0;

  const longVowels = normalized.match(/[اوي]/g)?.length ?? 0;
  const consonantClusters = normalized.length - longVowels;

  return Math.max(1, Math.round(longVowels + consonantClusters / 3));
}

/**
 * Splits a word into its phonetic syllables (simplified heuristic)
 */
export function extractSyllables(word: string): string[] {
  const normalized = normalizeArabic(word);
  if (!normalized) return [];

  // Simplified: treat long vowels and diphthongs as syllable centers
  // Regex looks for consonants followed by optional long vowels
  const matches = normalized.match(/[^اوي]*[اوي]*/g);
  return matches ? matches.filter(Boolean) : [normalized];
}

export function getRhymeTail(text: string, tailLength = 3): string {
  const words = tokenizeArabic(text);
  const last = words.at(-1) ?? "";
  const letters = getArabicLetters(last);

  return letters.slice(Math.max(0, letters.length - tailLength)).join("");
}

export function charFrequency(input: string): Record<string, number> {
  const freq: Record<string, number> = {};

  for (const char of getArabicLetters(input)) {
    freq[char] = (freq[char] ?? 0) + 1;
  }

  return freq;
}

export function lexicalOverlap(a: string, b: string): number {
  const aTokens = new Set(tokenizeArabic(a));
  const bTokens = new Set(tokenizeArabic(b));

  if (!aTokens.size || !bTokens.size) return 0;

  let shared = 0;

  for (const token of aTokens) {
    if (bTokens.has(token)) shared++;
  }

  return shared / Math.max(aTokens.size, bTokens.size);
}

export function endingSoundSimilarity(a: string, b: string): number {
  const aTail = getRhymeTail(a, 3);
  const bTail = getRhymeTail(b, 3);

  if (!aTail || !bTail) return 0;
  if (aTail === bTail) return 1;

  const min = Math.min(aTail.length, bTail.length);
  let matches = 0;

  for (let i = 0; i < min; i++) {
    if (aTail[aTail.length - 1 - i] === bTail[bTail.length - 1 - i]) {
      matches++;
    }
  }

  return matches / 3;
}
