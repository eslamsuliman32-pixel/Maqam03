import {
  Bar,
  Beat,
  Quatrain,
  TonalSpike,
  ScatPattern,
  IntonationCurvePoint,
  LayeredFlowMatrix,
  LayeredFlowRow,
  LayeredFlowCell,
} from "../types/flowEngine.types";

/**
 * دمج وترجيع مصفوفة التدفق الطبقية (2D Composer Matrix).
 * تجمع هذه الدالة البنية المفاهيمية للراب بالكامل، وتحسب تلاحم كل دقة إيقاعية بشكل مستقل.
 */
export function computeLayeredFlowMatrix(
  quatrains: Quatrain[],
  scatPatterns: ScatPattern[],
  intonationCurve: IntonationCurvePoint[],
  tonalSpikes: TonalSpike[]
): LayeredFlowMatrix {
  const rows: LayeredFlowRow[] = [];
  let totalActiveLayers = 0;
  const weakPoints: { rowIndex: number; cellIndex: number; reason: string }[] = [];

  // جمع كافة القوافي والبارات من جميع الرباعيات النشطة
  const bars = quatrains.flatMap((q) => q.bars);

  bars.forEach((bar, rowIndex) => {
    const cells: LayeredFlowCell[] = [];

    bar.beats.forEach((beat, cellIndex) => {
      // 1) البحث عن طبقة السكاتينج المناسبة
      // نختار أول نمط سكاتينج يملك مقطعاً موازياً لهذه الدقة
      const matchingScat = scatPatterns.find((p) => {
        const syllable = p.syllables[cellIndex];
        return syllable && syllable !== "·" && syllable !== "⬝";
      }) || null;

      // 2) البحث عن طبقة التنغيم النغمية
      // نأخذ القيمة التقريبية للمنحنى على مقياس الزمن (0 - 1)
      const normalizedTime = (rowIndex + cellIndex / 4) / Math.max(bars.length, 1);
      const matchingIntonation = intonationCurve.find((point) => {
        const diff = Math.abs(point.time - normalizedTime);
        return diff < 0.15; // مدى تقارب زمني مقبول
      }) || null;

      // 3) البحث عن النقاط النغمية الحادة (Spikes)
      const matchingSpike = tonalSpikes.find(
        (spike) => spike.barId === bar.id && spike.beatPosition === beat.position
      ) || null;

      // حساب عدد الطبقات النشطة في هذه الخلية الإيقاعية
      let activeCount = 1; // الهيكل الأساسي دائم النشاط
      if (matchingScat) activeCount++;
      if (matchingIntonation) activeCount++;
      if (matchingSpike) activeCount++;

      totalActiveLayers += activeCount;

      // حساب الدرجة المركبة (Composite Density & Intensity)
      let compositeScore = 40; // درجة الهيكل الأساسي
      if (matchingScat) compositeScore += 20;
      if (matchingIntonation) compositeScore += 15;
      if (matchingSpike) compositeScore += 25;

      compositeScore = Math.min(100, compositeScore);

      // رصد نقاط الضعف الفنية
      if (beat.syllable === "" && !matchingScat && !matchingSpike) {
        weakPoints.push({
          rowIndex,
          cellIndex,
          reason: "فراغ إيقاعي غير مغطى — نقترح إضافة مقطع سكات أو كتابة كلمات",
        });
      }

      cells.push({
        beat,
        skeletonLayer: beat.syllable.length > 0,
        scattingLayer: matchingScat,
        intonationLayer: matchingIntonation,
        tonalSpikeLayer: matchingSpike,
        compositeScore,
        layerCount: activeCount,
        visualIntensity: compositeScore / 100,
      });
    });

    rows.push({
      bar,
      cells,
    });
  });

  // حساب معدل التماسك الكلي للإنتاج
  const totalCells = rows.length * 4;
  const overallCoherence =
    totalCells > 0
      ? Math.round(
          rows.reduce(
            (sum, row) =>
              sum +
              row.cells.reduce((cellSum, cell) => cellSum + cell.compositeScore, 0),
            0
          ) / totalCells
        )
      : 80;

  // توليد مقترحات إتقان ذكية (Mastery Suggestions)
  const masterySuggestions: string[] = [];
  if (overallCoherence < 60) {
    masterySuggestions.push("🔴 التدفق العام يفتقر للطبقات التعبيرية. أضف همهمة (Scatting) لملء الفراغات الإيقاعية.");
  } else if (overallCoherence < 80) {
    masterySuggestions.push("🟡 تماسك واعد! جرّب إعداد قفزات نغمية (Tonal Spikes) عند الكلمات الحادة لخلق تباين درامي.");
  } else {
    masterySuggestions.push("👑 أداء من مستوى النخبة! التراكب الهارموني والسرعة الإيقاعية متكاملان تماماً.");
  }

  if (weakPoints.length > 3) {
    masterySuggestions.push(`⚠️ رصدنا ${weakPoints.length} ثغرات في توازن النفس. نقترح مراجعة خريطة النفس والوقفات.`);
  }

  return {
    rows,
    overallCoherence,
    masterySuggestions,
    totalActiveLayers,
    weakPoints,
  };
}
