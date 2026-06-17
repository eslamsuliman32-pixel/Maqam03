import React from "react";
import { motion } from "motion/react";
import { MoraProfile } from "../services/moraEngine";

interface MoraMatrixProps {
  profile: MoraProfile;
  text: string;
}

export const MoraMatrix: React.FC<MoraMatrixProps> = ({ profile, text }) => {
  const getWeightColor = (weight: number) => {
    if (weight < 30) return "var(--color-weight-light)";
    if (weight < 60) return "var(--color-weight-medium)";
    if (weight < 85) return "var(--color-weight-heavy)";
    return "var(--color-weight-super)";
  };

  return (
    <div className="bg-bg-surface/50 border border-border-default rounded-xl p-6 backdrop-blur-md space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono uppercase tracking-widest text-gold-400">
          تحليل الموراي (Mora)
        </h3>
        <div className="text-[10px] font-mono text-text-muted uppercase">
          إجمالي الموراي:{" "}
          <span className="text-gold-400 font-bold">{profile.totalMorae}</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Text Segments */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {(profile.units || []).map((unit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="px-3 py-1 bg-bg-elevated border border-border-default rounded flex flex-col items-center gap-1"
            >
              <span className="text-sm font-bold text-text-primary">
                {unit.text}
              </span>
              <span className="text-[8px] font-mono text-text-muted uppercase">
                {unit.type} ({unit.morae})
              </span>
            </motion.div>
          ))}
        </div>

        {/* Mora Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-mono text-text-muted uppercase">
            <span>شريط الموراي</span>
            <span>{Math.round((profile.totalMorae / 16) * 100)}% (16 بار)</span>
          </div>
          <div className="h-4 bg-bg-elevated rounded-full overflow-hidden flex">
            {(profile.units || []).map((unit, i) => (
              <motion.div
                key={i}
                initial={{ width: 0 }}
                animate={{ width: `${(unit.morae / 16) * 100}%` }}
                className="h-full border-r border-bg-base/20"
                style={{ backgroundColor: getWeightColor(profile.sonicWeight) }}
              />
            ))}
          </div>
        </div>

        {/* Weights */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-bg-elevated rounded-lg border border-border-default flex flex-col items-center gap-1">
            <span className="text-[8px] font-mono text-text-muted uppercase">
              الوزن الصوتي
            </span>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < Math.ceil(profile.sonicWeight / 20) ? "bg-gold-400" : "bg-gold-400/10"}`}
                />
              ))}
            </div>
          </div>
          <div className="p-3 bg-bg-elevated rounded-lg border border-border-default flex flex-col items-center gap-1">
            <span className="text-[8px] font-mono text-text-muted uppercase">
              الوزن الإيقاعي
            </span>
            <div className="w-full h-2 bg-bg-base rounded-full overflow-hidden">
              <div
                className="h-full bg-gold-400"
                style={{ width: `${profile.rhythmicWeight}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
