// ═══════════════════════════════════════════════════════════════
// MAQAM RAP | منسّق القوالب
// إنشاء وإدارة البارات بناءً على النمط المختار
// ═══════════════════════════════════════════════════════════════

import type {
  Bar,
  FlowPatternType,
  PatternConfig,
  PhoneticTail,
  FlowTemplate,
  BarMetadata,
} from '../types/flow.types';
import { analyzePhoneticTail } from './phoneticEngine';

// ────────────────────────────────────────────────────────────────
// إعدادات الأنماط الكاملة
// ────────────────────────────────────────────────────────────────
export const PATTERN_CONFIGS: Record<FlowPatternType, PatternConfig> = {
  AAAA: {
    id: 'AAAA',
    nameAr: 'الهجومي الكامل',
    nameEn: 'Full Assault',
    description: 'قافية واحدة تتكرر في كل البارات — أقصى حدة وتركيز',
    bpmRange: [140, 185],
    barCount: 4,
    syllableTarget: [8, 12],
    requiredAssonance: true,
    adLibPlacement: 'end',
    intensityCurve: [3, 4, 4, 5],
    color: '#FF4444',
    icon: '⚡',
  },
  AABB: {
    id: 'AABB',
    nameAr: 'الزوجي السردي',
    nameEn: 'Paired Narrative',
    description: 'أزواج من القوافي — يناسب السرد القصصي المتدفق',
    bpmRange: [100, 140],
    barCount: 4,
    syllableTarget: [10, 14],
    requiredAssonance: true,
    adLibPlacement: 'mid',
    intensityCurve: [2, 3, 3, 4],
    color: '#4488FF',
    icon: '🔵',
  },
  ABAB: {
    id: 'ABAB',
    nameAr: 'المتقاطع الكلاسيكي',
    nameEn: 'Classic Cross',
    description: 'تقاطع القوافي — التوازن بين الحدة والسرد',
    bpmRange: [120, 160],
    barCount: 4,
    syllableTarget: [8, 12],
    requiredAssonance: false,
    adLibPlacement: 'random',
    intensityCurve: [3, 2, 4, 3],
    color: '#44FF88',
    icon: '🔀',
  },
  ABBA: {
    id: 'ABBA',
    nameAr: 'العكسي التوسيعي',
    nameEn: 'Reverse Embrace',
    description: 'تطويق صوتي — يُلفّ الفكرة من الخارج للداخل',
    bpmRange: [90, 130],
    barCount: 4,
    syllableTarget: [9, 13],
    requiredAssonance: false,
    adLibPlacement: 'none',
    intensityCurve: [2, 3, 3, 2],
    color: '#FF88CC',
    icon: '🔄',
  },
  STACCATO: {
    id: 'STACCATO',
    nameAr: 'المتقطع النبضي',
    nameEn: 'Pulse Staccato',
    description: 'توقفات مكثفة بين المقاطع — يُحدث تأثير الضربات المتتالية',
    bpmRange: [160, 200],
    barCount: 6,
    syllableTarget: [4, 8],
    requiredAssonance: false,
    adLibPlacement: 'mid',
    intensityCurve: [5, 5, 4, 5, 4, 5],
    color: '#FF8800',
    icon: '💥',
  },
  PHONETIC_BEND: {
    id: 'PHONETIC_BEND',
    nameAr: 'الانثناء الصوتي',
    nameEn: 'Phonetic Bend',
    description: 'مزج إيقاعي عربي-إنجليزي — حرية صوتية كاملة',
    bpmRange: [130, 170],
    barCount: 4,
    syllableTarget: [8, 16],
    requiredAssonance: false,
    adLibPlacement: 'random',
    intensityCurve: [3, 4, 5, 4],
    color: '#AA44FF',
    icon: '🌀',
  },
  FREE_FLOW: {
    id: 'FREE_FLOW',
    nameAr: 'التدفق الحر',
    nameEn: 'Free Flow',
    description: 'لا قيود — الإبداع بلا حدود صرفية أو عروضية',
    bpmRange: [80, 180],
    barCount: 4,
    syllableTarget: [4, 20],
    requiredAssonance: false,
    adLibPlacement: 'none',
    intensityCurve: [1, 2, 3, 4],
    color: '#888888',
    icon: '🌊',
  },
  TRIPLET: {
    id: 'TRIPLET',
    nameAr: 'الثلاثي الإيقاعي',
    nameEn: 'Triplet Rush',
    description: 'ثلاثة مقاطع لكل نبضة — الإلقاء المكثف المعقد',
    bpmRange: [120, 160],
    barCount: 4,
    syllableTarget: [12, 18],
    requiredAssonance: true,
    adLibPlacement: 'end',
    intensityCurve: [4, 4, 5, 5],
    color: '#FFDD00',
    icon: '🎯',
  },
};

