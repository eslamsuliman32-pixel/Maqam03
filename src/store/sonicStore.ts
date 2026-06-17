// src/store/sonicStore.ts
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Verse, SonicFingerprint, Bar } from "../types/sonic";
import { segmentBar } from "../services/prosodyEngine";
import { distributeOnGrid } from "../services/gridEngine";
import { buildFingerprint } from "../services/sonicMatchEngine";

interface SonicState {
  verse: Verse | null;
  fingerprint: SonicFingerprint | null;
  // الإجراءات
  analyzeVerse: (rawText: string) => void;
  rewriteSegment: (barId: string, segmentId: string, newText: string) => void;
  reset: () => void;
}

export const useSonicStore = create<SonicState>()(
  immer((set) => ({
    verse: null,
    fingerprint: null,

    /** 5.1 -> 5.4: التحليل الكامل من نص خام */
    analyzeVerse: (rawText) =>
      set((state) => {
        const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
        const verse: Verse = {
          id: crypto.randomUUID(),
          bars: lines.map((text, index) => {
            const bar = { id: crypto.randomUUID(), index, text, segments: segmentBar(text) };
            return distributeOnGrid(bar);
          }),
        };
        state.verse = verse;
        state.fingerprint = buildFingerprint(verse.id, verse.bars);
      }),

    /** 3.3: المستخدم يكتب كلمات جديدة على نفس الهيكل الصوتي */
    rewriteSegment: (barId, segmentId, newText) =>
      set((state) => {
        const bar = state.verse?.bars.find((b) => b.id === barId);
        const seg = bar?.segments.find((s) => s.id === segmentId);
        if (!seg) return;
        seg.raw = newText; // البصمة الأصلية (startBeat/span) تبقى ثابتة = حفظ الفلو
      }),

    reset: () => set((state) => {
      state.verse = null;
      state.fingerprint = null;
    }),
  }))
);

const EMPTY_BARS: Bar[] = [];

/** Selectors لقراءة ذكية بدون Re-render زائد */
export const sonicSelectors = {
  bars: (s: SonicState) => s.verse?.bars ?? EMPTY_BARS,
  groupColor: (segId: string) => (s: SonicState) => {
    const gId = s.fingerprint?.cellGroupMap[segId];
    return s.fingerprint?.groups.find((g) => g.id === gId)?.color ?? null;
  },
};
