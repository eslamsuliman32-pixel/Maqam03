"use client";
import React from 'react';
import { motion } from 'motion/react';
import { Hammer } from 'lucide-react';

interface ComingSoonLensProps { label: string; hint: string; }

export const ComingSoonLens: React.FC<ComingSoonLensProps> = ({ label, hint }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4 }}
    className="w-full h-full min-h-[420px] flex flex-col items-center justify-center text-center gap-5 rounded-3xl border border-dashed border-amber-400/20 bg-white/[0.02] p-10"
  >
    <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
      <Hammer className="w-7 h-7 text-amber-400" />
    </div>
    <div className="space-y-2">
      <h3 className="text-lg font-bold text-white">عدسة «{label}»</h3>
      <p className="text-xs text-white/40 max-w-sm leading-relaxed">{hint}</p>
    </div>
    <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
      قيد البناء — دفعةٌ قادمة
    </span>
  </motion.div>
);
