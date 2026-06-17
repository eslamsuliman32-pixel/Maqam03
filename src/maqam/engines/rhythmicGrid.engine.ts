import type {
  RhythmicBar,
  RhythmicGridAnalysis,
  SubdivisionSlot,
  SyllableMapping,
  BarBeatMetrics,
  BeatGridConfig,
  DensityProfile,
  SectionType,
} from "../types/rhythmicGrid.types";
import type { BarInput } from "../types/maqam.types";
import {
  estimateArabicSyllables,
  tokenizeArabic,
  extractSyllables,
} from "../utils/arabicText.utils";
import {
  clampScore,
  weightedAverage,
  average,
} from "../utils/scoring.utils";

// ─────────────────────────────────────────────
// ثوابت الشبكة
// ─────────────────────────────────────────────

const SUBDIVISIONCOUNT = 16;

/*
  خريطة ثوابت كل خانة من خانات الـ 16:
  position → { symbol, weight, role }
 */
const SLOTBLUEPRINT: Record<
  number,
  { symbol: "●" | "○" | "·"; weight: number; role: "kick" | "snare" | "ghost" | "rest" }
> = {
  1:  { symbol: "●", weight: 1.0,  role: "kick"  },
  2:  { symbol: "·", weight: 0.25, role: "ghost" },
  3:  { symbol: "○", weight: 0.5,  role: "rest"  },
  4:  { symbol: "·", weight: 0.25, role: "ghost" },
  5:  { symbol: "●", weight: 0.85, role: "snare" },
  6:  { symbol: "·", weight: 0.25, role: "ghost" },
  7:  { symbol: "○", weight: 0.5,  role: "rest"  },
  8:  { symbol: "·", weight: 0.3,  role: "ghost" },
  9:  { symbol: "●", weight: 1.0,  role: "kick"  },
  10: { symbol: "·", weight: 0.25, role: "ghost" },
  11: { symbol: "○", weight: 0.5,  role: "rest"  },
  12: { symbol: "·", weight: 0.25, role: "ghost" },
  13: { symbol: "●", weight: 0.85, role: "snare" },
  14: { symbol: "·", weight: 0.25, role: "ghost" },
  15: { symbol: "○", weight: 0.5,  role: "rest"  },
  16: { symbol: "·", weight: 0.35, role: "ghost" },
};

/* مواضع القافية الكلاسيكية المُفضَّلة */
const RHYMEANCHORPOSITIONS = new Set([8, 9, 13, 15, 16]);

/* مواضع النَّفَس الطبيعية */
const BREATHPOSITIONS = new Set([8, 9, 16]);

// ─────────────────────────────────────────────
// دوال مساعدة
// ─────────────────────────────────────────────

function beatDurationMs(bpm: number): number {
  return 60000 / bpm;
}

function barDurationMs(config: BeatGridConfig): number {
  return beatDurationMs(config.bpm) * config.beatsPerBar;
}

function sanitizeConfig(raw: Partial<BeatGridConfig>): BeatGridConfig {
  return {
    bpm:          Math.max(40, Math.min(220, raw.bpm          ?? 90)),
    beatOffsetMs: raw.beatOffsetMs ?? 0,
    beatsPerBar:  raw.beatsPerBar  ?? 4,
    subdivision:  raw.subdivision  ?? 4,
    swing:        Math.max(0, Math.min(0.35, raw.swing ?? 0)),
  };
}

function getDensityLevel(
  syllables: number,
  beatsPerBar: number
): BarBeatMetrics["densityLevel"] {
  const ratio = syllables / beatsPerBar;
  if (ratio < 1.5)  return "sparse";
  if (ratio <= 3.8) return "balanced";
  if (ratio <= 5.0) return "dense";
  return "overflow";
}

// ─────────────────────────────────────────────
// توزيع المقاطع على الخانات
// ─────────────────────────────────────────────

/*
  يوزّع مقاطع النص على خانات الشبكة الـ 16
  مع مراعاة الوزن الإيقاعي لكل خانة
 */
