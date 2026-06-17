import React, { useMemo } from "react";
import { motion } from "motion/react";
import {
  Activity,
  Target,
  Zap,
  Layers,
  Cpu,
  Maximize2,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RhythmicMatrixProps {
  barText: string;
  blueprint?: any;
  moraProfile?: any;
  matrixData?: any;
  onStepClick?: (stepIndex: number) => void;
}

export const RhythmicMatrix: React.FC<RhythmicMatrixProps> = ({
  barText,
  blueprint,
  moraProfile,
  matrixData,
  onStepClick,
}) => {
  const totalSteps = 16;
  const occupiedSteps = moraProfile
    ? Math.min(totalSteps, Math.ceil(moraProfile.totalMorae))
    : matrixData
    ? matrixData.grid.bar1.filter((v: number) => v > 0).length
    : 0;

  const drumMap = blueprint?.drumMap || {
    kicks: [0, 8, 10],
    snares: [4, 12],
    hihats: [0, 2, 4, 6, 8, 10, 12, 14],
  };

  const energyData = useMemo(() => {
    // Generate a synthetic energy curve based on drum positions and AI pocket zones
    return Array.from({ length: totalSteps }).map((_, i) => {
      let energy = 20;
      if (drumMap?.kicks?.includes(i)) energy += 60;
      if (drumMap?.snares?.includes(i)) energy += 50;
      if (blueprint?.pocketZones?.includes(i)) energy += 30;
      if (blueprint?.overflowZones?.includes(i)) energy -= 10;

      // Add some noise/variation
      energy += Math.sin(i * 0.8) * 10;

      return {
        step: i,
        coord: `${Math.floor(i / 4) + 1}.${(i % 4) + 1}`,
        energy: Math.max(0, Math.min(100, energy)),
      };
    });
  }, [drumMap, blueprint]);

  return (
    <div className="bg-bg-surface/40 border border-border-gold/20 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
      {/* Header - Technical Specs */}
      <div className="bg-bg-elevated/50 border-b border-border-default p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold-400/10 rounded-xl flex items-center justify-center border border-gold-400/30">
            <Cpu className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-gold-400">
              Rhythmic Coordinate Matrix v2.0
            </h3>
            <p className="text-[8px] font-mono text-text-muted uppercase tracking-widest">
              AI-Driven Spatial Mapping • Precision: 1/16th
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-mono text-text-muted uppercase">
              BPM Sync
            </span>
            <span className="text-xs font-mono font-bold text-gold-400">
              {matrixData?.stats?.estimatedBPM || blueprint?.beatInfo?.bpm || 90}
            </span>
          </div>
          <div className="w-px h-8 bg-border-default" />
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-mono text-text-muted uppercase">
              Signature
            </span>
            <span className="text-xs font-mono font-bold text-gold-400">
              4/4
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* The Main Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gold-400" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-primary">
                مصفوفة الإحداثيات الإيقاعية
              </span>
            </div>
            <div className="flex items-center gap-4 text-[8px] font-mono text-text-muted">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-gold-400" />{" "}
                <span>Kick</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-quality-perfect" />{" "}
                <span>Snare</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-text-muted/30" />{" "}
                <span>Hi-Hat</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto pb-4 hide-scrollbar">
            <div className="grid grid-cols-16 gap-1.5 min-w-[800px]">
              {Array.from({ length: totalSteps }).map((_, i) => {
                const isKick = drumMap?.kicks?.includes(i);
                const isSnare = drumMap?.snares?.includes(i);
                const isHihat = drumMap?.hihats?.includes(i);
                
                let isOccupied = i < occupiedSteps;
                let weight = 1; // 1 for short, 2 for long
                if (matrixData && matrixData.grid.bar1[i]) {
                  isOccupied = matrixData.grid.bar1[i] > 0;
                  weight = matrixData.grid.bar1[i];
                }

                const beatNum = Math.floor(i / 4) + 1;
                const subBeat = (i % 4) + 1;

                return (
                  <div key={i} className="flex flex-col gap-1">
                    <div
                      className="text-[7px] font-mono text-text-muted text-center mb-1 cursor-pointer hover:text-gold-400 transition-colors"
                      onClick={() => onStepClick?.(i)}
                    >
                      {beatNum}.{subBeat}
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      onClick={() => onStepClick?.(i)}
                      className={`
                      relative h-16 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all duration-300 cursor-pointer
                      ${i % 4 === 0 ? "bg-bg-elevated border-gold-400/40" : "bg-bg-surface/50 border-border-default"}
                      ${isOccupied ? weight > 1 ? "ring-2 ring-gold-400/50 shadow-[0_0_20px_rgba(212,160,23,0.3)] bg-gold-400/10" : "ring-1 ring-gold-400/30 shadow-[0_0_15px_rgba(212,160,23,0.1)]" : ""}
                    `}
                    >
                      {/* Drum Indicators */}
                      <div className="absolute top-1 flex gap-0.5">
                        {isKick && (
                          <div className="w-1 h-1 rounded-full bg-gold-400" />
                        )}
                        {isSnare && (
                          <div className="w-1 h-1 rounded-full bg-quality-perfect" />
                        )}
                      </div>

                      {/* Occupancy Indicator */}
                      {isOccupied ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`rounded-full flex items-center justify-center ${weight > 1 ? "w-5 h-5 bg-gold-400" : "w-3 h-3 bg-gold-400/70"}`}
                        >
                          <Zap
                            className="w-2 h-2 text-bg-base"
                            fill="currentColor"
                          />
                        </motion.div>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-text-muted/10" />
                      )}

                      {/* Hi-hat tick */}
                      {isHihat && (
                        <div className="absolute bottom-1 w-3 h-0.5 bg-text-muted/20 rounded-full" />
                      )}
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Technical Accessories */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-bg-elevated/40 border border-border-default rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-gold-400">
              <Layers className="w-3 h-3" />
              <span className="text-[8px] font-mono uppercase font-bold">
                {matrixData ? "Syllable Count" : "Pocket Sync"}
              </span>
            </div>
            <div className="text-xs font-bold text-text-primary">
              {matrixData 
                ? `${matrixData.stats.syllableCount} Syllables`
                : blueprint?.pocketZones?.length > 0
                ? `${blueprint.pocketZones.length} Active Zones`
                : "Standard Sync"}
            </div>
            <p className="text-[8px] text-text-muted leading-relaxed">
              {matrixData
                ? "إجمالي عدد المقاطع الصوتية في البار."
                : "تتم مزامنة الكلمات مع مناطق الـ Pocket لضمان تدفق طبيعي."}
            </p>
          </div>

          <div className="bg-bg-elevated/40 border border-border-default rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-quality-perfect">
              <Zap className="w-3 h-3" />
              <span className="text-[8px] font-mono uppercase font-bold">
                Flow Pressure
              </span>
            </div>
            <div className="text-xs font-bold text-text-primary">
              {occupiedSteps >
              (typeof blueprint?.syllableCapacity === "object" &&
              blueprint?.syllableCapacity !== null &&
              !Array.isArray(blueprint?.syllableCapacity)
                ? blueprint.syllableCapacity.max || 12
                : Array.isArray(blueprint?.syllableCapacity)
                  ? blueprint.syllableCapacity[1] || 12
                  : blueprint?.syllableCapacity || 12)
                ? "High Pressure"
                : "Balanced"}
            </div>
            <div className="w-full h-1 bg-bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-quality-perfect"
                style={{
                  width: `${Math.min(100, (occupiedSteps / 16) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="bg-bg-elevated/40 border border-border-default rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-gold-400">
              <Info className="w-3 h-3" />
              <span className="text-[8px] font-mono uppercase font-bold">
                {matrixData ? "Rhyme Info" : "AI Recommendation"}
              </span>
            </div>
            <div className="text-[9px] text-text-secondary leading-tight line-clamp-2">
              {matrixData ? (
                <>
                  <span className="text-gold-400 font-bold">الروي:</span> {matrixData.rhymeInfo.root} <br />
                  <span className="text-gold-400 font-bold">النوع:</span> {matrixData.rhymeInfo.type}
                </>
              ) : (() => {
                const recs = blueprint?.phonemeRecommendations;
                if (Array.isArray(recs)) return recs.join(" • ");
                if (typeof recs === "string")
                  return recs
                    .split(",")
                    .map((s) => s.trim())
                    .join(" • ");
                return "ب • ق • د";
              })()}
            </div>
            {matrixData && (
               <div className="text-[8px] mt-1 text-text-muted font-mono">
                 Phonetic: {matrixData.phoneticScript}
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Coordinate Legend */}
      <div className="bg-bg-elevated/30 border-t border-border-default p-3 flex justify-between text-[7px] font-mono text-text-muted uppercase tracking-[0.3em]">
        <span>Coordinate System: Cartesian Rhythmic Matrix</span>
        <span>Maqam Engine v2.0.4</span>
      </div>
    </div>
  );
};
