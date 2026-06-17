import type { BarInput } from "../types/maqam.types";
import type { AudioOnset } from "../types/audioAnalysis.types";
import type { BeatPosition } from "../types/beatGrid.types";
import type { BeatGridConfig, SectionType } from "../types/rhythmicGrid.types";
import { analyzeRhythmicGrid }  from "./rhythmicGrid.engine";
import { analyzeVocalTiming, type RhythmicVocalTimingAnalysis }   from "./vocalTiming.engine";

export interface FullRhythmicAnalysis {
  gridAnalysis:   ReturnType<typeof analyzeRhythmicGrid>;
  timingAnalysis: RhythmicVocalTimingAnalysis | null;
  combinedScore:  number;
  visualReport:   string;
}

export function runFullRhythmicAnalysis(params: {
  bars:          BarInput[];
  config:        Partial<BeatGridConfig>;
  section?:      SectionType;
  // اختياري — إذا توفّر صوت فعلي
  beatPositions?: BeatPosition[];
  vocalOnsets?:  AudioOnset[];
}): FullRhythmicAnalysis {
  const { bars, config, section = "verse", beatPositions, vocalOnsets } = params;

  // 1. تحليل الشبكة النظرية
  const gridAnalysis = analyzeRhythmicGrid(bars, config, section);

  // 2. تحليل التوقيت الصوتي (اختياري)
  let timingAnalysis = null;
  if (vocalOnsets && beatPositions) {
    timingAnalysis = analyzeVocalTiming({
      bars,
      config: gridAnalysis.config,
      beatPositions,
      vocalOnsets,
    });
  }

  // 3. الدرجة المدمجة
  const combinedScore = timingAnalysis
    ? Math.round(gridAnalysis.globalScore * 0.5 + timingAnalysis.globalAlignment * 0.5)
    : gridAnalysis.globalScore;

  // 4. تقرير مرئي موحَّد
  const scoreBar = "█".repeat(Math.round(combinedScore / 5)).padEnd(20, "░");
  const visualReport = [
    "═".repeat(70),
    `  الشبكة الإيقاعية — ${section.toUpperCase()} | ${bars.length} بار | ${gridAnalysis.config.bpm} BPM`,
    "═".repeat(70),
    gridAnalysis.visualGrid,
    "",
    `  الدرجة الإجمالية: [${scoreBar}] ${combinedScore}/100`,
    `  متوسط المقاطع/Beat: ${gridAnalysis.averageSyllablesPerBeat.toFixed(2)}`,
    timingAnalysis
      ? `  تزامن الأداء: ${timingAnalysis.globalAlignment}/100 | Perfect Pockets: ${timingAnalysis.perfectPocketCount}/${bars.length}`
      : "  (لا يوجد تسجيل صوتي — تحليل نظري فقط)",
    "",
    ...(gridAnalysis.suggestions.length
      ? ["  💡 اقتراحات:", ...gridAnalysis.suggestions.map((s) => `      ${s}`)]
      : []),
    ...(timingAnalysis?.suggestions.length
      ? ["  🎤 توقيت الأداء:", ...timingAnalysis.suggestions.map((s) => `      ${s}`)]
      : []),
    "═".repeat(70),
  ].join("\n");

  return { gridAnalysis, timingAnalysis, combinedScore, visualReport };
}
