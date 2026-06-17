// ═══════════════════════════════════════════════════════════════
// مكون عداد المقاطع الصوتية — بصري وتفاعلي كاملاً
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { SyllableUnit } from '../../types/flow.types';

interface SyllableMeterProps {
  current: number;
  target: [number, number];
  syllableUnits?: SyllableUnit[];
  showUnits?: boolean;
  compact?: boolean;
}

const getStatusConfig = (current: number, min: number, max: number) => {
  if (current === 0) return { color: 'text-zinc-500', bg: 'bg-zinc-800', label: 'فارغ', ring: 'ring-zinc-700' };
  if (current < min) return { color: 'text-amber-400', bg: 'bg-amber-500/20', label: 'قصير', ring: 'ring-amber-500/50' };
  if (current > max) return { color: 'text-red-400', bg: 'bg-red-500/20', label: 'طويل', ring: 'ring-red-500/50' };
  if (current === max || current === min) return { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'مثالي', ring: 'ring-emerald-500/50' };
  return { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'متوازن', ring: 'ring-emerald-500/50' };
};

const getSyllableUnitColor = (type: SyllableUnit['type'], stress: boolean): string => {
  if (stress) return 'bg-yellow-400 shadow-yellow-400/50 shadow-sm';
  if (type === 'superheavy') return 'bg-purple-400';
  if (type === 'heavy') return 'bg-blue-400';
  return 'bg-zinc-400';
};

export const SyllableMeter: React.FC<SyllableMeterProps> = ({
  current,
  target,
  syllableUnits = [],
  showUnits = false,
  compact = false,
}) => {
  const [min, max] = target;
  const status = getStatusConfig(current, min, max);
  const fillRatio = Math.min(current / max, 1);

  if (compact) {
    return (
      <motion.div
        className={`
          flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono font-bold
          ring-1 transition-all duration-300 ${status.bg} ${status.color} ${status.ring}
        `}
        animate={{ scale: current > 0 ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 0.2 }}
      >
        <span>{current}</span>
        <span className="opacity-50">/</span>
        <span className="opacity-70">{max}</span>
      </motion.div>
    );
  }

  return (
    <div className="space-y-1.5" dir="rtl">
      {/* العداد الرقمي والتسمية */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.span
            key={current}
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-sm font-mono font-black ${status.color}`}
          >
            {current}
          </motion.span>
          <span className="text-xs text-zinc-600 font-mono">
            / {min}–{max} مقطع
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.span
            key={status.label}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className={`
              text-[10px] font-bold px-2 py-0.5 rounded-full
              ring-1 ${status.bg} ${status.color} ${status.ring}
            `}
          >
            {status.label}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* شريط التقدم المتدرج */}
      <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        {/* نطاق الهدف الأخضر */}
        <div
          className="absolute top-0 h-full bg-emerald-500/20 rounded-full"
          style={{
            left: `${(min / (max + 4)) * 100}%`,
            width: `${((max - min) / (max + 4)) * 100}%`,
          }}
        />
        {/* شريط التقدم الحالي */}
        <motion.div
          className={`h-full rounded-full ${
            current < min ? 'bg-amber-500' :
            current > max ? 'bg-red-500' :
            'bg-emerald-500'
          }`}
          style={{ width: `${fillRatio * 100}%` }}
          animate={{ width: `${fillRatio * 100}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* وحدات المقاطع الصوتية التفصيلية */}
      {showUnits && syllableUnits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex flex-wrap gap-0.5 pt-1"
        >
          {syllableUnits.map((unit, i) => (
            <motion.span
              key={`${unit.text}-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              title={`${unit.type} | ${unit.stress ? 'مُركَّز' : 'عادي'}`}
              className={`
                text-[9px] font-mono px-1 py-0.5 rounded cursor-default
                transition-transform hover:scale-110
                ${getSyllableUnitColor(unit.type, unit.stress)}
                text-zinc-900
              `}
            >
              {unit.text}
            </motion.span>
          ))}
        </motion.div>
      )}
    </div>
  );
};
export default SyllableMeter;
