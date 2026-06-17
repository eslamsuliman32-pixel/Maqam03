import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  BeatGrid, AudioEnergyFrame, TempoAnchor, TimeSignatureChange,
} from "../types/alignment";
import { PPQ_RESOLUTION } from "../types/alignment";
import { useRepositoryStore } from "./repositoryStore";

interface BeatAnalysisState {
  isAnalyzing: boolean;
  audioFileName: string | null;
  beatGrid: BeatGrid | null;
  energyFrames: AudioEnergyFrame[];

  startAnalysis: (fileName: string) => void;
  setBeatGrid: (
    tempoMap: TempoAnchor[],
    signatureMap: TimeSignatureChange[],
    downbeats: number[]
  ) => void;
  setEnergyFrames: (frames: AudioEnergyFrame[]) => void;
  reset: () => void;
}

export const useBeatAnalysisStore = create<BeatAnalysisState>()(
  immer((set) => ({
    isAnalyzing: false,
    audioFileName: null,
    beatGrid: null,
    energyFrames: [],

    startAnalysis: (fileName) => set((s) => {
      s.isAnalyzing = true;
      s.audioFileName = fileName;
    }),

    setBeatGrid: (tempoMap, signatureMap, downbeats) => set((s) => {
      s.beatGrid = {
        ppqResolution: PPQ_RESOLUTION,
        tempoMap,
        signatureMap,
        detectedDownbeats: downbeats,
      };
      s.isAnalyzing = false;
      
      // ربط الـ Snap بشبكة البيت عند الإعداد
      useRepositoryStore.getState().setSnap(PPQ_RESOLUTION / 4); // 1/16
    }),

    setEnergyFrames: (frames) => set((s) => { s.energyFrames = frames; }),

    reset: () => set((s) => {
      s.isAnalyzing = false;
      s.audioFileName = null;
      s.beatGrid = null;
      s.energyFrames = [];
    }),
  }))
);

const EMPTY_DOWNBEATS: number[] = [];

// Selectors لقراءة ذكية بلا Re-render زائد
export const beatSelectors = {
  beatGrid: (s: BeatAnalysisState) => s.beatGrid,
  downbeats: (s: BeatAnalysisState) => s.beatGrid?.detectedDownbeats ?? EMPTY_DOWNBEATS,
  isAnalyzing: (s: BeatAnalysisState) => s.isAnalyzing,
};
