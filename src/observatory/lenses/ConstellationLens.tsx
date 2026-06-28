"use client";
// ============================================================================
//  ConstellationLens.tsx — 🌌 سماء البارات
//  تُصوِّر كل بار نجمةً في فضاءٍ ثنائي الأبعاد مبنيٍّ على:
//    X: الوزن الإيقاعي (rhythmicWeight)
//    Y: كثافة المقاطع الصوتية (syllableCount)
//    اللون: المشاعر (emotion)
//    الحجم: الوزن السوني (sonicWeight)
//
//  التفاعل:
//    • مرور الفأرة: tooltip بنص البار + إحصاءاته
//    • نقر نجمة: Brush على البارات ذات القافية المشتركة
//    • سحب (box-select): Brush على منطقة مستطيلة
//    • زر المسح: إلغاء التصفية المتقاطعة
// ============================================================================

import React, {
  useEffect, useRef, useMemo, useCallback, useState,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { useObservatory } from "../ObservatoryContext";
import type { Bar } from "../../types";

// ── ألوان المشاعر ──────────────────────────────────────────────────────────
const EMOTION_COLORS: Record<string, string> = {
  aggressive: "#EF4444",
  sad:        "#3B82F6",
  triumphant: "#F59E0B",
  cinematic:  "#8B5CF6",
  romantic:   "#EC4899",
  neutral:    "#64748B",
};

const DEFAULT_COLOR = "#94A3B8";

function emotionColor(emotion?: string): string {
  return EMOTION_COLORS[emotion || ""] || DEFAULT_COLOR;
}

// ── نقطة مُشتقّة بعد الحساب ─────────────────────────────────────────────────
interface StarPoint {
  bar: Bar;
  x: number;     // 0-1
  y: number;     // 0-1
  r: number;     // radius px
  color: string;
  glow: string;  // rgba glow color
}

// ── احسب مواضع النجوم من derivedBars ─────────────────────────────────────────
function computeStars(bars: Bar[]): StarPoint[] {
  if (!bars.length) return [];
  const maxSyll = Math.max(...bars.map(b => b.syllableCount || b.totalMorae / 2 || 8));
  const minSyll = Math.min(...bars.map(b => b.syllableCount || b.totalMorae / 2 || 8));
  const syllRange = Math.max(1, maxSyll - minSyll);

  return bars.map((bar, i) => {
    const rw = Math.max(0, Math.min(1, bar.rhythmicWeight || 0));
    const sw = Math.max(0, Math.min(1, bar.sonicWeight || 0));
    const syll = bar.syllableCount || Math.round((bar.totalMorae || 16) / 2);
    // تشتيتٌ بسيطٌ يمنع التراكم المباشر على خط واحد
    const jitterX = (Math.sin(i * 2.718) * 0.04);
    const jitterY = (Math.cos(i * 1.618) * 0.04);
    const x = Math.max(0.04, Math.min(0.96, rw + jitterX));
    const y = Math.max(0.04, Math.min(0.96, 1 - (syll - minSyll) / syllRange + jitterY));
    const r = 3 + sw * 9;
    const col = emotionColor(bar.emotion);
    return { bar, x, y, r, color: col, glow: col + "88" };
  });
}

// ── مسافة نقطتين ─────────────────────────────────────────────────────────────
function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

// ── خريطة مصغّرة للمشاعر في الـ legend ──────────────────────────────────────
const EMOTION_META = [
  { key: "aggressive", label: "قوي",        color: "#EF4444" },
  { key: "triumphant", label: "انتصار",     color: "#F59E0B" },
  { key: "sad",        label: "حزين",       color: "#3B82F6" },
  { key: "cinematic",  label: "سينمائي",    color: "#8B5CF6" },
  { key: "romantic",   label: "رومانسي",    color: "#EC4899" },
  { key: "neutral",    label: "محايد",      color: "#64748B" },
];

// ============================================================================
export const ConstellationLens: React.FC = () => {
  const { derivedBars, brush, clearBrush, vizSelection } = useObservatory();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  // حالة التفاعل
  const [hovered, setHovered] = useState<StarPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ sx: number; sy: number; ex: number; ey: number } | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const stars = useMemo(() => computeStars(derivedBars), [derivedBars]);

  // IDs المحددة حالياً عبر brush
  const selectedIds = useMemo(() => new Set(vizSelection?.barIds || []), [vizSelection]);

  // ── رسم الـ Canvas ──────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const PAD = 40;
    const cW = W - PAD * 2;
    const cH = H - PAD * 2;

    ctx.clearRect(0, 0, W, H);

    // خلفية
    ctx.fillStyle = "#04060e";
    ctx.fillRect(0, 0, W, H);

    // شبكة خفيفة
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= 4; gx++) {
      const px = PAD + (gx / 4) * cW;
      ctx.beginPath(); ctx.moveTo(px, PAD); ctx.lineTo(px, H - PAD); ctx.stroke();
    }
    for (let gy = 0; gy <= 4; gy++) {
      const py = PAD + (gy / 4) * cH;
      ctx.beginPath(); ctx.moveTo(PAD, py); ctx.lineTo(W - PAD, py); ctx.stroke();
    }

    // محاور
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, PAD); ctx.lineTo(PAD, H - PAD); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD, H - PAD); ctx.lineTo(W - PAD, H - PAD); ctx.stroke();

    // تسميات المحاور
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "11px 'Cairo', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("الوزن الإيقاعي →", W / 2, H - 8);
    ctx.save();
    ctx.translate(12, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("كثافة المقاطع →", 0, 0);
    ctx.restore();

    // منطقة السحب
    if (drag) {
      const dx = PAD + drag.sx * cW;
      const dy = PAD + drag.sy * cH;
      const dw = (drag.ex - drag.sx) * cW;
      const dh = (drag.ey - drag.sy) * cH;
      ctx.strokeStyle = "rgba(251,191,36,0.5)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(dx, dy, dw, dh);
      ctx.fillStyle = "rgba(251,191,36,0.05)";
      ctx.fillRect(dx, dy, dw, dh);
      ctx.setLineDash([]);
    }

    // النجوم
    for (const star of stars) {
      const px = PAD + star.x * cW;
      const py = PAD + star.y * cH;
      const isSel = selectedIds.size > 0 ? selectedIds.has(star.bar.id) : true;
      const isHov = hovered?.bar.id === star.bar.id;

      // glow للمحدد أو المرئي
      if (isSel && (isHov || star.bar.isFavorite)) {
        const grad = ctx.createRadialGradient(px, py, 0, px, py, star.r * 3);
        grad.addColorStop(0, star.glow);
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(px, py, star.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // النجمة
      ctx.beginPath();
      ctx.arc(px, py, star.r, 0, Math.PI * 2);
      ctx.fillStyle = isSel ? star.color : star.color + "33";
      ctx.fill();

      // حلقة للمحدد
      if (isHov || (selectedIds.has(star.bar.id) && selectedIds.size > 0)) {
        ctx.strokeStyle = star.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // نجمة المفضلة
      if (star.bar.isFavorite) {
        ctx.fillStyle = "#F5C84B";
        ctx.font = "9px serif";
        ctx.textAlign = "center";
        ctx.fillText("★", px, py - star.r - 3);
      }
    }
  }, [stars, hovered, drag, selectedIds]);

  // ── إعداد Canvas و ResizeObserver ──────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      draw();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(draw);
  }, [draw]);

  // ── أحداث الفأرة ───────────────────────────────────────────────────────────
  const getStarAt = useCallback((cx: number, cy: number, canvas: HTMLCanvasElement) => {
    const PAD = 40;
    const cW = canvas.width - PAD * 2;
    const cH = canvas.height - PAD * 2;
    const nx = (cx - PAD) / cW;
    const ny = (cy - PAD) / cH;
    return stars.find(s => dist(s.x, s.y, nx, ny) < (s.r + 4) / Math.min(cW, cH));
  }, [stars]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    if (isDragging.current) {
      const PAD = 40;
      const cW = canvas.width - PAD * 2;
      const cH = canvas.height - PAD * 2;
      setDrag({
        sx: dragStart.current.x,
        sy: dragStart.current.y,
        ex: (cx - PAD) / cW,
        ey: (cy - PAD) / cH,
      });
      return;
    }

    const found = getStarAt(cx, cy, canvas);
    setHovered(found || null);
    if (found) setTooltipPos({ x: cx, y: cy });
  }, [getStarAt]);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const found = getStarAt(cx, cy, canvas);
    if (found) return; // سيُعالَج في onClick
    // بدء السحب
    const PAD = 40;
    const cW = canvas.width - PAD * 2;
    const cH = canvas.height - PAD * 2;
    isDragging.current = true;
    const nx = (cx - PAD) / cW;
    const ny = (cy - PAD) / cH;
    dragStart.current = { x: nx, y: ny };
    setDrag({ sx: nx, sy: ny, ex: nx, ey: ny });
  }, [getStarAt]);

  const onMouseUp = useCallback(() => {
    if (!isDragging.current || !drag) {
      isDragging.current = false;
      setDrag(null);
      return;
    }
    isDragging.current = false;
    // box-select
    const minX = Math.min(drag.sx, drag.ex);
    const maxX = Math.max(drag.sx, drag.ex);
    const minY = Math.min(drag.sy, drag.ey);
    const maxY = Math.max(drag.sy, drag.ey);
    const boxSize = (maxX - minX) * (maxY - minY);
    if (boxSize > 0.001) {
      const selected = stars
        .filter(s => s.x >= minX && s.x <= maxX && s.y >= minY && s.y <= maxY)
        .map(s => s.bar.id);
      if (selected.length > 0) {
        brush(selected, { lens: "constellation", label: `منطقة تضم ${selected.length} بار` });
      }
    }
    setDrag(null);
  }, [drag, stars, brush]);

  const onClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drag && (Math.abs(drag.ex - drag.sx) > 0.01 || Math.abs(drag.ey - drag.sy) > 0.01)) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const found = getStarAt(e.clientX - rect.left, e.clientY - rect.top, canvas);
    if (!found) {
      clearBrush();
      return;
    }
    // brush على البارات ذات القافية المشتركة
    const core = found.bar.corePhoneme || found.bar.endPhoneme?.slice(-2) || "";
    const siblings = stars
      .filter(s => (s.bar.corePhoneme || s.bar.endPhoneme?.slice(-2) || "") === core)
      .map(s => s.bar.id);
    if (siblings.length > 0) {
      brush(siblings, { lens: "constellation", label: `قافية «${core || "مشتركة"}» — ${siblings.length} بار` });
    }
  }, [drag, getStarAt, stars, brush, clearBrush]);

  // ── الإحصاءات السريعة (أعلى اليمين) ──────────────────────────────────────
  const quickStats = useMemo(() => {
    if (!derivedBars.length) return null;
    const avgRW = derivedBars.reduce((s, b) => s + (b.rhythmicWeight || 0), 0) / derivedBars.length;
    const avgSW = derivedBars.reduce((s, b) => s + (b.sonicWeight || 0), 0) / derivedBars.length;
    return { avgRW: (avgRW * 100).toFixed(0), avgSW: (avgSW * 100).toFixed(0) };
  }, [derivedBars]);

  // ── عد المشاعر للـ legend ─────────────────────────────────────────────────
  const emotionCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of derivedBars) {
      const em = b.emotion || "neutral";
      map[em] = (map[em] || 0) + 1;
    }
    return map;
  }, [derivedBars]);

  if (!derivedBars.length) {
    return (
      <div className="w-full h-full min-h-[420px] flex items-center justify-center text-white/30 text-sm font-arabic">
        لا توجد بارات للعرض — عدّل الفلاتر
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-3" dir="rtl">
      {/* ── رأس ── */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌌</span>
          <div>
            <h2 className="text-sm font-black text-white font-arabic">سماء البارات</h2>
            <p className="text-[10px] text-white/30 font-arabic">
              {derivedBars.length} نجمة · انقر لتصفية القافية · اسحب لتحديد منطقة
            </p>
          </div>
        </div>
        {quickStats && (
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="text-white/40">وزن إيقاعي متوسط: <b className="text-amber-400">{quickStats.avgRW}%</b></span>
            <span className="text-white/40">ثقل سوني متوسط: <b className="text-purple-400">{quickStats.avgSW}%</b></span>
          </div>
        )}
      </div>

      {/* ── الـ Legend ── */}
      <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
        {EMOTION_META.filter(em => emotionCounts[em.key]).map(em => (
          <div key={em.key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: em.color }} />
            <span className="text-[10px] text-white/50 font-arabic">{em.label}</span>
            <span className="text-[10px] font-mono text-white/25">({emotionCounts[em.key]})</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mr-2">
          <div className="w-2.5 h-2.5 rounded-full border border-amber-400/60 flex items-center justify-center">
            <span className="text-[7px] text-amber-400">★</span>
          </div>
          <span className="text-[10px] text-white/50 font-arabic">مفضلة</span>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div ref={containerRef} className="flex-1 min-h-0 relative rounded-2xl overflow-hidden bg-[#04060e] border border-white/[0.06]">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseMove={onMouseMove}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseLeave={() => { setHovered(null); onMouseUp(); }}
          onClick={onClick}
        />

        {/* Tooltip */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              key={hovered.bar.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.12 }}
              className="absolute pointer-events-none z-20 max-w-[220px]"
              style={{
                left: tooltipPos.x + 14,
                top: Math.max(0, tooltipPos.y - 60),
              }}
            >
              <div className="bg-[#0a0d1a]/95 border border-white/10 rounded-xl p-3 shadow-2xl">
                <p className="text-xs text-white/90 font-arabic leading-relaxed mb-2 font-bold">
                  {hovered.bar.text}
                </p>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono">
                    {hovered.bar.syllableCount || 0}م
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 font-mono">
                    ر:{hovered.bar.rhythmicWeight?.toFixed(2) || 0}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 font-mono">
                    س:{hovered.bar.sonicWeight?.toFixed(2) || 0}
                  </span>
                  {hovered.bar.corePhoneme && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-arabic">
                      ق:{hovered.bar.corePhoneme}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* تلميح السحب */}
        {!vizSelection && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-white/15 font-arabic pointer-events-none">
            انقر نجمةً ← قافيتها · اسحب ← منطقة · انقر الفراغ ← مسح
          </div>
        )}
      </div>
    </div>
  );
};
