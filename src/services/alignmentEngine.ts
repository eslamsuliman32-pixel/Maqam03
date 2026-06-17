import type {
  Syllable, BeatGrid, SyllableAlignment, TimeSignatureChange,
} from "../types/alignment";
import { ppqToSeconds, snapToNearestBeat } from "./timeMapping";

const ON_BEAT_TOLERANCE_MS = 30; // ضمن 30ms يُعتبر على الضربة

/** التوقيع الزمني الفعّال عند موقع PPQ معيّن */
const signatureAt = (
  ppq: number,
  signatureMap: TimeSignatureChange[]
): TimeSignatureChange => {
  let current = signatureMap[0] ?? { ppq: 0, numerator: 4, denominator: 4 };
  for (const sig of signatureMap) {
    if (sig.ppq <= ppq) current = sig;
    else break;
  }
  return current;
};

/** ترتيب الضربة داخل البار (0-based) */
const beatIndexInBar = (
  ppq: number,
  grid: BeatGrid
): number => {
  const sig = signatureAt(ppq, grid.signatureMap);
  const ppqPerBeat = grid.ppqResolution * (4 / sig.denominator);
  const ppqPerBar = ppqPerBeat * sig.numerator;
  const posInBar = ((ppq % ppqPerBar) + ppqPerBar) % ppqPerBar;
  return Math.floor(posInBar / ppqPerBeat);
};

/**
 * توليد محاذاة لمقطع لفظي واحد:
 * يلتصق بأقرب ضربة ويحسب الانحراف الفني (laid-back / pushing)
 */
export const buildSyllableAlignment = (
  syllable: Syllable,
  barId: string,
  grid: BeatGrid
): SyllableAlignment => {
  const { nearestBeatPPQ } = snapToNearestBeat(syllable.onsetPPQ, grid);

  const onsetSec = ppqToSeconds(syllable.onsetPPQ, grid);
  const beatSec = ppqToSeconds(nearestBeatPPQ, grid);
  const offsetFromBeatMs = (onsetSec - beatSec) * 1000;

  return {
    id: `align_${syllable.id}`,
    syllableId: syllable.id,
    barId,
    nearestBeatPPQ,
    beatIndexInBar: beatIndexInBar(syllable.onsetPPQ, grid),
    subdivision: 4, // افتراضي 1/16 - يُحسّن لاحقاً بكشف التثليث
    offsetFromBeatMs,
    isOnBeat: Math.abs(offsetFromBeatMs) <= ON_BEAT_TOLERANCE_MS,
    alignmentSource: syllable.isManuallyAdjusted ? "manual" : "auto",
  };
};

/** توليد المحاذاة لكل المقاطع دفعة واحدة */
export const buildAllAlignments = (
  syllables: Syllable[],
  resolveBarId: (syllable: Syllable) => string,
  grid: BeatGrid
): SyllableAlignment[] =>
  syllables.map((syl) =>
    buildSyllableAlignment(syl, resolveBarId(syl), grid)
  );
