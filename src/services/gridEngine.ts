// src/services/gridEngine.ts
import { BEATS_PER_BAR } from "../types/sonic";
import type { Bar } from "../types/sonic";

/**
 * توزيع المقاطع على شبكة الـ16 دقّة بنظام 4/4.
 * span يُحسب بالتناسب مع طول المقطع الصوتي (rasf/رصّ احترافي - بند 6.3).
 */
export const distributeOnGrid = (bar: Bar): Bar => {
  const segs = bar.segments;
  if (!segs.length) return bar;

  const weights = segs.map((s) => Math.max(1, s.phoneticKey.length));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let cursor = 0;
  segs.forEach((seg, i) => {
    const span = Math.max(1, Math.round((weights[i] / totalWeight) * BEATS_PER_BAR));
    seg.startBeat = Math.min(cursor, BEATS_PER_BAR - 1);
    seg.span = Math.min(span, BEATS_PER_BAR - seg.startBeat);
    cursor += seg.span;
  });

  return bar;
};
