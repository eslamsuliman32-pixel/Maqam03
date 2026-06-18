"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { useVRASStore } from "../../../store/vrasStore";

// ── لوحة ألوان احترافية للأقسام ──
const SECTION_COLORS: Record<string, string> = {
  intro: "#8B5CF6",
  verse: "#10B981",
  chorus: "#EF4444",
  bridge: "#F59E0B",
  outro: "#64748B",
  hook: "#06B6D4",
  "pre-chorus": "#EC4899",
};

// تحويل hex إلى rgba
function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export const BeatVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const { beatAnalysis, player, canvas: canvasState, actions } = useVRASStore();

  const [isDragging, setIsDragging] = useState(false);
  const [loopDragStart, setLoopDragStart] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const { scrollX, zoom, showKickMarkers, showEnergyMap, showSectionLabels } = canvasState;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !beatAnalysis) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width / devicePixelRatio;
    const H = canvas.height / devicePixelRatio;
    const dur = beatAnalysis.duration;
    const spb = beatAnalysis.secondsPerBar;
    const beatDur = beatAnalysis.secondsPerBeat;
    const pxPerSec = (W / dur) * zoom;
    const timeToX = (t: number) => t * pxPerSec - scrollX;
    const xToTime = (x: number) => (x + scrollX) / pxPerSec;

    // ── تخطيط المسارات (lanes) ──
    const RIBBON = 24;                 // شريط الأقسام
    const RULER = 20;                  // مسطرة البارات/الضربات
    const ENERGY_H = 16;               // شريط الطاقة السفلي
    const waveTop = RIBBON + RULER;
    const waveH = H - waveTop - ENERGY_H;
    const waveMid = waveTop + waveH / 2;

    // ── خلفية متدرّجة ──
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#070a14");
    bg.addColorStop(1, "#04060e");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const tStart = Math.max(0, xToTime(0));
    const tEnd = Math.min(dur, xToTime(W));
    const firstBar = Math.floor(tStart / spb);
    const lastBar = Math.ceil(tEnd / spb);

    // ── خطوط الشبكة (بارات + ضربات) ──
    for (let bar = firstBar; bar <= lastBar; bar++) {
      const bx = timeToX(bar * spb);
      // ضربات داخل البار
      for (let beat = 1; beat < 4; beat++) {
        const beatX = timeToX(bar * spb + beat * beatDur);
        if (beatX < 0 || beatX > W) continue;
        ctx.strokeStyle = "rgba(255,255,255,0.035)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(beatX, waveTop);
        ctx.lineTo(beatX, waveTop + waveH);
        ctx.stroke();
      }
      // خط البار
      if (bx >= -1 && bx <= W + 1) {
        ctx.strokeStyle = "rgba(255,255,255,0.09)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx, RIBBON);
        ctx.lineTo(bx, H - ENERGY_H);
        ctx.stroke();
      }
    }

    // ── شريط الأقسام (Ribbon) ──
    beatAnalysis.sections.forEach((section) => {
      const x1 = timeToX(section.startTime);
      const x2 = timeToX(section.endTime);
      if (x2 < 0 || x1 > W) return;
      const col = SECTION_COLORS[section.type] || "#8B5CF6";
      const w = x2 - x1;

      // خلفية القسم الكاملة (خفيفة جداً)
      ctx.fillStyle = hexA(col, 0.06);
      ctx.fillRect(x1, RIBBON, w, H - RIBBON - ENERGY_H);

      // شريحة القسم العلوية
      const pad = 1.5;
      ctx.fillStyle = hexA(col, 0.9);
      roundRect(ctx, x1 + pad, 3, Math.max(0, w - pad * 2), RIBBON - 6, 4);
      ctx.fill();

      if (showSectionLabels && w > 46) {
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.font = "bold 11px Tajawal, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(section.label, x1 + w / 2, RIBBON / 2 + 1);
      }
    });

    // ── مسطرة البارات ──
    ctx.textBaseline = "middle";
    for (let bar = firstBar; bar <= lastBar; bar++) {
      const bx = timeToX(bar * spb);
      if (bx < 0 || bx > W) continue;
      const showEvery = zoom < 1.5 ? 4 : zoom < 3 ? 2 : 1;
      if (bar % showEvery === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "bold 9px 'IBM Plex Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText(`${bar + 1}`, bx + 3, RIBBON + RULER / 2);
      }
      // علامات الضربات الصغيرة
      for (let beat = 0; beat < 4; beat++) {
        const beatX = timeToX(bar * spb + beat * beatDur);
        if (beatX < 0 || beatX > W) continue;
        ctx.fillStyle = beat === 0 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)";
        ctx.fillRect(beatX, RIBBON + RULER - 5, beat === 0 ? 2 : 1, 5);
      }
    }

    // ── الشكل الموجي الحقيقي (مرايا حول المنتصف) ──
    const wf = beatAnalysis.waveformData;
    if (wf && wf.length > 0) {
      ctx.beginPath();
      // النصف العلوي
      for (let i = 0; i < wf.length; i++) {
        const t = (i / wf.length) * dur;
        const x = timeToX(t);
        if (x < -2) continue;
        if (x > W + 2) break;
        const amp = wf[i] * (waveH / 2) * 0.92;
        const y = waveMid - amp;
        if (x <= timeToX((Math.max(0, i - 1) / wf.length) * dur) + 0.01 && i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      // النصف السفلي (عكسي)
      for (let i = wf.length - 1; i >= 0; i--) {
        const t = (i / wf.length) * dur;
        const x = timeToX(t);
        if (x > W + 2) continue;
        if (x < -2) break;
        const amp = wf[i] * (waveH / 2) * 0.92;
        ctx.lineTo(x, waveMid + amp);
      }
      ctx.closePath();
      const wg = ctx.createLinearGradient(0, waveTop, 0, waveTop + waveH);
      wg.addColorStop(0, "rgba(245,200,80,0.30)");
      wg.addColorStop(0.5, "rgba(212,160,23,0.55)");
      wg.addColorStop(1, "rgba(245,200,80,0.30)");
      ctx.fillStyle = wg;
      ctx.fill();
      ctx.strokeStyle = "rgba(245,200,80,0.5)";
      ctx.lineWidth = 0.75;
      ctx.stroke();
    }

    // خط المنتصف
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, waveMid);
    ctx.lineTo(W, waveMid);
    ctx.stroke();

    // ── علامات الإيقاع (كيك/سنير/هاي-هات) ──
    if (showKickMarkers && beatAnalysis.beatPoints) {
      const baseline = waveTop + waveH - 3;
      beatAnalysis.beatPoints.forEach((bp) => {
        const x = timeToX(bp.time);
        if (x < -4 || x > W + 4) return;
        const amp = Math.max(0.25, bp.amplitude);

        if (bp.type === "kick") {
          // كيك: دائرة حمراء متوهّجة على خط الأساس
          const r = 3 + amp * 4;
          ctx.beginPath();
          ctx.arc(x, baseline, r, 0, Math.PI * 2);
          ctx.fillStyle = hexA("#EF4444", 0.85);
          ctx.shadowColor = "#EF4444";
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (bp.type === "snare") {
          // سنير: شريط سماوي عمودي
          const h = 8 + amp * 14;
          ctx.strokeStyle = hexA("#06B6D4", 0.8);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, waveMid - h / 2);
          ctx.lineTo(x, waveMid + h / 2);
          ctx.stroke();
        } else if (bp.type === "hihat") {
          // هاي-هات: نقطة صغيرة قرب الأعلى
          ctx.beginPath();
          ctx.arc(x, waveTop + 5, 1.5 + amp * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(226,232,240,0.55)";
          ctx.fill();
        }
      });
    }

    // ── شريط الطاقة الحراري (أسفل) ──
    if (showEnergyMap && beatAnalysis.energyMap) {
      const ey = H - ENERGY_H;
      beatAnalysis.energyMap.forEach((e, i) => {
        const x = timeToX(i);
        if (x < -2 || x > W + 2) return;
        const wSec = pxPerSec;
        // تدرّج حراري: أزرق → كهرماني → أحمر
        let col: string;
        if (e < 0.33) col = `rgba(59,130,246,${0.35 + e})`;
        else if (e < 0.66) col = `rgba(245,180,40,${0.4 + e * 0.5})`;
        else col = `rgba(239,68,68,${0.5 + e * 0.4})`;
        ctx.fillStyle = col;
        ctx.fillRect(x, ey + (1 - e) * ENERGY_H, Math.max(1, wSec), e * ENERGY_H);
      });
      // خط فاصل
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(0, ey, W, 1);
    }

    // ── منطقة التكرار ──
    if (player.isLooping && player.loopStart !== null && player.loopEnd !== null) {
      const lx1 = timeToX(player.loopStart);
      const lx2 = timeToX(player.loopEnd);
      ctx.fillStyle = "rgba(16,185,129,0.12)";
      ctx.fillRect(lx1, RIBBON, lx2 - lx1, H - RIBBON - ENERGY_H);
      ctx.strokeStyle = "rgba(16,185,129,0.7)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(lx1, RIBBON, lx2 - lx1, H - RIBBON - ENERGY_H);
      ctx.setLineDash([]);
    }

    // سحب التكرار قيد التنفيذ
    if (isDragging && loopDragStart !== null && hoverX !== null) {
      const a = timeToX(loopDragStart);
      const b = hoverX;
      ctx.fillStyle = "rgba(16,185,129,0.1)";
      ctx.fillRect(Math.min(a, b), RIBBON, Math.abs(b - a), H - RIBBON - ENERGY_H);
    }

    // ── خط التمرير (Hover guide) ──
    if (hoverX !== null && !isDragging) {
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hoverX, RIBBON);
      ctx.lineTo(hoverX, H - ENERGY_H);
      ctx.stroke();
      ctx.setLineDash([]);

      // تلميح الوقت + البار:الضربة
      const t = xToTime(hoverX);
      const bar = Math.floor(t / spb) + 1;
      const beat = Math.floor((t % spb) / beatDur) + 1;
      const label = `${formatTime(t)} · بار ${bar}:${beat}`;
      ctx.font = "bold 10px 'IBM Plex Mono', monospace";
      const tw = ctx.measureText(label).width + 12;
      const tx = Math.min(W - tw, Math.max(0, hoverX + 6));
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      roundRect(ctx, tx, RIBBON + 3, tw, 16, 4);
      ctx.fill();
      ctx.fillStyle = "rgba(245,200,80,0.95)";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, tx + 6, RIBBON + 11);
    }

    // ── رأس التشغيل (Playhead) ──
    const playX = timeToX(player.currentTime);
    if (playX >= -2 && playX <= W + 2) {
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "rgba(255,255,255,0.6)";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(playX, RIBBON);
      ctx.lineTo(playX, H - ENERGY_H);
      ctx.stroke();
      ctx.shadowBlur = 0;
      // مثلث علوي
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(playX - 5, RIBBON);
      ctx.lineTo(playX + 5, RIBBON);
      ctx.lineTo(playX, RIBBON + 7);
      ctx.closePath();
      ctx.fill();
    }
  }, [beatAnalysis, player, canvasState, scrollX, zoom, showKickMarkers, showEnergyMap, showSectionLabels, hoverX, isDragging, loopDragStart]);

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
      const dpr = devicePixelRatio;
      canvas.width = entry.contentRect.width * dpr;
      canvas.height = entry.contentRect.height * dpr;
      canvas.style.width = `${entry.contentRect.width}px`;
      canvas.style.height = `${entry.contentRect.height}px`;
      canvas.getContext("2d")?.scale(dpr, dpr);
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

  const getLocalX = (clientX: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    return rect ? clientX - rect.left : 0;
  };

  return (
    <div className="flex flex-col bg-[#060810] border-b border-white/[0.06]">
      <VisualizerToolbar />

      <div className="relative" style={{ height: 248 }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseMove={(e) => {
            setHoverX(getLocalX(e.clientX));
            actions.setHoveredTime(getTimeFromX(e.clientX));
          }}
          onMouseLeave={() => {
            setHoverX(null);
            actions.setHoveredTime(null);
          }}
          onClick={(e) => {
            if (!e.shiftKey) actions.seekTo(getTimeFromX(e.clientX));
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
              if (endT - start > 0.3) actions.setLoop(start, endT);
              setIsDragging(false);
              setLoopDragStart(null);
            }
          }}
          onWheel={(e) =>
            e.shiftKey
              ? actions.setScrollX(scrollX + e.deltaY * 2)
              : actions.setZoom(zoom + (e.deltaY > 0 ? -0.4 : 0.4))
          }
        />
      </div>

      {/* ── شريط التمرير ── */}
      {beatAnalysis && (
        <div className="flex items-center gap-3 px-4 py-2 bg-black/30 border-t border-white/[0.05]">
          <span className="text-[9px] text-white/30 font-mono">تمرير</span>
          <input
            type="range"
            min={0}
            max={Math.max(0, beatAnalysis.duration * zoom - 10)}
            step={0.1}
            value={scrollX / Math.max(0.01, zoom)}
            onChange={(e) => actions.setScrollX(Number(e.target.value) * zoom)}
            className="flex-1 h-1 accent-amber-500 cursor-pointer"
          />
          <span className="text-[9px] text-white/25 font-arabic">
            عجلة: تكبير · Shift+عجلة: تمرير · Shift+سحب: تكرار
          </span>
        </div>
      )}
    </div>
  );
};

