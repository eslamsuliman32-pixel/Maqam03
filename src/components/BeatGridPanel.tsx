// src/components/BeatGridPanel.tsx
// v5.0 — Elite Visualizer for BeatGrid
// مقفل بصرياً بـ Pixel-Perfect adherence to previous design,
// مع ربط البيانات بالـ v5 Engine الجديد (TimingUnits، VisualRows)

import React from "react";
import { useMaqamAnalysisStore } from "../maqam/store/maqamAnalysis.store";
import { type BeatGridAnalysisV5 } from "../maqam/engines/beatGrid.engine";
import { AlertCircle, Target, Activity, Zap, CheckCircle2 } from "lucide-react";
import classNames from "classnames";

export function BeatGridPanel() {
  const state = useMaqamAnalysisStore();

  if (state.isAnalyzingAudio) {
    return (
      <div className="p-8 text-center text-maqam-text-muted animate-pulse">
        جاري تحليل الشبكة الإيقاعية (BeatGrid)...
      </div>
    );
  }

  // Cast because context might not strictly know it's V5 yet
  const bResult = state.beatGridAnalysis as unknown as BeatGridAnalysisV5 | null;

  if (!bResult || !bResult.barFits || bResult.barFits.length === 0) {
    return (
      <div className="p-4 md:p-8 text-center text-maqam-text-muted">
        لم يتم العثور على بيانات إيقاعية. أرسل النص للتحليل مجدداً.
      </div>
    );
  }

  // Safe checks
  const { globalRhythmProfile, visualRows, averageSyllablesPerBeat } = bResult;

  if (!globalRhythmProfile || !visualRows) {
     return (
        <div className="p-4 text-center text-maqam-text-muted">
           جاري تحديث البيانات الإيقاعية...
        </div>
     );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      {/* ───────────────────────────────────────────────────────── */}
      {/* 1. Global Metrics (Layered Engine Stats) */}
      {/* ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-maqam-surface border border-maqam-border rounded-xl p-4 flex flex-col justify-between hover:border-maqam-primary/30 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm text-maqam-text-muted font-medium uppercase tracking-wider">
              Score
            </span>
            <Target className="w-4 h-4 text-maqam-primary opacity-80" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={classNames("text-2xl md:text-3xl font-bold tracking-tight", 
               bResult.globalBeatFitScore >= 75 ? "text-green-400" :
               bResult.globalBeatFitScore >= 50 ? "text-yellow-400" : "text-red-400"
            )}>
              {bResult.globalBeatFitScore}
            </span>
            <span className="text-sm text-maqam-text-muted">/100</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-maqam-surface border border-maqam-border rounded-xl p-4 flex flex-col justify-between hover:border-blue-500/30 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm text-maqam-text-muted font-medium uppercase tracking-wider">
              Density (Syl/Beat)
            </span>
            <Activity className="w-4 h-4 text-blue-400 opacity-80" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {(averageSyllablesPerBeat ?? 0).toFixed(1)}
            </span>
            <span className="text-xs text-blue-400 font-medium">AVG</span>
          </div>
        </div>
        
        {/* Metric 3 */}
        <div className="bg-maqam-surface border border-maqam-border rounded-xl p-4 flex flex-col justify-between hover:border-purple-500/30 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm text-maqam-text-muted font-medium uppercase tracking-wider">
               Rhythm Var.
            </span>
            <Zap className="w-4 h-4 text-purple-400/80" />
          </div>
          <div className="flex items-baseline gap-2">
             <span className="text-2xl md:text-3xl font-bold tracking-tight text-white">
               {globalRhythmProfile.rhythmicVariance}
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-maqam-surface border border-maqam-border rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm text-maqam-text-muted font-medium uppercase tracking-wider">
               Tempo (BPM)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400/80" />
          </div>
          <div className="flex items-baseline gap-2">
             <span className="text-2xl md:text-3xl font-bold tracking-tight text-white">
               {globalRhythmProfile.recommendedTempo}
            </span>
            {globalRhythmProfile.recommendedTempo !== bResult.config.bpm && (
                <span className="text-xs text-yellow-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                   Rec.
                </span>
            )}
          </div>
        </div>

      </div>

      {/* ───────────────────────────────────────────────────────── */}
      {/* 2. Global Suggestions */}
      {/* ───────────────────────────────────────────────────────── */}
      {bResult.suggestions && bResult.suggestions.length > 0 && (
         <div className="bg-maqam-surface border border-maqam-border rounded-xl p-4 md:p-6 space-y-3">
             <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
               <AlertCircle className="w-4 h-4 text-yellow-400" />
               توصيات الأداء العامة (Layered Engine)
             </h3>
             <ul className="space-y-2">
                 {bResult.suggestions.map((s, idx) => (
                    <li key={idx} className="text-sm text-maqam-text-muted flex items-start gap-2">
                       <span className="text-maqam-primary mt-1 text-[10px]">▶</span>
                       <span>{s}</span>
                    </li>
                 ))}
             </ul>
         </div>
      )}

      {/* ───────────────────────────────────────────────────────── */}
      {/* 3. Detailed Bar Fit Visuals */}
      {/* ───────────────────────────────────────────────────────── */}
      <div className="bg-maqam-surface border border-maqam-border rounded-xl p-4 md:p-6 overflow-hidden">
        <h3 className="text-sm font-semibold text-white mb-4">
          خريطة البارات (Layer 1 & Layer 2)
        </h3>
        
        <div className="space-y-6">
          {bResult.barFits.map((fit, idx) => (
             <BarFitRow key={fit.barId || idx} fit={fit} config={bResult.config} />
          ))}
        </div>
      </div>
      
    </div>
  );
}

