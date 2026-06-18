"use client";

import React, { useState, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  useVRASStore,
  MusicalSection,
  BarSlot,
  TextBar,
  EnergyLevel,
} from "../../../store/vrasStore";

const ENERGY_META: Record<EnergyLevel, { color: string; label: string; level: number }> = {
  silent: { color: "#64748B", label: "صامت", level: 0 },
  low:    { color: "#3B82F6", label: "منخفض", level: 1 },
  medium: { color: "#F5C84B", label: "متوسط", level: 2 },
  high:   { color: "#F97316", label: "عالٍ", level: 3 },
  peak:   { color: "#EF4444", label: "ذروة", level: 4 },
};

const SECTION_COLORS: Record<string, string> = {
  intro: "#8B5CF6", verse: "#10B981", chorus: "#EF4444",
  bridge: "#F59E0B", outro: "#64748B", hook: "#06B6D4", "pre-chorus": "#EC4899",
};

export const SectionGrid: React.FC = () => {
  const { beatAnalysis, barSlots, actions } = useVRASStore();
  if (!beatAnalysis) return null;

  return (
    <div className="p-5 space-y-5 font-arabic">
      {beatAnalysis.sections.map((section, sIdx) => {
        const sectionSlots = barSlots.filter((s) => s.sectionId === section.id);
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.05 }}
          >
            <SectionBlock
              section={section}
              slots={sectionSlots}
              onAutoFill={() => actions.autoFillSection(section.id)}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

const SectionBlock: React.FC<{
  section: MusicalSection;
  slots: BarSlot[];
  onAutoFill: () => void;
}> = memo(({ section, slots, onAutoFill }) => {
  const col = SECTION_COLORS[section.type] || "#F5C84B";
  const filled = slots.filter((s) => s.status !== "empty").length;
  const pct = slots.length ? (filled / slots.length) * 100 : 0;

  return (
    <div className="rounded-2xl border overflow-hidden bg-white/[0.015]" style={{ borderColor: `${col}30` }}>
      {/* ── رأس القسم ── */}
      <div className="flex items-center justify-between px-5 py-3.5" style={{ background: `linear-gradient(90deg, ${col}1A, transparent)` }}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: col, boxShadow: `0 0 10px ${col}` }} />
          <h3 className="text-base font-black" style={{ color: col }}>{section.label}</h3>
          <span className="text-[11px] text-white/40 bg-white/5 px-2.5 py-1 rounded-md font-mono">{section.barCount} بار</span>
          <span className="text-[11px] text-white/30 font-mono">{section.startTime.toFixed(1)}s — {section.endTime.toFixed(1)}s</span>
          {/* مخطط الطاقة المصغّر */}
          <div className="flex items-end gap-0.5 h-5 mr-1">
            {section.energyProfile.slice(0, 24).map((e, i) => (
              <div key={i} className="w-1 rounded-sm" style={{ height: `${(ENERGY_META[e].level / 4) * 100}%`, backgroundColor: ENERGY_META[e].color, opacity: 0.7 }} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* شريط التقدم */}
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: col }} />
            </div>
            <span className="text-xs text-white/50 font-mono">
              <span style={{ color: col }} className="font-bold">{filled}</span>/{slots.length}
            </span>
          </div>
          <button
            onClick={onAutoFill}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all hover:brightness-125 font-arabic"
            style={{ backgroundColor: `${col}1F`, color: col, border: `1px solid ${col}3A` }}
          >
            ⚡ تعبئة تلقائية
          </button>
        </div>
      </div>

      {/* ── شبكة البارات ── */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3 bg-black/20">
        {slots.map((slot, idx) => (
          <BarSlotCard key={slot.id} slot={slot} index={idx} />
        ))}
      </div>
    </div>
  );
});

const BarSlotCard: React.FC<{ slot: BarSlot; index: number }> = memo(({ slot, index }) => {
  const { canvas, actions } = useVRASStore();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const isSelected = canvas.selectedSlotId === slot.id;
  const energy = ENERGY_META[slot.energyLevel];

  const handleSelect = () => {
    actions.selectSlot(isSelected ? null : slot.id);
    setShowSuggestions(!isSelected);
  };

  return (
    <div
      className={`rounded-xl border bg-[#0a0d18] transition-all duration-200 overflow-hidden flex ${
        isSelected ? "ring-2 ring-amber-400/50 border-amber-400/30" : "border-white/[0.07] hover:border-white/15"
      }`}
    >
      {/* شريط الطاقة الجانبي */}
      <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: energy.color, opacity: 0.8 }} />

      <div className="flex-1 min-w-0">
        {/* ── رأس الخلية ── */}
        <div className="flex items-center justify-between px-3 py-2 cursor-pointer border-b border-white/[0.04]" onClick={handleSelect}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30 font-mono font-bold w-6">#{index + 1}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: energy.color, backgroundColor: `${energy.color}1A` }}>
              {energy.label}
            </span>
            <span className="text-[11px] text-white/40 font-arabic flex items-center gap-1">
              🎯 {slot.targetSyllables} مقطع
            </span>
            {slot.rhymePosition !== "free" && (
              <span className="text-[10px] text-purple-300 bg-purple-500/15 px-1.5 py-0.5 rounded font-mono">قافية {slot.rhymePosition}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/25 font-mono">{slot.timeRange[0].toFixed(1)}s</span>
            <StatusDot status={slot.status} />
          </div>
        </div>

        {/* ── محتوى الخلية ── */}
        <div className="px-3 py-2.5">
          {slot.placedBar ? (
            <PlacedBarView
              bar={slot.placedBar}
              onRemove={() => actions.removeBarFromSlot(slot.id)}
              onLock={() => actions.lockSlot(slot.id)}
              isLocked={slot.status === "locked"}
            />
          ) : (
            <EmptySlotView slot={slot} onShowSuggestions={handleSelect} />
          )}
        </div>

        {/* ── قائمة الاقتراحات ── */}
        <AnimatePresence>
          {showSuggestions && slot.suggestedBars.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-white/[0.06]"
            >
              <div className="p-2.5 space-y-2 bg-black/40 max-h-56 overflow-y-auto custom-scrollbar">
                <p className="text-[10px] text-white/40 text-center font-arabic font-bold">
                  ✨ أفضل {slot.suggestedBars.length} بارات مطابقة
                </p>
                {slot.suggestedBars.map((bar) => (
                  <SuggestionCard
                    key={bar.id}
                    bar={bar}
                    onPlace={() => {
                      actions.placeBarInSlot(slot.id, bar);
                      setShowSuggestions(false);
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

const PlacedBarView: React.FC<{
  bar: TextBar;
  onRemove: () => void;
  onLock: () => void;
  isLocked: boolean;
}> = ({ bar, onRemove, onLock, isLocked }) => (
  <div className="space-y-2.5">
    <p className="text-sm text-white/90 leading-relaxed font-bold font-arabic">{bar.text}</p>
    <div className="flex items-center gap-1.5 flex-wrap">
      <StatTag label={`${bar.syllableCount} مقطع`} color="amber" />
      <StatTag label={`قافية: ${bar.rhymeEnd}`} color="purple" />
      {bar.hasInternalRhyme && <StatTag label="قافية داخلية" color="green" />}
      {bar.matchScore !== undefined && (
        <StatTag label={`مطابقة ${bar.matchScore}%`} color={bar.matchScore >= 70 ? "green" : bar.matchScore >= 50 ? "amber" : "red"} />
      )}
    </div>
    <div className="flex gap-2">
      <button
        onClick={onLock}
        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all font-arabic ${
          isLocked ? "bg-amber-400/20 text-amber-400 border border-amber-400/30" : "bg-white/5 text-white/40 hover:bg-white/10 border border-white/5"
        }`}
      >
        {isLocked ? "🔒 مقفل" : "🔓 قفل"}
      </button>
      <button
        onClick={onRemove}
        className="flex-1 py-1.5 rounded-lg text-[11px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 cursor-pointer transition-all font-arabic"
      >
        ✕ إزالة
      </button>
    </div>
  </div>
);

const EmptySlotView: React.FC<{
  slot: BarSlot;
  onShowSuggestions: () => void;
}> = ({ slot, onShowSuggestions }) => (
  <div className="space-y-2.5">
    <div className="h-12 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center">
      <span className="text-[11px] text-white/25 font-arabic">خلية فارغة — اختر بارًا مناسبًا</span>
    </div>
    <button
      onClick={onShowSuggestions}
      className="w-full py-2 rounded-lg bg-amber-400/10 border border-amber-400/25 text-amber-400 text-xs font-bold hover:bg-amber-400/20 cursor-pointer transition-all font-arabic"
    >
      💡 عرض الاقتراحات ({slot.suggestedBars.length})
    </button>
  </div>
);

const SuggestionCard: React.FC<{ bar: TextBar; onPlace: () => void }> = ({ bar, onPlace }) => {
  const score = bar.matchScore || 0;
  const scoreColor = score >= 70 ? "#10B981" : score >= 50 ? "#F5C84B" : "#EF4444";
  return (
    <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/15 space-y-2 transition-all">
      <p className="text-xs text-white/85 leading-relaxed font-arabic">{bar.text}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <StatTag label={`${bar.syllableCount}م`} color="amber" />
          <div className="flex items-center gap-1">
            <div className="w-10 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: scoreColor }} />
            </div>
            <span className="text-[10px] font-mono font-bold" style={{ color: scoreColor }}>{score}%</span>
          </div>
        </div>
        <button
          onClick={onPlace}
          className="px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/30 cursor-pointer font-arabic border border-emerald-500/20"
        >
          ← رصّ هنا
        </button>
      </div>
    </div>
  );
};

const StatTag: React.FC<{ label: string; color: string }> = ({ label, color }) => {
  const colors: Record<string, string> = {
    amber: "bg-amber-500/12 text-amber-400",
    purple: "bg-purple-500/12 text-purple-300",
    green: "bg-emerald-500/12 text-emerald-400",
    red: "bg-red-500/12 text-red-400",
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-arabic ${colors[color] || colors.amber}`}>{label}</span>;
};

const StatusDot: React.FC<{ status: string }> = ({ status }) => {
  const meta: Record<string, { c: string; glow: boolean }> = {
    empty: { c: "bg-white/15", glow: false },
    suggested: { c: "bg-amber-400", glow: true },
    placed: { c: "bg-emerald-400", glow: true },
    locked: { c: "bg-blue-400", glow: true },
    conflict: { c: "bg-red-400", glow: true },
  };
  const m = meta[status] || meta.empty;
  return <div className={`w-2 h-2 rounded-full ${m.c}`} style={m.glow ? { boxShadow: "0 0 6px currentColor" } : {}} />;
};
