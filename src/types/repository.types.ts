import type { Bar } from './index';

export type EmotionalKey =
  | 'حزن' | 'حماس' | 'غضب' | 'فرح' | 'شوق' | 'تمرد' | 'حيرة' | 'أمل' | string;

export type NarrativeRole =
  | 'افتتاحية' | 'ذروة' | 'كوبري' | 'خاتمة' | 'هوك' | 'مشهد' | string;

export type GrooveStyle =
  | 'Boombap' | 'Trap' | 'Drill' | 'Afrobeats' | 'Mahraganat' | 'Custom';

export interface BarMetadata {
  bpm: number;
  groove: GrooveStyle;
  emotion: EmotionalKey;
  narrativeRole: NarrativeRole;
  semanticVector: number[];
  keywords: string[];
  hookScore: number;
  createdAt: number;
  usageCount: number;
}

export type RepositoryBar = Bar;

export interface SearchCriteria {
  keyword?: string;
  emotion?: EmotionalKey;
  narrativeRole?: NarrativeRole;
  bpmRange?: [number, number];
  groove?: GrooveStyle;
  semanticQuery?: string;
}

export interface SuggestionResult {
  bar: RepositoryBar;
  relevanceScore: number;
  source: 'repository' | 'aigenerated';
  matchReason: string[];
}

export interface SuggestionResponse {
  repositorySuggestions: SuggestionResult[];
  aiSuggestions: SuggestionResult[];
  aiTriggered: boolean;
  triggerReason?: 'thresholdnotmet' | 'explicitrequest';
}
