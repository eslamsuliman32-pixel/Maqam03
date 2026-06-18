"use client";

import React, { useMemo, useState, useRef, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useVRASStore, TextBar, EmotionTag } from "../../../store/vrasStore";
import { useRepositoryStore } from "../../../store/repositoryStore";

const EMOTION_ICONS: Record<EmotionTag, string> = {
  aggressive: "🔥", sad: "🌙", triumphant: "👑",
  cinematic: "🎬", neutral: "⚡", romantic: "💖",
};

export const BarDatabasePanel: React.FC = () => {
  const {
    barDatabase, activeEmotionFilter, searchQuery, canvas, actions,
  } = useVRASStore();
  const repoAddBar = useRepositoryStore((s) => s.addBar);
  const repoAddBatch = useRepositoryStore((s) => s.addBatch);
  const repoBarsCount = useRepositoryStore((s) => s.bars.length);
  const [addMode, setAddMode] = useState(false);
  const [newBarText, setNewBarText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    return barDatabase
      .filter((bar) =>
        activeEmotionFilter === "all" || bar.emotion === activeEmotionFilter
      )
      .filter((bar) =>
        !searchQuery || bar.text.includes(searchQuery)
      );
  }, [barDatabase, activeEmotionFilter, searchQuery]);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target?.result as string;
      // كل سطر = بار واحد، استيراد دفعي للمستودع الرئيسي
      const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      repoAddBatch(
        lines.map((text) => ({ text, dialect: "fusha" as const, tags: ["imported"] }))
      );
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleAddBar = () => {
    if (!newBarText.trim()) return;
    const text = newBarText.trim();
    // إضافة للمستودع الرئيسي — المزامنة التلقائية ستُحدّث VRAS
    repoAddBar({ text, dialect: "fusha", tags: ["manual", "vras"] });
    setNewBarText("");
    setAddMode(false);
  };

  return (
    <div className="flex flex-col h-full font-arabic" dir="rtl">
      {/* ── رأس اللوحة ── */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">📝</span>
            <div>
              <h3 className="text-xs font-black text-white/80">مستودع البارات</h3>
              <p className="text-[9px] font-mono flex items-center gap-1">
                <span className="text-white/30">{barDatabase.length} بار</span>
                {repoBarsCount > 0 && (
                  <span className="text-emerald-400/70">· مزامن ✓</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => fileRef.current?.click()}
              className="px-2 py-1 rounded-lg bg-white/[0.04] text-white/40 text-[9px] hover:bg-white/[0.08] cursor-pointer font-arabic"
            >
              📂 استيراد
            </button>
            <button
              onClick={() => setAddMode(!addMode)}
              className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-[9px] border border-amber-500/20 hover:bg-amber-500/20 cursor-pointer font-arabic"
            >
              + إضافة
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={handleImportFile} />
        </div>

        {/* ── بحث ── */}
        <input
          type="text"
          placeholder="بحث في البارات..."
          value={searchQuery}
          onChange={(e) => actions.setSearchQuery(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-3 py-1.5 text-[10px] text-white/70 placeholder-white/20 focus:outline-none focus:border-amber-500/30 font-arabic"
        />
      </div>

      {/* ── فلتر المشاعر ── */}
      <div className="flex-shrink-0 flex gap-1 px-3 py-2 border-b border-white/5 overflow-x-auto scrollbar-none">
        {(["all", "aggressive", "sad", "triumphant", "cinematic", "neutral"] as const).map(
          (em) => (
            <button
              key={em}
              onClick={() => actions.setEmotionFilter(em as any)}
              className={`px-2.5 py-1 rounded-full text-[8px] font-bold whitespace-nowrap cursor-pointer transition-all font-arabic ${
                activeEmotionFilter === em
                  ? "bg-amber-400/20 text-amber-400 border border-amber-400/30"
                  : "text-white/25 hover:text-white/50"
              }`}
            >
              {em === "all"
                ? "الكل"
                : `${EMOTION_ICONS[em as EmotionTag]} ${em}`}
            </button>
          )
        )}
      </div>

      {/* ── إضافة بار ── */}
      <AnimatePresence>
        {addMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden flex-shrink-0 border-b border-white/5"
          >
            <div className="p-3 space-y-2">
              <textarea
                value={newBarText}
                onChange={(e) => setNewBarText(e.target.value)}
                placeholder="اكتب البار هنا..."
                rows={2}
                className="w-full bg-white/[0.03] border border-amber-400/20 rounded-lg p-2 text-[11px] text-white/80 resize-none focus:outline-none focus:border-amber-400/40 font-arabic"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddBar}
                  className="flex-1 py-1.5 rounded-lg bg-amber-400 text-black text-[10px] font-black cursor-pointer font-arabic"
                >
                  إضافة للمستودع
                </button>
                <button
                  onClick={() => setAddMode(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-white/30 text-[10px] cursor-pointer font-arabic"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── قائمة البارات ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
        <p className="text-[8px] text-white/20 text-center font-mono">
          {filtered.length} results
        </p>
        <AnimatePresence mode="popLayout">
          {filtered.map((bar, idx) => (
            <motion.div
              key={bar.id}
              layout
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.02 }}
            >
              <DatabaseBarCard bar={bar} />
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <p className="text-center text-[10px] text-white/20 py-8 font-arabic">
            لا توجد بارات تطابق الفلتر الحالي
          </p>
        )}
      </div>
    </div>
  );
};

interface DatabaseBarCardProps {
  bar: TextBar;
}

const DatabaseBarCard: React.FC<DatabaseBarCardProps> = memo(({ bar }) => {
  const { canvas, actions } = useVRASStore();

  const handleDrop = () => {
    const selectedSlot = canvas.selectedSlotId;
    if (selectedSlot) {
      actions.placeBarInSlot(selectedSlot, bar);
    }
  };

  return (
    <div className="p-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:border-white/10 transition-all group font-arabic">
      <p className="text-[11px] text-white/90 leading-relaxed mb-2 font-arabic">{bar.text}</p>
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <span className="text-[8px] text-white/30">
          {EMOTION_ICONS[bar.emotion]}
        </span>
        <span className="text-[8px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold font-mono">
          {bar.syllableCount}m
        </span>
        <span className="text-[8px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded font-bold">
          {bar.rhymeEnd}
        </span>
        {bar.hasInternalRhyme && (
          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
            قافية داخلية
          </span>
        )}
      </div>
      <button
        onClick={handleDrop}
        disabled={!canvas.selectedSlotId}
        className="w-full py-1 rounded-lg text-[8px] font-bold cursor-pointer transition-all disabled:opacity-20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 font-arabic"
      >
        {canvas.selectedSlotId ? "← رصّ في الخلية المحددة" : "اختر خلية أولاً"}
      </button>
    </div>
  );
});
DatabaseBarCard.displayName = "DatabaseBarCard";
