// src/store/eliteFlowLabSlice.ts

import { create } from 'zustand';
import {
  EliteFlowLabState,
  LeadInstrumentId,
  UserMode,
  WritingGoal,
} from '../types/flowLabElite';
import { suggestLeadInstrument } from '../services/leadInstrumentSelector';
import { buildFlowBars } from '../services/flowBarBuilder';
import { evaluateWriting } from '../services/writingEvaluator';

export const useEliteFlowLabStore = create<EliteFlowLabState>((set, get) => ({
  userMode: 'simple',
  activeLeadInstrument: 'unknown',
  suggestedLeadInstrument: null,
  leadCandidates: [],
  flowBars: [],
  selectedBarId: null,
  writingGoal: 'aggressive',
  canvasViewport: {
    startTime: 0,
    endTime: 16,
    zoom: 1,
  },
  evaluation: null,

  setUserMode: (mode: UserMode) => {
    set({ userMode: mode });
  },

  setActiveLeadInstrument: (id: LeadInstrumentId) => {
    set({ activeLeadInstrument: id });
  },

  acceptSuggestedLead: () => {
    const suggested = get().suggestedLeadInstrument;

    if (!suggested) return;

    set({
      activeLeadInstrument: suggested.id,
    });
  },

  setSelectedBarId: (id: string | null) => {
    set({ selectedBarId: id });
  },

  updateBarWords: (barId: string, words: string) => {
    set((state) => ({
      flowBars: state.flowBars.map((bar) =>
        bar.id === barId
          ? {
              ...bar,
              words,
              syllableEstimate: Math.max(1, Math.ceil(words.length / 3.2)),
            }
          : bar
      ),
    }));

    get().evaluateCurrentWriting();
  },

  setWritingGoal: (goal: WritingGoal) => {
    set({ writingGoal: goal });
  },

  setViewportZoom: (zoom: number) => {
    const safeZoom = Math.max(0.5, Math.min(5, zoom));

    set((state) => {
      const windowSize = 16 / safeZoom;

      return {
        canvasViewport: {
          ...state.canvasViewport,
          zoom: safeZoom,
          endTime: state.canvasViewport.startTime + windowSize,
        },
      };
    });
  },

  buildEliteFlowFromAnalysis: (analysisResult: any) => {
    const leadResult = suggestLeadInstrument(analysisResult);
    const bars = buildFlowBars(analysisResult);

    set({
      suggestedLeadInstrument: leadResult.suggested,
      leadCandidates: leadResult.candidates,
      activeLeadInstrument: leadResult.suggested?.id || 'unknown',
      flowBars: bars,
      canvasViewport: {
        startTime: bars[0]?.startTime || 0,
        endTime: bars[Math.min(7, bars.length - 1)]?.endTime || 16,
        zoom: 1,
      },
      evaluation: evaluateWriting(bars),
    });
  },

  evaluateCurrentWriting: () => {
    const evaluation = evaluateWriting(get().flowBars);
    set({ evaluation });
  },

  importRepositoryBars: (barsText: string[]) => {
    set((state) => ({
      flowBars: state.flowBars.map((bar, idx) => {
        if (idx < barsText.length) {
          const text = barsText[idx];
          return {
            ...bar,
            words: text,
            syllableEstimate: Math.max(1, Math.ceil(text.length / 3.2)),
          };
        }
        return bar;
      }),
    }));
    get().evaluateCurrentWriting();
  },

  importSingleRepoBar: (barId: string, text: string) => {
    set((state) => ({
      flowBars: state.flowBars.map((bar) =>
        bar.id === barId
          ? {
              ...bar,
              words: text,
              syllableEstimate: Math.max(1, Math.ceil(text.length / 3.2)),
            }
          : bar
      ),
    }));
    get().evaluateCurrentWriting();
  },
}));
