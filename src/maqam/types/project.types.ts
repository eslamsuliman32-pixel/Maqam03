import type { BarInput, MaqamAnalysisResult } from "./maqam.types";
import type { HookAnalysis } from "./hook.types";
import type { NarrativeArcAnalysis } from "./narrative.types";
import type { SonicSemanticLine } from "../engines/sonicSemantic.engine";
import type { BeatGridAnalysis } from "./beatGrid.types";
import type { BeatBlueprint } from "../../types/audio.types";
import type { RhythmicVocalTimingAnalysis } from "../engines/vocalTiming.engine";

export type MaqamProjectSyncStatus =
  | "local-only"
  | "synced"
  | "dirty"
  | "syncing"
  | "error";

export interface MaqamProjectMeta {
  id: string;
  title: string;
  ownerId?: string | null;
  bpm: number;
  beatOffsetMs: number;
  beatsPerBar: number;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string | null;
  syncStatus: MaqamProjectSyncStatus;
  version: number;
}

export interface MaqamProjectAnalysisBundle {
  phoneticResults: MaqamAnalysisResult[];
  narrativeArc: NarrativeArcAnalysis | null;
  hookAnalysis: HookAnalysis | null;
  sonicSemanticLines: SonicSemanticLine[];
  beatGridAnalysis: BeatGridAnalysis | null;
  audioBeatAnalysis?: BeatBlueprint | null;
  vocalTimingAnalysis?: RhythmicVocalTimingAnalysis | null;
}

export interface MaqamProjectDocument {
  meta: MaqamProjectMeta;
  bars: BarInput[];
  analysis: MaqamProjectAnalysisBundle;
}

export interface MaqamProjectSummary {
  id: string;
  title: string;
  ownerId?: string | null;
  bpm: number;
  updatedAt: string;
  syncStatus: MaqamProjectSyncStatus;
  version: number;
}
