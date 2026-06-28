"use client";
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Activity, Database, Star, Filter, X, PanelRightClose } from 'lucide-react';
import type { Bar } from '../types';
import type { VizSelection } from './observatoryTypes';
import { computeDerivedStats } from './observatoryFilters';

interface CompanionPanelProps {
  derivedBars: Bar[];
  vizSelection: VizSelection | null;
  onClearBrush: () => void;
  onClose: () => void;
}

const MiniStat: React.FC<{ icon: React.ReactNode; label: string; value: string | number; tone: string }> = ({
  icon, label, value, tone,
}) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
    <div className="space-y-0.5">
      <span className="text-[10px] text-white/30 font-mono block">{label}</span>
      <span className={`text-xl font-extrabold font-mono ${tone}`}>{value}</span>
    </div>
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 ${tone}`}>
      {icon}
    </div>
  </div>
);

export const CompanionPanel: React.FC<CompanionPanelProps> = ({
  derivedBars, vizSelection, onClearBrush, onClose,
}) => {
  const stats = useMemo(() => computeDerivedStats(derivedBars), [derivedBars]);

  return (
    <motion.aside
      dir="rtl"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="shrink-0 overflow-hidden"
    >
      <div className="w-[280px] h-full flex flex-col gap-4 p-5 rounded-3xl bg-white/[0.03] border border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <h4 className="text-sm font-bold text-white font-arabic">نظرةٌ حيّة</h4>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence>
          {vizSelection && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Filter className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] text-amber-300 font-bold truncate font-arabic">
                  {vizSelection.source.label}
                </span>
              </div>
              <button onClick={onClearBrush} className="p-1 rounded-md text-amber-400 hover:bg-amber-400/20 transition-colors shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          <MiniStat icon={<Database className="w-4 h-4" />} label="البارات الظاهرة الآن" value={stats.total} tone="text-purple-400" />
          <MiniStat icon={<TrendingUp className="w-4 h-4" />} label="متوسط الوزن الإيقاعي" value={`${stats.avgRhythmicWeight}%`} tone="text-blue-400" />
          <MiniStat icon={<Activity className="w-4 h-4" />} label="متوسط المقاطع الصوتية" value={stats.avgSyllables} tone="text-amber-400" />
          <MiniStat icon={<Star className="w-4 h-4" />} label="المفضّلة ضمن المجموعة" value={stats.favorites} tone="text-yellow-400" />
        </div>

        <p className="mt-auto text-[10px] text-white/25 leading-relaxed bg-white/[0.02] border border-white/5 p-3 rounded-xl font-arabic">
          تعكس هذه الأرقام ما تراه الآن بالضبط. صفِّ في الجدول أو «افرك» منطقةً في أي عدسة، وستتحدّث فوراً.
        </p>
      </div>
    </motion.aside>
  );
};
