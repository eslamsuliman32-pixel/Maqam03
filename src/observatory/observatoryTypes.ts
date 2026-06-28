import type { Bar } from '../types';

export type LensId =
  | 'table'
  | 'constellation'
  | 'heatmap'
  | 'trajectory'
  | 'stats'
  | 'style';

export interface LensMeta {
  id: LensId;
  label: string;
  icon: string;
  hint: string;
  ready: boolean;
}

export interface VizSelection {
  barIds: string[];
  source: {
    lens: LensId;
    label: string;
  };
}

export type GroupMode = 'none' | 'ai' | 'rhyme' | 'family' | 'sonic';

export type SortBy =
  | 'newest'
  | 'oldest'
  | 'moraCount'
  | 'sonicWeight'
  | 'serialNumber';

export interface TableFilters {
  searchQuery: string;
  emotionFilter: string;
  footFilter: string;
  rhymeFilter: string;
  stressFilter: string;
  sortBy: SortBy;
  groupMode: GroupMode;
}

export interface DerivedStats {
  total: number;
  avgRhythmicWeight: number;
  avgSyllables: number;
  favorites: number;
}

export interface ObservatoryContextValue {
  derivedBars: Bar[];
  vizSelection: VizSelection | null;
  brush: (barIds: string[], source: VizSelection['source']) => void;
  clearBrush: () => void;
  activeLens: LensId;
}