function mapSyllablesToSlots(
  words: string[],
  totalSyllables: number
): SyllableMapping[] {
  const mappings: SyllableMapping[] = [];

  // حساب "خطوة" التوزيع: كم خانة لكل مقطع
  const step = Math.max(1, Math.floor(SUBDIVISIONCOUNT / Math.max(totalSyllables, 1)));
  // نقطة البداية: نبدأ من الخانة الأولى دائماً
  let currentSlot = 1;

  words.forEach((word, wordIndex) => {
    const syllables = extractSyllables(word);
    syllables.forEach((syllable, syllableIndex) => {
      if (currentSlot > SUBDIVISIONCOUNT) return;

      const blueprint = SLOTBLUEPRINT[currentSlot];
      const isStressed =
        blueprint.weight >= 0.8 ||
        (syllableIndex === 0 && syllables.length > 1);

      mappings.push({
        syllable,
        word,
        wordIndex,
        syllableIndex,
        assignedSlot: currentSlot,
        slotSymbol: blueprint.symbol,
        isStressed,
        durationSlots: step,
      });

      currentSlot += step;
    });
  });

  return mappings;
}

// ─────────────────────────────────────────────
// بناء خانات البار الـ 16
// ─────────────────────────────────────────────

function buildSlots(syllableMappings: SyllableMapping[]): SubdivisionSlot[] {
  // خريطة سريعة: position → mapping
  const mappingBySlot = new Map<number, SyllableMapping>(
    syllableMappings.map((m) => [m.assignedSlot, m])
  );

  return Array.from({ length: SUBDIVISIONCOUNT }, (_, i) => {
    const position = i + 1;
    const blueprint = SLOTBLUEPRINT[position];
    const mapping  = mappingBySlot.get(position);

    return {
      position,
      symbol:         blueprint.symbol,
      role:           mapping ? "vocal" : blueprint.role,
      syllable:       mapping?.syllable,
      wordPart:       mapping?.word,
      isRhymeAnchor:  RHYMEANCHORPOSITIONS.has(position),
      isBreathPoint:  BREATHPOSITIONS.has(position) && !mapping,
      weight:         blueprint.weight,
    } satisfies SubdivisionSlot;
  });
}

// ─────────────────────────────────────────────
// حساب مقاييس الأداء الإيقاعي للبار
// ─────────────────────────────────────────────

function computeBarMetrics(
  bar: BarInput,
  config: BeatGridConfig,
  estimatedSyllables: number
): BarBeatMetrics {
  const localBarMs    = barDurationMs(config);
  const beatMs        = beatDurationMs(config.bpm);
  const startMs       = config.beatOffsetMs + bar.index * config.beatsPerBar * beatMs;

  // تقدير مدة الأداء بناءً على نوع القسم
  const syllablesPerBeatTarget =
    bar.section === "hook"   ? 2.2 :
    bar.section === "verse"  ? 3.05 : 2.4;

  const beatsNeeded       = estimatedSyllables / syllablesPerBeatTarget;
  const performedDurationMs = Math.min(
    localBarMs * 1.12,
    Math.max(beatMs * 0.5, beatsNeeded * beatMs)
  );
  const endMs = startMs + performedDurationMs;

  // ─── درجات التقييم ───

  // 1. كثافة المقاطع
  const syllablesPerBeat = estimatedSyllables / config.beatsPerBar;
  const densityScore = clampScore(
    syllablesPerBeat <= 3.8
      ? 100 - Math.abs(syllablesPerBeat - 2.8) * 18
      : 100 - (syllablesPerBeat - 3.8) * 35
  );

  // 2. محاذاة الـ Downbeat
  const rawBeat        = (startMs - config.beatOffsetMs) / beatMs;
  const nearestBarBeat = Math.round(rawBeat / config.beatsPerBar) * config.beatsPerBar;
  const downbeatScore  = clampScore(100 - Math.abs(rawBeat - nearestBarBeat) * 85);

  // 3. هبوط القافية (Cadence Landing)
  const rawEndBeat   = (endMs - config.beatOffsetMs) / beatMs;
  const beatInBar    = ((rawEndBeat % config.beatsPerBar) + config.beatsPerBar) % config.beatsPerBar;
  const strongPoints = [0, 2, 3.5, config.beatsPerBar - 0.25];
  const bestDist     = Math.min(...strongPoints.map((p) => Math.abs(beatInBar - p)));
  const cadenceScore = clampScore(100 - bestDist * 75);

  // 4. مساحة النَّفَس
  const remainingMs      = localBarMs - performedDurationMs;
  const syllablePressure = estimatedSyllables / Math.max(1, localBarMs / 1000);
  const breathScore      = clampScore(
    weightedAverage([
      { value: clampScore((remainingMs / localBarMs) * 180), weight: 0.45 },
      { value: clampScore(100 - Math.max(0, syllablePressure - 6.5) * 12), weight: 0.55 },
    ])
  );

  // 5. السينكوبيشن
  const syncopationScore = clampScore(
    80 + (syllablesPerBeat > 2.5 && syllablesPerBeat < 4 ? 12 : -10)
  );

  // 6. الـ Groove
  const grooveScore = clampScore(
    weightedAverage([
      { value: densityScore,  weight: 0.35 },
      { value: cadenceScore,  weight: 0.35 },
      { value: breathScore,   weight: 0.3  },
    ])
  );

  // 7. الدرجة الكلية
  const overallBeatFitScore = clampScore(
    weightedAverage([
      { value: densityScore,    weight: 0.22 },
      { value: downbeatScore,   weight: 0.16 },
      { value: cadenceScore,    weight: 0.20 },
      { value: breathScore,     weight: 0.18 },
      { value: grooveScore,     weight: 0.24 },
    ])
  );

  return {
    bpm: config.bpm,
    startMs, endMs,
    durationMs: performedDurationMs,
    estimatedSyllables,
    syllablesPerBeat,
    densityScore,
    downbeatAlignmentScore: downbeatScore,
    cadenceLandingScore:    cadenceScore,
    breathWindowScore:      breathScore,
    syncopationScore,
    grooveScore,
    overallBeatFitScore,
    densityLevel: getDensityLevel(estimatedSyllables, config.beatsPerBar),
  };
}

