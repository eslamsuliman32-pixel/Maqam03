import { FlowLabState } from './types';

export const flowLabSelectors = {
  textCells: (state: FlowLabState) => state.textCells,
  analysisResult: (state: FlowLabState) => state.analysisResult,
  analysisStatus: (state: FlowLabState) => state.analysisStatus,
  analysisProgress: (state: FlowLabState) => state.analysisProgress,
  activeTab: (state: FlowLabState) => state.activeTab,
  canvasViewport: (state: FlowLabState) => state.canvasViewport,
  suggestions: (state: FlowLabState) => state.suggestions,
  suggestionsLoading: (state: FlowLabState) => state.suggestionsLoading,
};
