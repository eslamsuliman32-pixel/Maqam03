// ═══════════════════════════════════════════════════════════════
//  MAQAM — VRAS Beat Adapter
//  محوّل مخرجات محرك التحليل الحقيقي (BeatBlueprint) إلى صيغة VRAS
//  يربط audioAnalysisEngine.ts بنظام التوافق البصري الإيقاعي (vrasStore)
// ═══════════════════════════════════════════════════════════════

import type { BeatBlueprint, OnsetEvent } from "../types/audio.types";
import type {
  BeatAnalysis,
  MusicalSection,
  BeatPoint,
  EnergyLevel as VrasEnergyLevel,
  SectionType as VrasSectionType,
} from "../store/vrasStore";

// ── مطابقة مستوى الطاقة: audio.types ("low"|"mid"|"high"|"peak") → VRAS ──
function mapEnergyLevel(
  level: "low" | "mid" | "high" | "peak",
  hasSilence = false
): VrasEnergyLevel {
  if (hasSilence) return "silent";
  switch (level) {
    case "mid":
      return "medium";
    case "low":
      return "low";
    case "high":
      return "high";
    case "peak":
      return "peak";
    default:
      return "medium";
  }
}

// ── مطابقة نوع القسم: المحرك ("drop" غير موجود في VRAS) → VRAS ──
function mapSectionType(
  type: "intro" | "verse" | "hook" | "chorus" | "bridge" | "outro" | "drop"
): VrasSectionType {
  if (type === "drop") return "chorus";
  return type;
}

// ── تسميات عربية للأقسام ──
const SECTION_LABELS_AR: Record<VrasSectionType, string> = {
  intro: "المقدمة",
  verse: "مقطع",
  chorus: "اللازمة",
  hook: "الهوك",
  bridge: "الجسر",
  outro: "الخاتمة",
  "pre-chorus": "تمهيد اللازمة",
};

// ── عدد المقاطع الموصى به لكل بار حسب الطاقة ──
// طاقة أعلى ⇒ كثافة لفظية أعلى (بارات أطول)
function recommendedSyllablesForEnergy(energyScore: number): number {
  const raw = 6 + energyScore * 6; // 6 → 12
  return Math.max(4, Math.min(14, Math.round(raw)));
}

// ═══════════════════════════════════════════════════════════════
//  المحوّل الرئيسي
// ═══════════════════════════════════════════════════════════════

export function beatBlueprintToVrasAnalysis(
  blueprint: BeatBlueprint
): BeatAnalysis {
  const { metadata, tempo, spectral, rhythm, structure } = blueprint;
  const { secondsPerBar, secondsPerBeat } = tempo;
  const totalBars = metadata.totalBars;
  const duration = metadata.durationSeconds;
  const bars = rhythm.bars;

  // ── خريطة الطاقة لكل ثانية (مشتقة من طاقة كل بار) ──
  const energyMap: number[] = [];
  const totalSeconds = Math.max(1, Math.ceil(duration));
  for (let s = 0; s < totalSeconds; s++) {
    const barIndex = Math.min(bars.length - 1, Math.floor(s / secondsPerBar));
    energyMap.push(bars[barIndex]?.energyScore ?? 0);
  }

  // ── مواضع الكيك والسنير بالثواني ──
  const kickPositions = rhythm.kickPositions.map((o) => o.timeSeconds);
  const snarePositions = rhythm.snarePositions.map((o) => o.timeSeconds);

  // ── طاقة الباسلاين لكل بار ──
  const basslineEnergy = spectral.bassProfile.slice(0, totalBars);

  // ── نقاط الإيقاع (kick + snare + hihat) ──
  const toBeatPoint = (
    o: OnsetEvent,
    type: "kick" | "snare" | "hihat"
  ): BeatPoint => ({
    time: o.timeSeconds,
    type,
    amplitude: Math.max(0, Math.min(1, o.strength)),
    bar: o.barIndex,
    beat: o.beatIndex,
    subdivision: o.subdivisionIndex,
  });
  const beatPoints: BeatPoint[] = [
    ...rhythm.kickPositions.map((o) => toBeatPoint(o, "kick")),
    ...rhythm.snarePositions.map((o) => toBeatPoint(o, "snare")),
    ...rhythm.hihatPositions.map((o) => toBeatPoint(o, "hihat")),
  ].sort((a, b) => a.time - b.time);

  // ── الأقسام الموسيقية ──
  const typeCounters: Partial<Record<VrasSectionType, number>> = {};
  const sections: MusicalSection[] = structure.sections.map((sec) => {
    const vType = mapSectionType(sec.type);
    typeCounters[vType] = (typeCounters[vType] || 0) + 1;
    const sectionBars = bars.slice(sec.startBar, sec.endBar + 1);

    const energyProfile: VrasEnergyLevel[] = sectionBars.map((b) =>
      mapEnergyLevel(b.energyLevel, b.hasSilence)
    );
    const recommendedSyllables: number[] = sectionBars.map((b) =>
      recommendedSyllablesForEnergy(b.energyScore)
    );

    return {
      id: sec.id,
      type: vType,
      label: `${SECTION_LABELS_AR[vType]} ${typeCounters[vType]}`,
      startTime: sec.startTime,
      endTime: sec.endTime,
      startBar: sec.startBar,
      endBar: sec.endBar,
      barCount: sec.barCount,
      energyProfile,
      recommendedSyllables,
      color: sec.colorHex,
      isExpanded: true,
    };
  });

  // ── خطر الازدحام لكل بار (مشتق من كثافة الـ onsets) ──
  const maxOnsets = Math.max(1, ...bars.map((b) => b.onsets.length));
  const crowdingRisk = bars.map((b) =>
    Math.max(0, Math.min(1, b.onsets.length / maxOnsets))
  );

  // ── بيانات الشكل الموجي (مشتقة من منحنى الطاقة، 500 نقطة) ──
  const WAVE_POINTS = 500;
  const waveformData = Array.from({ length: WAVE_POINTS }, (_, i) => {
    const t = (i / WAVE_POINTS) * duration;
    const idx = Math.min(energyMap.length - 1, Math.floor(t));
    return Math.max(0, Math.min(1, energyMap[idx] ?? 0));
  });

  // ── الوصف الترددي السائد (بدل المقام/السلّم غير المكتشَفين) ──
  const dominantRangeLabelAr: Record<string, string> = {
    "bass-heavy": "هيمنة الباس",
    "mid-focused": "تركيز متوسط",
    "high-sharp": "حدّة عالية",
    balanced: "متوازن",
  };

  return {
    fileName: metadata.filename,
    duration,
    bpm: tempo.bpm,
    timeSignature: tempo.timeSignature,
    totalBars,
    beatsPerBar: 4,
    secondsPerBar,
    secondsPerBeat,
    keySignature: "غير محدد",
    maqamType: dominantRangeLabelAr[spectral.dominantRange] || "غير محدد",
    energyMap,
    kickPositions,
    snarePositions,
    basslineEnergy,
    beatPoints,
    sections,
    crowdingRisk,
    suggestedBarCount: sections.reduce((sum, s) => sum + s.barCount, 0),
    waveformData,
  };
}
