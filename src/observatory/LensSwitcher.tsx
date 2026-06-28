"use client";
import React from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import type { LensId } from './observatoryTypes';
import { LENSES } from './lensRegistry';

interface LensSwitcherProps { activeLens: LensId; onChange: (lens: LensId) => void; }

function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[name] || Icons.Circle;
  return <Cmp className={className} />;
}

export const LensSwitcher: React.FC<LensSwitcherProps> = ({ activeLens, onChange }) => (
  <div
    dir="rtl"
    className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/30 border border-white/5 overflow-x-auto"
  >
    {LENSES.map((lens) => {
      const isActive = lens.id === activeLens;
      return (
        <button
          key={lens.id}
          onClick={() => onChange(lens.id)}
          title={lens.hint}
          className={`relative shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap font-arabic ${
            isActive ? 'text-black' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          {isActive && (
            <motion.span
              layoutId="active-lens-pill"
              className="absolute inset-0 rounded-xl bg-amber-400"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Icon name={lens.icon} className="w-3.5 h-3.5" />
            {lens.label}
            {!lens.ready && (
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full border ${
                isActive
                  ? 'bg-black/20 border-black/30 text-black'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                قريباً
              </span>
            )}
          </span>
        </button>
      );
    })}
  </div>
);
