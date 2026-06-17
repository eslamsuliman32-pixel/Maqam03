// src/components/sonic/SonicGrid.tsx
import React from "react";
import { motion } from "motion/react";
import { useSonicStore, sonicSelectors } from "../../store/sonicStore";
import { BEATS_PER_BAR } from "../../types/sonic";

export const COLOR_THEMES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  "match-1": { bg: "bg-red-500/10 hover:bg-red-500/20", border: "border-red-500/30", text: "text-red-400", dot: "bg-red-500" },
  "match-2": { bg: "bg-blue-500/10 hover:bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-400", dot: "bg-blue-500" },
  "match-3": { bg: "bg-emerald-500/10 hover:bg-emerald-500/20", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-500" },
  "match-4": { bg: "bg-amber-500/10 hover:bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-400", dot: "bg-amber-500" },
  "match-5": { bg: "bg-purple-500/10 hover:bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-400", dot: "bg-purple-500" },
  "match-6": { bg: "bg-pink-500/10 hover:bg-pink-500/20", border: "border-pink-500/30", text: "text-pink-400", dot: "bg-pink-500" },
  "match-7": { bg: "bg-indigo-500/10 hover:bg-indigo-500/20", border: "border-indigo-500/30", text: "text-indigo-400", dot: "bg-indigo-500" },
  "match-8": { bg: "bg-orange-500/10 hover:bg-orange-500/20", border: "border-orange-500/30", text: "text-orange-400", dot: "bg-orange-500" },
};

export const SonicGrid = () => {
  const bars = useSonicStore(sonicSelectors.bars);
  const rewriteSegment = useSonicStore((s) => s.rewriteSegment);
  const fingerprint = useSonicStore((s) => s.fingerprint);

  if (!bars.length) {
    return (
      <div className="text-center p-12 bg-bg-surface/30 border border-white/[0.02] rounded-2xl flex flex-col items-center justify-center gap-4">
        <span className="text-4xl text-white/20 select-none">🎹</span>
        <p className="text-text-muted text-sm font-medium">أدخل فيرساً في المحرر للبدء بإنشاء البصمة الصوتية.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      {bars.map((bar, barIdx) => (
        <div key={bar.id} className="bg-bg-surface/80 border border-border-default rounded-xl p-4 shadow-sm hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold font-mono tracking-widest text-gold-400">
              البار {barIdx + 1}
            </span>
            <span className="text-[11px] font-arabic font-medium text-white/40 truncate max-w-xs">
              {bar.text}
            </span>
          </div>

          <div 
            className="grid gap-1 bg-black/20 p-1.5 rounded-lg border border-white/5" 
            style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}
          >
            {Array.from({ length: BEATS_PER_BAR }).map((_, beat) => {
              // Find if there is a segment that covers this beat
              const seg = bar.segments.find(
                (s) => beat >= s.startBeat && beat < s.startBeat + s.span
              );
              
              if (!seg) {
                return (
                  <div
                    key={beat}
                    className="h-10 rounded bg-bg-base/30 border border-border-subtle/40 opacity-40 select-none"
                  />
                );
              }

              // Only show the input on the start of the segment
              const isStart = beat === seg.startBeat;
              
              // Find match group coloring
              const gId = fingerprint?.cellGroupMap[seg.id];
              const group = fingerprint?.groups.find((g) => g.id === gId);
              const colorCode = group?.color;
              const theme = colorCode ? COLOR_THEMES[colorCode] : null;

              if (!isStart) {
                // Return a visual "connector" or span continuation
                return (
                  <div
                    key={beat}
                    className={`h-10 rounded bg-bg-base/20 border border-dashed transition-all
                      ${theme ? `${theme.bg} ${theme.border}` : "border-border-subtle/10"}`}
                  />
                );
              }

              return (
                <motion.div
                  key={beat}
                  layoutId={`seg-${seg.id}`}
                  style={{ gridColumnEnd: `span ${seg.span}` }}
                  className={`h-10 rounded flex items-center justify-center px-1 font-arabic border text-xs overflow-hidden transition-all duration-300 relative group/cell
                    ${theme ? `${theme.bg} ${theme.border} text-white` : "bg-bg-base border-border-subtle hover:border-white/20 text-text-muted"}`}
                >
                  <input
                    defaultValue={seg.raw}
                    onBlur={(e) => rewriteSegment(bar.id, seg.id, e.target.value)}
                    className="w-full h-full bg-transparent text-center outline-none font-semibold text-text-default selection:bg-gold-400/30"
                  />
                  {theme && (
                    <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-gold-400" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
