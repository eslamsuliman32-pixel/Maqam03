// src/maqam/components/NarrativeArcPanel.tsx
"use client";
import React, { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMaqamStore, type ArcStrategy } from "../../store/maqamStore";
import { cn } from "../../lib/utils";
import type { BeatBlueprint, AudioAnalysisResult } from "../../types/maqam.types";

// ─── Segment Types ─────────────────────────────────────────
interface NarrativeSegment {
  id: string;
  label: string;
  arabicLabel: string;
  startBar: number;
  endBar: number;
  intensity: number; // 0–1
  emotionalTag: string;
  content: string;
  color: string;
  arcRole: "setup" | "rising" | "peak" | "falling" | "resolution";
}

// ─── Arc Strategy Builders ────────────────────────────────
const ARCSTRATEGIES: Record<ArcStrategy, {
  label: string;
  arabicLabel: string;
  description: string;
  icon: string;
  color: string;
  intensityCurve: number[]; // normalized 0–1 per bar fraction
}> = {
  cinematic: {
    label: "Cinematic", arabicLabel: "سينمائي 🎬", icon: "🎬",
    color: "#F59E0B",
    description: "بناء تصاعدي كلاسيكي: مقدمة → تصعيد → ذروة → حل",
    intensityCurve: [0.1, 0.2, 0.3, 0.4, 0.55, 0.65, 0.8, 0.95, 1.0, 0.85, 0.6, 0.3],
  },
  circular: {
    label: "Circular", arabicLabel: "دائري 🔄", icon: "🔄",
    color: "#06B6D4",
    description: "العودة للنقطة الأولى: تبدأ وتنتهي بنفس الطاقة",
    intensityCurve: [0.5, 0.7, 0.9, 1.0, 0.8, 0.6, 0.5, 0.7, 0.9, 1.0, 0.8, 0.5],
  },
  montage: {
    label: "Montage", arabicLabel: "مونتاج ⚡", icon: "⚡",
    color: "#EF4444",
    description: "تحولات مفاجئة وتقطيع سريع: تعاكسات حادة بين المشاعر",
    intensityCurve: [0.9, 0.2, 0.8, 0.1, 1.0, 0.3, 0.85, 0.2, 0.95, 0.4, 0.7, 0.1],
  },
  spiral: {
    label: "Spiral", arabicLabel: "لولبي 🌀", icon: "🌀",
    color: "#8B5CF6",
    description: "تصاعد لولبي: كل دورة أعلى من السابقة",
    intensityCurve: [0.3, 0.5, 0.4, 0.65, 0.55, 0.75, 0.65, 0.85, 0.78, 0.92, 0.88, 1.0],
  },
  explosive: {
    label: "Explosive", arabicLabel: "انفجاري 💥", icon: "💥",
    color: "#F97316",
    description: "ضربة فورية: اقتحام مباشر في الذروة منذ البداية",
    intensityCurve: [1.0, 0.95, 0.85, 0.9, 0.8, 0.85, 0.75, 0.8, 0.7, 0.75, 0.65, 0.5],
  },
};

// ─── Segment Roles ─────────────────────────────────────────
const ROLECONFIG: Record<NarrativeSegment["arcRole"], { arabicLabel: string; color: string }> = {
  setup:      { arabicLabel: "تأسيس",   color: "#06B6D4" },
  rising:     { arabicLabel: "تصاعد",   color: "#10B981" },
  peak:       { arabicLabel: "ذروة",    color: "#EF4444" },
  falling:    { arabicLabel: "هبوط",    color: "#F59E0B" },
  resolution: { arabicLabel: "خاتمة",  color: "#8B5CF6" },
};

function getEmotionalTag(intensity: number, strategy: ArcStrategy): string {
  if (strategy === "explosive") return intensity > 0.8 ? "اقتحام" : "إيقاع";
  if (intensity > 0.9) return "ذروة الطاقة";
  if (intensity > 0.7) return "تصاعد قوي";
  if (intensity > 0.5) return "بناء تدريجي";
  if (intensity > 0.3) return "هدوء نسبي";
  return "تأسيس";
}

