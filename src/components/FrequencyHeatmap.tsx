// ═══════════════════════════════════════════════════════════════
//  MAQAM — Frequency Heatmap  (خريطة الطاقة الترددية)
// ═══════════════════════════════════════════════════════════════

import React from "react";
import { motion } from "motion/react";
import type { BeatBlueprint } from "../types/audio.types";

interface BandRowProps {
  label:      string;
  values:     number[];
  colorStart: string;
  colorEnd:   string;
  delay:      number;
}

const BandRow: React.FC<BandRowProps> = ({ label, values, colorStart, colorEnd, delay }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest w-12">
        {label}
      </span>
      <div className="flex-1 flex items-end gap-[2px] h-10 ml-2">
        {values.map((val, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ delay: delay + i * 0.008, duration: 0.3 }}
            style={{
              flex:             1,
              height:           `${Math.max(val * 100, 4)}%`,
              background:       `linear-gradient(to top, ${colorStart}, ${colorEnd})`,
              opacity:          0.3 + val * 0.7,
              borderRadius:     "2px 2px 0 0",
              transformOrigin:  "bottom",
            }}
            title={`Bar ${i + 1}: ${Math.round(val * 100)}%`}
          />
        ))}
      </div>
    </div>
  </div>
);

// ── Energy Gradient Strip ──────────────────────────────────────

const EnergyCurveStrip: React.FC<{ values: number[]; sections: BeatBlueprint["structure"]["sections"] }> = ({
  values, sections,
}) => (
  <div className="relative h-8 flex items-end gap-[1px]">
    {values.map((val, i) => {
      const section = sections.find(s => i >= s.startBar && i <= s.endBar);
      const color   = section?.colorHex ?? "#6B7280";
      return (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.005 }}
          style={{
            flex:           1,
            height:         `${Math.max(val * 100, 8)}%`,
            backgroundColor: color,
            opacity:        0.4 + val * 0.6,
            borderRadius:   "2px 2px 0 0",
          }}
          title={`Bar ${i + 1}: ${Math.round(val * 100)}%`}
        />
      );
    })}
  </div>
);

// ── Main ──────────────────────────────────────────────────────

interface Props { blueprint: BeatBlueprint }

export const FrequencyHeatmap: React.FC<Props> = ({ blueprint }) => {
  const { spectral, structure } = blueprint;

  const dominantLabel = {
    "bass-heavy":  "ثقيل (Bass Heavy)",
    "mid-focused": "متوسط (Mid Focused)",
    "high-sharp":  "حاد (High Sharp)",
    "balanced":    "متوازن (Balanced)",
  }[spectral.dominantRange];

  return (
    <div className="space-y-5 bg-[#12121A]/30 rounded-3xl p-5 border border-white/5">

      <div className="flex items-center justify-between">
        <h4 className="font-bold text-[#F1F5F9] text-sm">خريطة الطاقة الترددية</h4>
        <span className="text-[10px] text-[#F59E0B] font-bold bg-[#F59E0B]/10 px-3 py-1 rounded-full border border-[#F59E0B]/20">
          {dominantLabel}
        </span>
      </div>

      <div className="space-y-4">
        <BandRow
          label="BASS"
          values={spectral.bassProfile}
          colorStart="#EF4444"
          colorEnd="#FCA5A5"
          delay={0}
        />
        <BandRow
          label="MID"
          values={spectral.midProfile}
          colorStart="#10B981"
          colorEnd="#6EE7B7"
          delay={0.1}
        />
        <BandRow
          label="HIGH"
          values={spectral.highProfile}
          colorStart="#6366F1"
          colorEnd="#A5B4FC"
          delay={0.2}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-white/5 pt-4 space-y-2">
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B]">
          منحنى الطاقة الكلية
        </span>
        <EnergyCurveStrip values={spectral.energyCurve} sections={structure.sections} />
      </div>
    </div>
  );
};
