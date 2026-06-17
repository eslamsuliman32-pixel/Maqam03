// src/services/writingEvaluator.ts

import { FlowBar, FlowEvaluation } from '../types/flowLabElite';

const estimateSyllablesArabic = (text: string) => {
  const clean = text.trim();

  if (!clean) return 0;

  const words = clean.split(/\s+/).filter(Boolean);

  return words.reduce((total, word) => {
    const normalized = word.replace(/[^\u0600-\u06FFa-zA-Z]/g, '');
    const estimated = Math.max(1, Math.ceil(normalized.length / 3.2));
    return total + estimated;
  }, 0);
};

export const evaluateWriting = (bars: FlowBar[]): FlowEvaluation => {
  const activeBars = bars.filter((bar) => bar.words && bar.words.trim().length > 0);

  if (activeBars.length === 0) {
    return {
      clarity: 0,
      coherence: 0,
      crowding: 0,
      impact: 0,
      notes: ['ابدأ بكتابة كلمات على البارات حتى تظهر نتيجة التقييم.'],
    };
  }

  let clarity = 70;
  let coherence = 70;
  let crowding = 20;
  let impact = 50;

  const notes: string[] = [];

  activeBars.forEach((bar) => {
    const syllables = estimateSyllablesArabic(bar.words);
    const wordsCount = bar.words.trim().split(/\s+/).length;

    if (bar.intensity === 'high' && syllables > 9) {
      crowding += 16;
      clarity -= 8;
      notes.push(`البار ${bar.index}: الآلة مزدحمة، والكلمات كثيرة. اختصر الجملة.`);
    }

    if (bar.intensity === 'low' && wordsCount <= 3) {
      impact += 8;
      coherence += 5;
      notes.push(`البار ${bar.index}: استخدام جيد للفراغ. مناسب للمد أو التوكيد.`);
    }

    if (bar.intensity === 'medium' && syllables >= 5 && syllables <= 10) {
      clarity += 5;
      coherence += 5;
    }

    if (/[اأإآىيه]$/.test(bar.words.trim())) {
      impact += 4;
    }
  });

  return {
    clarity: Math.max(0, Math.min(100, Math.round(clarity))),
    coherence: Math.max(0, Math.min(100, Math.round(coherence))),
    crowding: Math.max(0, Math.min(100, Math.round(crowding))),
    impact: Math.max(0, Math.min(100, Math.round(impact))),
    notes: notes.length ? notes.slice(0, 4) : ['الرصف جيد ومناسب للتدفق الحالي.'],
  };
};