// ─── Build Segments ────────────────────────────────────────
function buildSegments(
  totalBars: number,
  strategy: ArcStrategy,
  analysisResult: AudioAnalysisResult | null
): NarrativeSegment[] {
  const curve = ARCSTRATEGIES[strategy].intensityCurve;
  const color = ARCSTRATEGIES[strategy].color;
  const segments: NarrativeSegment[] = [];

  const sections = analysisResult?.sections ?? [];
  const numSegments = Math.max(4, Math.min(12, sections.length || 8));

  const roleOrder: NarrativeSegment["arcRole"][] = ["setup", "rising", "peak", "falling", "resolution"];

  for (let i = 0; i < numSegments; i++) {
    const fraction = i / (numSegments - 1);
    const curveIdx = Math.min(curve.length - 1, Math.floor(fraction * curve.length));
    const intensity = curve[curveIdx] ?? fraction;

    const startBar = Math.floor((i / numSegments) * totalBars);
    const endBar = Math.floor(((i + 1) / numSegments) * totalBars) - 1;

    const roleIdx = Math.min(roleOrder.length - 1, Math.floor(fraction * roleOrder.length));
    const arcRole = roleOrder[roleIdx] ?? "setup";

    const sectionLabel = sections[i]?.label ?? (i === 0 ? "intro" : i === numSegments - 1 ? "outro" : "verse");

    const arcLabels: Record<string, string> = {
      intro: "المقدمة", verse: "بيت", hook: "هوك", bridge: "جسر", outro: "خاتمة",
    };

    segments.push({
      id: `seg-${i}`,
      label: sectionLabel,
      arabicLabel: arcLabels[sectionLabel] ?? `قسم ${i + 1}`,
      startBar,
      endBar,
      intensity,
      emotionalTag: getEmotionalTag(intensity, strategy),
      content: "",
      color,
      arcRole,
    });
  }

  return segments;
}

