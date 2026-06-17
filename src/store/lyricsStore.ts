import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Word, Syllable, Phoneme } from "../types/alignment";
import { useBeatAnalysisStore } from "./beatAnalysisStore";
import { ppqToSeconds } from "../services/timeMapping";

interface LyricsState {
  rawText: string;
  words: Record<string, Word>; // مفهرسة بالـ ID
  syllables: Record<string, Syllable>;
  phonemes: Record<string, Phoneme>;
  wordOrder: string[]; // الترتيب الخطي للكلمات

  setRawText: (text: string) => void;
  // حقن ناتج المحاذاة القسرية القادم من الخادم الخلفي
  ingestAlignmentResult: (payload: {
    words: Word[];
    syllables: Syllable[];
    phonemes: Phoneme[];
  }) => void;
  // تعديل يدوي لمقطع واحد (من الـ Piano Roll لاحقاً)
  updateSyllableTiming: (
    syllableId: string,
    onsetPPQ: number,
    offsetPPQ: number,
    onsetSeconds: number,
    offsetSeconds: number
  ) => void;
  previewSyllableMove: (id: string, newOnsetPPQ: number) => void;
  previewSyllableResize: (id: string, newOffsetPPQ: number) => void;
  serialize: () => {
    rawText: string;
    words: Record<string, Word>;
    syllables: Record<string, Syllable>;
    phonemes: Record<string, Phoneme>;
    wordOrder: string[];
  };
  hydrate: (snapshot: any) => void;
  reset: () => void;
}

export const useLyricsStore = create<LyricsState>()(
  immer((set) => ({
    rawText: "",
    words: {},
    syllables: {},
    phonemes: {},
    wordOrder: [],

    setRawText: (text) => set((s) => { s.rawText = text; }),

    ingestAlignmentResult: (payload) => set((s) => {
      s.words = {};
      s.syllables = {};
      s.phonemes = {};
      s.wordOrder = [];
      for (const p of payload.phonemes) s.phonemes[p.id] = p;
      for (const syl of payload.syllables) s.syllables[syl.id] = syl;
      for (const w of payload.words) {
        s.words[w.id] = w;
        s.wordOrder.push(w.id);
      }
    }),

    updateSyllableTiming: (id, onsetPPQ, offsetPPQ, onsetSec, offsetSec) =>
      set((s) => {
        const syl = s.syllables[id];
        if (!syl) return;
        syl.onsetPPQ = onsetPPQ;
        syl.offsetPPQ = offsetPPQ;
        syl.onsetSeconds = onsetSec;
        syl.offsetSeconds = offsetSec;
        syl.isManuallyAdjusted = true; // تجاوز المحاذاة الآلية يدوياً
      }),

    previewSyllableMove: (id, newOnsetPPQ) =>
      set((s) => {
        const syl = s.syllables[id];
        if (!syl) return;
        const durationPPQ = syl.offsetPPQ - syl.onsetPPQ;
        const durationSec = syl.offsetSeconds - syl.onsetSeconds;

        syl.onsetPPQ = Math.max(0, newOnsetPPQ);
        syl.offsetPPQ = syl.onsetPPQ + durationPPQ;

        // تحديث الثواني من الـ beatGrid إن وجدت لتتحرك بسلاسة
        const grid = useBeatAnalysisStore.getState().beatGrid;
        if (grid) {
          syl.onsetSeconds = ppqToSeconds(syl.onsetPPQ, grid);
          syl.offsetSeconds = ppqToSeconds(syl.offsetPPQ, grid);
        } else {
          syl.onsetSeconds = syl.onsetPPQ / 960 * 0.5;
          syl.offsetSeconds = syl.onsetSeconds + durationSec;
        }
      }),

    previewSyllableResize: (id, newOffsetPPQ) =>
      set((s) => {
        const syl = s.syllables[id];
        if (!syl) return;
        const minOffset = syl.onsetPPQ + 10; // الحد الأدنى للطول لمنع التداخل أو التصفير
        syl.offsetPPQ = Math.max(minOffset, newOffsetPPQ);

        const grid = useBeatAnalysisStore.getState().beatGrid;
        if (grid) {
          syl.offsetSeconds = ppqToSeconds(syl.offsetPPQ, grid);
        } else {
          syl.offsetSeconds = syl.offsetPPQ / 960 * 0.5;
        }
      }),

    serialize: () => {
      const { rawText, words, syllables, phonemes, wordOrder } = useLyricsStore.getState();
      return { rawText, words, syllables, phonemes, wordOrder };
    },

    hydrate: (snapshot) =>
      set((s) => {
        if (!snapshot) return;
        s.rawText = snapshot.rawText ?? "";
        s.words = snapshot.words ?? {};
        s.syllables = snapshot.syllables ?? {};
        s.phonemes = snapshot.phonemes ?? {};
        s.wordOrder = snapshot.wordOrder ?? [];
      }),

    reset: () => set((s) => {
      s.rawText = "";
      s.words = {};
      s.syllables = {};
      s.phonemes = {};
      s.wordOrder = [];
    }),
  }))
);

export const lyricsSelectors = {
  orderedWords: (s: LyricsState) => s.wordOrder.map((id) => s.words[id]),
  syllableById: (id: string) => (s: LyricsState) => s.syllables[id],
  syllableCount: (s: LyricsState) => Object.keys(s.syllables).length,
};
