import { useEffect, useRef } from "react";
import type { BeatGrid } from "../../types/alignment";
import type { ViewportControls } from "./useTimelineViewport";

interface Props {
  grid: BeatGrid | null;
  controls: ViewportControls;
  height: number;
}

const COLOR_DOWNBEAT = "#3a3a4a";
const COLOR_BEAT = "#252530";
const COLOR_BG = "#1a1a22";

export const BeatGridCanvas = ({ grid, controls, height }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { viewport, ppqToX, visibleRange } = controls;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = viewport.widthPx * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, viewport.widthPx, height);
    if (!grid) return;

    // الضربات القوية المكتشفة (Downbeats) من Essentia.js
    ctx.strokeStyle = COLOR_DOWNBEAT;
    ctx.lineWidth = 1.5;
    for (const beatPPQ of grid.detectedDownbeats) {
      if (beatPPQ < visibleRange.startPPQ || beatPPQ > visibleRange.endPPQ)
        continue;
      const x = ppqToX(beatPPQ);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // تقسيمات الـ 1/16 بين الضربات (4 خطوات لكل ضربة)
    const ppqPerBeat = grid.ppqResolution;
    const stepPPQ = ppqPerBeat / 4;
    ctx.strokeStyle = COLOR_BEAT;
    ctx.lineWidth = 0.5;
    const firstStep =
      Math.floor(visibleRange.startPPQ / stepPPQ) * stepPPQ;
    for (let p = firstStep; p <= visibleRange.endPPQ; p += stepPPQ) {
      const x = ppqToX(p);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }, [grid, viewport, height, ppqToX, visibleRange]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: viewport.widthPx, height, display: "block" }}
    />
  );
};
