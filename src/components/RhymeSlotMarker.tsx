// src/components/RhymeSlotMarker.tsx
"use client";
import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMaqamStore, type RhymeScheme } from "../store/maqamStore";
import { cn } from "../lib/utils";
import type { BeatBlueprint, AudioAnalysisResult } from "../types/maqam.types";

// ─── Slot Config ───────────────────────────────────────────
type SlotType = "landing" | "breath" | "pocket" | "ghost" | "anchor" | "echo";

interface SlotConfig {
  label: string;
  arabicLabel: string;
  color: string;
  bg: string;
  border: string;
  description: string;
  intensity: number; // Visual weight 0–1
}

const SLOTCONFIG: Record<SlotType, SlotConfig> = {
  landing: {
    label: "Landing",
    arabicLabel: "هبوط",
    color: "#F59E0B",
    bg: "bg-amber-500/15",
    border: "border-amber-500/50",
    description: "النقطة الرئيسية لسقوط القافية — على الضربة القوية",
    intensity: 1.0,
  },
  breath: {
    label: "Breath",
    arabicLabel: "نفَس",
    color: "#06B6D4",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/35",
    description: "موضع الاستراحة والتنفس — بين الأقسام",
    intensity: 0.4,
  },
  pocket: {
    label: "Pocket",
    arabicLabel: "جيب",
    color: "#10B981",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/35",
    description: "قافية داخلية — في منتصف البار",
    intensity: 0.7,
  },
  ghost: {
    label: "Ghost",
    arabicLabel: "ظل",
    color: "#8B5CF6",
    bg: "bg-purple-500/10",
    border: "border-purple-500/35",
    description: "قافية خفية — على ضربة ضعيفة",
    intensity: 0.3,
  },
  anchor: {
    label: "Anchor",
    arabicLabel: "مرساة",
    color: "#EF4444",
    bg: "bg-red-500/10",
    border: "border-red-500/35",
    description: "قافية تثبيت — تعيد ضبط الإيقاع",
    intensity: 0.9,
  },
  echo: {
    label: "Echo",
    arabicLabel: "صدى",
    color: "#F97316",
    bg: "bg-orange-500/10",
    border: "border-orange-500/35",
    description: "تكرار القافية — صدى يعزز التأثير",
    intensity: 0.6,
  },
};

// ─── Rhyme Scheme Patterns ────────────────────────────────
const SCHEMEPATTERNS: Record<RhymeScheme, {
  pattern: string[];
  description: string;
  color: string;
}> = {
  AABB: {
    pattern: ["A", "A", "B", "B"],
    description: "القافية المزدوجة — الأكثر شيوعاً في الراب",
    color: "#F59E0B",
  },
  ABAB: {
    pattern: ["A", "B", "A", "B"],
    description: "القافية المتشابكة — تنوع وتوازن",
    color: "#06B6D4",
  },
  ABBA: {
    pattern: ["A", "B", "B", "A"],
    description: "القافية المحتضنة — عمق وشعرية",
    color: "#8B5CF6",
  },
  AAAA: {
    pattern: ["A", "A", "A", "A"],
    description: "القافية الموحدة — قوة وتأكيد",
    color: "#EF4444",
  },
  free: {
    pattern: ["A", "B", "C", "D"],
    description: "القافية الحرة — إبداع بلا قيود",
    color: "#10B981",
  },
  custom: {
    pattern: ["?", "?", "?", "?"],
    description: "قافية مخصصة — صمم نظامك الخاص",
    color: "#F97316",
  },
};

// ─── Extended Rhyme Slot ───────────────────────────────────
interface ExtendedRhymeSlot {
  id: string;
  barIndex: number;
  beatIndex: number;
  timeMs: number;
  slotType: SlotType;
  rhymeGroup: string; // A, B, C…
  content: string;
  scheme: RhymeScheme;
  phonemeEnding: string; // آخر صوت
  confidence: number;
  isLocked: boolean;
}

