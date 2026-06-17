import { create } from "zustand";
import { useLyricsStore } from "./lyricsStore";
import { useAlignmentStore } from "./alignmentStore";
import { useRepositoryStore } from "./repositoryStore";

export interface AppSnapshot {
  label: string;
  timestamp: number;
  lyrics: unknown;
  alignment: unknown;
  repository: unknown;
}

interface HistoryState {
  past: AppSnapshot[];
  future: AppSnapshot[];
  limit: number;
  capture: (label: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

// التقاط الحالة الراهنة من المتاجر الثلاثة
const snapStores = (label: string): AppSnapshot => ({
  label,
  timestamp: Date.now(),
  lyrics: useLyricsStore.getState().serialize(),
  alignment: useAlignmentStore.getState().serialize(),
  repository: useRepositoryStore.getState().serialize(),
});

// إعادة بثّ لقطة إلى المتاجر
const restoreStores = (snap: AppSnapshot) => {
  useLyricsStore.getState().hydrate(snap.lyrics);
  useAlignmentStore.getState().hydrate(snap.alignment);
  useRepositoryStore.getState().hydrate(snap.repository as never);
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  limit: 50,

  // تُستدعى قبل أي تعديل لحفظ الحالة الحالية
  capture: (label) => {
    const snapshot = snapStores(label);
    set((s) => {
      const past = [...s.past, snapshot].slice(-s.limit);
      return { past, future: [] }; // أي تعديل جديد يمسح مكدّس الإعادة
    });
  },

  undo: () => {
    const { past } = get();
    if (past.length === 0) return;
    const current = snapStores("current");
    const previous = past[past.length - 1];
    restoreStores(previous);
    set((s) => ({
      past: s.past.slice(0, -1),
      future: [current, ...s.future].slice(0, s.limit),
    }));
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return;
    const current = snapStores("current");
    const next = future[0];
    restoreStores(next);
    set((s) => ({
      past: [...s.past, current].slice(-s.limit),
      future: s.future.slice(1),
    }));
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
  clear: () => set({ past: [], future: [] }),
}));
