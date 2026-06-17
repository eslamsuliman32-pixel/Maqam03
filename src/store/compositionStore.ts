// ═══════════════════════════════════════════════════════════════
// MAQAM RAP | المخزن المركزي للتأليف (Zustand)
// حالة موحدة — لا تشتت بين المكونات وبأعلى معايير الأمان
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import type {
  FlowTemplate,
  Bar,
  FlowPatternType,
  AIAnalysisState,
  FlowState,
} from '../types/flow.types';
import {
  createFlowTemplate,
  PATTERN_CONFIGS,
  updateBarInTemplate,
} from '../services/templateOrchestrator';
import {
  extractSyllables,
  calculateGlobalAssonance,
} from '../services/phoneticEngine';
import {
  analyzeFlowPattern,
  suggestRhymeWords,
  completeBar,
} from '../services/flowAI.service';

// ────────────────────────────────────────────────────────────────
// تعريف الحالة الكاملة
// ────────────────────────────────────────────────────────────────
interface CompositionState {
  // ── الحالة الرئيسية ──
  flowState: FlowState;
  currentTemplate: FlowTemplate | null;
  bpm: number;
  selectedPatternId: FlowPatternType | null;
  anchorWord: string;

  // ── التحليل ──
  assonanceScore: number;
  aiState: AIAnalysisState;

  // ── واجهة المستخدم ──
  selectedBarId: string | null;
  isPatternSelectorOpen: boolean;
  showVisualization: boolean;

  // ── الإجراءات ──
  initializeTemplate: (pattern: FlowPatternType, anchorWord: string) => void;
  updateBarContent: (barId: string, content: string) => void;
  toggleBarLock: (barId: string) => void;
  setBarAdLib: (barId: string, adLib: string | null) => void;
  setBPM: (bpm: number) => void;
  setSelectedBar: (barId: string | null) => void;
  togglePatternSelector: () => void;
  toggleVisualization: () => void;

  // ── إجراءات الذكاء الاصطناعي ──
  analyzeWithAI: () => Promise<void>;
  fetchRhymeSuggestions: () => Promise<void>;
  aiCompleteBar: (barId: string) => Promise<void>;

  // ── التصفية والحساب ──
  resetComposition: () => void;
}

const EMPTY_ARRAY: any[] = [];

// ────────────────────────────────────────────────────────────────
// الحالة الابتدائية
// ────────────────────────────────────────────────────────────────
const initialAIState: AIAnalysisState = {
  isLoading: false,
  lastAnalysis: null,
  error: null,
  suggestedWords: [],
};

