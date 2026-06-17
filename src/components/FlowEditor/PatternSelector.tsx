// ═══════════════════════════════════════════════════════════════
// مكون اختيار النمط — بصري كامل مع تفاصيل كل نمط
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PATTERN_CONFIGS } from '../../services/templateOrchestrator';
import type { FlowPatternType, PatternConfig } from '../../types/flow.types';

interface PatternSelectorProps {
  selected: FlowPatternType | null;
  onSelect: (pattern: FlowPatternType, anchorWord: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const IntensityCurve: React.FC<{ curve: number[]; color: string }> = ({ curve, color }) => {
  const max = Math.max(...curve);
  const points = curve.map((v, i) => ({
    x: (i / (curve.length - 1)) * 60,
    y: 20 - (v / max) * 16,
  }));

  const pathData = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <svg width="60" height="24" className="opacity-70">
      <path d={pathData} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color} />
      ))}
    </svg>
  );
};

const BPMRangeDisplay: React.FC<{ range: [number, number] }> = ({ range }) => (
  <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">
    <span>{range[0]}</span>
    <span className="text-zinc-700">—</span>
    <span>{range[1]}</span>
    <span className="text-zinc-600">BPM</span>
  </div>
);

const PatternCard: React.FC<{
  config: PatternConfig;
  isSelected: boolean;
  onClick: () => void;
}> = ({ config, isSelected, onClick }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    className={`
      w-full text-right p-4 rounded-xl border-2 transition-all duration-200
      relative overflow-hidden group cursor-pointer
      ${isSelected
        ? 'border-yellow-500/60 bg-yellow-500/5 shadow-yellow-500/10 shadow-lg'
        : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900'
      }
    `}
    dir="rtl"
  >
    {/* خلفية اللون التمييزي */}
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity"
      style={{ backgroundColor: config.color }}
    />

    <div className="relative z-10 space-y-2">
      {/* العنوان والأيقونة */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-base">{config.icon}</span>
            <span className={`text-sm font-bold ${isSelected ? 'text-yellow-400' : 'text-zinc-200'}`}>
              {config.nameAr}
            </span>
          </div>
          <span className="text-[10px] font-mono" style={{ color: config.color }}>
            {config.nameEn} • {config.id}
          </span>
        </div>

        {/* منحنى الشدة */}
        <IntensityCurve curve={config.intensityCurve} color={config.color} />
      </div>

      {/* الوصف */}
      <p className="text-[11px] text-zinc-500 leading-relaxed">
        {config.description}
      </p>

      {/* المعلومات التقنية */}
      <div className="flex items-center gap-3 pt-1 border-t border-zinc-800">
        <BPMRangeDisplay range={config.bpmRange} />
        <span className="text-[10px] text-zinc-600">
          {config.barCount} بارات
        </span>
        <span className="text-[10px] text-zinc-600">
          {config.syllableTarget[0]}–{config.syllableTarget[1]} مقطع
        </span>
        {config.requiredAssonance && (
          <span className="text-[10px] text-emerald-600 font-medium">
            قافية إلزامية
          </span>
        )}
      </div>
    </div>

    {/* مؤشر التحديد */}
    {isSelected && (
      <motion.div
        layoutId="pattern-selected"
        className="absolute top-2 left-2 w-2 h-2 rounded-full bg-yellow-400"
      />
    )}
  </motion.button>
);

export const PatternSelector: React.FC<PatternSelectorProps> = ({
  selected,
  onSelect,
  isOpen,
  onClose,
}) => {
  const [, setHoveredPattern] = useState<FlowPatternType | null>(null);
  const [anchorWord, setAnchorWord] = useState('');
  const [pendingPattern, setPendingPattern] = useState<FlowPatternType | null>(null);

  const handlePatternClick = (patternId: FlowPatternType) => {
    setPendingPattern(patternId);
  };

  const handleConfirm = () => {
    if (!pendingPattern) return;
    onSelect(pendingPattern, anchorWord || 'ليل');
    onClose();
    setAnchorWord('');
    setPendingPattern(null);
  };

  const patterns = Object.values(PATTERN_CONFIGS);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* الخلفية المعتمة */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* اللوح الجانبي */}
          <motion.aside
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col"
            dir="rtl"
          >
            {/* الرأس */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <div>
                <h2 className="text-lg font-black text-zinc-100">اختر نمط التدفق</h2>
                <p className="text-xs text-zinc-500 mt-0.5">كل نمط له طاقة وإيقاع وعروض راب مختلفة</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* القوائم */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {patterns.map(config => (
                <div
                  key={config.id}
                  onMouseEnter={() => setHoveredPattern(config.id)}
                  onMouseLeave={() => setHoveredPattern(null)}
                >
                  <PatternCard
                    config={config}
                    isSelected={pendingPattern === config.id || selected === config.id}
                    onClick={() => handlePatternClick(config.id)}
                  />
                </div>
              ))}
            </div>

            {/* لوح التأكيد */}
            <AnimatePresence>
              {pendingPattern && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="p-4 border-t border-zinc-800 bg-zinc-950 space-y-3"
                >
                  <p className="text-xs text-zinc-400">
                    النمط المختار:{' '}
                    <span className="text-yellow-400 font-bold">
                      {PATTERN_CONFIGS[pendingPattern].nameAr}
                    </span>
                  </p>

                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500 block">
                      كلمة مرساة القافية (الميزان الصوتي)
                    </label>
                    <input
                      type="text"
                      value={anchorWord}
                      onChange={e => setAnchorWord(e.target.value)}
                      placeholder="مثال: ليل، نار، حرية..."
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-right font-arabic text-zinc-200 placeholder:text-zinc-600 focus:border-yellow-500/50 focus:outline-none transition-colors"
                      dir="rtl"
                    />
                  </div>

                  <button
                    onClick={handleConfirm}
                    className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black text-sm rounded-xl transition-colors cursor-pointer"
                  >
                    ابدأ التأليف ⚡
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
export default PatternSelector;
