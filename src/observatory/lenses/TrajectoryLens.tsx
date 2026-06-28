"use client";
// ============================================================================
//  TrajectoryLens.tsx — 📈 نبض الكوبليه
//  تُصوِّر تدفّق طاقة البارات عبر تسلسلها الزمني (الترتيب في المستودع):
//    • ثلاث موجات: الوزن الإيقاعي · الثقل السوني · كثافة المقاطع
//    • تظليل المساحة تحت كل موجة يُعطي انطباعاً عن «نبض الكوبليه»
//    • نقر أي نقطة: Brush على النقطة وجاراتها العشر الأقرب إيقاعياً
//    • سحب أفقي: Brush على نطاقٍ من البارات (محور التسلسل)
//    • زر تبديل الموجات يُخفي/يُظهر كل مسار
// ============================================================================

import React, {
  useRef, useMemo, useState, useCallback, useEffect,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { useObservatory } from "../ObservatoryContext";
import type { Bar } from "../../types";

// ── ألوان المسارات ────────────────────────────────────────────────────────────
const TRACKS = [
  { key: "rhythmicWeight", label: "الوزن الإيقاعي", color: "#F59E0B", fill: "#F59E0B22" },
  { key: "sonicWeight",    label: "الثقل السوني",   color: "#A78BFA", fill: "#A78BFA22" },
  { key: "syllables",      label: "كثافة المقاطع",  color: "#38BDF8", fill: "#38BDF822" },
] as const;

type TrackKey = typeof TRACKS[number]["key"];

// ── استخراج قيمة المسار لبار ──────────────────────────────────────────────
function trackValue(bar: Bar, key: TrackKey, maxSyll: number): number {
  if (key === "syllables") {
    const s = bar.syllableCount || Math.round((bar.totalMorae || 16) / 2);
    return maxSyll > 0 ? s / maxSyll : 0;
  }
  return Math.max(0, Math.min(1, (bar[key] as number) || 0));
}

// ── بناء مسار SVG polyline ──────────────────────────────────────────────────
function buildPath(
  values: number[],
  W: number,
  H: number,
  PAD: { l: number; r: number; t: number; b: number }
): string {
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  if (!values.length) return "";
  return values
    .map((v, i) => {
      const x = PAD.l + (i / Math.max(1, values.length - 1)) * cW;
      const y = PAD.t + (1 - v) * cH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

// ── بناء مسار مساحة مُغلقة للتظليل ──────────────────────────────────────────
function buildAreaPath(
  values: number[],
  W: number,
  H: number,
  PAD: { l: number; r: number; t: number; b: number }
): string {
  const line = buildPath(values, W, H, PAD);
  if (!line) return "";
  const lastX = PAD.l + W - PAD.l - PAD.r;
  const baseY = PAD.t + (H - PAD.t - PAD.b);
  return `${line} L${lastX.toFixed(1)},${baseY.toFixed(1)} L${PAD.l},${baseY.toFixed(1)} Z`;
}

// ============================================================================
export const TrajectoryLens: React.FC = () => {
  const { derivedBars, brush, clearBrush, vizSelection } = useObservatory();

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 300 });
  const [visibleTracks, setVisibleTracks] = useState<Set<TrackKey>>(
    new Set(["rhythmicWeight", "sonicWeight", "syllables"])
  );
  const [hovered, setHovered] = useState<{ bar: Bar; idx: number; x: number; y: number } | null>(null);
  const [dragRange, setDragRange] = useState<[number, number] | null>(null);
  const isDragging = useRef(false);
  const dragStartIdx = useRef(0);

  // الـ PAD الثابتة
  const PAD = { l: 44, r: 20, t: 20, b: 36 };

  // ── ResizeObserver ────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: Math.max(180, height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── البيانات المُشتقّة ────────────────────────────────────────────────────
  const maxSyll = useMemo(
    () => Math.max(...derivedBars.map(b => b.syllableCount || Math.round((b.totalMorae || 16) / 2)), 1),
    [derivedBars]
  );

  const trackData = useMemo(
    () => TRACKS.map(t => ({
      ...t,
      values: derivedBars.map(b => trackValue(b, t.key, maxSyll)),
    })),
    [derivedBars, maxSyll]
  );

  // ── نطاق التحديد بالـ pixel ──────────────────────────────────────────────
  const idxToX = useCallback((idx: number) => {
    const cW = size.w - PAD.l - PAD.r;
    return PAD.l + (idx / Math.max(1, derivedBars.length - 1)) * cW;
  }, [size.w, derivedBars.length, PAD.l, PAD.r]);

  const xToIdx = useCallback((px: number) => {
    const cW = size.w - PAD.l - PAD.r;
    const norm = (px - PAD.l) / cW;
    return Math.round(Math.max(0, Math.min(derivedBars.length - 1, norm * (derivedBars.length - 1))));
  }, [size.w, derivedBars.length, PAD.l, PAD.r]);

  // ── أقرب نقطة للفأرة ─────────────────────────────────────────────────────
  const findNearest = useCallback((clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || !derivedBars.length) return null;
    const px = clientX - rect.left;
    const idx = xToIdx(px);
    return { bar: derivedBars[idx], idx, x: idxToX(idx), y: 0 };
  }, [derivedBars, xToIdx, idxToX]);

  // ── أحداث الفأرة ─────────────────────────────────────────────────────────
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;

    if (isDragging.current) {
      const idx = xToIdx(px);
      setDragRange([dragStartIdx.current, idx]);
      return;
    }

    const found = findNearest(e.clientX);
    if (found) {
      // رفع y للنقطة المُمرَّر عليها (متوسط المسارات المرئية)
      const cH = size.h - PAD.t - PAD.b;
      const avgV = TRACKS.filter(t => visibleTracks.has(t.key))
        .reduce((s, t) => s + trackValue(found.bar, t.key, maxSyll), 0)
        / Math.max(1, visibleTracks.size);
      const y = PAD.t + (1 - avgV) * cH;
      setHovered({ ...found, y: y + rect.top - (svgRef.current?.getBoundingClientRect().top || 0) });
    }
  }, [findNearest, xToIdx, size.h, PAD.t, PAD.b, visibleTracks, maxSyll]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    isDragging.current = true;
    dragStartIdx.current = xToIdx(e.clientX - rect.left);
    setDragRange([dragStartIdx.current, dragStartIdx.current]);
  }, [xToIdx]);

  const onMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (dragRange) {
      const [a, b] = [Math.min(...dragRange), Math.max(...dragRange)];
      if (b - a > 1) {
        const selected = derivedBars.slice(a, b + 1).map(bar => bar.id);
        brush(selected, { lens: "trajectory", label: `البارات ${a + 1}–${b + 1} (${selected.length})` });
        setDragRange(null);
        return;
      }
    }
    setDragRange(null);
  }, [dragRange, derivedBars, brush]);

  const onClick = useCallback((e: React.MouseEvent) => {
    if (dragRange && Math.abs(dragRange[1] - dragRange[0]) > 2) return;
    const found = findNearest(e.clientX);
    if (!found) { clearBrush(); return; }

    // Brush على أقرب 10 بارات إيقاعياً
    const pivot = found.bar.rhythmicWeight || 0;
    const sorted = [...derivedBars]
      .map(b => ({ id: b.id, diff: Math.abs((b.rhythmicWeight || 0) - pivot) }))
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 10)
      .map(b => b.id);
    brush(sorted, { lens: "trajectory", label: `أقرب 10 إيقاعياً لـ #${found.idx + 1}` });
  }, [dragRange, findNearest, derivedBars, brush, clearBrush]);

  // ── تبديل مسار ───────────────────────────────────────────────────────────
  const toggleTrack = (key: TrackKey) => {
    setVisibleTracks(prev => {
      const next = new Set(prev);
      if (next.has(key) && next.size > 1) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ── تسميات محور Y ────────────────────────────────────────────────────────
  const yLabels = [1, 0.75, 0.5, 0.25, 0];
  const selectedIds = useMemo(() => new Set(vizSelection?.barIds || []), [vizSelection]);

  if (!derivedBars.length) {
    return (
      <div className="w-full h-full min-h-[300px] flex items-center justify-center text-white/30 text-sm font-arabic">
        لا توجد بارات — عدّل الفلاتر
      </div>
    );
  }

  const { w, h } = size;
  const cW = w - PAD.l - PAD.r;
  const cH = h - PAD.t - PAD.b;

  // ── خط التحديد (drag range) ──────────────────────────────────────────────
  const dragX1 = dragRange ? idxToX(Math.min(...dragRange)) : 0;
  const dragX2 = dragRange ? idxToX(Math.max(...dragRange)) : 0;

  return (
    <div className="w-full h-full flex flex-col gap-3" dir="rtl">

      {/* رأس */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <div>
            <h2 className="text-sm font-black text-white font-arabic">نبض الكوبليه</h2>
            <p className="text-[10px] text-white/30 font-arabic">
              {derivedBars.length} بار · انقر نقطةً ← أقرب 10 إيقاعياً · اسحب ← نطاق
            </p>
          </div>
        </div>

        {/* تبديل المسارات */}
        <div className="flex items-center gap-2">
          {TRACKS.map(t => (
            <button
              key={t.key}
              onClick={() => toggleTrack(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold border transition-all font-arabic ${
                visibleTracks.has(t.key)
                  ? "border-white/10 bg-white/5"
                  : "border-white/[0.03] opacity-30"
              }`}
            >
              <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: t.color }} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 relative rounded-2xl overflow-hidden border border-white/[0.06] bg-[#04060e]"
      >
        <svg
          ref={svgRef}
          width={w}
          height={h}
          className="w-full h-full cursor-crosshair select-none"
          onMouseMove={onMouseMove}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseLeave={() => { setHovered(null); onMouseUp(); }}
          onClick={onClick}
        >
          {/* شبكة */}
          {yLabels.map(v => {
            const py = PAD.t + (1 - v) * cH;
            return (
              <g key={v}>
                <line x1={PAD.l} y1={py} x2={w - PAD.r} y2={py}
                  stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
                <text x={PAD.l - 6} y={py + 4} textAnchor="end"
                  className="text-[9px]" fill="rgba(255,255,255,0.2)" fontSize={9}>
                  {Math.round(v * 100)}
                </text>
              </g>
            );
          })}

          {/* تسمية محور X */}
          {derivedBars.length <= 30
            ? derivedBars.map((_, i) => {
                if (i % Math.max(1, Math.floor(derivedBars.length / 10)) !== 0) return null;
                return (
                  <text key={i} x={idxToX(i)} y={h - 6} textAnchor="middle"
                    fill="rgba(255,255,255,0.2)" fontSize={8}>
                    {i + 1}
                  </text>
                );
              })
            : [0, Math.floor(derivedBars.length / 4), Math.floor(derivedBars.length / 2),
               Math.floor(derivedBars.length * 3 / 4), derivedBars.length - 1].map(i => (
                <text key={i} x={idxToX(i)} y={h - 6} textAnchor="middle"
                  fill="rgba(255,255,255,0.2)" fontSize={8}>
                  {i + 1}
                </text>
              ))
          }

          {/* خطوط المحور */}
          <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={h - PAD.b}
            stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
          <line x1={PAD.l} y1={h - PAD.b} x2={w - PAD.r} y2={h - PAD.b}
            stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

          {/* مساحات التظليل */}
          {trackData.map(t => {
            if (!visibleTracks.has(t.key)) return null;
            return (
              <path key={`area-${t.key}`}
                d={buildAreaPath(t.values, w, h, PAD)}
                fill={t.fill}
              />
            );
          })}

          {/* المسارات */}
          {trackData.map(t => {
            if (!visibleTracks.has(t.key)) return null;
            return (
              <motion.path
                key={`line-${t.key}`}
                d={buildPath(t.values, w, h, PAD)}
                fill="none"
                stroke={t.color}
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            );
          })}

          {/* نقاط التحديد المُرشَّح عليه */}
          {selectedIds.size > 0 && derivedBars.map((bar, i) => {
            if (!selectedIds.has(bar.id)) return null;
            const px = idxToX(i);
            const rv = trackValue(bar, "rhythmicWeight", maxSyll);
            const py = PAD.t + (1 - rv) * cH;
            return (
              <circle key={bar.id} cx={px} cy={py} r={4}
                fill="#F59E0B" stroke="#04060e" strokeWidth={1.5} opacity={0.9} />
            );
          })}

          {/* نقطة المُرمَّر عليها */}
          {hovered && visibleTracks.size > 0 && (() => {
            const px = idxToX(hovered.idx);
            return (
              <>
                <line x1={px} y1={PAD.t} x2={px} y2={h - PAD.b}
                  stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="4 4" />
                {trackData.filter(t => visibleTracks.has(t.key)).map(t => {
                  const v = t.values[hovered.idx] || 0;
                  const py = PAD.t + (1 - v) * cH;
                  return (
                    <circle key={t.key} cx={px} cy={py} r={5}
                      fill={t.color} stroke="#04060e" strokeWidth={1.5} />
                  );
                })}
              </>
            );
          })()}

          {/* منطقة السحب */}
          {dragRange && (
            <rect
              x={dragX1} y={PAD.t}
              width={Math.abs(dragX2 - dragX1)} height={cH}
              fill="rgba(251,191,36,0.08)"
              stroke="rgba(251,191,36,0.4)"
              strokeWidth={1}
              strokeDasharray="5 3"
            />
          )}
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              key={hovered.idx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute pointer-events-none z-20 max-w-[220px]"
              style={{
                left: Math.min(idxToX(hovered.idx) + 12, w - 240),
                top: Math.max(4, hovered.y - 60),
              }}
            >
              <div className="bg-[#0a0d1a]/95 border border-white/10 rounded-xl p-3 shadow-2xl">
                <p className="text-[9px] text-white/40 font-mono mb-1">بار #{hovered.idx + 1}</p>
                <p className="text-xs text-white/90 font-arabic leading-relaxed mb-2 font-bold line-clamp-2">
                  {hovered.bar.text}
                </p>
                <div className="space-y-1">
                  {TRACKS.map(t => {
                    if (!visibleTracks.has(t.key)) return null;
                    const v = trackValue(hovered.bar, t.key, maxSyll);
                    return (
                      <div key={t.key} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                        <span className="text-[9px] text-white/50 font-arabic flex-1">{t.label}</span>
                        <span className="text-[9px] font-mono font-bold" style={{ color: t.color }}>
                          {(v * 100).toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* تلميح */}
        {!vizSelection && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-white/10 font-arabic pointer-events-none whitespace-nowrap">
            انقر ← أقرب 10 إيقاعياً · اسحب ← نطاق · انقر الفراغ ← مسح
          </div>
        )}
      </div>

      {/* إحصاء سريع */}
      {derivedBars.length > 1 && (() => {
        const avgRW = derivedBars.reduce((s, b) => s + (b.rhythmicWeight || 0), 0) / derivedBars.length;
        const avgSW = derivedBars.reduce((s, b) => s + (b.sonicWeight || 0), 0) / derivedBars.length;
        const maxRW = Math.max(...derivedBars.map(b => b.rhythmicWeight || 0));
        const peakIdx = derivedBars.findIndex(b => (b.rhythmicWeight || 0) === maxRW);
        return (
          <div className="flex items-center gap-4 flex-shrink-0 flex-wrap">
            {[
              { label: "متوسط إيقاعي", val: `${(avgRW * 100).toFixed(0)}%`, color: "#F59E0B" },
              { label: "متوسط سوني",   val: `${(avgSW * 100).toFixed(0)}%`, color: "#A78BFA" },
              { label: "ذروة الطاقة",  val: `بار #${peakIdx + 1}`,          color: "#EF4444" },
              { label: "إجمالي البارات", val: derivedBars.length,           color: "#64748B" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 text-[10px]">
                <span className="text-white/30 font-arabic">{s.label}:</span>
                <span className="font-mono font-bold" style={{ color: s.color }}>{s.val}</span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
};
