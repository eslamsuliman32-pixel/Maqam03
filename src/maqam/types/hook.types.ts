export type HookTechnique =
  | "symmetricalsoniccondensation"
  | "concentratedsemanticreduction"
  | "astonishingverbalparadox"
  | "exceptionalrhythmiccadence"
  | "evolvingdynamicrepetition"
  | "resonantkeyword"
  | "multilayeredsonicharmony"
  | "integratedsensoryhook"
  | "culturallyextendedsurprise"
  | "rhythmicsemantictransition";

export interface HookAnalysis {
  hookText: string;
  memorabilityScore: number;
  symmetryScore: number;
  semanticCompressionScore: number;
  paradoxScore: number;
  cadenceScore: number;
  repetitionEvolutionScore: number;
  resonantKeywordScore: number;
  sonicHarmonyScore: number;
  sensoryScore: number;
  culturalSurpriseScore: number;
  transitionScore: number;
  detectedTechniques: HookTechnique[];
  keywords: string[];
  suggestions: string[];
}
