// src/maqam/components/RhythmicGridVisualizer.tsx
"use client";
import React, { useMemo, useRef, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useMaqamStore } from "../../store/maqamStore";
import { cn } from "../../lib/utils";
import type { BeatBlueprint, GridCell, AudioAnalysisResult } from "../../types/maqam.types";

// ─── Mora Weight Engine ───────────────────────────────────
// أوزان المقاطع الصوتية العربية بناءً على علم العروض
const ARABICMORAWEIGHTS: Record<string, number> = {
  // حروف ثقيلة — Heavy consonants (وزن 1.8)
  ق: 1.8, ك: 1.7, ط: 1.8, ض: 1.9, ج: 1.5, ر: 1.4,
  غ: 1.6, ع: 1.7, ظ: 1.8, ذ: 1.5, خ: 1.6, ص: 1.7,
  // حروف متوسطة — Medium consonants (وزن 1.2)
  ب: 1.2, د: 1.2, t: 1.2, ف: 1.2, ز: 1.2, س: 1.2,
  ش: 1.3, ح: 1.3, ث: 1.2,
  // حروف خفيفة — Light vowels (وزن 0.8)
  م: 0.9, ن: 0.9, ل: 0.9, و: 0.8, ي: 0.8, ه: 0.7, ا: 0.7,
};

function calcMoraWeight(syllable: string): number {
  if (!syllable) return 1.0;
  let total = 0;
  let count = 0;
  for (const char of syllable) {
    const weight = ARABICMORAWEIGHTS[char];
    if (weight !== undefined) {
      total += weight;
      count++;
    }
  }
  return count > 0 ? total / count : 1.0;
}

// ─── Grid Cell Builder ────────────────────────────────────
function buildGridCells(
  blueprint: BeatBlueprint | null,
  analysisResult: AudioAnalysisResult | null,
  syllables: string[]
): GridCell[] {
  if (!analysisResult) return [];

  const { beats } = analysisResult;
  const cells: GridCell[] = [];
  let syllableIdx = 0;

  beats.forEach((beat, beatIdx) => {
    const barIndex = Math.floor(beatIdx / 4);
    const beatInBar = beatIdx % 4;
    const syllable = syllables[syllableIdx] ?? "";
    const moraWeight = calcMoraWeight(syllable);

    cells.push({
      cellIndex: beatIdx,
      barIndex,
      beatInBar,
      strength: beat.strength as GridCell["strength"],
      timeMs: beat.timeMs,
      syllable,
      moraWeight,
      isActive: false,
      isPinned: false,
      confidence: beat.confidence,
    });

    // Advance syllable index on strong beats
    if (beat.strength !== "weak") syllableIdx++;
  });

  return cells;
}

// ─── Cell Strength Config ─────────────────────────────────
const STRENGTHCONFIG = {
  downbeat: {
    bg: "bg-amber-500/20",
    border: "border-amber-500/60",
    dot: "bg-amber-400",
    label: "↓",
    arabicLabel: "ضربة رئيسية",
    height: "h-14",
  },
  strong: {
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/40",
    dot: "bg-cyan-400",
    label: "▲",
    arabicLabel: "قوية",
    height: "h-12",
  },
  medium: {
    bg: "bg-white/5",
    border: "border-white/15",
    dot: "bg-white/40",
    label: "◆",
    arabicLabel: "متوسطة",
    height: "h-10",
  },
  weak: {
    bg: "bg-white/2",
    border: "border-white/8",
    dot: "bg-white/20",
    label: "·",
    arabicLabel: "خفيفة",
    height: "h-8",
  },
} as const;

