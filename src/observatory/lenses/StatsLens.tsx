"use client";
// ============================================================================
//  StatsLens.tsx — 🎯 الأرقام الصادقة
//  إحصاءات تفاعلية عميقة على مجموعة البارات المُرشَّحة:
//    • هيستوغرام قابل للنقر لكل بُعد (مقاطع · وزن إيقاعي · ثقل سوني)
//    • توزيع المشاعر (دائرة + بطاقات نسبية)
//    • بطاقات الرؤى الفورية (أعلى / أدنى / متوسط)
//    • مشتّت ثنائي: الوزن الإيقاعي × الثقل السوني مع تلوين المشاعر
//    • نقر أي خانة أو نقطة → Brush على مجموعتها
// ============================================================================

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useObservatory } from "../ObservatoryContext";
import type { Bar } from "../../types";

// ── ألوان المشاعر (متسقة مع ConstellationLens) ─────────────────────────────
const EMOTION_COLORS: Record<string, string> = {
  حزن:    "#818CF8",
  فرح:    "#34D399",
  غضب:    "#F87171",
  حنين:   "#C084FC",
  أمل:    "#FCD34D",
  هدوء:   "#67E8F9",
  فخر:    "#FB923C",
  حب:     "#F472B6",
};
function emotionColor(e: string) {
  return EMOTION_COLORS[e] ?? "#94A3B8";
}

// ── أبعاد الهيستوغرام ──────────────────────────────────────────────────────
const DIMS = [
  { key: "syllableCount",   label: "المقاطع",       bins: 8,  color: "#38BDF8" },
  { key: "rhythmicWeight",  label: "الوزن الإيقاعي", bins: 8,  color: "#F59E0B" },
  { key: "sonicWeight",     label: "الثقل السوني",   bins: 8,  color: "#A78BFA" },
] as const;

type DimKey = typeof DIMS[number]["key"];

// ── استخراج قيمة البُعد ────────────────────────────────────────────────────
function dimValue(bar: Bar, key: DimKey): number {
  if (key === "syllableCount") {
    return bar.syllableCount ?? Math.round((bar.totalMorae || 16) / 2);
  }
  return (bar[key] as number) ?? 0;
}

// ── بناء بيانات الهيستوغرام ─────────────────────────────────────────────────
interface Bin { lo: number; hi: number; bars: Bar[]; count: number; }
function buildHistogram(bars: Bar[], key: DimKey, binCount: number): Bin[] {
  if (!bars.length) return [];
  const values = bars.map(b => dimValue(b, key));
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  if (lo === hi) {
    return [{ lo, hi: lo + 1, bars: [...bars], count: bars.length }];
  }
  const step = (hi - lo) / binCount;
  const buckets: Bin[] = Array.from({ length: binCount }, (_, i) => ({
    lo: lo + i * step,
    hi: lo + (i + 1) * step,
    bars: [],
    count: 0,
  }));
  bars.forEach(b => {
    const v = dimValue(b, key);
    const idx = Math.min(Math.floor((v - lo) / step), binCount - 1);
    buckets[idx].bars.push(b);
    buckets[idx].count++;
  });
  return buckets;
}

// ── توزيع المشاعر ───────────────────────────────────────────────────────────
interface EmotionSlice { emotion: string; count: number; pct: number; barIds: string[]; }
function buildEmotionDist(bars: Bar[]): EmotionSlice[] {
  const map: Record<string, string[]> = {};
  bars.forEach(b => {
    const e = b.dominantMood || b.emotion || "غير محدد";
    (map[e] = map[e] || []).push(b.id);
  });
  const total = bars.length || 1;
  return Object.entries(map)
    .map(([emotion, ids]) => ({ emotion, count: ids.length, pct: ids.length / total, barIds: ids }))
    .sort((a, b) => b.count - a.count);
}

// ── بطاقات الرؤى ────────────────────────────────────────────────────────────
interface InsightCard { label: string; value: string; sub: string; barId?: string; }
function buildInsights(bars: Bar[]): InsightCard[] {
  if (!bars.length) return [];
  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const rws = bars.map(b => b.rhythmicWeight ?? 0);
  const sws = bars.map(b => b.sonicWeight ?? 0);
  const sylls = bars.map(b => dimValue(b, "syllableCount"));
  const maxRW = Math.max(...rws);
  const minRW = Math.min(...rws);
  const heaviestBar = bars[rws.indexOf(maxRW)];
  const lightestBar = bars[rws.indexOf(minRW)];
  const maxSyll = Math.max(...sylls);
  const densestBar = bars[sylls.indexOf(maxSyll)];
  return [
    {
      label: "أثقل بار إيقاعياً",
      value: maxRW.toFixed(2),
      sub: heaviestBar?.text?.slice(0, 40) + "…" || "",
      barId: heaviestBar?.id,
    },
    {
      label: "أخف بار إيقاعياً",
      value: minRW.toFixed(2),
      sub: lightestBar?.text?.slice(0, 40) + "…" || "",
      barId: lightestBar?.id,
    },
    {
      label: "متوسط الوزن الإيقاعي",
      value: avg(rws).toFixed(2),
      sub: `متوسط الثقل السوني: ${avg(sws).toFixed(2)}`,
    },
    {
      label: "أكثف بار مقطعياً",
      value: `${maxSyll} مقطع`,
      sub: densestBar?.text?.slice(0, 40) + "…" || "",
      barId: densestBar?.id,
    },
  ];
}

