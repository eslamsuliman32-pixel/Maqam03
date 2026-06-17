// src/store/maqamStore.ts
// ─── Elite State Management Engine ───────────────────────
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo"; // Undo/Redo
import type {
  BeatBlueprint,
  GridCell,
  SpectralProfile,
  NarrativeArc,
  RhymeSlot,
  AudioAnalysisResult,
  MaqamError,
  IntensityPoint,
  RewriteSuggestion,
  SchemeAnalysis,
} from "../types/maqam.types";

// ─── Type Definitions ─────────────────────────────────────
export interface MaqamState {
  // Core Data
  blueprint: BeatBlueprint | null;
  audioBuffer: AudioBuffer | null;
  analysisResult: AudioAnalysisResult | null;

  // Module States
  grid: {
    cells: GridCell[];
    activeCell: number | null;
    playheadPosition: number;
    zoomLevel: number;
    snapMode: "beat" | "subdivision" | "free";
  };

  heatmap: {
    spectralProfile: SpectralProfile | null;
    targetEmotion: EmotionTarget;
    rewriteSuggestions: RewriteSuggestion[];
    analysisMode: "phonetic" | "semantic" | "hybrid";
    confidenceScore: number;
  };

  narrativeArc: {
    arc: NarrativeArc | null;
    strategy: ArcStrategy;
    intensityMap: IntensityPoint[];
    selectedSegment: string | null;
  };

  rhymeSlots: {
    slots: RhymeSlot[];
    activeSlot: string | null;
    rhymeScheme: RhymeScheme;
    schemeAnalysis: SchemeAnalysis | null;
  };

  // Global UI State
  isAnalyzing: boolean;
  analysisProgress: number;
  activeModule: "blueprint" | "grid" | "heatmap" | "arc" | "rhyme";
  errors: MaqamError[];

  // Actions
  actions: MaqamActions;
}

interface MaqamActions {
  loadAudio: (file: File) => Promise<void>;
  setBlueprint: (blueprint: BeatBlueprint) => void;
  updateGridCell: (cellIndex: number, update: Partial<GridCell>) => void;
  setTargetEmotion: (emotion: EmotionTarget) => void;
  triggerRewrite: (text: string) => Promise<void>;
  setArcStrategy: (strategy: ArcStrategy) => void;
  updateRhymeSlot: (slotId: string, update: Partial<RhymeSlot>) => void;
  setActiveModule: (module: MaqamState["activeModule"]) => void;
  clearErrors: () => void;
  reset: () => void;
}

// ─── Emotion Targets ──────────────────────────────────────
export type EmotionTarget =
  | "explosive"   // انفجاري
  | "smooth"      // ناعم
  | "melancholic" // حزين
  | "aggressive"  // عدواني
  | "ethereal"    // أثيري
  | "raw";        // خام

export type ArcStrategy =
  | "cinematic"   // سينمائي
  | "circular"    // دائري
  | "montage"     // مونتاج
  | "spiral"      // لولبي
  | "explosive";  // انفجاري

export type RhymeScheme = "AABB" | "ABAB" | "ABBA" | "AAAA" | "free" | "custom";

// ─── Store Implementation ─────────────────────────────────
const initialState = {
  blueprint: null,
  audioBuffer: null,
  analysisResult: null,
  grid: {
    cells: [],
    activeCell: null,
    playheadPosition: 0,
    zoomLevel: 1,
    snapMode: "beat" as const,
  },
  heatmap: {
    spectralProfile: null,
    targetEmotion: "explosive" as EmotionTarget,
    rewriteSuggestions: [],
    analysisMode: "hybrid" as const,
    confidenceScore: 0,
  },
  narrativeArc: {
    arc: null,
    strategy: "cinematic" as ArcStrategy,
    intensityMap: [],
    selectedSegment: null,
  },
  rhymeSlots: {
    slots: [],
    activeSlot: null,
    rhymeScheme: "AABB" as RhymeScheme,
    schemeAnalysis: null,
  },
  isAnalyzing: false,
  analysisProgress: 0,
  activeModule: "blueprint" as const,
  errors: [],
};

// Placeholder for the rewrite function
async function generatePhoneticRewrite(text: string, target: EmotionTarget): Promise<RewriteSuggestion[]> {
  // This would ideally call an AI or a local rule-based engine
  return [];
}

export const useMaqamStore = create<MaqamState>()(
  temporal(
    immer((set, get) => ({
      ...initialState,
      actions: {
        loadAudio: async (file: File) => {
          set((s) => {
            s.isAnalyzing = true;
            s.analysisProgress = 0;
          });
          try {
            const audioCtx = new AudioContext();
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

            set((s) => {
              s.audioBuffer = audioBuffer;
              s.analysisProgress = 30;
            });

            // Dispatch to Web Worker for heavy analysis
            const worker = new Worker(
              new URL("../workers/audioAnalysis.worker.ts", import.meta.url),
              { type: "module" }
            );

            worker.postMessage({
              type: "ANALYZEFULL",
              channelData: audioBuffer.getChannelData(0),
              sampleRate: audioBuffer.sampleRate,
            });

            worker.onmessage = (e: MessageEvent) => {
              if (e.data.error) {
                set((s) => {
                  s.errors.push({ id: Date.now().toString(), message: e.data.error, severity: "error" });
                  s.isAnalyzing = false;
                });
              } else {
                set((s) => {
                  s.analysisResult = e.data;
                  s.analysisProgress = 100;
                  s.isAnalyzing = false;
                });
              }
              worker.terminate();
            };

            worker.onerror = (err) => {
              set((s) => {
                s.errors.push({ id: Date.now().toString(), message: err.message, severity: "error" });
                s.isAnalyzing = false;
              });
              worker.terminate();
            };
          } catch (err) {
            set((s) => {
              s.errors.push({
                id: Date.now().toString(),
                message: (err as Error).message,
                severity: "error",
              });
              s.isAnalyzing = false;
            });
          }
        },

        setBlueprint: (blueprint) =>
          set((s) => {
            s.blueprint = blueprint;
          }),

        updateGridCell: (cellIndex, update) =>
          set((s) => {
            const cellIndexInArray = s.grid.cells.findIndex((c) => c.cellIndex === cellIndex);
            if (cellIndexInArray !== -1) {
              Object.assign(s.grid.cells[cellIndexInArray]!, update);
            }
          }),

        setTargetEmotion: (emotion) =>
          set((s) => {
            s.heatmap.targetEmotion = emotion;
          }),

        triggerRewrite: async (text) => {
          const { heatmap } = get();
          const suggestions = await generatePhoneticRewrite(text, heatmap.targetEmotion);
          set((s) => {
            s.heatmap.rewriteSuggestions = suggestions;
          });
        },

        setArcStrategy: (strategy) =>
          set((s) => {
            s.narrativeArc.strategy = strategy;
          }),

        updateRhymeSlot: (slotId, update) =>
          set((s) => {
            const slotIndex = s.rhymeSlots.slots.findIndex((sl) => sl.id === slotId);
            if (slotIndex !== -1) {
              Object.assign(s.rhymeSlots.slots[slotIndex]!, update);
            }
          }),

        setActiveModule: (module) =>
          set((s) => {
            s.activeModule = module;
          }),

        clearErrors: () =>
          set((s) => {
            s.errors = [];
          }),

        reset: () => set(() => initialState),
      },
    })),
    { limit: 50 } // 50 undo steps
  )
);
