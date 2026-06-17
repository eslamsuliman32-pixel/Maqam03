// src/components/StructureTimeline.tsx
import React from "react";
import type { BeatBlueprint, AudioAnalysisResult } from "../types/maqam.types";

export const StructureTimeline: React.FC<{
  blueprint: BeatBlueprint | null;
  analysisResult: AudioAnalysisResult | null;
}> = ({ analysisResult }) => {
  if (!analysisResult) return null;

  return (
    <div className="bg-white/3 p-6 rounded-2xl border border-white/5 space-y-4">
      <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">
        المخطط الزمني للهيكل (Structure Timeline)
      </h3>
      <div className="flex gap-2 h-12">
        {analysisResult.sections.map((section, i) => (
          <div
            key={i}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-[10px] text-white/40 group hover:bg-white/10 transition-colors"
          >
            {section.label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-white/3 rounded-xl border border-white/5">
          <div className="text-lg font-bold text-amber-400">{analysisResult.totalBars}</div>
          <div className="text-[10px] text-white/30 uppercase">إجمالي البارات</div>
        </div>
        <div className="p-3 bg-white/3 rounded-xl border border-white/5">
          <div className="text-lg font-bold text-cyan-400">{Math.round(analysisResult.totalDurationMs / 1000)}s</div>
          <div className="text-[10px] text-white/30 uppercase">المدة الزمنية</div>
        </div>
      </div>
    </div>
  );
};
