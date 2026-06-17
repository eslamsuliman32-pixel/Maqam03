"use client";

import React from "react";
import { useVRASStore } from "../../../store/vrasStore";

export const SessionStatsBar: React.FC = () => {
  const { beatAnalysis, sessionStats } = useVRASStore();
  if (!beatAnalysis || !sessionStats) return null;

  const filledPct =
    sessionStats.totalSlots > 0
      ? Math.round((sessionStats.filledSlots / sessionStats.totalSlots) * 100)
      : 0;

  return (
    <div
      className="h-9 flex-shrink-0 flex items-center gap-4 px-6 bg-white/[0.02] border-b border-white/[0.05] overflow-x-auto text-[9px] select-none font-arabic scrollbar-none"
      dir="rtl"
    >
      <Chip icon="🎼" label="BPM" value={`${beatAnalysis.bpm}`} />
      <Chip icon="⏱️" label="المدة" value={`${Math.floor(beatAnalysis.duration / 60)}:${String(Math.floor(beatAnalysis.duration % 60)).padStart(2, "0")}`} />
      <Chip icon="📦" label="الأقسام" value={`${beatAnalysis.sections.length}`} />
      <Chip icon="📝" label="البارات الكلية" value={`${sessionStats.filledSlots}/${sessionStats.totalSlots}`} />

      {/* شريط الاكتمال */}
      <div className="flex items-center gap-2 flex-shrink-0 font-arabic">
        <span className="text-white/30">الاكتمال:</span>
        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all"
            style={{ width: `${filledPct}%` }}
          />
        </div>
        <span className="text-emerald-400 font-bold font-mono">{filledPct}%</span>
      </div>

      <Chip icon="⭐" label="الفلو" value={`${sessionStats.flowScore}/10`} highlight={sessionStats.flowScore >= 7} />
      <Chip icon="🎯" label="المطابقة" value={`%${sessionStats.avgMatchScore}`} />

      {sessionStats.readyForRecording && (
        <span className="flex-shrink-0 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold animate-pulse font-arabic">
          ✓ جاهز للتسجيل
        </span>
      )}
    </div>
  );
};

const Chip: React.FC<{
  icon: string; label: string; value: string; highlight?: boolean;
}> = ({ icon, label, value, highlight }) => (
  <div className="flex items-center gap-1 flex-shrink-0 bg-white/[0.02] border border-white/5 px-2 py-0.5 rounded-lg font-arabic">
    <span>{icon}</span>
    <span className="text-white/30">{label}:</span>
    <span className={`font-black font-mono ${highlight ? "text-emerald-400" : "text-amber-300"}`}>
      {value}
    </span>
  </div>
);
