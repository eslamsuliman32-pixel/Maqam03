// src/components/EliteFlowCanvas.tsx

import React, { useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Waves } from 'lucide-react';
import { useEliteFlowLabStore } from '../store/eliteFlowLabSlice';

const intensityColor = {
  low: 'rgba(56, 189, 248, 0.35)',
  medium: 'rgba(168, 85, 247, 0.42)',
  high: 'rgba(251, 191, 36, 0.55)',
};

export const EliteFlowCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flowBars = useEliteFlowLabStore((state) => state.flowBars);
  const viewport = useEliteFlowLabStore((state) => state.canvasViewport);
  const setViewportZoom = useEliteFlowLabStore((state) => state.setViewportZoom);
  const activeLead = useEliteFlowLabStore((state) => state.activeLeadInstrument);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const parent = canvas.parentElement;

    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const width = rect.width;
    const height = rect.height;
    const visibleStart = viewport.startTime;
    const visibleEnd = viewport.endTime;
    const visibleDuration = visibleEnd - visibleStart;

    const toX = (time: number) => {
      return ((time - visibleStart) / (visibleDuration || 1)) * width;
    };

    ctx.fillStyle = '#070a12';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 16; i++) {
      const x = (i / 16) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    flowBars.forEach((bar) => {
      if (bar.endTime < visibleStart || bar.startTime > visibleEnd) return;

      const x = toX(bar.startTime);
      const w = Math.max(8, toX(bar.endTime) - x);

      ctx.fillStyle = intensityColor[bar.intensity];
      ctx.fillRect(x, 0, w, height);

      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.strokeRect(x, 0, w, height);

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '700 11px sans-serif';
      ctx.fillText(`بار ${bar.index}`, x + 10, 22);

      const centerY =
        bar.intensity === 'high'
          ? height * 0.35
          : bar.intensity === 'medium'
          ? height * 0.5
          : height * 0.65;

      ctx.beginPath();
      ctx.strokeStyle =
        bar.intensity === 'high'
          ? 'rgba(251, 191, 36, 0.95)'
          : bar.intensity === 'medium'
          ? 'rgba(168, 85, 247, 0.95)'
          : 'rgba(56, 189, 248, 0.9)';

      ctx.lineWidth = 3;

      for (let step = 0; step <= 24; step++) {
        const px = x + (w * step) / 24;
        const wave =
          Math.sin(step * 0.8 + bar.index) *
          (bar.intensity === 'high' ? 18 : bar.intensity === 'medium' ? 12 : 7);

        const py = centerY + wave;

        if (step === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }

      ctx.stroke();

      if (bar.words && bar.words.trim()) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(x + 8, height - 48, w - 16, 30);

        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.font = '600 12px sans-serif';
        ctx.fillText(bar.words.slice(0, 34), x + 16, height - 28);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = '500 11px sans-serif';
        ctx.fillText(
          bar.intensity === 'low' ? 'مساحة تنفس' : bar.intensity === 'high' ? 'كلمات قصيرة' : 'رصف متوازن',
          x + 12,
          height - 24
        );
      }
    });
  }, [flowBars, viewport, activeLead]);

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0a0d14] p-5 text-right font-sans" dir="rtl">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-black text-white">
            <Waves className="h-4 w-4 text-amber-300" />
            قماش التدفق الحي
          </h3>
          <p className="mt-1 text-xs text-white/50">
            عرض مرئي للآلة القائدة، كثافة البارات، ومناطق الكتابة المناسبة.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2" dir="ltr">
          <button
            onClick={() => setViewportZoom(viewport.zoom - 0.5)}
            className="text-white/50 hover:text-white cursor-pointer"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <span className="text-[11px] font-mono text-white/60">
            {viewport.startTime.toFixed(1)}s إلى {viewport.endTime.toFixed(1)}s
          </span>

          <button
            onClick={() => setViewportZoom(viewport.zoom + 0.5)}
            className="text-white/50 hover:text-white cursor-pointer"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative h-72 overflow-hidden rounded-2xl border border-white/10 bg-black">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <Legend color="bg-sky-400/50" label="ارتخاء ومساحة تنفس" />
        <Legend color="bg-purple-400/50" label="تدفق متوسط" />
        <Legend color="bg-amber-400/60" label="كثافة عالية" />
      </div>
    </section>
  );
};

const Legend: React.FC<{ color: string; label: string }> = ({ color, label }) => {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/60">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </div>
  );
};
