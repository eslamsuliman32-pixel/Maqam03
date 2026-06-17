// ─── phonetic-filters/index.ts ───────────────────────────────────────────────

export type {
  Syllable,
  MoraWeight,
  RhymeSignature,
  RhymeType,
  InternalRhyme,
  ProsodicSignature,
  ArabicFoot,
  ArabicMeter,
  FilterMode,
  SingleFilterParam,
  PhoneticFilter,
  PhoneticFilterValues,
  BarPhoneticProfile,
} from "./phonetic-filter.types";

export {
  analyzeBarPhoneticsAndProsody,
  RHYMEFAMILYMAP,
} from "./prosodic-analyzer.engine";

export {
  computePhoneticMatchScore,
  scoreParam,
} from "./phonetic-score.engine";

export {
  applyPhoneticFilter,
  invalidatePhoneticCache,
} from "./phonetic-filter.engine";

export { PhoneticFilterPresets } from "./phonetic-filter.presets";

export {
  applyDerivedFilters,
  applyCompositeFilterToPool,
  computeBarMatchScore,
  type CompositeFilter,
} from "./composite-filter.engine";
