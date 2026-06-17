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

const ENERGY_COLORS: Record<EnergyLevel, { bg: string; border: string; text: string }> = {
  silent:  { bg: "bg-white/[0.02]",  border: "border-white/5",       text: "text-white/30" },
  low:     { bg: "bg-blue-500/5",    border: "border-blue-500/20",    text: "text-blue-400" },
  medium:  { bg: "bg-amber-500/5",   border: "border-amber-500/20",   text: "text-amber-400" },
  high:    { bg: "bg-orange-500/8",  border: "border-orange-500/25",  text: "text-orange-400" },
  peak:    { bg: "bg-red-500/10",    border: "border-red-500/30",     text: "text-red-400" },
};

const SECTION_COLORS: Record<string, string> = {
  intro: "#7C3AED", verse: "#D4A017", chorus: "#059669",
  bridge: "#DC2626", outro: "#7C3AED", hook: "#0891B2",
};

export const SectionGrid: React.FC = () => {
  const { beatAnalysis, barSlots, actions } = useVRASStore();
  if (!beatAnalysis) return null;

  return (
    <div className="p-4 space-y-4 font-arabic">
      {beatAnalysis.sections.map((section, sIdx) => {
        const sectionSlots = barSlots.filter((s) => s.sectionId === section.id);
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.06 }}
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
  const sectionColor = SECTION_COLORS[section.type] || "#D4A017";
  const filled = slots.filter((s) => s.status !== "empty").length;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: `${sectionColor}25` }}
    >
      {/* ── رأس القسم ── */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ backgroundColor: `${sectionColor}10` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: sectionColor }}
          />
          <h3 className="text-sm font-black" style={{ color: sectionColor }}>
            {section.label}
          </h3>
          <span className="text-[9px] text-white/30 bg-white/5 px-2 py-0.5 rounded font-mono">
            {section.barCount} بار
          </span>
          <span className="text-[9px] text-white/30 font-mono">
            {section.startTime.toFixed(1)}s — {section.endTime.toFixed(1)}s
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[10px] text-white/40">
            <span style={{ color: sectionColor }} className="font-bold font-mono">{filled}</span>
            /{slots.length}
          </div>
          <button
            onClick={onAutoFill}
            className="px-2.5 py-1 rounded-lg text-[9px] font-bold cursor-pointer transition-all font-arabic"
            style={{
              backgroundColor: `${sectionColor}15`,
              color: sectionColor,
              border: `1px solid ${sectionColor}30`,
            }}
          >
            تعبئة تلقائية
          </button>
        </div>
      </div>

      {/* ── شبكة البارات ── */}
      <div className="p-3 grid grid-cols-2 gap-2 bg-black/20">
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
  const energyStyle = ENERGY_COLORS[slot.energyLevel];

  const handleSelect = () => {
    actions.selectSlot(isSelected ? null : slot.id);
    setShowSuggestions(!isSelected);
  };

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${energyStyle.bg} ${
        isSelected ? "ring-1 ring-amber-400/40" : energyStyle.border
      }`}
    >
      {/* ── رأس الخلية ── */}
      <div
        className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer"
        onClick={handleSelect}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] text-white/20 font-mono w-4">{index + 1}</span>
          <span className={`text-[8px] font-bold ${energyStyle.text} uppercase`}>
            {slot.energyLevel}
          </span>
          <span className="text-[8px] text-white/20 font-arabic">
            🎯 {slot.targetSyllables} مقطع
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-white/20 font-mono">
            {slot.timeRange[0].toFixed(1)}s
          </span>
          <StatusDot status={slot.status} />
        </div>
      </div>

      {/* ── محتوى الخلية ── */}
      <div className="px-2.5 pb-2">
        {slot.placedBar ? (
          <PlacedBarView
            bar={slot.placedBar}
            slot={slot}
            onRemove={() => actions.removeBarFromSlot(slot.id)}
            onLock={() => actions.lockSlot(slot.id)}
            isLocked={slot.status === "locked"}
          />
        ) : (
          <EmptySlotView
            slot={slot}
            onShowSuggestions={() => setShowSuggestions(true)}
          />
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
            className="overflow-hidden border-t border-white/5"
          >
            <div className="p-2 space-y-1.5 bg-black/30 max-h-48 overflow-y-auto">
              <p className="text-[8px] text-white/30 text-center font-arabic">
                اقتراحات المطابقة
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
  );
});

const PlacedBarView: React.FC<{
  bar: TextBar;
  slot: BarSlot;
  onRemove: () => void;
  onLock: () => void;
  isLocked: boolean;
}> = ({ bar, slot, onRemove, onLock, isLocked }) => (
  <div className="space-y-1.5">
    <p className="text-[11px] text-white/90 leading-relaxed font-bold font-arabic">
      {bar.text}
    </p>
    <div className="flex items-center gap-1.5 flex-wrap">
      <StatTag label={`${bar.syllableCount} مقطع`} color="amber" />
      <StatTag label={bar.rhymeEnd} color="purple" />
      {bar.hasInternalRhyme && <StatTag label="قافية داخلية" color="green" />}
      {bar.matchScore !== undefined && (
        <StatTag
          label={`%${bar.matchScore}`}
          color={bar.matchScore >= 70 ? "green" : "red"}
        />
      )}
    </div>
    <div className="flex gap-1">
      <button
        onClick={onLock}
        title={isLocked ? "فك القفل" : "قفل البار"}
        className={`flex-1 py-1 rounded text-[8px] font-bold cursor-pointer transition-all font-arabic ${
          isLocked
            ? "bg-amber-400/20 text-amber-400"
            : "bg-white/5 text-white/30 hover:bg-white/10"
        }`}
      >
        {isLocked ? "🔒 مقفل" : "🔓 قفل"}
      </button>
      <button
        onClick={onRemove}
        className="flex-1 py-1 rounded text-[8px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer transition-all font-arabic"
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
  <div className="space-y-1.5">
    <div className="h-8 border border-dashed border-white/10 rounded-lg flex items-center justify-center">
      <span className="text-[9px] text-white/20 font-arabic">فارغ — اسحب بارًا هنا</span>
    </div>
    <button
      onClick={onShowSuggestions}
      className="w-full py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[9px] font-bold hover:bg-amber-400/20 cursor-pointer transition-all font-arabic"
    >
      💡 عرض الاقتراحات ({slot.suggestedBars.length})
    </button>
  </div>
);

const SuggestionCard: React.FC<{ bar: TextBar; onPlace: () => void }> = ({ bar, onPlace }) => (
  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
    <p className="text-[10px] text-white/80 leading-relaxed font-arabic">{bar.text}</p>
    <div className="flex items-center justify-between">
      <div className="flex gap-1">
        <StatTag label={`${bar.syllableCount}م`} color="amber" />
        <StatTag label={`%${bar.matchScore || 0}`} color="green" />
      </div>
      <button
        onClick={onPlace}
        className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[8px] font-bold hover:bg-emerald-500/30 cursor-pointer font-arabic"
      >
        ← رصّ
      </button>
    </div>
  </div>
);

const StatTag: React.FC<{ label: string; color: string }> = ({ label, color }) => {
  const colors: Record<string, string> = {
    amber: "bg-amber-500/10 text-amber-400",
    purple: "bg-purple-500/10 text-purple-400",
    green: "bg-emerald-500/10 text-emerald-400",
    red: "bg-red-500/10 text-red-400",
  };
  return (
    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold font-arabic ${colors[color] || colors.amber}`}>
      {label}
    </span>
  );
};

const StatusDot: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    empty: "bg-white/10",
    suggested: "bg-amber-400",
    placed: "bg-emerald-400",
    locked: "bg-blue-400",
    conflict: "bg-red-400",
  };
  return (
    <div className={`w-1.5 h-1.5 rounded-full ${colors[status] || "bg-white/10"}`} />
  );
};
