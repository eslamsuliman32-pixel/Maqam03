// ═══════════════════════════════════════════════════════════════
// MAQAM RAP | خدمة الذكاء الاصطناعي للتدفق (Client PROXY)
// تحويل استدعاءات الـ Client لطلبات خادم مؤمّنة في المنصة
// ═══════════════════════════════════════════════════════════════

import type { Bar, FlowPatternType, AssonanceAnalysis } from '../types/flow.types';

// استخراج JSON آمن من نص استجابة الخادم
const extractJSON = <T>(text: string): T => {
  const cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('لم يُعثر على JSON صالح في استجابة السيرفر');

  return JSON.parse(jsonMatch[0]) as T;
};

// ────────────────────────────────────────────────────────────────
// 🔹 تحليل نمط التدفق الكامل (عبر الـ API الخاص بـ Express)
// ────────────────────────────────────────────────────────────────
export const analyzeFlowPattern = async (
  bars: Bar[],
  currentPattern: FlowPatternType,
): Promise<AssonanceAnalysis> => {
  const filledBars = bars.filter(b => b.content.trim());
  if (filledBars.length < 2) {
    return createDefaultAnalysis(currentPattern);
  }

  const response = await fetch('/api/maqam/flow-ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bars: filledBars, currentPattern }),
  });

  if (!response.ok) {
    throw new Error('فشل الاتصال بالخادم لتحليل الفلو؛ يرجى المحاولة لاحقاً');
  }

  const data = await response.json();
  const rawText = data.result || '{}';
  const parsed = extractJSON<AnyAnalysisBody>(rawText);

  return {
    score: Math.max(0, Math.min(100, parsed.score ?? 0)),
    detectedPattern: parsed.detectedPattern ?? currentPattern,
    rhymingPairs: parsed.rhymingPairs ?? [],
    weakBars: parsed.weakBars ?? [],
    suggestions: parsed.suggestions ?? [],
    phoneticBends: parsed.phoneticBends ?? [],
    overallQuality: parsed.overallQuality ?? 'average',
  };
};

// ────────────────────────────────────────────────────────────────
// 🔹 اقتراح كلمات قافية (عبر الـ API الخاص بـ Express)
// ────────────────────────────────────────────────────────────────
export const suggestRhymeWords = async (
  anchorWord: string,
  pattern: FlowPatternType,
  context: string = '',
  count = 8,
): Promise<string[]> => {
  const response = await fetch('/api/maqam/flow-ai/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anchorWord, pattern, context, count }),
  });

  if (!response.ok) {
    throw new Error('فشل جلب اقتراحات القافية من الخادم');
  }

  const data = await response.json();
  const rawText = data.result || '[]';
  
  const cleaned = rawText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!arrMatch) return [];

  const parsed = JSON.parse(arrMatch[0]) as string[];
  return Array.isArray(parsed) ? parsed.slice(0, count) : [];
};

// ────────────────────────────────────────────────────────────────
// 🔹 إكمال بار ناقص (عبر الـ API الخاص بـ Express)
// ────────────────────────────────────────────────────────────────
export const completeBar = async (
  partialContent: string,
  anchorWord: string,
  pattern: FlowPatternType,
  previousBars: string[],
): Promise<string> => {
  const response = await fetch('/api/maqam/flow-ai/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ partialContent, anchorWord, pattern, previousBars }),
  });

  if (!response.ok) {
    throw new Error('فشل إكمال البار التلقائي بالخادم');
  }

  const data = await response.json();
  return (data.result || '').trim();
};

// ────────────────────────────────────────────────────────────────
// تحليل افتراضي للحالات الفارغة
// ────────────────────────────────────────────────────────────────
const createDefaultAnalysis = (pattern: FlowPatternType): AssonanceAnalysis => ({
  score: 0,
  detectedPattern: pattern,
  rhymingPairs: [],
  weakBars: [],
  suggestions: ['أضف محتوى للبارات أولاً (بارين كحد أدنى) لتفعيل التحليل الجنائي الصوتي'],
  phoneticBends: [],
  overallQuality: 'average',
});

interface AnyAnalysisBody {
  score?: number;
  detectedPattern?: FlowPatternType;
  rhymingPairs?: Array<[string, string, number]>;
  weakBars?: string[];
  suggestions?: string[];
  phoneticBends?: string[];
  overallQuality?: 'excellent' | 'good' | 'average' | 'weak';
}
