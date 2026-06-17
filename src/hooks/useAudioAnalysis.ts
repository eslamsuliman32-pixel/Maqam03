// ═══════════════════════════════════════════════════════════════
//  MAQAM — useAudioAnalysis Hook
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from "react";
import { analyzeAudioFile } from "../services/audioAnalysisEngine";
import type { AnalysisState, BeatBlueprint } from "../types/audio.types";

const INITIALSTATE: AnalysisState = {
  status:   "idle",
  progress: 0,
  stage:    "",
};

export function useAudioAnalysis() {
  const [state, setState] = useState<AnalysisState>(INITIALSTATE);
  const abortRef          = useRef(false);

  const analyze = useCallback(async (file: File) => {
    abortRef.current = false;
    setState({ status: "loading", progress: 0, stage: "تحضير المحرك..." });

    try {
      const blueprint = await analyzeAudioFile(file, (progress, stage) => {
        if (abortRef.current) return;
        setState(prev => ({ ...prev, status: "analyzing", progress, stage }));
      });

      if (!abortRef.current) {
        setState({ status: "complete", progress: 100, stage: "اكتمل التحليل", blueprint });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      setState({ status: "error", progress: 0, stage: "خطأ في التحليل", error: message });
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setState(INITIALSTATE);
  }, []);

  return {
    ...state,
    blueprint: state.blueprint,
    isAnalyzing: state.status === "analyzing" || state.status === "loading",
    analyze,
    reset,
  };
}