// ─────────────────────────────────────────────
// بناء تحذيرات واقتراحات البار
// ─────────────────────────────────────────────

function buildWarningsAndSuggestions(
  metrics: BarBeatMetrics
): { warnings: string[]; suggestions: string[] } {
  const warnings:    string[] = [];
  const suggestions: string[] = [];

  if (metrics.densityLevel === "overflow") {
    warnings.push("⚠️ كثافة المقاطع عالية جدًا — الفلو سيُعاني.");
    suggestions.push("احذف كلمة غير محورية أو وزّع الجملة على بارين.");
  }

  if (metrics.densityLevel === "sparse") {
    warnings.push("⚠️ النص خفيف جدًا — البار سيبدو فارغاً.");
    suggestions.push("أضف تفصيلة أو مقطعاً لملء الشبكة.");
  }

  if (metrics.cadenceLandingScore < 55) {
    suggestions.push("أنهِ الكلمة الأخيرة قرب Beat قوي (1 أو 3 أو نصف Beat).");
  }

  if (metrics.breathWindowScore < 45) {
    warnings.push("⚠️ مساحة النَّفَس ضيقة.");
    suggestions.push("أضف وقفة بعد الكلمة الثقيلة أو اختصر قبل القافية.");
  }

  if (metrics.downbeatAlignmentScore < 60) {
    suggestions.push("ابدأ البار على الـ Downbeat لتحسين التزامن.");
  }

  return { warnings, suggestions };
}

// ─────────────────────────────────────────────
// توليد الشبكة المرئية للبار (RTL)
// ─────────────────────────────────────────────

/*
  يُنتج سطراً نصياً يعرض:
  - رقم البار
  - رموز الخانات الـ 16 (من اليمين لليسار، مقسومة بـ |)
  - المقاطع المُسنَدة
 */
function renderBarVisual(bar: RhythmicBar): string {
  const slots     = bar.slots;
  const rightHalf = slots.slice(8);   // 9→16
  const leftHalf  = slots.slice(0, 8); // 1→8

  // رموز الخانات
  const rightSymbols = rightHalf.map((s) => s.syllable ?? s.symbol).join(" ");
  const leftSymbols  = leftHalf .map((s) => s.syllable ?? s.symbol).join(" ");

  // بار رقم مع padding
  const barLabel = `بار ${String(bar.displayIndex).padStart(2, "0")}`;

  // درجة الملاءمة الإيقاعية
  const score     = Math.round(bar.beatData.overallBeatFitScore);
  const scoreTag  =
    score >= 85 ? "✅" :
    score >= 65 ? "🟡" : "🔴";

  return `│ ${barLabel} │ ${rightSymbols} ║ ${leftSymbols} │ ${scoreTag}${score}`;
}

// ─────────────────────────────────────────────
// توليد الشبكة الكاملة
// ─────────────────────────────────────────────