// ────────────────────────────────────────────────────────────────
// إنشاء المخزن
// ────────────────────────────────────────────────────────────────
export const useCompositionStore = create<CompositionState>()((set, get) => ({
  // ── الحالة الابتدائية ──
  flowState: 'idle',
  currentTemplate: null,
  bpm: 140,
  selectedPatternId: null,
  anchorWord: '',
  assonanceScore: 0,
  aiState: initialAIState,
  selectedBarId: null,
  isPatternSelectorOpen: false,
  showVisualization: true,

  // ────────────────────────────────────────────────────────────
  // 🔹 تهيئة القالب
  // ────────────────────────────────────────────────────────────
  initializeTemplate: (pattern, anchorWord) => {
    const template = createFlowTemplate(pattern, anchorWord);
    const config = PATTERN_CONFIGS[pattern];

    set({
      flowState: 'composing',
      currentTemplate: template,
      selectedPatternId: pattern,
      anchorWord,
      bpm: config.bpmRange[0],
      assonanceScore: 0,
      aiState: initialAIState,
      selectedBarId: null,
      isPatternSelectorOpen: false,
    });
  },

  // ────────────────────────────────────────────────────────────
  // 🔹 تحديث محتوى البار (العملية الأهم)
  // ────────────────────────────────────────────────────────────
  updateBarContent: (barId, content) => {
    const { currentTemplate } = get();
    if (!currentTemplate) return;

    const syllableUnits = extractSyllables(content);
    const updatedTemplate = updateBarInTemplate(
      currentTemplate,
      barId,
      content,
      syllableUnits,
    );

    // حساب نقاط السجع الإجمالية ورسم جودة القوافي
    const filledBars = updatedTemplate.bars.filter(b => b.content.trim());
    const tails = filledBars.map(b => b.phoneticTail);
    const newScore = calculateGlobalAssonance(tails);

    set({
      currentTemplate: updatedTemplate,
      assonanceScore: newScore,
    });
  },

  // ────────────────────────────────────────────────────────────
  // 🔹 قفل/فتح البار
  // ────────────────────────────────────────────────────────────
  toggleBarLock: (barId) => {
    const { currentTemplate } = get();
    if (!currentTemplate) return;

    const updatedBars = currentTemplate.bars.map(bar => {
      if (bar.id !== barId) return bar;
      return { ...bar, isLocked: !bar.isLocked };
    });

    set({
      currentTemplate: {
        ...currentTemplate,
        bars: updatedBars,
      },
    });
  },

  // ────────────────────────────────────────────────────────────
  // 🔹 تعيين الـ Ad-Lib
  // ────────────────────────────────────────────────────────────
  setBarAdLib: (barId, adLib) => {
    const { currentTemplate } = get();
    if (!currentTemplate) return;

    const updatedBars = currentTemplate.bars.map(bar => {
      if (bar.id !== barId) return bar;
      return { ...bar, adLib };
    });

    set({
      currentTemplate: {
        ...currentTemplate,
        bars: updatedBars,
      },
    });
  },

  // ── إجراءات بسيطة ──
  setBPM: (bpm) => set({ bpm: Math.max(60, Math.min(220, bpm)) }),
  setSelectedBar: (barId) => set({ selectedBarId: barId }),
  togglePatternSelector: () => set(state => ({
    isPatternSelectorOpen: !state.isPatternSelectorOpen,
  })),
  toggleVisualization: () => set(state => ({
    showVisualization: !state.showVisualization,
  })),

  // ────────────────────────────────────────────────────────────
  // 🔹 التحليل بالذكاء الاصطناعي
  // ────────────────────────────────────────────────────────────
  analyzeWithAI: async () => {
    const { currentTemplate, selectedPatternId } = get();
    if (!currentTemplate || !selectedPatternId) return;

    set(state => ({
      aiState: {
        ...state.aiState,
        isLoading: true,
        error: null,
      },
      flowState: 'analyzing',
    }));

    try {
      const analysis = await analyzeFlowPattern(
        currentTemplate.bars,
        selectedPatternId,
      );

      // ربط درجات القوافي المفصلية بالبارات
      const updatedBars = currentTemplate.bars.map((bar, idx) => {
        const isWeak = analysis.weakBars.includes(bar.id) || analysis.weakBars.includes(String(idx + 1));
        const matchedQuality = isWeak ? 'none' : 'perfect'; // default fallback mapping
        return {
          ...bar,
          rhymeQuality: matchedQuality as Bar['rhymeQuality'],
        };
      });

      set(state => ({
        currentTemplate: updatedBars.length ? { ...currentTemplate, bars: updatedBars } : currentTemplate,
        aiState: {
          ...state.aiState,
          isLoading: false,
          lastAnalysis: analysis,
        },
        assonanceScore: analysis.score,
        flowState: 'composing',
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'خطأ غير متوقع';
      set(state => ({
        aiState: {
          ...state.aiState,
          isLoading: false,
          error: errorMsg,
        },
        flowState: 'error',
      }));
    }
  },

  // ────────────────────────────────────────────────────────────
  // 🔹 جلب اقتраحات القافية
  // ────────────────────────────────────────────────────────────
  fetchRhymeSuggestions: async () => {
    const { anchorWord, selectedPatternId } = get();
    if (!anchorWord || !selectedPatternId) return;

    set(state => ({
      aiState: { ...state.aiState, isLoading: true }
    }));

    try {
      const words = await suggestRhymeWords(anchorWord, selectedPatternId);
      set(state => ({
        aiState: {
          ...state.aiState,
          suggestedWords: words,
          isLoading: false,
        }
      }));
    } catch (err: any) {
      set(state => ({
        aiState: {
          ...state.aiState,
          isLoading: false,
          error: err.message || 'خطأ في جلب الاقتراحات',
        }
      }));
    }
  },

  // ────────────────────────────────────────────────────────────
  // 🔹 إكمال البار بالذكاء الاصطناعي
  // ────────────────────────────────────────────────────────────
  aiCompleteBar: async (barId) => {
    const { currentTemplate, anchorWord, selectedPatternId } = get();
    if (!currentTemplate || !selectedPatternId) return;

    const bar = currentTemplate.bars.find(b => b.id === barId);
    if (!bar || bar.isLocked) return;

    set(state => ({
      aiState: { ...state.aiState, isLoading: true }
    }));

    try {
      const previousContent = currentTemplate.bars
        .filter(b => b.content.trim() && b.id !== barId)
        .map(b => b.content);

      const completed = await completeBar(
        bar.content,
        anchorWord,
        selectedPatternId,
        previousContent,
      );

      get().updateBarContent(barId, completed);
      set(state => ({
        aiState: { ...state.aiState, isLoading: false }
      }));
    } catch (err: any) {
      set(state => ({
        aiState: {
          ...state.aiState,
          isLoading: false,
          error: err.message || 'خطأ في الإكمال',
        }
      }));
    }
  },

  // ────────────────────────────────────────────────────────────
  // 🔹 إعادة التهيئة
  // ────────────────────────────────────────────────────────────
  resetComposition: () => {
    set({
      flowState: 'idle',
      currentTemplate: null,
      bpm: 140,
      selectedPatternId: null,
      anchorWord: '',
      assonanceScore: 0,
      aiState: initialAIState,
      selectedBarId: null,
      isPatternSelectorOpen: false,
    });
  },
}));

// ────────────────────────────────────────────────────────────────
// Selectors مُحسَّنة (تمنع إعادة الرسم غير الضرورية)
// ────────────────────────────────────────────────────────────────
export const compositionSelectors = {
  // حالة التدفق
  flowState: (s: CompositionState) => s.flowState,
  isComposing: (s: CompositionState) => s.flowState === 'composing',
  isAnalyzing: (s: CompositionState) => s.flowState === 'analyzing',

  // القالب والبارات
  bars: (s: CompositionState) => s.currentTemplate?.bars ?? EMPTY_ARRAY,
  barCount: (s: CompositionState) => s.currentTemplate?.bars.length ?? 0,
  currentPattern: (s: CompositionState) => s.selectedPatternId,
  patternConfig: (s: CompositionState) =>
    s.selectedPatternId ? PATTERN_CONFIGS[s.selectedPatternId] : null,

  // الإحصائيات
  assonanceScore: (s: CompositionState) => s.assonanceScore,
  syllableBalance: (s: CompositionState) =>
    s.currentTemplate?.bars.map(b => b.syllableCount) ?? EMPTY_ARRAY,
  filledBarsCount: (s: CompositionState) =>
    s.currentTemplate?.bars.filter(b => b.content.trim()).length ?? 0,

  // التحقق من الصحة
  isFlowValid: (s: CompositionState) => {
    if (!s.currentTemplate) return false;
    const config = PATTERN_CONFIGS[s.currentTemplate.pattern];
    const [min, max] = config.syllableTarget;
    return s.currentTemplate.bars.every(
      b => !b.content.trim() || (b.syllableCount >= min && b.syllableCount <= max)
    );
  },

  // الذكاء الاصطناعي
  aiState: (s: CompositionState) => s.aiState,
  lastAnalysis: (s: CompositionState) => s.aiState.lastAnalysis,
  suggestedWords: (s: CompositionState) => s.aiState.suggestedWords,

  // واجهة المستخدم
  selectedBarId: (s: CompositionState) => s.selectedBarId,
  bpm: (s: CompositionState) => s.bpm,
  anchorWord: (s: CompositionState) => s.anchorWord,
  showVisualization: (s: CompositionState) => s.showVisualization,
};
export default useCompositionStore;