// ─── Slot Builder ──────────────────────────────────────────
function buildRhymeSlots(
  totalBars: number,
  scheme: RhymeScheme,
  analysisResult: AudioAnalysisResult | null
): ExtendedRhymeSlot[] {
  const pattern = SCHEMEPATTERNS[scheme].pattern;
  const slots: ExtendedRhymeSlot[] = [];
  const beatsPerBar = 4;
  const bpm = analysisResult?.bpm ?? 90;
  const beatIntervalMs = (60 / bpm) * 1000;

  for (let bar = 0; bar < totalBars; bar++) {
    const patternIdx = bar % pattern.length;
    const rhymeGroup = pattern[patternIdx] ?? "A";

    // Landing slot (beat 4 of each bar — downbeat of next)
    const landingBeat = beatsPerBar - 1;
    slots.push({
      id: `slot-${bar}-landing`,
      barIndex: bar,
      beatIndex: landingBeat,
      timeMs: (bar * beatsPerBar + landingBeat) * beatIntervalMs,
      slotType: "landing",
      rhymeGroup,
      content: "",
      scheme,
      phonemeEnding: "",
      confidence: 1.0,
      isLocked: false,
    });

    // Pocket slot (beat 2 — mid-bar)
    if (bar % 2 === 0) {
      slots.push({
        id: `slot-${bar}-pocket`,
        barIndex: bar,
        beatIndex: 2,
        timeMs: (bar * beatsPerBar + 2) * beatIntervalMs,
        slotType: "pocket",
        rhymeGroup: rhymeGroup === "A" ? "C" : "D",
        content: "",
        scheme,
        phonemeEnding: "",
        confidence: 0.7,
        isLocked: false,
      });
    }

    // Ghost slot (beat 1.5 — off-beat)
    if (bar % 4 === 3) {
      slots.push({
        id: `slot-${bar}-ghost`,
        barIndex: bar,
        beatIndex: 1,
        timeMs: (bar * beatsPerBar + 1.5) * beatIntervalMs,
        slotType: "ghost",
        rhymeGroup: "X",
        content: "",
        scheme,
        phonemeEnding: "",
        confidence: 0.4,
        isLocked: false,
      });
    }

    // Breath slot (last beat of every 4 bars)
    if (bar % 4 === 3) {
      slots.push({
        id: `slot-${bar}-breath`,
        barIndex: bar,
        beatIndex: 3,
        timeMs: (bar * beatsPerBar + 3) * beatIntervalMs,
        slotType: "breath",
        rhymeGroup: "-",
        content: "",
        scheme,
        phonemeEnding: "",
        confidence: 0.5,
        isLocked: false,
      });
    }
  }

  return slots.sort((a, b) => a.timeMs - b.timeMs);
}

// ─── Phoneme Analyzer ─────────────────────────────────────
function extractPhonemeEnding(text: string): string {
  if (!text.trim()) return "";
  const words = text.trim().split(/\s+/);
  const lastWord = words[words.length - 1] ?? "";
  // Last 2–3 characters for Arabic rhyme detection
  return lastWord.slice(-2);
}

function checkRhymeMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a === b || (a.length > 1 && b.length > 1 && a[a.length - 1] === b[b.length - 1]);
}

