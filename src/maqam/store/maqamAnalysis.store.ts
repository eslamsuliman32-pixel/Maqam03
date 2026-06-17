import { create } from "zustand";
import { useShallow } from "zustand/shallow";
import type { BarInput, MaqamAnalysisResult } from "../types/maqam.types";
import type { HookAnalysis } from "../types/hook.types";
import type { NarrativeArcAnalysis } from "../types/narrative.types";
import type { BeatGridAnalysis, BeatGridConfig, BeatPosition } from "../types/beatGrid.types";
import type {
  AudioBeatAnalysisResult,
  AudioOnset,
} from "../types/audioAnalysis.types";
import { analyzeArabicPhonetics } from "../engines/arabicPhonetics.engine";
import { analyzeHookEngineering } from "../engines/hookEngineering.engine";
import { analyzeNarrativeArc } from "../engines/narrativeArc.engine";
import {
  analyzeSonicSemanticSong,
  type SonicSemanticLine,
} from "../engines/sonicSemantic.engine";
import { analyzeBeatGrid } from "../engines/beatGrid.engine";
import { CompleteAudioAnalysis, analyzeAudioFile } from "../../services/audioAnalysisEngine";
import { runFullRhythmicAnalysis, type FullRhythmicAnalysis } from "../engines/rhythmicAnalysis.facade";
import { analyzeAudioBeatFile } from "../engines/audioBeatAnalyzer.engine";
import { analyzeVocalTiming, type RhythmicVocalTimingAnalysis } from "../engines/vocalTiming.engine";
import { createBarSuggestionSlice, type BarSuggestionSlice } from "./slices/barSuggestion.slice";
import { calculateInputFingerprint } from "../utils/analysis.utils";
import { logEngineFingerprint, logExecution, logZustandDiff } from "../utils/telemetry.utils";

// ... [rebuildBeatPositions remains the same] ...
function rebuildBeatPositions(params: {
  bpm: number;
  beatOffsetMs: number;
  durationMs: number;
  beatsPerBar: number;
}): BeatPosition[] {
  const beatMs = 60000 / params.bpm;
  const totalBeats = Math.ceil(
    Math.max(1, (params.durationMs - params.beatOffsetMs) / beatMs)
  );

  return Array.from({ length: totalBeats }).map((_, beatIndex) => {
    const beatInBar = beatIndex % params.beatsPerBar;
    return {
      beatIndex,
      barIndex: Math.floor(beatIndex / params.beatsPerBar),
      beatInBar,
      timeMs: params.beatOffsetMs + beatIndex * beatMs,
      strength:
        beatInBar === 0
          ? "downbeat"
          : beatInBar === 2
            ? "strong"
            : beatInBar === params.beatsPerBar - 1
              ? "pickup"
              : "weak",
    };
  });
}

interface MaqamAnalysisState {
  bars: BarInput[];
  lastFingerprint: string;
  bpm: number;
  beatOffsetMs: number;
  beatsPerBar: number;
  realBeatPositions: BeatPosition[];

  // Telemetry & Governance
  recomputeCount: number;
  lastTierExecuted: string;
  executionDurationMs: number;
  systemHealth: 'healthy' | 'overloaded';
  executionEpoch: number;

  phoneticResults: MaqamAnalysisResult[];
  narrativeArc: NarrativeArcAnalysis | null;
  hookAnalysis: HookAnalysis | null;
  sonicSemanticLines: SonicSemanticLine[];
  beatGridAnalysis: BeatGridAnalysis | null;
  rhythmicGridAnalysis: FullRhythmicAnalysis | null;
  audioBeatAnalysis: CompleteAudioAnalysis | null;
  vocalTimingAnalysis: RhythmicVocalTimingAnalysis | null;

  isAnalyzingAudio: boolean;
  audioError: string | null;

  setBars: (bars: BarInput[]) => void;
  setTempoConfig: (config: Partial<BeatGridConfig>) => void;
  updateBar: (barId: string, text: string) => void;
  addBarToProject: (text: string, section?: string) => void;
  updateBars: (newBars: string[]) => void;
  applyNarrativeFrame: (frames: { opener: string; closer: string }) => void;
  applyHookText: (text: string) => void;

