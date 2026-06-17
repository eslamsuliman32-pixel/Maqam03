"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { useVRASStore, EnergyLevel } from "../../../store/vrasStore";

const SECTION_COLORS: Record<string, string> = {
  intro: "#7C3AED",
  verse: "#D4A017",
  chorus: "#059669",
  bridge: "#DC2626",
  outro: "#7C3AED",
  hook: "#0891B2",
  "pre-chorus": "#B45309",
};

export const BeatVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const {
    beatAnalysis, player, canvas: canvasState, actions,
  } = useVRASStore();

  const [isDragging, setIsDragging] = useState(false);
  const [loopDragStart, setLoopDragStart] = useState<number | null>(null);

  const { scrollX, zoom, showKickMarkers, showEnergyMap, showSectionLabels } = canvasState;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !beatAnalysis) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width / devicePixelRatio;
    const H = canvas.height / devicePixelRatio;
    const pxPerSec = (W / beatAnalysis.duration) * zoom;
    const timeToX = (t: number) => t * pxPerSec - scrollX;

    // ── خلفية ──
    ctx.fillStyle = "#04060e";
    ctx.fillRect(0, 0, W, H);

    // ── خريطة الطاقة ──
    if (showEnergyMap) {
      beatAnalysis.energyMap.forEach((energy, i) => {
        const x = timeToX(i);
        if (x < -2 || x > W + 2) return;
        ctx.fillStyle = `rgba(212,160,23,${energy * 0.4})`;
        ctx.fillRect(x, 0, pxPerSec, H);
      });
    }

    // ── تلوين الأقسام ──
    beatAnalysis.sections.forEach((section) => {
      const x1 = timeToX(section.startTime);
      const x2 = timeToX(section.endTime);
      if (x2 < 0 || x1 > W) return;

      const rgbaCol = SECTION_COLORS[section.type] || "#7C3AED";
      ctx.fillStyle = rgbaCol + "12"; // Opacity trick for hex values
      ctx.fillRect(x1, 0, x2 - x1, H);

      // حدود القسم
      ctx.strokeStyle = rgbaCol;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, 0);
      ctx.lineTo(x1, H);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // تسمية القسم
      if (showSectionLabels && x2 - x1 > 40) {
        ctx.fillStyle = rgbaCol;
        ctx.font = "bold 10px Tajawal, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(section.label, x1 + (x2 - x1) / 2, 14);
      }
    });

    // ── خطوط الشبكة (بارات) ──
    for (let bar = 0; bar <= beatAnalysis.totalBars; bar++) {
      const x = timeToX(bar * beatAnalysis.secondsPerBar);
      if (x < 0 || x > W) continue;
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, H);
      ctx.stroke();

      // رقم البار
      if (zoom >= 2) {
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.font = "8px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`${bar + 1}`, x + 2, H - 4);
      }
    }

    // ── الشكل الموجي (Waveform) ──
    const waveH = H * 0.4;
    const waveY = H * 0.3;
    ctx.strokeStyle = "rgba(212,160,23,0.5)";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    beatAnalysis.waveformData.forEach((amp, i) => {
      const x = timeToX((i / beatAnalysis.waveformData.length) * beatAnalysis.duration);
      if (x < -2 || x > W + 2) return;
      const y = waveY + waveH / 2 - amp * (waveH / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // ── مؤشرات الكيك ──
    if (showKickMarkers) {
      beatAnalysis.kickPositions.forEach((t) => {
        const x = timeToX(t);
        if (x < 0 || x > W) return;
        ctx.fillStyle = "rgba(239,68,68,0.7)";
        ctx.beginPath();
        ctx.moveTo(x, H - 20);
        ctx.lineTo(x - 4, H - 5);
        ctx.lineTo(x + 4, H - 5);
        ctx.closePath();
        ctx.fill();
      });

      // مؤشرات السنير
      beatAnalysis.snarePositions.forEach((t) => {
        const x = timeToX(t);
        if (x < 0 || x > W) return;
        ctx.strokeStyle = "rgba(124,58,237,0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, H - 18);
        ctx.lineTo(x, H - 6);
        ctx.stroke();
      });
    }

    // ── منطقة التكرار (Loop Region) ──
    if (player.isLooping && player.loopStart !== null && player.loopEnd !== null) {
      const lx1 = timeToX(player.loopStart);
      const lx2 = timeToX(player.loopEnd);
      ctx.fillStyle = "rgba(5,150,105,0.15)";
      ctx.fillRect(lx1, 0, lx2 - lx1, H);
      ctx.strokeStyle = "rgba(5,150,105,0.6)";
      ctx.lineWidth = 2;
      ctx.strokeRect(lx1, 0, lx2 - lx1, H);
    }

    // ── رأس التشغيل ──
    const playX = timeToX(player.currentTime);
    if (playX >= 0 && playX <= W) {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playX, 0);
      ctx.lineTo(playX, H);
      ctx.stroke();
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.moveTo(playX - 6, 0);
      ctx.lineTo(playX + 6, 0);
      ctx.lineTo(playX, 8);
      ctx.closePath();
      ctx.fill();
    }
  }, [beatAnalysis, player, canvasState, scrollX, zoom, showKickMarkers, showEnergyMap, showSectionLabels]);

  // ── حلقة الرسم ──
  useEffect(() => {
    const loop = () => {
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  // ── ResizeObserver ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(([entry]) => {
      canvas.width = entry.contentRect.width * devicePixelRatio;
      canvas.height = entry.contentRect.height * devicePixelRatio;
      canvas.style.width = `${entry.contentRect.width}px`;
      canvas.style.height = `${entry.contentRect.height}px`;
      canvas.getContext("2d")?.scale(devicePixelRatio, devicePixelRatio);
    });
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, []);

  const getTimeFromX = useCallback(
    (clientX: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !beatAnalysis) return 0;
      const rect = canvas.getBoundingClientRect();
      const pxPerSec = (rect.width / beatAnalysis.duration) * zoom;
      return (clientX - rect.left + scrollX) / pxPerSec;
    },
    [beatAnalysis, zoom, scrollX]
  );

  return (
    <div className="flex flex-col bg-[#060810] border-b border-white/5">
      {/* ── شريط أدوات العارض ── */}
      <VisualizerToolbar />

      {/* ── القماش ── */}
      <div className="relative h-28">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseMove={(e) => actions.setHoveredTime(getTimeFromX(e.clientX))}
          onMouseLeave={() => actions.setHoveredTime(null)}
          onClick={(e) => {
            const t = getTimeFromX(e.clientX);
            actions.seekTo(t);
          }}
          onMouseDown={(e) => {
            if (e.shiftKey) {
              setLoopDragStart(getTimeFromX(e.clientX));
              setIsDragging(true);
            }
          }}
          onMouseUp={(e) => {
            if (isDragging && loopDragStart !== null) {
              const end = getTimeFromX(e.clientX);
              const start = Math.min(loopDragStart, end);
              const endT = Math.max(loopDragStart, end);
              if (endT - start > 0.5) actions.setLoop(start, endT);
              setIsDragging(false);
              setLoopDragStart(null);
            }
          }}
          onWheel={(e) =>
            e.shiftKey
              ? actions.setScrollX(scrollX + e.deltaY * 2)
              : actions.setZoom(zoom + (e.deltaY > 0 ? -0.5 : 0.5))
          }
        />
        <div className="absolute bottom-1 left-2 text-[8px] text-white/20 select-none font-arabic">
          عجلة الفأرة: تكبير • Shift+عجلة: تمرير • Shift+سحب: تحديد منطقة التكرار
        </div>
      </div>

      {/* ── منزلق التمرير ── */}
      {beatAnalysis && (
        <div className="px-4 py-1.5 bg-black/20 border-t border-white/5">
          <input
            type="range"
            min={0}
            max={Math.max(0, beatAnalysis.duration * zoom - 10)}
            step={0.1}
            value={scrollX / zoom}
            onChange={(e) => actions.setScrollX(Number(e.target.value) * zoom)}
            className="w-full h-1 accent-amber-500 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};

const VisualizerToolbar: React.FC = () => {
  const { canvas, beatAnalysis, actions } = useVRASStore();

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/5">
      <div className="flex items-center gap-3 text-[10px] font-arabic">
        <span className="text-white/40 font-bold">العارض البصري للبيت</span>
        {beatAnalysis && (
          <>
            <InfoChip icon="⏱️" label="BPM" value={`${beatAnalysis.bpm}`} />
            <InfoChip icon="🎵" label="المقام" value={beatAnalysis.maqamType} />
            <InfoChip icon="📊" label="الأقسام" value={`${beatAnalysis.sections.length}`} />
            <InfoChip icon="🥁" label="مجموع البارات" value={`${beatAnalysis.suggestedBarCount}`} />
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <ToggleBtn
          label="كيك"
          active={canvas.showKickMarkers}
          onClick={actions.toggleKickMarkers}
          color="red"
        />
        <ToggleBtn
          label="طاقة"
          active={canvas.showEnergyMap}
          onClick={actions.toggleEnergyMap}
          color="amber"
        />
        <div className="flex items-center gap-1 mr-2">
          <ZBtn onClick={() => actions.setZoom(canvas.zoom - 1)} label="−" />
          <span className="text-[9px] text-white/30 w-6 text-center font-mono">{canvas.zoom}x</span>
          <ZBtn onClick={() => actions.setZoom(canvas.zoom + 1)} label="+" />
        </div>
      </div>
    </div>
  );
};

const InfoChip: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 font-arabic">
    <span>{icon}</span>
    <span className="text-white/30">{label}:</span>
    <span className="text-amber-300 font-bold font-mono">{value}</span>
  </div>
);

const ToggleBtn: React.FC<{
  label: string; active: boolean; onClick: () => void; color: string;
}> = ({ label, active, onClick, color }) => (
  <button
    onClick={onClick}
    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer font-arabic ${
      active
        ? color === "red"
          ? "bg-red-500/20 border-red-500/30 text-red-400"
          : "bg-amber-500/20 border-amber-500/30 text-amber-400"
        : "bg-white/[0.02] border-white/5 text-white/25"
    }`}
  >
    {label}
  </button>
);

const ZBtn: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button
    onClick={onClick}
    className="w-5 h-5 rounded bg-white/[0.04] border border-white/5 text-white/40 text-xs hover:bg-white/[0.08] transition-all cursor-pointer font-mono"
  >
    {label}
  </button>
);
