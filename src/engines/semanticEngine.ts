const SYNONYMMAP: Record<string, string[]> = {
  غياب:   ['بُعد', 'فراق', 'رحيل', 'وداع', 'ضياع', 'خسارة', 'تركتني', 'مشيت'],
  حب:     ['عشق', 'هوى', 'قلب', 'وله', 'غرام', 'شغف', 'حبيب'],
  ألم:    ['وجع', 'جرح', 'حرقة', 'مكسور', 'تعب', 'دمعة', 'بكاء'],
  حماس:  ['نار', 'قوة', 'صعود', 'وثبة', 'طموح', 'إصرار', 'تحدي'],
  خيانة: ['غدر', 'طعنة', 'وعود', 'كذب', 'خذلان', 'ظهر', 'صاحبي'],
  نجاح:  ['فوز', 'قمة', 'وصلت', 'حققت', 'إنجاز', 'ذهب', 'جائزة'],
  وحدة:  ['منفردي', 'لوحدي', 'ما فيش', 'فاضي', 'صمت', 'فراغ'],
};

export function buildSemanticVector(text: string): number[] {
  const words = tokenize(text);
  const vector = new Array(Object.keys(SYNONYMMAP).length).fill(0);
  const keys = Object.keys(SYNONYMMAP);

  keys.forEach((concept, idx) => {
    const family = [concept, ...(SYNONYMMAP[concept] ?? [])];
    const hits = words.filter(w => family.some(f => w.includes(f))).length;
    vector[idx] = hits / Math.max(words.length, 1);
  });

  return vector;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  const dot = a.reduce((sum, val, i) => sum + val * (b[i] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

export function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'التي', 'الذي',
    'كان', 'كانت', 'يكون', 'أن', 'إن', 'لا', 'ما', 'لم', 'قد', 'هو', 'هي',
  ]);
  return tokenize(text)
    .filter(w => w.length > 2 && !stopWords.has(w))
    .slice(0, 10);
}

export function calculateHookScore(text: string): number {
  const words = tokenize(text);
  let score = 0;

  const rhymeScore = detectRhymePattern(words);
  score += rhymeScore * 40;

  const lengthScore = words.length >= 8 && words.length <= 16 ? 30 : 10;
  score += lengthScore;

  const emotionalWords = ['قلبي', 'روحي', 'دمي', 'نار', 'وجع', 'حلم', 'وحدي'];
  const emotionHits = words.filter(w => emotionalWords.some(e => w.includes(e))).length;
  score += Math.min(emotionHits * 10, 30);

  return Math.min(Math.round(score), 100);
}

function tokenize(text: string): string[] {
  return text
    .replace(/[،,!?؟.]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function detectRhymePattern(words: string[]): number {
  if (words.length < 4) return 0;
  const endings = words.map(w => w.slice(-3));
  const freq = endings.reduce<Record<string, number>>((acc, e) => {
    acc[e] = (acc[e] ?? 0) + 1;
    return acc;
  }, {});
  const maxFreq = Math.max(...Object.values(freq));
  return maxFreq / words.length;
}