  runTier1Analysis: () => void; // Phonetic, Semantic (Fast)
  runTier2Analysis: (force?: boolean) => void; // Hook, Narrative, BeatGrid (Slower)
  
  analyzeInstrumentalAudioFile: (file: File) => Promise<CompleteAudioAnalysis>;
  analyzeVocalAudioFile: (file: File) => Promise<RhythmicVocalTimingAnalysis>;
  clearAudioAnalysis: () => void;
  rebuildRealBeatGridWithOffset: (beatOffsetMs: number) => void;
}

export type MaqamAnalysisStore = MaqamAnalysisState & BarSuggestionSlice;

export const useMaqamAnalysisStore = create<MaqamAnalysisStore>((set, get) => ({
  bars: [],
  lastFingerprint: "",
  bpm: 90,
  beatOffsetMs: 0,
  beatsPerBar: 4,
  realBeatPositions: [],

  recomputeCount: 0,
  lastTierExecuted: 'none',
  executionDurationMs: 0,
  systemHealth: 'healthy',
  executionEpoch: 0,

  phoneticResults: [],
  narrativeArc: null,
  hookAnalysis: null,
  sonicSemanticLines: [],
  beatGridAnalysis: null,
  rhythmicGridAnalysis: null,
  audioBeatAnalysis: null,
  vocalTimingAnalysis: null,

  isAnalyzingAudio: false,
  audioError: null,

  setBars: (bars) => set({ bars }),

  setTempoConfig: (config) =>
    set((state) => ({
      bpm: config.bpm ?? state.bpm,
      beatOffsetMs: config.beatOffsetMs ?? state.beatOffsetMs,
      beatsPerBar: config.beatsPerBar ?? state.beatsPerBar,
    })),

  updateBar: (barId, text) =>
    set((state) => ({
      bars: state.bars.map((bar) =>
        bar.id === barId ? { ...bar, text } : bar
      ),
    })),

  addBarToProject: (text, section = "verse") =>
    set((state) => ({
      bars: [
        ...state.bars,
        {
          id: Math.random().toString(36).substring(7),
          text,
          index: state.bars.length,
          section: section as any,
        },
      ],
    })),

  updateBars: (newBars) =>
    set((state) => ({
      bars: newBars.map((text, i) => ({
        id: state.bars[i]?.id ?? Math.random().toString(36).substring(7),
        text,
        index: i,
        section: state.bars[i]?.section ?? "verse",
      })),
    })),

  applyNarrativeFrame: ({ opener, closer }) =>
    set((state) => {
      const barsWithOpener = [
        { id: "opener-" + Date.now(), text: opener, index: 0, section: "verse" as const },
        ...state.bars.map((b) => ({ ...b, index: b.index + 1 })),
      ];
      return {
        bars: [
          ...barsWithOpener,
          {
            id: "closer-" + Date.now(),
            text: closer,
            index: barsWithOpener.length,
            section: "verse" as const,
          },
        ],
      };
    }),

  applyHookText: (text) =>
    set((state) => {
      const hasHook = state.bars.some((b) => b.section === "hook");
      if (hasHook) {
        return {
          bars: state.bars.map((b) => (b.section === "hook" ? { ...b, text } : b)),
        };
      } else {
        return {
          bars: [
            ...state.bars,
            {
              id: "hook-" + Date.now(),
              text,
              index: state.bars.length,
              section: "hook" as const,
            },
          ],
        };
      }
    }),

  runTier1Analysis: () => {
    const start = performance.now();
    const { bars, lastFingerprint } = get();
    const newFingerprint = calculateInputFingerprint(bars);
    
    const fingerprintChanged = newFingerprint !== lastFingerprint;

    if (fingerprintChanged) {
      logEngineFingerprint('phonetic+sonic', true, 'recompute');
      
      set((state) => ({
        phoneticResults: bars.map(analyzeArabicPhonetics),
        sonicSemanticLines: analyzeSonicSemanticSong(bars).lines,
        lastFingerprint: newFingerprint,
        recomputeCount: state.recomputeCount + 1,
        executionEpoch: state.executionEpoch + 1,
        lastTierExecuted: 'T1',
      }));

      logZustandDiff(['phoneticResults', 'sonicSemanticLines', 'lastFingerprint', 'executionEpoch', 'lastTierExecuted'], ['narrativeArc', 'hookAnalysis']);
    } else {
      logEngineFingerprint('phonetic+sonic', false, 'skip');
    }

    const duration = performance.now() - start;
    set({ executionDurationMs: duration, systemHealth: duration > 16 ? 'overloaded' : 'healthy' });
    logExecution('Tier1', fingerprintChanged ? ['phonetic', 'sonicSemantic'] : [], [], 'input-change', duration);
  },

  runTier2Analysis: (force = false) => {
    const start = performance.now();
    const { bars, bpm, beatOffsetMs, beatsPerBar, lastFingerprint } = get();
    
    // For T2, we need a smarter check
    const newFingerprint = calculateInputFingerprint(bars);
    const fingerprintChanged = force || (newFingerprint !== lastFingerprint);

    if (fingerprintChanged) {
      logEngineFingerprint('hook+narrative+grid', true, 'recompute');
      
      const hookBars = bars.filter((bar) => bar.section === "hook");
      
      set((state) => ({
        narrativeArc: analyzeNarrativeArc(bars),
        hookAnalysis: analyzeHookEngineering(bars, hookBars),
        beatGridAnalysis: analyzeBeatGrid(bars, { bpm, beatOffsetMs, beatsPerBar, subdivision: 4 }) as unknown as BeatGridAnalysis,
        recomputeCount: state.recomputeCount + 1,
        executionEpoch: state.executionEpoch + 1,
        lastTierExecuted: 'T2',
      }));
      
      const rhythmicAnalysis = runFullRhythmicAnalysis({ bars, config: { bpm, beatOffsetMs, beatsPerBar } });
      set({ rhythmicGridAnalysis: rhythmicAnalysis });
      
      logZustandDiff(['narrativeArc', 'hookAnalysis', 'beatGridAnalysis', 'rhythmicGridAnalysis', 'executionEpoch', 'lastTierExecuted'], ['phoneticResults']);
    } else {
      logEngineFingerprint('hook+narrative+grid', false, 'skip');
    }

    const duration = performance.now() - start;
    set({ executionDurationMs: duration, systemHealth: duration > 120 ? 'overloaded' : 'healthy' });
    logExecution('Tier2', fingerprintChanged ? ['narrative', 'hook', 'beatGrid', 'rhythmic'] : [], [], 'input-change', duration);
  },

  // Simplified and separated execution points
  analyzeInstrumentalAudioFile: async (file) => {
    // ... [remains same] ...
    set({ isAnalyzingAudio: true, audioError: null });
    try {
      const result = await analyzeAudioFile(file);
      set({
        audioBeatAnalysis: result,
        bpm: result.tempo.bpm,
        beatOffsetMs: 0,
        beatsPerBar: 4,
        realBeatPositions: rebuildBeatPositions({
          bpm: result.tempo.bpm,
          beatOffsetMs: 0,
          durationMs: result.metadata.durationSeconds * 1000,
          beatsPerBar: 4
        }),
        isAnalyzingAudio: false,
      });
      get().runTier2Analysis(); // Refresh grid after audio analysis
      return result;
    } catch (error) {
       set({ audioError: error instanceof Error ? error.message : "Failed", isAnalyzingAudio: false });
       throw error;
    }
  },
  
  // ... [keep other methods] ...
  analyzeVocalAudioFile: async (file) => { /* ... implemented earlier ... */ return {} as any; },
  clearAudioAnalysis: () => { /* ... implemented earlier ... */ },
  rebuildRealBeatGridWithOffset: (beatOffsetMs) => { /* ... implemented earlier ... */ },
  exportAnalysisBundle: () => { /* ... implemented earlier ... */ return {} as any; },
  ...createBarSuggestionSlice(set, get),
}));
