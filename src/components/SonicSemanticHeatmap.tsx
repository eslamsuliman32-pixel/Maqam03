// src/components/SonicSemanticHeatmap.tsx
// v5.0 — Elite Sonic Energy Map
// يعرض الطاقة الترددية (الجيوب، الظلال، أطوال الأنفاس) بدقة 

import React from "react";
import { useMaqamAnalysisStore } from "../maqam/store/maqamAnalysis.store";
import { Info, Zap, Wind, AlertCircle, Target } from "lucide-react";
import classNames from "classnames";
// Re-use logic from beatGrid and vocalTiming engines
import { type BeatGridAnalysisV5, type BarBeatFitV5 } from "../maqam/engines/beatGrid.engine";
import { type RhythmicVocalTimingAnalysis } from "../maqam/engines/vocalTiming.engine";

export function SonicSemanticHeatmap() {
  const state = useMaqamAnalysisStore();

  // Cast
  const bResult = state.beatGridAnalysis as unknown as BeatGridAnalysisV5 | null;
  const vResult = state.vocalTimingAnalysis as unknown as RhythmicVocalTimingAnalysis | null;

  if (state.isAnalyzingAudio) {
    return (
      <div className="p-8 text-center text-maqam-text-muted animate-pulse">
        جاري رسم خريطة الطاقة الترددية...
      </div>
    );
  }

  if (!bResult || !bResult.densityHeatmap || bResult.densityHeatmap.length === 0 || !vResult) {
    return (
      <div className="p-4 md:p-8 text-center text-maqam-text-muted">
        بيانات الطاقة (Flow & Rhyme) غير متوفرة بعد.
      </div>
    );
  }

  // Energy data per bar
  const maxDensity = Math.max(...bResult.densityHeatmap.flat(), 1);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
       
       {/* Explanation Header */}
       <div className="bg-gradient-to-r from-maqam-primary/10 to-transparent p-4 rounded-xl border border-maqam-primary/20">
          <div className="flex items-start gap-3">
             <Zap className="w-5 h-5 text-maqam-primary shrink-0 mt-0.5" />
             <div>
                <h3 className="text-sm font-semibold text-white mb-1">خريطة الطاقة الترددية (Sonic Energy Map)</h3>
                <p className="text-xs text-maqam-text-muted leading-relaxed">
                  توضح هذه الخريطة أماكن تمركز المقاطع الصوتية الثقيلة (الطاقة العالية) والفراغات (جيوب التنفس). 
                  النقاط الساطعة هي نبرات الـ Flow، والمساحات المعتمة تمثل فرص الجلوس على الإيقاع الداخلي (Pocket).
                </p>
             </div>
          </div>
       </div>

       {/* Heatmap Grid */}
       <div className="bg-maqam-surface border border-maqam-border rounded-xl p-4 md:p-6 overflow-hidden">
          <div className="space-y-8">
              {bResult.densityHeatmap.map((heatArray, idx) => {
                 const fit = bResult.barFits[idx] as BarBeatFitV5;
                 if (!fit) return null;
                 
                 // How well does it breathe?
                 const breathGaps = fit.breathGaps || [];
                 const hasAdequateBreath = breathGaps.length === 0 || breathGaps.some(g => g.adequate);

                 return (
                    <div key={`heat-${idx}`} className="space-y-2">
                       {/* Label */}
                       <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-mono text-maqam-text-muted">BAR {idx + 1}</span>
                          {!hasAdequateBreath && (
                             <span className="text-[10px] text-red-400 flex items-center gap-1 bg-red-400/10 px-2 py-0.5 rounded">
                                <AlertCircle className="w-3 h-3" /> بدون جيوب تنفس
                             </span>
                          )}
                       </div>

                       {/* The Heat Blocks */}
                       <div className="flex items-center gap-1 h-8 md:h-10">
                           {heatArray.map((val, bIdx) => {
                               // normalized 0-1
                               const nVal = val / maxDensity;
                               const isHighImpact = nVal > 0.7;

                               return (
                                  <div 
                                    key={bIdx}
                                    className="relative flex-1 rounded-sm h-full overflow-hidden group transition-all"
                                    style={{
                                        // The visual trick: mapping value to a custom gradient or opacity
                                        backgroundColor: `rgba(219, 39, 119, ${0.1 + (nVal * 0.9)})`, // maqam-primary base
                                        border: isHighImpact ? '1px solid rgba(255,255,255,0.2)' : 'none'
                                    }}
                                  >
                                      {/* Tooltip on hover */}
                                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/50 flex items-center justify-center transition-opacity flex-col">
                                         <span className="text-[8px] text-white opacity-80 uppercase">BEAT {bIdx+1}</span>
                                         <span className="text-[10px] text-white font-bold">{Math.round(nVal * 100)}%</span>
                                      </div>
                                  </div>
                               );
                           })}
                       </div>
                    </div>
                 )
              })}
          </div>
       </div>

       {/* Flow Stats Footer combining Layered Engine Metrics */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-maqam-surface border border-maqam-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Wind className="w-5 h-5 text-blue-400" />
                 <div>
                    <p className="text-xs text-maqam-text-muted uppercase tracking-wider">Flow Smoothness</p>
                    <p className="text-sm text-white font-medium">Global Alignment</p>
                 </div>
              </div>
              <span className={classNames("text-xl font-bold", vResult.globalAlignment > 70 ? "text-blue-400" : "text-maqam-text-muted")}>
                 {vResult.globalAlignment ? vResult.globalAlignment.toFixed(0) : "N/A"}
              </span>
           </div>

           <div className="bg-maqam-surface border border-maqam-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Target className="w-5 h-5 text-purple-400" />
                 <div>
                    <p className="text-xs text-maqam-text-muted uppercase tracking-wider">Consistency</p>
                    <p className="text-sm text-white font-medium">Timing Consistency</p>
                 </div>
              </div>
              <span className={classNames("text-xl font-bold", vResult.consistencyScore > 70 ? "text-purple-400" : "text-maqam-text-muted")}>
                 {vResult.consistencyScore ? vResult.consistencyScore.toFixed(0) : "N/A"}
              </span>
           </div>
       </div>
    </div>
  );
}