// ────────────────────────────────────────────────────────────────
// إنشاء بار فارغ
// ────────────────────────────────────────────────────────────────
const createEmptyBar = (
  index: number,
  config: PatternConfig,
  anchorRhyme: PhoneticTail,
  isRhyming: boolean,
): Bar => {
  const now = Date.now();
  const metadata: BarMetadata = {
    createdAt: now,
    lastModified: now,
    editCount: 0,
    aiSuggested: false,
  };

  const restDuration = index === config.barCount - 1 ? 800 :
    config.id === 'STACCATO' ? 600 : 200;

  return {
    id: `bar-${Date.now()}-${index}`,
    content: '',
    syllableCount: 0,
    syllableUnits: [],
    phoneticTail: isRhyming ? anchorRhyme : createVariantTail(anchorRhyme, index),
    adLib: null,
    restDuration,
    intensity: (config.intensityCurve[index] ?? 3) as Bar['intensity'],
    rhymeQuality: 'none',
    isLocked: false,
    metadata,
  };
};

// إنشاء ذيل صوتي متغاير (للأنماط غير AAAA)
const createVariantTail = (anchor: PhoneticTail, index: number): PhoneticTail => {
  const vowels: PhoneticTail['vowel'][] = ['fatha', 'kasra', 'damma', 'sukun', 'madd'];
  const variantVowel = vowels[index % vowels.length] ?? anchor.vowel;
  return {
    ...anchor,
    vowel: variantVowel,
    phoneticHash: `variant-${index}-${anchor.phoneticHash}`,
  };
};

// ────────────────────────────────────────────────────────────────
// 🔹 توليد المخطط الأساسي (Blueprint Generator)
// ────────────────────────────────────────────────────────────────
export const generateBlueprint = (
  pattern: FlowPatternType,
  anchorRhyme: PhoneticTail,
): Bar[] => {
  const config = PATTERN_CONFIGS[pattern];

  // تحديد أي البارات تتشارك قافية الـ anchor
  const rhymingPattern = getRhymingPattern(pattern, config.barCount);

  return Array.from({ length: config.barCount }, (_, i) =>
    createEmptyBar(i, config, anchorRhyme, rhymingPattern[i] === 'A')
  );
};

// خريطة مواضع القافية لكل نمط
const getRhymingPattern = (
  pattern: FlowPatternType,
  barCount: number
): ('A' | 'B')[] => {
  const patterns: Record<string, ('A' | 'B')[]> = {
    AAAA: ['A', 'A', 'A', 'A'],
    AABB: ['A', 'A', 'B', 'B'],
    ABAB: ['A', 'B', 'A', 'B'],
    ABBA: ['A', 'B', 'B', 'A'],
    STACCATO: ['A', 'B', 'A', 'B', 'A', 'A'],
    PHONETIC_BEND: ['A', 'B', 'A', 'B'],
    FREE_FLOW: ['A', 'B', 'B', 'A'],
    TRIPLET: ['A', 'A', 'A', 'A'],
  };
  return (patterns[pattern] ?? Array(barCount).fill('A')).slice(0, barCount);
};

// ────────────────────────────────────────────────────────────────
// 🔹 إنشاء قالب تدفق كامل
// ────────────────────────────────────────────────────────────────
export const createFlowTemplate = (
  pattern: FlowPatternType,
  anchorWord: string,
  title: string = '',
): FlowTemplate => {
  const anchorRhyme = analyzePhoneticTail(anchorWord);
  const config = PATTERN_CONFIGS[pattern];
  const bars = generateBlueprint(pattern, anchorRhyme);

  return {
    id: `template-${Date.now()}`,
    pattern,
    config,
    anchorRhyme,
    bars,
    createdAt: Date.now(),
    title: title || `${config.nameAr} — ${anchorWord}`,
    tags: [pattern, config.nameAr],
  };
};

// ────────────────────────────────────────────────────────────────
// 🔹 تحديث بار واحد وإعادة حساب قيمه
// ────────────────────────────────────────────────────────────────
export const updateBarInTemplate = (
  template: FlowTemplate,
  barId: string,
  content: string,
  syllableUnits: Bar['syllableUnits'],
): FlowTemplate => {
  const newTail = content.trim()
    ? analyzePhoneticTail(content.trim().split(' ').pop() ?? '')
    : template.anchorRhyme;

  const now = Date.now();
  const updatedBars = template.bars.map(bar => {
    if (bar.id !== barId) return bar;
    return {
      ...bar,
      content,
      syllableCount: syllableUnits.length,
      syllableUnits,
      phoneticTail: newTail,
      metadata: {
        ...bar.metadata,
        lastModified: now,
        editCount: bar.metadata.editCount + 1,
      },
    };
  });

  return { ...template, bars: updatedBars };
};
export default {
  PATTERN_CONFIGS,
  generateBlueprint,
  createFlowTemplate,
  updateBarInTemplate,
};