// ── Scatter Point ────────────────────────────────────────────────────────────
interface ScatterPt { x: number; y: number; bar: Bar; }
function buildScatter(bars: Bar[]): ScatterPt[] {
  return bars.map(b => ({
    x: b.rhythmicWeight ?? 0,
    y: b.sonicWeight ?? 0,
    bar: b,
  }));
}

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  COMPONENT                                                               ║
// ╚══════════════════════════════════════════════════════════════════════════╝
export function StatsLens() {
  const { derivedBars, brush, clearBrush, vizSelection } = useObservatory();
  const [activeDim, setActiveDim] = useState<DimKey>("rhythmicWeight");
  const [hoveredBin, setHoveredBin] = useState<number | null>(null);
  const [hoveredEmotion, setHoveredEmotion] = useState<string | null>(null);
  const [hoveredScatter, setHoveredScatter] = useState<string | null>(null);
  const scatterRef = useRef<SVGSVGElement>(null);
  const [scatterSize, setScatterSize] = useState({ w: 300, h: 200 });

  // responsive scatter
  useEffect(() => {
    const el = scatterRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const e = entries[0].contentRect;
      setScatterSize({ w: e.width, h: e.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const selectedIds = useMemo(
    () => new Set(vizSelection?.barIds ?? []),
    [vizSelection]
  );

  // ── compute ────────────────────────────────────────────────────────────
  const dim = useMemo(() => DIMS.find(d => d.key === activeDim)!, [activeDim]);
  const histogram = useMemo(
    () => buildHistogram(derivedBars, activeDim, dim.bins),
    [derivedBars, activeDim, dim.bins]
  );
  const maxBinCount = useMemo(
    () => Math.max(1, ...histogram.map(b => b.count)),
    [histogram]
  );
  const emotionDist = useMemo(() => buildEmotionDist(derivedBars), [derivedBars]);
  const insights = useMemo(() => buildInsights(derivedBars), [derivedBars]);
  const scatterPts = useMemo(() => buildScatter(derivedBars), [derivedBars]);

  // scatter coordinate helpers
  const PAD = { l: 32, r: 16, t: 16, b: 28 };
  const maxX = useMemo(() => Math.max(1, ...scatterPts.map(p => p.x)), [scatterPts]);
  const maxY = useMemo(() => Math.max(1, ...scatterPts.map(p => p.y)), [scatterPts]);
  const toSX = useCallback(
    (v: number) => PAD.l + (v / maxX) * (scatterSize.w - PAD.l - PAD.r),
    [maxX, scatterSize.w]
  );
  const toSY = useCallback(
    (v: number) => (scatterSize.h - PAD.b) - (v / maxY) * (scatterSize.h - PAD.t - PAD.b),
    [maxY, scatterSize.h]
  );

  // ── handlers ───────────────────────────────────────────────────────────
  const handleBinClick = useCallback((bin: Bin) => {
    if (!bin.bars.length) return;
    brush(bin.bars.map(b => b.id), {
      lens: "stats",
      label: `${dim.label}: ${bin.lo.toFixed(1)}–${bin.hi.toFixed(1)}`,
    });
  }, [brush, dim]);

  const handleEmotionClick = useCallback((slice: EmotionSlice) => {
    brush(slice.barIds, { lens: "stats", label: `مشاعر: ${slice.emotion}` });
  }, [brush]);

  const handleScatterClick = useCallback((pt: ScatterPt) => {
    // brush nearest 12 by euclidean distance
    const scored = scatterPts
      .map(p => ({
        id: p.bar.id,
        d: Math.hypot(p.x - pt.x, p.y - pt.y),
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 12);
    brush(scored.map(s => s.id), {
      lens: "stats",
      label: `قريب من (${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`,
    });
  }, [scatterPts, brush]);

  // ── empty state ────────────────────────────────────────────────────────
  if (!derivedBars.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
        لا توجد بارات لعرض إحصاءاتها
      </div>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 text-white" dir="rtl">

      {/* ── Insight Cards ── */}
      <section>
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
          رؤى فورية
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {insights.map((card, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => card.barId && brush([card.barId], { lens: "stats", label: card.label })}
              className={`bg-white/5 rounded-xl p-3 text-right border transition-colors
                ${card.barId
                  ? "border-white/10 hover:border-amber-400/40 cursor-pointer"
                  : "border-white/5 cursor-default"
                }`}
            >
              <p className="text-xs text-white/40 mb-1">{card.label}</p>
              <p className="text-xl font-bold text-amber-400">{card.value}</p>
              {card.sub && (
                <p className="text-[10px] text-white/30 mt-1 truncate">{card.sub}</p>
              )}
            </motion.button>
          ))}
        </div>
      </section>

      {/* ── Histogram ── */}
      <section>
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest">
            توزيع
          </h3>
          {DIMS.map(d => (
            <button
              key={d.key}
              onClick={() => setActiveDim(d.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all
                ${activeDim === d.key
                  ? "text-zinc-900"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              style={activeDim === d.key ? { backgroundColor: d.color } : {}}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="bg-white/[0.03] rounded-xl p-4">
          <div className="flex items-end gap-1 h-32">
            {histogram.map((bin, i) => {
              const pct = bin.count / maxBinCount;
              const isHovered = hoveredBin === i;
              const hasSelected = bin.bars.some(b => selectedIds.has(b.id));
              return (
                <motion.button
                  key={i}
                  className="flex-1 relative flex flex-col items-center justify-end group"
                  onMouseEnter={() => setHoveredBin(i)}
                  onMouseLeave={() => setHoveredBin(null)}
                  onClick={() => handleBinClick(bin)}
                  title={`${bin.lo.toFixed(1)} – ${bin.hi.toFixed(1)}: ${bin.count} بار`}
                >
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: pct }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.04 }}
                    style={{
                      backgroundColor: dim.color,
                      originY: 1,
                      opacity: hasSelected ? 1 : isHovered ? 0.9 : 0.55,
                    }}
                    className="w-full rounded-t-sm h-full transition-opacity"
                  />
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-10 pointer-events-none"
                    >
                      {bin.count} بار
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-white/30">
              {histogram[0]?.lo.toFixed(1)}
            </span>
            <span className="text-[10px] text-white/30">
              {histogram[histogram.length - 1]?.hi.toFixed(1)}
            </span>
          </div>
          <p className="text-center text-[10px] text-white/30 mt-0.5">{dim.label}</p>
        </div>
      </section>

      {/* ── Emotion Distribution ── */}
      <section>
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
          توزيع المشاعر
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* bars */}
          <div className="space-y-2">
            {emotionDist.slice(0, 8).map((slice, i) => {
              const isHov = hoveredEmotion === slice.emotion;
              const hasSel = slice.barIds.some(id => selectedIds.has(id));
              return (
                <motion.button
                  key={slice.emotion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleEmotionClick(slice)}
                  onMouseEnter={() => setHoveredEmotion(slice.emotion)}
                  onMouseLeave={() => setHoveredEmotion(null)}
                  className="w-full flex items-center gap-2 text-right hover:bg-white/5 px-2 py-1 rounded-lg transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: emotionColor(slice.emotion) }}
                  />
                  <span className="text-xs text-white/70 w-14 text-right truncate">
                    {slice.emotion}
                  </span>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${slice.pct * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05 }}
                      className="h-full rounded-full transition-opacity"
                      style={{
                        backgroundColor: emotionColor(slice.emotion),
                        opacity: hasSel ? 1 : isHov ? 0.85 : 0.55,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-white/40 w-12 text-left">
                    {slice.count} ({(slice.pct * 100).toFixed(0)}%)
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* donut */}
          <div className="flex items-center justify-center">
            <svg viewBox="0 0 120 120" className="w-32 h-32" aria-hidden>
              {(() => {
                let cursor = 0;
                const R = 44, r = 28, cx = 60, cy = 60;
                return emotionDist.map(slice => {
                  const angle = slice.pct * 2 * Math.PI;
                  const x1 = cx + R * Math.sin(cursor);
                  const y1 = cy - R * Math.cos(cursor);
                  const x2 = cx + R * Math.sin(cursor + angle);
                  const y2 = cy - R * Math.cos(cursor + angle);
                  const xi1 = cx + r * Math.sin(cursor);
                  const yi1 = cy - r * Math.cos(cursor);
                  const xi2 = cx + r * Math.sin(cursor + angle);
                  const yi2 = cy - r * Math.cos(cursor + angle);
                  const large = angle > Math.PI ? 1 : 0;
                  const d = [
                    `M ${x1} ${y1}`,
                    `A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`,
                    `L ${xi2} ${yi2}`,
                    `A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1}`,
                    "Z",
                  ].join(" ");
                  const isHov = hoveredEmotion === slice.emotion;
                  cursor += angle;
                  return (
                    <motion.path
                      key={slice.emotion}
                      d={d}
                      fill={emotionColor(slice.emotion)}
                      opacity={isHov ? 1 : 0.65}
                      className="cursor-pointer"
                      whileHover={{ scale: 1.04 }}
                      onClick={() => handleEmotionClick(slice)}
                      onMouseEnter={() => setHoveredEmotion(slice.emotion)}
                      onMouseLeave={() => setHoveredEmotion(null)}
                    />
                  );
                });
              })()}
              <circle cx="60" cy="60" r="28" fill="rgba(15,15,20,0.85)" />
              <text x="60" y="55" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.5)">
                {derivedBars.length}
              </text>
              <text x="60" y="68" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.3)">
                بار
              </text>
            </svg>
          </div>
        </div>
      </section>

      {/* ── Scatter Plot ── */}
      <section>
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">
          الوزن الإيقاعي × الثقل السوني
        </h3>
        <div className="bg-white/[0.03] rounded-xl p-2">
          <svg
            ref={scatterRef}
            className="w-full"
            style={{ height: 220 }}
            onMouseLeave={() => setHoveredScatter(null)}
          >
            {/* axes */}
            <line
              x1={PAD.l} y1={PAD.t}
              x2={PAD.l} y2={scatterSize.h - PAD.b}
              stroke="rgba(255,255,255,0.1)" strokeWidth={1}
            />
            <line
              x1={PAD.l} y1={scatterSize.h - PAD.b}
              x2={scatterSize.w - PAD.r} y2={scatterSize.h - PAD.b}
              stroke="rgba(255,255,255,0.1)" strokeWidth={1}
            />
            {/* axis labels */}
            <text
              x={scatterSize.w / 2} y={scatterSize.h - 4}
              textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.3)"
            >
              الوزن الإيقاعي
            </text>
            <text
              x={10} y={scatterSize.h / 2}
              textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.3)"
              transform={`rotate(-90, 10, ${scatterSize.h / 2})`}
            >
              الثقل السوني
            </text>

            {/* points */}
            {scatterPts.map(pt => {
              const cx = toSX(pt.x);
              const cy = toSY(pt.y);
              const isHov = hoveredScatter === pt.bar.id;
              const isSel = selectedIds.has(pt.bar.id);
              const col = emotionColor(pt.bar.dominantMood || pt.bar.emotion || "");
              return (
                <motion.circle
                  key={pt.bar.id}
                  cx={cx}
                  cy={cy}
                  r={isHov ? 6 : isSel ? 5 : 3}
                  fill={col}
                  fillOpacity={isSel ? 0.95 : isHov ? 0.9 : selectedIds.size > 0 ? 0.2 : 0.55}
                  stroke={isHov ? "#fff" : "none"}
                  strokeWidth={1}
                  className="cursor-pointer"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  onMouseEnter={() => setHoveredScatter(pt.bar.id)}
                  onClick={() => handleScatterClick(pt)}
                />
              );
            })}

            {/* hover tooltip */}
            {hoveredScatter && (() => {
              const pt = scatterPts.find(p => p.bar.id === hoveredScatter);
              if (!pt) return null;
              const cx = toSX(pt.x);
              const cy = toSY(pt.y);
              return (
                <g>
                  <rect
                    x={cx + 8} y={cy - 20}
                    width={120} height={36}
                    rx={4} fill="rgba(20,20,30,0.92)"
                    stroke="rgba(255,255,255,0.1)" strokeWidth={0.5}
                  />
                  <text x={cx + 14} y={cy - 5} fontSize={9} fill="rgba(255,255,255,0.8)">
                    {pt.bar.text?.slice(0, 22)}…
                  </text>
                  <text x={cx + 14} y={cy + 10} fontSize={8} fill="rgba(255,255,255,0.4)">
                    إيقاع: {pt.x.toFixed(2)} · سوني: {pt.y.toFixed(2)}
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>
        <p className="text-[10px] text-white/30 text-center mt-1">
          كل نقطة بار · اللون = المشاعر · انقر لتشابه المنطقة
        </p>
      </section>

      {/* ── clear brush ── */}
      <AnimatePresence>
        {vizSelection && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex justify-center pb-4"
          >
            <button
              onClick={clearBrush}
              className="px-4 py-1.5 rounded-full text-xs bg-white/10 hover:bg-white/20 text-white/60 transition-colors"
            >
              إلغاء التحديد ({vizSelection.barIds.length} بار)
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
