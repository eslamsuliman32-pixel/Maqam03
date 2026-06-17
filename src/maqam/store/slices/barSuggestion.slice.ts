import type {
  BarCandidate,
  BarMatchResult,
  BeatWindowContext,
} from "../../engines/barBeatMatcher.engine";
import {
  suggestBarsFromBeat,
  extractBeatWindowFromAnalysis,
} from "../../engines/barBeatMatcher.engine";

export interface BarSuggestionSlice {
  suggestedBars: BarMatchResult[];
  isSuggestingBars: boolean;
  activeBeatWindowContext: BeatWindowContext | null;
  barSuggestionError: string | null;

  triggerBarSuggestion: (
    bars: BarCandidate[],
    barIndex?: number
  ) => Promise<void>;
  clearBarSuggestions: () => void;
  setActiveBeatWindowContext: (ctx: BeatWindowContext | null) => void;
}

export const createBarSuggestionSlice = (
  set: (
    partial: Partial<BarSuggestionSlice>,
    replace?: boolean
  ) => void,
  get: () => { audioBeatAnalysis: unknown }
): BarSuggestionSlice => ({
  suggestedBars: [],
  isSuggestingBars: false,
  activeBeatWindowContext: null,
  barSuggestionError: null,

  triggerBarSuggestion: async (bars, barIndex = 0) => {
    const analysis = get().audioBeatAnalysis;

    if (!analysis) {
      set({
        barSuggestionError:
          "لا يوجد تحليل بيت متاح — ارفع ملف إنسترومنتال أولاً.",
        isSuggestingBars: false,
      });
      return;
    }

    set({ isSuggestingBars: true, barSuggestionError: null });

    try {
      // نُجري الحساب في microtask لتجنب blocking UI
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          const beatAnalysis = analysis as Parameters<
            typeof extractBeatWindowFromAnalysis
          >[0];

          const beatWindow = extractBeatWindowFromAnalysis(
            beatAnalysis,
            barIndex
          );

          const results = suggestBarsFromBeat({
            bars,
            beatWindow,
            topN: 12,
          });

          set({
            suggestedBars: results,
            activeBeatWindowContext: beatWindow,
            isSuggestingBars: false,
          });

          resolve();
        }, 0);
      });
    } catch (err) {
      set({
        barSuggestionError:
          err instanceof Error ? err.message : "خطأ غير متوقع",
        isSuggestingBars: false,
      });
    }
  },

  clearBarSuggestions: () =>
    set({
      suggestedBars: [],
      isSuggestingBars: false,
      activeBeatWindowContext: null,
      barSuggestionError: null,
    }),

  setActiveBeatWindowContext: (ctx) =>
    set({ activeBeatWindowContext: ctx }),
});
