export { ObservatoryShell } from './ObservatoryShell';
export { ObservatoryProvider, useObservatory } from './ObservatoryContext';
export { useObservatoryStore } from './useObservatoryStore';
export { LensSwitcher } from './LensSwitcher';
export { CompanionPanel } from './CompanionPanel';
export { LENSES, LENS_BY_ID, resolveLensComponent } from './lensRegistry';
export {
  buildDerivedBars, applyCrossFilter, passesFilters, matchesSearch,
  sortBars, groupBars, computeDerivedStats,
} from './observatoryFilters';
export type {
  LensId, LensMeta, VizSelection, TableFilters, GroupMode, SortBy,
  DerivedStats, ObservatoryContextValue,
} from './observatoryTypes';
