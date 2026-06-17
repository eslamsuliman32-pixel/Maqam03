import type {
  Syllable, BeatGrid, FlowDensityFrame,
} from "../types/alignment";

/**
 * يحسب عدد المقاطع لكل ضربة في نوافذ منزلقة على طول المقطوعة.
 * النتيجة طبقة Overlay تُقارن بصرياً بطاقة البيت (AudioEnergyFrame).
 */
export const computeFlowDensity = (
  syllables: Syllable[],
  grid: BeatGrid,
  windowBeats: number = 1
): FlowDensityFrame[] => {
  if (syllables.length === 0) return [];

  const ppqPerBeat = grid.ppqResolution; // مبسّط لـ x/4
  const windowPPQ = ppqPerBeat * windowBeats;

  const sorted = [...syllables].sort((a, b) => a.onsetPPQ - b.onsetPPQ);
  const lastPPQ = sorted[sorted.length - 1].offsetPPQ;
  const frames: FlowDensityFrame[] = [];

  for (let start = 0; start <= lastPPQ; start += windowPPQ) {
    const end = start + windowPPQ;
    const inWindow = sorted.filter(
      (s) => s.onsetPPQ >= start && s.onsetPPQ < end
    );

    // سرعة الإلقاء = متوسط مدة المقطع (أقصر = أسرع)
    const avgDurationPPQ =
      inWindow.length > 0
        ? inWindow.reduce((sum, s) => sum + (s.offsetPPQ - s.onsetPPQ), 0) /
          inWindow.length
        : 0;
    const deliverySpeed =
      avgDurationPPQ > 0 ? ppqPerBeat / avgDurationPPQ : 0;

    frames.push({
      ppq: start,
      syllablesPerBeat: inWindow.length / windowBeats,
      deliverySpeed,
    });
  }
  return frames;
};