// ─── Single Grid Cell ─────────────────────────────────────
const GridCellItem: React.FC<{
  cell: GridCell;
  isActive: boolean;
  onSelect: (cellIndex: number) => void;
  onSyllableChange: (cellIndex: number, syllable: string) => void;
  zoomLevel: number;
}> = ({ cell, isActive, onSelect, onSyllableChange, zoomLevel }) => {
  const cfg = STRENGTHCONFIG[cell.strength];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(cell.syllable ?? "");

  const commitEdit = () => {
    onSyllableChange(cell.cellIndex, draft);
    setEditing(false);
  };

  return (
    <motion.div
      layout
      onClick={() => onSelect(cell.cellIndex)}
      onDoubleClick={() => setEditing(true)}
      className={cn(
        "relative rounded-lg border cursor-pointer transition-all duration-150 select-none",
        cfg.bg, cfg.border, cfg.height,
        isActive && "ring-2 ring-amber-400/60 ring-offset-1 ring-offset-black scale-105",
        "flex flex-col items-center justify-between p-1 overflow-hidden"
      )}
      style={{ minWidth: `${48 * zoomLevel}px`, maxWidth: `${80 * zoomLevel}px` }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Beat marker */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[9px] text-white/25 tabular-nums">
          {cell.barIndex + 1}.{cell.beatInBar + 1}
        </span>
        <div className={cn("w-2 h-2 rounded-full", cfg.dot)} />
      </div>

      {/* Syllable */}
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => e.key === "Enter" && commitEdit()}
          className="w-full text-center text-xs bg-transparent border-b border-amber-400 outline-none text-amber-300"
          style={{ direction: "rtl" }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="text-center text-xs font-bold truncate w-full"
          style={{ direction: "rtl" }}
          title={cell.syllable}
        >
          {cell.syllable || <span className="text-white/15 text-[10px]">فارغ</span>}
        </div>
      )}

      {/* Mora weight bar */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-400"
          animate={{ width: `${Math.min(100, (cell.moraWeight / 2) * 100)}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Pinned indicator */}
      {cell.isPinned && (
        <div className="absolute top-1 right-1 text-[8px] text-amber-400">📌</div>
      )}
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────
interface Props {
  blueprint: BeatBlueprint | null;
  analysisResult: AudioAnalysisResult | null;
}

export const RhythmicGridVisualizer: React.FC<Props> = ({
  blueprint,
  analysisResult,
}) => {
  const { grid, actions } = useMaqamStore();
  const [inputText, setInputText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse text into syllables
  const syllables = useMemo(() => {
    if (!inputText) return [];
    // Split on spaces and syllable boundaries
    return inputText
      .trim()
      .split(/\s+/)
      .flatMap((word) => {
        // Simple Arabic syllabification: CV / CVC splitting
        const result: string[] = [];
        let current = "";
        for (const char of word) {
          current += char;
          const isVowel = "اوي".includes(char);
          if (isVowel && current.length >= 2) {
            result.push(current);
            current = "";
          }
        }
        if (current) result.push(current);
        return result.length > 0 ? result : [word];
      });
  }, [inputText]);

  const cells = useMemo(
    () => buildGridCells(blueprint, analysisResult, syllables),
    [blueprint, analysisResult, syllables]
  );

  // Group by bar
  const bars = useMemo(() => {
    const grouped = new Map<number, GridCell[]>();
    cells.forEach((cell) => {
      if (!grouped.has(cell.barIndex)) grouped.set(cell.barIndex, []);
      grouped.get(cell.barIndex)!.push(cell);
    });
    return Array.from(grouped.entries()).sort(([a], [b]) => a - b);
  }, [cells]);

  // Stats
  const stats = useMemo(() => {
    const avgMora = cells.length
      ? cells.reduce((s, c) => s + c.moraWeight, 0) / cells.length
      : 0;
    const filledCells = cells.filter((c) => c.syllable).length;
    return { avgMora, filledCells, total: cells.length };
  }, [cells]);

  const handleSyllableChange = useCallback(
    (cellIndex: number, syllable: string) => {
      actions.updateGridCell(cellIndex, { syllable, moraWeight: calcMoraWeight(syllable) });
    },
    [actions]
  );

  return (
    <div className="space-y-4">
      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "إجمالي الخلايا", value: stats.total, color: "text-white/60" },
          { label: "الخلايا المملوءة", value: stats.filledCells, color: "text-emerald-400" },
          { label: "متوسط وزن المورا", value: stats.avgMora.toFixed(2), color: "text-amber-400" },
          { label: "نسبة التعبئة", value: `${stats.total ? Math.round((stats.filledCells / stats.total) * 100) : 0}%`, color: "text-cyan-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/3 rounded-xl p-3 border border-white/5">
            <div className={cn("text-xl font-bold tabular-nums", stat.color)}>
              {stat.value}
            </div>
            <div className="text-[10px] text-white/30 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Text Input ── */}
      <div className="bg-white/3 rounded-xl p-4 border border-white/5 space-y-2">
        <label className="text-xs text-white/40 uppercase tracking-widest">
          أدخل الكلمات / المقاطع
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="اكتب كلمات البيت هنا… سيتم توزيعها تلقائياً على الشبكة الإيقاعية"
          className="w-full bg-transparent text-white/80 placeholder:text-white/20 text-sm outline-none resize-none min-h-[80px]"
          style={{ direction: "rtl", fontFamily: "inherit" }}
          rows={3}
        />
        {inputText && (
          <div className="text-[10px] text-white/25">
            {syllables.length} مقطع محللة
          </div>
        )}
      </div>

      {/* ── Zoom Control ── */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/30">تكبير:</span>
        <input
          type="range"
          min={0.6}
          max={2}
          step={0.1}
          value={grid.zoomLevel}
          onChange={(e) =>
            useMaqamStore.setState((s) => {
              s.grid.zoomLevel = parseFloat(e.target.value);
            })
          }
          className="flex-1 accent-amber-400"
        />
        <span className="text-xs text-amber-400 tabular-nums w-10">
          {grid.zoomLevel.toFixed(1)}x
        </span>
      </div>

      {/* ── Grid ── */}
      <div
        ref={containerRef}
        className="overflow-x-auto pb-4 space-y-3"
      >
        {bars.length === 0 ? (
          <div className="text-center py-12 text-white/20 text-sm">
            قم بتحميل بيت موسيقي لعرض الشبكة الإيقاعية
          </div>
        ) : (
          bars.map(([barIdx, barCells]) => (
            <div key={barIdx} className="flex items-end gap-1.5">
              {/* Bar label */}
              <div className="text-[10px] text-white/20 w-8 text-right shrink-0 pb-2">
                B{barIdx + 1}
              </div>

              {/* Bar cells */}
              <div className="flex gap-1.5 flex-wrap">
                {barCells.map((cell) => (
                  <GridCellItem
                    key={cell.cellIndex}
                    cell={cell}
                    isActive={grid.activeCell === cell.cellIndex}
                    onSelect={(idx) =>
                      useMaqamStore.setState((s) => {
                        s.grid.activeCell = s.grid.activeCell === idx ? null : idx;
                      })
                    }
                    onSyllableChange={handleSyllableChange}
                    zoomLevel={grid.zoomLevel}
                  />
                ))}
              </div>

              {/* Bar energy mini-chart */}
              <div className="ml-2 flex items-end gap-0.5 h-14 shrink-0">
                {barCells.map((cell) => (
                  <div
                    key={cell.cellIndex}
                    className="w-1 rounded-full bg-amber-400/40"
                    style={{ height: `${Math.min(100, cell.moraWeight * 40)}%` }}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Legend ── */}
      <div className="flex gap-4 flex-wrap text-[10px] text-white/30">
        {Object.entries(STRENGTHCONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full", cfg.dot)} />
            <span>{cfg.arabicLabel}</span>
          </div>
        ))}
        <div className="text-white/15">· انقر مرتين لتعديل المقطع</div>
      </div>
    </div>
  );
};