// ─── Slot Item Component ──────────────────────────────────
const SlotItem: React.FC<{
  slot: ExtendedRhymeSlot;
  allSlots: ExtendedRhymeSlot[];
  onUpdate: (id: string, update: Partial<ExtendedRhymeSlot>) => void;
  isActive: boolean;
  onActivate: (id: string) => void;
}> = ({ slot, allSlots, onUpdate, isActive, onActivate }) => {
  const cfg = SLOTCONFIG[slot.slotType];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(slot.content);

  // Check rhyme matches
  const rhymeMatches = allSlots.filter(
    (s) =>
      s.id !== slot.id &&
      s.rhymeGroup === slot.rhymeGroup &&
      s.phonemeEnding &&
      slot.phonemeEnding &&
      checkRhymeMatch(s.phonemeEnding, slot.phonemeEnding)
  );

  const commitEdit = () => {
    const phonemeEnding = extractPhonemeEnding(draft);
    onUpdate(slot.id, { content: draft, phonemeEnding });
    setEditing(false);
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <motion.div
      layout
      onClick={() => onActivate(slot.id)}
      className={cn(
        "relative rounded-xl border p-3 cursor-pointer transition-all duration-200 space-y-2",
        cfg.bg, cfg.border,
        isActive && "ring-2 ring-white/20 ring-offset-1 ring-offset-black scale-[1.01]",
        slot.isLocked && "opacity-60"
      )}
      whileHover={{ scale: isActive ? 1.01 : 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Slot type badge */}
          <div
            className="text-[9px] px-1.5 py-0.5 rounded-md font-medium"
            style={{ backgroundColor: cfg.color + "25", color: cfg.color }}
          >
            {cfg.arabicLabel}
          </div>

          {/* Rhyme group */}
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ backgroundColor: cfg.color + "30", color: cfg.color }}
          >
            {slot.rhymeGroup}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Time */}
          <span className="text-[9px] text-white/20 tabular-nums font-mono">
            {formatTime(slot.timeMs)}
          </span>

          {/* Lock toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUpdate(slot.id, { isLocked: !slot.isLocked });
            }}
            className="text-[10px] text-white/20 hover:text-amber-400 transition-colors"
          >
            {slot.isLocked ? "🔒" : "🔓"}
          </button>
        </div>
      </div>

      {/* Content input */}
      {editing ? (
        <div onClick={(e) => e.stopPropagation()}>
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => e.key === "Enter" && commitEdit()}
            className="w-full bg-transparent border-b border-white/20 text-white/80 text-xs outline-none pb-1"
            style={{ direction: "rtl" }}
            placeholder="أدخل القافية…"
          />
        </div>
      ) : (
        <div
          onDoubleClick={() => { if (!slot.isLocked) setEditing(true); }}
          className="text-xs min-h-[20px]"
          style={{ direction: "rtl" }}
        >
          {slot.content ? (
            <span className="text-white/70">{slot.content}</span>
          ) : (
            <span className="text-white/15 italic text-[10px]">
              انقر مرتين للكتابة…
            </span>
          )}
        </div>
      )}

      {/* Phoneme ending & rhyme match */}
      {slot.phonemeEnding && (
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold"
            style={{ backgroundColor: cfg.color + "20", color: cfg.color }}
          >
            /{slot.phonemeEnding}/
          </span>
          {rhymeMatches.length > 0 && (
            <span className="text-[9px] text-emerald-400">
              ✓ {rhymeMatches.length} تطابق
            </span>
          )}
        </div>
      )}

      {/* Intensity bar */}
      <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full opacity-60"
          style={{
            width: `${cfg.intensity * 100}%`,
            backgroundColor: cfg.color,
          }}
        />
      </div>

      {/* Bar position */}
      <div className="text-[9px] text-white/15">
        بار {slot.barIndex + 1} · ضربة {slot.beatIndex + 1}
      </div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────
interface Props {
  blueprint: BeatBlueprint | null;
  analysisResult: AudioAnalysisResult | null;
}

