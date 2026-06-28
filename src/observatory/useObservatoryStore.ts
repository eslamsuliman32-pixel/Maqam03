import { create } from 'zustand';
import type { LensId, VizSelection } from './observatoryTypes';

interface ObservatoryStore {
  activeLens: LensId;
  companionOpen: boolean;
  vizSelection: VizSelection | null;
  setLens: (lens: LensId) => void;
  toggleCompanion: (open?: boolean) => void;
  brush: (barIds: string[], source: VizSelection['source']) => void;
  clearBrush: () => void;
}

export const useObservatoryStore = create<ObservatoryStore>((set) => ({
  activeLens: 'table',
  companionOpen: true,
  vizSelection: null,
  setLens: (lens) => set({ activeLens: lens }),
  toggleCompanion: (open) =>
    set((state) => ({
      companionOpen: typeof open === 'boolean' ? open : !state.companionOpen,
    })),
  brush: (barIds, source) =>
    set({ vizSelection: barIds.length > 0 ? { barIds, source } : null }),
  clearBrush: () => set({ vizSelection: null }),
}));