// ============================================================================
// Sub-Component: BarFitRow
// ============================================================================
const BarFitRow: React.FC<{ fit: any, config: any }> = ({ fit, config }) => {
    
    // Safety
    if (!fit || !fit.timingUnits) return null;

    const isCritical = fit.overflowSeverity === "critical";
    const isWarning  = fit.overflowSeverity === "mild";

    return (
       <div className={classNames(
           "flex flex-col gap-3 p-4 rounded-lg border",
           isCritical ? "border-red-500/20 bg-red-500/5" :
           isWarning  ? "border-yellow-500/20 bg-yellow-500/5" :
           "border-maqam-border bg-black/20"
       )}>
           {/* Header Info */}
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
               <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded bg-maqam-surface border border-maqam-border flex items-center justify-center text-xs font-mono text-maqam-text-muted">
                      {fit.index + 1}
                   </div>
                   <p className="text-sm text-white font-medium" dir="rtl">{fit.text}</p>
               </div>
               <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase tracking-wider text-maqam-text-muted">Score</span>
                      <span className="text-sm font-bold text-white">{fit.overallBeatFitScore}</span>
                  </div>
                  <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase tracking-wider text-maqam-text-muted">Syl/Beat</span>
                      <span className={classNames("text-sm font-bold", isCritical ? "text-red-400" : isWarning ? "text-yellow-400" : "text-white")}>
                          {(fit.syllablesPerBeat ?? 0).toFixed(1)}
                      </span>
                  </div>
               </div>
           </div>

           {/* Warnings/Suggestions (Layer 3 Context) */}
           {(fit.warnings?.length > 0 || fit.suggestions?.length > 0) && (
             <div className="flex flex-col gap-1 mt-1">
                 {fit.warnings?.map((w: string, i: number) => (
                    <p key={`w-${i}`} className="text-xs text-red-400/90 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {w}
                    </p>
                 ))}
                 {fit.suggestions?.map((s: string, i: number) => (
                    <p key={`s-${i}`} className="text-xs text-yellow-400/90 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> {s}
                    </p>
                 ))}
             </div>
           )}

           {/* The visual unit timeline */}
           <div className="relative h-12 mt-2 bg-maqam-surface/50 rounded overflow-hidden">
               {/* Fixed Background Beat Markers */}
               {Array.from({ length: config.beatsPerBar }).map((_, bIdx) => (
                  <div 
                    key={bIdx}
                    className="absolute top-0 bottom-0 border-l border-white/5"
                    style={{ left: `${(bIdx / config.beatsPerBar) * 100}%` }}
                  >
                      <span className="absolute top-1 left-1 text-[8px] text-white/20 font-mono">
                          {bIdx + 1}
                      </span>
                  </div>
               ))}

               {/* Tokens positioned correctly based on phonemic v5 timing */}
               {fit.timingUnits.map((u: any, i: number) => {
                   // Calculate position percentage. 
                   // phase (0-1) within beat + beatIndex = total beats.
                   // divide by beatsPerBar * 100 for percent.
                   const absoluteBeat = u.beatIndexStart + u.beatPhaseStart;
                   const pctStart = (absoluteBeat / config.beatsPerBar) * 100;

                   // Approx width based on duration vs bar duration
                   // barDurationMs = ms per beat * beatsPerBar
                   const beatMs = 60000 / config.bpm;
                   const barMs = beatMs * config.beatsPerBar;
                   const pctWidth = Math.max(2, (u.durationMs / barMs) * 100);

                   // Stress visual
                   const isPrimary = u.stressScore === 100;
                   const isSecondary = u.stressScore >= 60 && u.stressScore < 100;

                   return (
                       <div 
                         key={i}
                         className={classNames(
                            "absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded-sm text-[10px] px-1 pointer-events-none transition-all",
                            isPrimary ? "bg-maqam-primary/20 border border-maqam-primary/50 text-maqam-primary" :
                            isSecondary ? "bg-blue-400/10 border border-blue-400/30 text-blue-300" :
                            "bg-white/5 border border-white/10 text-white/50"
                         )}
                         style={{ 
                             left: `${pctStart}%`, 
                             width: `${pctWidth}%`,
                             maxWidth: '50px',
                             minHeight: '20px'
                          }}
                       >
                           <span className="truncate w-full text-center" dir="rtl">{u.token}</span>
                       </div>
                   )
               })}
           </div>
       </div>
    );
}
