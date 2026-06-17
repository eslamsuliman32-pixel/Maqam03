// src/types/flowLabElite.ts

export type UserMode = 'simple' | 'pro';

export type LeadInstrumentId =
  | 'synth-lead'
  | 'strings'
  | 'brass'
  | 'vocal'
  | 'bass'
  | 'piano'
  | 'unknown';

export type IntensityLevel = 'low' | 'medium' | 'high';

export type WritingGoal =
  | 'aggressive'
  | 'sad'
  | 'celebratory'
  | 'sarcastic'
  | 'motivational'
  | 'cinematic';

export interface LeadInstrumentCandidate {
  id: LeadInstrumentId;
  labelAr: string;
  labelEn: string;
  icon: string;
  confidence: number;
  presenceScore: number;
  motionScore: number;
  beatSyncScore: number;
  continuityScore: number;
  writingSpaceScore: number;
  reason: string;
}

export interface FlowBar {
  id: string;
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
  intensity: IntensityLevel;
  suggestedWritingHint: string;
  words: string;
  syllableEstimate: number;
}

export interface FlowEvaluation {
  clarity: number;
  coherence: number;
  crowding: number;
  impact: number;
  notes: string[];
}

export interface CanvasViewport {
  startTime: number;
  endTime: number;
  zoom: number;
}

export interface EliteFlowLabState {
  userMode: UserMode;
  activeLeadInstrument: LeadInstrumentId;
  suggestedLeadInstrument: LeadInstrumentCandidate | null;
  leadCandidates: LeadInstrumentCandidate[];
  flowBars: FlowBar[];
  selectedBarId: string | null;
  writingGoal: WritingGoal;
  canvasViewport: CanvasViewport;
  evaluation: FlowEvaluation | null;

  setUserMode: (mode: UserMode) => void;
  setActiveLeadInstrument: (id: LeadInstrumentId) => void;
  acceptSuggestedLead: () => void;
  setSelectedBarId: (id: string | null) => void;
  updateBarWords: (barId: string, words: string) => void;
  setWritingGoal: (goal: WritingGoal) => void;
  setViewportZoom: (zoom: number) => void;

  buildEliteFlowFromAnalysis: (analysisResult: any) => void;
  evaluateCurrentWriting: () => void;
  importRepositoryBars: (barsText: string[]) => void;
  importSingleRepoBar: (barId: string, text: string) => void;
}
