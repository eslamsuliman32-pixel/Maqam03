import type { EmotionTarget } from "./maqam.types";

export type NarrativeTechnique =
  | "enhancedcircularnarrative"
  | "advancednarrativemontage"
  | "harmonizedcontradictoryimagery"
  | "evolvingmetaphormatrix"
  | "integratedsonicsemanticline";

export interface NarrativeNode {
  id: string;
  barIndex: number;
  text: string;
  detectedTimeMode: "past" | "present" | "future" | "timeless" | "unknown";
  emotionalTone: EmotionTarget;
  semanticDensity: number;
  contradictionScore: number;
  metaphorScore: number;
  anchorScore: number;
}

export interface NarrativeArcAnalysis {
  circularityScore: number;
  montageScore: number;
  contradictionHarmonyScore: number;
  metaphorEvolutionScore: number;
  sonicSemanticIntegrationScore: number;
  globalNarrativeScore: number;
  nodes: NarrativeNode[];
  detectedTechniques: NarrativeTechnique[];
  suggestions: string[];
}
