import { useEffect, useRef } from "react";
import type { AudioEnergyFrame, FlowDensityFrame } from "../../types/alignment";
import type { ViewportControls } from "./useTimelineViewport";

interface Props {
  audioEnergy: AudioEnergyFrame[];
  flowDensity: FlowDensityFrame[];
  controls: ViewportControls;
  height: number;
}

const COLOR_AUDIO = "rgba(80, 140, 255, 0.35)"; // طاقة البيت - مملوءة
const COLOR_FLOW = "#ff6b9d"; // التدفق اللفظي - خط

export const EnergyOverlayCanvas = ({
  audioEnergy,
  flowDensity,
  controls,
  height,
}: Props) => {
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
    ctx.clearRect(0, 0, viewport.widthPx, height);

    // الطبقة 1: طاقة البيت (مساحة مملوءة من الأسفل)
    const visibleAudio = audioEnergy.filter(
      (f) => f.ppq >= visibleRange.startPPQ && f.ppq <= visibleRange.endPPQ
    );
    if (visibleAudio.length > 0) {
      ctx.fillStyle = COLOR_AUDIO;
      ctx.beginPath();
      ctx.moveTo(ppqToX(visibleAudio[0].ppq), height);
      for (const f of visibleAudio) {
        ctx.lineTo(ppqToX(f.ppq), height - f.rmsEnergy * height);
      }
      ctx.lineTo(ppqToX(visibleAudio[visibleAudio.length - 1].ppq), height);
      ctx.closePath();
      ctx.fill();
    }

    // الطبقة 2: كثافة التدفق اللفظي (خط فوق الطاقة)
    const visibleFlow = flowDensity.filter(
      (f) => f.ppq >= visibleRange.startPPQ && f.ppq <= visibleRange.endPPQ
    );
    if (visibleFlow.length > 0) {
      const maxDensity = Math.max(
        ...flowDensity.map((f) => f.syllablesPerBeat),
        1
      );
      ctx.strokeStyle = COLOR_FLOW;
      ctx.lineWidth = 2;
      ctx.beginPath();
      visibleFlow.forEach((f, i) => {
        const x = ppqToX(f.ppq);
        const y = height - (f.syllablesPerBeat / maxDensity) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }, [audioEnergy, flowDensity, viewport, height, ppqToX, visibleRange]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: viewport.widthPx,
        height,
        display: "block",
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none", // لا يعترض النقر - مجرد طبقة بصرية
      }}
    />
  );
};