// ─── Arc Curve SVG ─────────────────────────────────────────
const ArcCurveChart: React.FC<{
  segments: NarrativeSegment[];
  activeSegment: string | null;
  onSegmentClick: (id: string) => void;
  color: string;
}> = ({ segments, activeSegment, onSegmentClick, color }) => {
  const width = 600;
  const height = 120;
  const padding = { x: 20, y: 16 };

  const points = segments.map((seg, i) => ({
    x: padding.x + (i / (segments.length - 1)) * (width - padding.x * 2),
    y: height - padding.y - seg.intensity * (height - padding.y * 2),
  }));

  // Smooth bezier path
  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1]!;
    const cp1x = prev.x + (pt.x - prev.x) / 3;
    const cp2x = prev.x + (2 * (pt.x - prev.x)) / 3;
    return `${acc} C ${cp1x} ${prev.y} ${cp2x} ${pt.y} ${pt.x} ${pt.y}`;
  }, "");

  // Fill area
  const fillD = pathD
    + ` L ${points[points.length - 1]!.x} ${height - padding.y}`
    + ` L ${points[0]!.x} ${height - padding.y} Z`;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="arcGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* Fill area */}
      <path d={fillD} fill="url(#arcGrad)" />

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((level) => (
        <line
          key={level}
          x1={padding.x}
          y1={height - padding.y - level * (height - padding.y * 2)}
          x2={width - padding.x}
          y2={height - padding.y - level * (height - padding.y * 2)}
          stroke="rgba(255,255,255,0.04)"
          strokeDasharray="3 4"
        />
      ))}

      {/* Main curve */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />

      {/* Segment dots */}
      {points.map((pt, i) => {
        const seg = segments[i]!;
        const isActive = activeSegment === seg.id;
        const isPeak = seg.arcRole === "peak";

        return (
          <g key={seg.id} onClick={() => onSegmentClick(seg.id)} className="cursor-pointer">
            {/* Pulse on peak */}
            {isPeak && (
              <motion.circle
                cx={pt.x} cy={pt.y}
                r={12}
                fill={color}
                opacity={0.1}
                animate={{ r: [8, 18, 8] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}

            <motion.circle
              cx={pt.x} cy={pt.y}
              r={isActive ? 7 : isPeak ? 6 : 4}
              fill={isActive ? "#fff" : color}
              stroke={isActive ? color : "transparent"}
              strokeWidth={2}
              animate={{ r: isActive ? 7 : isPeak ? 6 : 4 }}
              transition={{ type: "spring", stiffness: 300 }}
            />

            {/* Label */}
            <text
              x={pt.x}
              y={pt.y - 10}
              textAnchor="middle"
              fill={isActive ? "#fff" : "rgba(255,255,255,0.3)"}
              fontSize={8}
              fontFamily="monospace"
            >
              {seg.arabicLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Main Component ───────────────────────────────────────
interface Props {
  blueprint: BeatBlueprint | null;
  analysisResult: AudioAnalysisResult | null;
}

export const NarrativeArcPanel: React.FC<Props> = ({
  blueprint,
  analysisResult,
}) => {
  const { narrativeArc, actions } = useMaqamStore();
  const totalBars = analysisResult?.totalBars ?? 16;

  const segments = useMemo(
    () => buildSegments(totalBars, narrativeArc.strategy, analysisResult),
    [totalBars, narrativeArc.strategy, analysisResult]
  );

  const activeSegment = narrativeArc.selectedSegment;
  const activeSegmentData = segments.find((s) => s.id === activeSegment);
  const strategyConfig = ARCSTRATEGIES[narrativeArc.strategy];

  const handleSegmentClick = useCallback(
    (id: string) => {
        useMaqamStore.setState((s) => {
            s.narrativeArc.selectedSegment = s.narrativeArc.selectedSegment === id ? null : id;
        });
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* ── Strategy Selector ── */}
      <div className="space-y-3">
        <label className="text-xs text-white/40 uppercase tracking-widest">
          استراتيجية السرد
        </label>
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(ARCSTRATEGIES) as ArcStrategy[]).map((strategy) => {
            const cfg = ARCSTRATEGIES[strategy];
            const isActive = narrativeArc.strategy === strategy;
            return (
              <motion.button
                key={strategy}
                onClick={() => actions.setArcStrategy(strategy)}
                className={cn(
                  "p-3 rounded-xl border text-[11px] text-center space-y-1 transition-all",
                  isActive
                    ? "text-black font-bold"
                    : "bg-white/3 border-white/10 text-white/35 hover:border-white/20"
                )}
                style={isActive ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
              >
                <div className="text-lg">{cfg.icon}</div>
                <div>{cfg.arabicLabel.replace(/\s\S+$/, "")}</div>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={narrativeArc.strategy}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[10px] text-white/30"
          >
            {strategyConfig.description}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* ── Arc Chart ── */}
      <div className="bg-white/3 rounded-xl p-4 border border-white/5">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-white/40 uppercase tracking-widest">
            منحنى الطاقة الدرامية
          </span>
          <span className="text-[10px] text-white/20">
            {totalBars} بار · {segments.length} قسم
          </span>
        </div>

        <ArcCurveChart
          segments={segments}
          activeSegment={activeSegment}
          onSegmentClick={handleSegmentClick}
          color={strategyConfig.color}
        />
      </div>

      {/* ── Segment Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {segments.map((seg, i) => {
          const roleConfig = ROLECONFIG[seg.arcRole];
          const isActive = activeSegment === seg.id;

          return (
            <motion.div
              key={seg.id}
              layout
              onClick={() => handleSegmentClick(seg.id)}
              className={cn(
                "p-3 rounded-xl border cursor-pointer transition-all space-y-2",
                isActive
                  ? "border-white/30 bg-white/10"
                  : "border-white/5 bg-white/2 hover:border-white/15"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-medium text-white/70">
                    {seg.arabicLabel}
                  </span>
                  <div
                    className="text-[9px] mt-0.5 font-medium"
                    style={{ color: roleConfig.color }}
                  >
                    {roleConfig.arabicLabel}
                  </div>
                </div>
                <div
                  className="text-xs font-bold tabular-nums"
                  style={{ color: strategyConfig.color }}
                >
                  {Math.round(seg.intensity * 100)}%
                </div>
              </div>

              {/* Intensity bar */}
              <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: strategyConfig.color + "90" }}
                  animate={{ width: `${seg.intensity * 100}%` }}
                  transition={{ duration: 0.5, delay: i * 0.04 }}
                />
              </div>

              <div className="text-[9px] text-white/25">
                بار {seg.startBar + 1}–{seg.endBar + 1}
              </div>

              <div
                className="text-[9px] px-1.5 py-0.5 rounded-md inline-block"
                style={{
                  backgroundColor: strategyConfig.color + "20",
                  color: strategyConfig.color,
                }}
              >
                {seg.emotionalTag}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Active Segment Detail ── */}
      <AnimatePresence>
        {activeSegmentData && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white/3 rounded-xl p-4 border border-white/10 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white/80">
                ✏️ محتوى: {activeSegmentData.arabicLabel}
              </h3>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: ROLECONFIG[activeSegmentData.arcRole].color + "20",
                  color: ROLECONFIG[activeSegmentData.arcRole].color,
                }}
              >
                {ROLECONFIG[activeSegmentData.arcRole].arabicLabel}
              </span>
            </div>

            <textarea
              placeholder={`اكتب محتوى ${activeSegmentData.arabicLabel} هنا… الطاقة المطلوبة: ${Math.round(activeSegmentData.intensity * 100)}%`}
              className="w-full bg-white/3 border border-white/10 rounded-lg p-3 text-white/70 placeholder:text-white/20 text-sm outline-none resize-none min-h-[80px] focus:border-white/20 transition-colors"
              style={{ direction: "rtl" }}
              rows={3}
            />

            <div className="flex gap-2 text-[10px] text-white/25">
              <span>طاقة مقترحة: {Math.round(activeSegmentData.intensity * 100)}%</span>
              <span>·</span>
              <span>الإيقاع: {activeSegmentData.emotionalTag}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