export const RhymeSlotMarker: React.FC<Props> = ({
  blueprint,
  analysisResult,
}) => {
  const { rhymeSlots, actions } = useMaqamStore();
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [filter, setFilter] = useState<SlotType | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");

  const totalBars = analysisResult?.totalBars ?? 8;

  const slots = useMemo(
    () => buildRhymeSlots(totalBars, rhymeSlots.rhymeScheme, analysisResult),
    [totalBars, rhymeSlots.rhymeScheme, analysisResult]
  );

  const [localSlots, setLocalSlots] = useState<ExtendedRhymeSlot[]>(slots);

  // Sync when scheme or totalBars change
  React.useEffect(() => {
    setLocalSlots(slots);
  }, [slots]);

  const handleUpdate = useCallback((id: string, update: Partial<ExtendedRhymeSlot>) => {
    setLocalSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...update } : s))
    );
  }, []);

  const filteredSlots = useMemo(
    () =>
      filter === "all"
        ? localSlots
        : localSlots.filter((s) => s.slotType === filter),
    [localSlots, filter]
  );

  // Rhyme group analysis
  const rhymeGroupStats = useMemo(() => {
    const groups = new Map<string, { count: number; matched: number; phonemes: string[] }>();
    localSlots.forEach((slot) => {
      if (!groups.has(slot.rhymeGroup)) {
        groups.set(slot.rhymeGroup, { count: 0, matched: 0, phonemes: [] });
      }
      const g = groups.get(slot.rhymeGroup)!;
      g.count++;
      if (slot.phonemeEnding) g.phonemes.push(slot.phonemeEnding);
    });

    // Count matches within groups
    groups.forEach((g) => {
      const phonemeCount = new Map<string, number>();
      g.phonemes.forEach((p) => phonemeCount.set(p, (phonemeCount.get(p) ?? 0) + 1));
      g.matched = Math.max(0, ...Array.from(phonemeCount.values())) ;
    });

    return groups;
  }, [localSlots]);

  const schemeConfig = SCHEMEPATTERNS[rhymeSlots.rhymeScheme];

  return (
    <div className="space-y-5">
      {/* ── Scheme Selector ── */}
      <div className="space-y-3">
        <label className="text-xs text-white/40 uppercase tracking-widest">
          نظام القافية
        </label>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(SCHEMEPATTERNS) as RhymeScheme[]).map((scheme) => {
            const cfg = SCHEMEPATTERNS[scheme];
            const isActive = rhymeSlots.rhymeScheme === scheme;
            return (
              <motion.button
                key={scheme}
                onClick={() =>
                  useMaqamStore.setState((s) => {
                    s.rhymeSlots.rhymeScheme = scheme;
                  })
                }
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all",
                  isActive
                    ? "text-black font-bold"
                    : "bg-white/3 border-white/10 text-white/40 hover:border-white/20"
                )}
                style={isActive ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {/* Pattern preview */}
                <div className="flex gap-0.5">
                  {cfg.pattern.map((g, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-sm text-[7px] flex items-center justify-center font-bold"
                      style={{
                        backgroundColor: isActive
                          ? "rgba(0,0,0,0.2)"
                          : cfg.color + "30",
                        color: isActive ? "rgba(0,0,0,0.7)" : cfg.color,
                      }}
                    >
                      {g}
                    </div>
                  ))}
                </div>
                <span>{scheme}</span>
              </motion.button>
            );
          })}
        </div>
        <p className="text-[10px] text-white/25">{schemeConfig.description}</p>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "إجمالي الجيوب",
            value: localSlots.length,
            color: "text-white/60",
          },
          {
            label: "قوافي مدخلة",
            value: localSlots.filter((s) => s.content).length,
            color: "text-emerald-400",
          },
          {
            label: "تطابقات صوتية",
            value: localSlots.filter((s) => s.phonemeEnding).length,
            color: "text-amber-400",
          },
          {
            label: "مجموعات القافية",
            value: rhymeGroupStats.size,
            color: "text-cyan-400",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/3 rounded-xl p-3 border border-white/5">
            <div className={cn("text-xl font-bold tabular-nums", stat.color)}>
              {stat.value}
            </div>
            <div className="text-[10px] text-white/25 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters & View ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Type filters */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "text-[10px] px-2.5 py-1 rounded-lg border transition-all",
              filter === "all"
                ? "bg-white/15 border-white/25 text-white"
                : "border-white/8 text-white/30 hover:border-white/15"
            )}
          >
            الكل ({localSlots.length})
          </button>
          {(Object.keys(SLOTCONFIG) as SlotType[]).map((type) => {
            const cfg = SLOTCONFIG[type];
            const count = localSlots.filter((s) => s.slotType === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={cn(
                  "text-[10px] px-2.5 py-1 rounded-lg border transition-all",
                  filter === type ? "text-black" : "border-white/10 text-white/30"
                )}
                style={
                  filter === type
                    ? { backgroundColor: cfg.color, borderColor: cfg.color }
                    : {}
                }
              >
                {cfg.arabicLabel} ({count})
              </button>
            );
          })}
        </div>

        {/* View toggle */}
        <div className="ml-auto flex gap-1.5">
          {(["grid", "timeline"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "text-[10px] px-2.5 py-1 rounded-lg border transition-all",
                viewMode === mode
                  ? "bg-white/10 border-white/20 text-white"
                  : "border-white/8 text-white/25"
              )}
            >
              {mode === "grid" ? "⊞ شبكة" : "── خط زمني"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Slot Grid ── */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatePresence>
            {filteredSlots.map((slot) => (
              <SlotItem
                key={slot.id}
                slot={slot}
                allSlots={localSlots}
                onUpdate={handleUpdate}
                isActive={activeSlot === slot.id}
                onActivate={setActiveSlot}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Timeline View ── */}
      {viewMode === "timeline" && (
        <div className="space-y-2 overflow-x-auto pb-2">
          {Array.from({ length: Math.ceil(totalBars) }).map((_, barIdx) => {
            const barSlots = filteredSlots.filter((s) => s.barIndex === barIdx);
            if (barSlots.length === 0) return null;

            return (
              <div key={barIdx} className="flex items-center gap-2">
                <div className="text-[10px] text-white/20 w-10 text-right shrink-0">
                  B{barIdx + 1}
                </div>
                <div className="flex-1 relative h-10 bg-white/3 rounded-lg border border-white/5 overflow-hidden">
                  {/* Beat grid lines */}
                  {[1, 2, 3].map((beat) => (
                    <div
                      key={beat}
                      className="absolute top-0 bottom-0 w-px bg-white/5"
                      style={{ left: `${(beat / 4) * 100}%` }}
                    />
                  ))}

                  {/* Slots */}
                  {barSlots.map((slot) => {
                    const cfg = SLOTCONFIG[slot.slotType];
                    const leftPct = ((slot.beatIndex % 4) / 4) * 100;
                    return (
                      <motion.div
                        key={slot.id}
                        className="absolute top-1 bottom-1 w-8 rounded-md border cursor-pointer flex items-center justify-center"
                        style={{
                          left: `calc(${leftPct}% + 2px)`,
                          backgroundColor: cfg.color + "20",
                          borderColor: cfg.color + "50",
                        }}
                        onClick={() => setActiveSlot(slot.id)}
                        whileHover={{ scale: 1.1 }}
                        title={`${cfg.arabicLabel} — ${slot.content || "فارغ"}`}
                      >
                        <span className="text-[8px]" style={{ color: cfg.color }}>
                          {slot.rhymeGroup}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Rhyme Group Analysis ── */}
      {localSlots.some((s) => s.phonemeEnding) && (
        <div className="bg-white/3 rounded-xl p-4 border border-white/5 space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-widest">
            تحليل مجموعات القافية
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from(rhymeGroupStats.entries())
              .filter(([group]) => group !== "-" && group !== "X")
              .map(([group, stats]) => {
                const schemeColor = schemeConfig.color;
                const matchRate = stats.count > 0 ? stats.matched / stats.count : 0;
                return (
                  <div
                    key={group}
                    className="p-3 rounded-lg border border-white/5 bg-white/2 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: schemeColor + "30", color: schemeColor }}
                      >
                        {group}
                      </div>
                      <span
                        className="text-xs font-bold"
                        style={{ color: matchRate > 0.6 ? "#10B981" : "#F59E0B" }}
                      >
                        {Math.round(matchRate * 100)}%
                      </span>
                    </div>
                    <div className="text-[9px] text-white/25 space-y-0.5">
                      <div>{stats.count} جيب</div>
                      {stats.phonemes.length > 0 && (
                        <div className="font-mono text-[8px]" style={{ color: schemeColor + "80" }}>
                          {[...new Set(stats.phonemes)].join(" / ")}
                        </div>
                      )}
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${matchRate * 100}%`,
                          backgroundColor: matchRate > 0.6 ? "#10B981" : "#F59E0B",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── Legend ── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {(Object.entries(SLOTCONFIG) as [SlotType, SlotConfig][]).map(([type, cfg]) => (
          <div key={type} className="text-center space-y-1">
            <div
              className="h-1.5 rounded-full mx-4"
              style={{ backgroundColor: cfg.color + "70" }}
            />
            <div className="text-[9px] text-white/25">{cfg.arabicLabel}</div>
            <div className="text-[8px] text-white/15 leading-tight px-1">
              {cfg.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