// ── شريط الأدوات ──
const VisualizerToolbar: React.FC = () => {
  const { canvas, beatAnalysis, actions } = useVRASStore();

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.05]">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-white/50 font-bold font-arabic ml-1">العارض البصري للبيت</span>
        {beatAnalysis && (
          <>
            <InfoChip icon="⏱" label="BPM" value={`${beatAnalysis.bpm}`} accent="#F5C84B" />
            <InfoChip icon="🎚" label="الميزان" value={beatAnalysis.timeSignature} accent="#10B981" />
            <InfoChip icon="📐" label="الأقسام" value={`${beatAnalysis.sections.length}`} accent="#06B6D4" />
            <InfoChip icon="📊" label="البارات" value={`${beatAnalysis.totalBars}`} accent="#8B5CF6" />
            <InfoChip icon="🎵" label="الطابع" value={beatAnalysis.maqamType} accent="#EC4899" />
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <LegendDot color="#EF4444" label="كيك" />
        <LegendDot color="#06B6D4" label="سنير" />
        <LegendDot color="#E2E8F0" label="هاي-هات" />
        <div className="w-px h-4 bg-white/10 mx-1" />
        <ToggleBtn label="كيك" active={canvas.showKickMarkers} onClick={actions.toggleKickMarkers} color="red" />
        <ToggleBtn label="طاقة" active={canvas.showEnergyMap} onClick={actions.toggleEnergyMap} color="amber" />
        <div className="flex items-center gap-1 mr-1">
          <ZBtn onClick={() => actions.setZoom(canvas.zoom - 1)} label="−" />
          <span className="text-[10px] text-white/40 w-7 text-center font-mono font-bold">{canvas.zoom.toFixed(1)}x</span>
          <ZBtn onClick={() => actions.setZoom(canvas.zoom + 1)} label="+" />
        </div>
      </div>
    </div>
  );
};

const InfoChip: React.FC<{ icon: string; label: string; value: string; accent: string }> = ({ icon, label, value, accent }) => (
  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] font-arabic">
    <span className="text-[10px]">{icon}</span>
    <span className="text-[10px] text-white/35">{label}</span>
    <span className="text-[11px] font-black font-mono" style={{ color: accent }}>{value}</span>
  </div>
);

const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-1">
    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
    <span className="text-[9px] text-white/35 font-arabic">{label}</span>
  </div>
);

const ToggleBtn: React.FC<{ label: string; active: boolean; onClick: () => void; color: string }> = ({ label, active, onClick, color }) => (
  <button
    onClick={onClick}
    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer font-arabic ${
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
    className="w-6 h-6 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/50 text-sm hover:bg-white/[0.1] transition-all cursor-pointer font-mono flex items-center justify-center"
  >
    {label}
  </button>
);

// ── أدوات مساعدة ──
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function formatTime(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
