import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  SyllableAlignment, FlowDensityFrame, BeatGrid, Syllable,
} from "../types/alignment";
import { buildAllAlignments } from "../services/alignmentEngine";
import { computeFlowDensity } from "../services/flowDensity";

interface AlignmentState {
  alignments: Record<string, SyllableAlignment>; // مفهرسة بـ syllableId
  flowDensity: FlowDensityFrame[];

  // التوليد الآلي الكامل بعد وصول ناتج المحاذاة
  generateAlignments: (
    syllables: Syllable[],
    resolveBarId: (s: Syllable) => string,
    grid: BeatGrid
  ) => void;

  // تحديث محاذاة واحدة بعد سحب يدوي على الـ Piano Roll
  upsertAlignment: (alignment: SyllableAlignment) => void;
  serialize: () => {
    alignments: Record<string, SyllableAlignment>;
    flowDensity: FlowDensityFrame[];
  };
  hydrate: (snapshot: any) => void;
  reset: () => void;
}

export const useAlignmentStore = create<AlignmentState>()(
  immer((set) => ({
    alignments: {},
    flowDensity: [],

    generateAlignments: (syllables, resolveBarId, grid) => set((s) => {
      const list = buildAllAlignments(syllables, resolveBarId, grid);
      s.alignments = {};
      for (const a of list) s.alignments[a.syllableId] = a;
      s.flowDensity = computeFlowDensity(syllables, grid);
    }),

    upsertAlignment: (alignment) => set((s) => {
      s.alignments[alignment.syllableId] = alignment;
    }),

    serialize: () => {
      const { alignments, flowDensity } = useAlignmentStore.getState();
      return { alignments, flowDensity };
    },

    hydrate: (snapshot) =>
      set((s) => {
        if (!snapshot) return;
        s.alignments = snapshot.alignments ?? {};
        s.flowDensity = snapshot.flowDensity ?? [];
      }),

    reset: () => set((s) => {
      s.alignments = {};
      s.flowDensity = [];
    }),
  }))
);

export const alignmentSelectors = {
  bySyllable: (id: string) => (s: AlignmentState) => s.alignments[id],
  // المقاطع منخفضة الثقة أو المتأخرة بشدة - لتلوينها على الشبكة
  offBeatAlignments: (s: AlignmentState) =>
    Object.values(s.alignments).filter((a) => !a.isOnBeat),
  flowDensity: (s: AlignmentState) => s.flowDensity,
};
