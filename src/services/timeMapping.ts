import type { BeatGrid } from "../types/alignment";

/** تحويل موقع موسيقي (PPQ) إلى زمن فيزيائي (ثوانٍ) */
export const ppqToSeconds = (ppq: number, grid: BeatGrid): number => {
  const map = grid.tempoMap;
  if (map.length === 0) return 0;
  if (ppq <= map[0].ppq) return map[0].absoluteTimeSeconds;

  for (let i = 0; i < map.length - 1; i++) {
    const a = map[i];
    const b = map[i + 1];
    if (ppq >= a.ppq && ppq <= b.ppq) {
      const ratio = (ppq - a.ppq) / (b.ppq - a.ppq);
      return a.absoluteTimeSeconds +
        ratio * (b.absoluteTimeSeconds - a.absoluteTimeSeconds);
    }
  }
  // ما بعد آخر نقطة: امتداد خطي بآخر BPM معروف
  const last = map[map.length - 1];
  const secPerPPQ = 60 / (last.bpm * grid.ppqResolution);
  return last.absoluteTimeSeconds + (ppq - last.ppq) * secPerPPQ;
};

/** تحويل زمن فيزيائي (ثوانٍ) إلى موقع موسيقي (PPQ) */
export const secondsToPpq = (seconds: number, grid: BeatGrid): number => {
  const map = grid.tempoMap;
  if (map.length === 0) return 0;
  if (seconds <= map[0].absoluteTimeSeconds) return map[0].ppq;

  for (let i = 0; i < map.length - 1; i++) {
    const a = map[i];
    const b = map[i + 1];
    if (seconds >= a.absoluteTimeSeconds && seconds <= b.absoluteTimeSeconds) {
      const ratio =
        (seconds - a.absoluteTimeSeconds) /
        (b.absoluteTimeSeconds - a.absoluteTimeSeconds);
      return a.ppq + ratio * (b.ppq - a.ppq);
    }
  }
  const last = map[map.length - 1];
  const ppqPerSec = (last.bpm * grid.ppqResolution) / 60;
  return last.ppq + (seconds - last.absoluteTimeSeconds) * ppqPerSec;
};

/** أقرب ضربة شبكية لموقع PPQ معطى (للـ Snap) */
export const snapToNearestBeat = (
  ppq: number,
  grid: BeatGrid
): { nearestBeatPPQ: number; offsetPPQ: number } => {
  const beats = grid.detectedDownbeats;
  if (beats.length === 0) return { nearestBeatPPQ: ppq, offsetPPQ: 0 };

  let nearest = beats[0];
  let minDist = Math.abs(ppq - beats[0]);
  for (const b of beats) {
    const d = Math.abs(ppq - b);
    if (d < minDist) { minDist = d; nearest = b; }
  }
  return { nearestBeatPPQ: nearest, offsetPPQ: ppq - nearest };
};