function renderFullGrid(bars: RhythmicBar[]): string {
  const header =
    "┌──────────┬─────────────────────────────────┬─────────────────────────────────┬───────┐\\n" +
    "│  البار   │     نهاية البار  16 ← 9         ║     بداية البار  8 ← 1          │ Score │\\n" +
    "├──────────┼─────────────────────────────────┼─────────────────────────────────┼───────┤";

  const rows   = bars.map(renderBarVisual);
  const footer =
    "└──────────┴─────────────────────────────────┴─────────────────────────────────┴───────┘";

  // مفتاح الرموز
  const legend =
    "\\nالرموز: ● نقطة قوة (Kick/Snare)  ○ فراغ إيقاعي  · تدفق (Ghost)  ✅≥85  🟡≥65  🔴<65";

  return [header, ...rows, footer, legend].join("\n");
}

// ─────────────────────────────────────────────
// تحليل البار الفردي
// ─────────────────────────────────────────────

function analyzeRhythmicBar(
  bar: BarInput,
  config: BeatGridConfig
): RhythmicBar {
  const words             = tokenizeArabic(bar.text);
  const estimatedSyllables = words.reduce(
    (sum, w) => sum + estimateArabicSyllables(w),
    0
  );

  const syllableMappings = mapSyllablesToSlots(words, estimatedSyllables);
  const slots            = buildSlots(syllableMappings);
  const beatData         = computeBarMetrics(bar, config, estimatedSyllables);
  const { warnings, suggestions } = buildWarningsAndSuggestions(beatData);

  return {
    barId:        bar.id,
    barIndex:     bar.index,
    displayIndex: bar.index + 1,
    section:      bar.section as SectionType,
    text:         bar.text,
    slots,
    syllableMap:  syllableMappings,
    beatData,
    warnings,
    suggestions,
  };
}

// ─────────────────────────────────────────────
// حساب ملف الكثافة للفيرس كاملاً
// ─────────────────────────────────────────────

function buildDensityProfile(bars: RhythmicBar[]): DensityProfile {
  const counts = { sparse: 0, balanced: 0, dense: 0, overflow: 0 };
  let peakScore    = -Infinity;
  let weakestScore =  Infinity;
  let peakIdx      = 0;
  let weakestIdx   = 0;

  bars.forEach((bar, i) => {
    counts[bar.beatData.densityLevel]++;
    if (bar.beatData.overallBeatFitScore > peakScore) {
      peakScore = bar.beatData.overallBeatFitScore;
      peakIdx   = i;
    }
    if (bar.beatData.overallBeatFitScore < weakestScore) {
      weakestScore = bar.beatData.overallBeatFitScore;
      weakestIdx   = i;
    }
  });

  return {
    sparseCount:    counts.sparse,
    balancedCount:  counts.balanced,
    denseCount:     counts.dense,
    overflowCount:  counts.overflow,
    peakBarIndex:   peakIdx,
    weakestBarIndex: weakestIdx,
  };
}

// ─────────────────────────────────────────────
// الدالة الرئيسية — التحليل الكامل
// ─────────────────────────────────────────────

export function analyzeRhythmicGrid(
  bars: BarInput[],
  inputConfig: Partial<BeatGridConfig>,
  section: SectionType = "verse"
): RhythmicGridAnalysis {
  const config     = sanitizeConfig(inputConfig);
  const orderedBars = [...bars].sort((a, b) => a.index - b.index);

  const analyzedBars = orderedBars.map((bar) =>
    analyzeRhythmicBar(bar, config)
  );

  const globalScore = clampScore(
    average(analyzedBars.map((b) => b.beatData.overallBeatFitScore))
  );

  const densityProfile = buildDensityProfile(analyzedBars);
  const visualGrid     = renderFullGrid(analyzedBars);

  // اقتراحات على مستوى الفيرس
  const globalSuggestions: string[] = [];
  if (densityProfile.overflowCount > 2) {
    globalSuggestions.push(
      `🔴 ${densityProfile.overflowCount} بارات بكثافة مرتفعة — راجع التوزيع العام.`
    );
  }
  if (globalScore < 60) {
    globalSuggestions.push(
      "ابدأ بتحسين البار الأضعف قبل تعديل الفيرس كاملاً."
    );
  }
  if (densityProfile.sparseCount > orderedBars.length * 0.4) {
    globalSuggestions.push(
      "أكثر من 40% من البارات خفيفة — الفيرس يفقد طاقته الإيقاعية."
    );
  }

  return {
    config,
    totalBars:              orderedBars.length,
    section,
    bars:                   analyzedBars,
    globalScore,
    averageSyllablesPerBeat: average(
      analyzedBars.map((b) => b.beatData.syllablesPerBeat)
    ),
    densityProfile,
    visualGrid,
    suggestions: globalSuggestions,
  };
}
