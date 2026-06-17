export type EmotionTarget =
  | "anger"
  | "sadness"
  | "pride"
  | "love"
  | "tension"
  | "hope"
  | "defiance"
  | "melancholy"
  | "triumph"
  | "neutral";

export type SongSectionType =
  | "intro"
  | "verse"
  | "hook"
  | "bridge"
  | "outro";

export interface BarInput {
  id: string;
  text: string;
  index: number;
  section: SongSectionType;
  bpm?: number;
  beatGrid?: number[];
}

export interface PhoneticProfile {
  impact: number;
  smoothness: number;
  heaviness: number;
  breathLoad: number;
  bounce: number;
  sibilance: number;
  gutturalWeight: number;
  nasalDensity: number;
  plosiveDensity: number;
  elongation: number;
  rhymeTail: string;
  syllableEstimate: number;
  energyCurve: number[];
}

export interface MaqamAnalysisResult {
  barId: string;
  text: string;
  phonetics: PhoneticProfile;
  warnings: string[];
  suggestions: string[];
}
